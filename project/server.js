// Set Up External File Variables

var express         = require("express"),
    app             = express(),
    http            = require("http").Server(app),
    io              = require("socket.io")(http),
    path            = require("path"),
    mongoose        = require("mongoose"),
    User            = require("./models/user.js"),
    Chat            = require("./models/chat.js"),
    dotenv          = require("dotenv").config(),
    cookieParser    = require('cookie-parser'),
    seed            = require("./seed.js"),
    passport        = require("passport"),
    session         = require("express-session"),
    isDebugMode     = false;
    
app.set("view engine", "ejs") // Set the type of file to use to make pages dynamic
app.set('views', path.join(__dirname, '/views')); // Set the location for all views files(pages) to be stored
app.use(express.static(__dirname + "/public")); // Set the public directory.
app.use(cookieParser(process.env.COOKIE_SECRETS)) // Set up cookie parser using the list of secrets held in the .env file
app.use(session({secret: process.env.SESSION_SECRET}))
app.use(passport.initialize())
app.use(passport.session())

mongoose.connect(process.env.DATABASE_URL, { useMongoClient: true });

require("./passportconfig.js")(passport);

/*
USE THIS TO SEED THE DATABASE WITH TWO TEST USERS AND A TEST CHAT

seed.seedUsers()
seed.seedChat()

*/

require("./routes/index.js")(app, passport)



// If the third argument provided is true, set debug mode to ON
if (process.argv[2] == "true"){
    isDebugMode = true;
}

// if debug mode is ON and console.debug() is called, console.log the args
console.debug = function(args)
{
  if (isDebugMode){
    console.log(args);
  }
};


var roster = []; // Roster - Array of all users currently online

// Search the roster for the userID provided
function findUserInRoster(userID){
    var index;
    console.debug(roster);
    
    roster.some(function(user){
        // If the user is null, it does not exist - do not continue to check this index
        if (user === null){
            return;
        }
        if (user._id == userID) {
            
            index = roster.indexOf(user);
            return;
        }
    })
    // Debug messages
    console.debug("Index of user(" + userID + ") in roster: " + index)
    if (index >= 0){
        console.debug("User(" + userID + ") was found in the roster, returning the index as stated above")
        // Return the index of the user if found
        return index; 
        
    } else {
        console.debug("User(" + userID + ") was not found in the roster, returning false");
        // return false if the user is not found
        return false;
    }
}

io.on("connection", function(socket){
    var userName;
    var authenticated = false;
    var userID;
    
    console.debug("New client connected on socket: " + socket.id);
    
    

    
    

    /*  When a new user has conencted and sends an authentication request:
        1. find the user that made the request in the database
        2. check the authenticaion key in the user is the same as in the request
        3. If this is correct - send all chats/users that associate with the user to the socket
        and append the socket to the list of sockets connected to that user
    */
        
    
    socket.on('authentication message', function(data){
        // Find the specified user in the database
        User.findById(data.userID, function(err, user){
            if(user){
                // Handle any errors finding the user
                if(err){return console.debug("auth error" + err.toString())}
                // If the authentication key is provided and matches the key stored in the user
                if(user.authenticationKey === data.authKey){
                    userName = user.username;
                    authenticated = true;
                    userID = user._id;
    
                    var found = false;
                    // Check through each user in the roster to see if the user is already in the roster
                    roster.forEach(function(user){
                        // This step can cause errors so use a try and catch statement
                        
                        try{
                            // If the user is already in the roster, push the socket to the users sockets list
                            if (user.userID == userID) {
                            user.sockets.push(socket.id);
                            found = true;
                            }
                        } catch(TypeError){
                            console.debug("Error comparing userIDs or pushing sockets to the user");
                        }
                    })
                    if (!found) {
                        // If the user is not already in the roster, add it to the roster.
                        roster.push({_id: data.userID, username: userName, sockets: [socket.id]});
                    }
                    // Send a roster update message to all clients.
                    io.emit('roster update', roster);
                    
                    // Send init message with all chats and users
                    // $ne finds all users except the current one
                    User.find({_id: {$ne:userID}}, function(err, users){
                        if (err) {return console.debug(err) }
                        
                        Chat.find({}, function(err, chats){
                            if(err){return console.debug(err)}
                            
                            // Find all the chats that contain the user as a recipient 
                            chats.forEach(function(oneChat){
                                var isInChat = false;
                                console.debug(oneChat.chatParticipants);
                                oneChat.chatParticipants.forEach(function(part){
                                    if (isInChat) {return true}
                                
                                  if (part == userID) {
                                      console.debug(userID);
                                      isInChat = true;
                                      
                                  } 
                                 
                                });
                                // console.debug(isInChat)
                                if (isInChat != true){
                                    
                                     chats.splice(chats.indexOf(oneChat), 1);
                                    //  console.debug(chats)
                                 }
                            })
                            // Send each user that is not the current user, and each chat that contains the user, to the socket the user logged into
                            console.debug("Sending initialisation data of " + chats.length + " chats, " + users.length + " users to user: " + userID + " on socket: " + socket.id)
                            socket.emit('initialisation data', {chats: chats, users:users});
                        })
                        
                    })
   
                }
                
            } else {
                socket.emit("auth failed");
            }
        })
    })
    
    /*  When a chat message is recieved from the user:
        Append the message data to the chat it is associated with and
        send it to all online users that are included in the chat */
    socket.on("chat message", function(message){
        if (authenticated){
        
        var newMessage = {
                messageText: message.messageText,
                sender: userName,
                senderID: message.userID,
                timeSent: new Date(Date.now())
        };
        // Push the new message to the chat that it corresponds with using $push to add it.
        Chat.findByIdAndUpdate(message.chatID, {$push: {chatMessages: newMessage}}, function(err, added){
          if(err){return console.debug(err)}
          Chat.findById(mongoose.Types.ObjectId(message.chatID), function(err, chat){
              if(err){return console.debug(err)}
              var socketsToSendTo = []
              
              chat.chatParticipants.forEach(function(user){
                  if (user) {
                      console.debug(user.toString() + "    " + message.userID.toString() + "   " + message.senderID)
                      var userInRoster = findUserInRoster(user)
                      
                      if (userInRoster !== false && userInRoster >= 0 ) {
                          
                          roster[userInRoster].sockets.forEach(function(socket){
                              socketsToSendTo.push(socket)
                              
                          })
                      }
                  }
              })
              if ( socketsToSendTo.length >= 1 ){
                  socketsToSendTo.forEach(function(sockID){
                      
                    //   console.debug(sockID)
                        var logStr = ""
                        socketsToSendTo.forEach(function(sockID) {logStr += ", " + sockID.toString()})
                        console.debug("Sending message of text '" + message.messageText + "' to " + logStr  +  ".")
                        io.to(sockID).emit('chat message', {message: newMessage, chat: message.chatID})
                        
                  })

              }
          })
        })
        
        
        }    
    });
    
    // socket on NEW CHAT
    // create new chat
    // Send chat to both recipients as a database update
    
    socket.on("create chat", function(participants, callback){
        var newChat = new Chat({
            chatParticipants: participants
        });
        
        newChat.save(function(err, savedChat){
            if(err){return console.debug(err)}
            console.debug("Created chat with users" + participants.toString())
            callback(savedChat)
            var otherUsers = []
            savedChat.chatParticipants.forEach(function(user){
                var rosterIndex = findUserInRoster(user)
                console.log(rosterIndex)
                if (rosterIndex != false){
                    roster[rosterIndex].sockets.forEach(function(socket){
                        console.debug("Sending chat to socket")
                        io.to(socket).emit('database update', {type: "new chat", data:savedChat})
                    })
                }
            })
        })
    });
    
    
    /*  When the user requests a username change 
        Change the username in the database and send a roster update to all clients
    */
    socket.on("update user", function(username, callback){
        if(authenticated){
            console.debug("Updating Username")
            // Replace the current version of the username with the new one
        User.findByIdAndUpdate(userID, {username: username},function(err, newUser){
            if(err){
                console.debug(err)
                return callback(false)
            }
            var rosterIndex = findUserInRoster(userID)
            if (rosterIndex >= 0){
                roster[rosterIndex].username = username
                io.emit("roster update", roster)
                callback(true)
            }
        })
        }    
        
    });

    
});

/* Every Second: 
    Check the sockets attached to users in the roster still exist
    If not remove them
    If there are not longer any sockets attached to a user in the roster,
    remove that use from the roster
*/
setInterval(function(){
    
    roster.forEach(function(user){
        
        try {
            for (var i = 0; i < user.sockets.length ; i++) {
                if(!io.nsps["/"].sockets.hasOwnProperty(user.sockets[i])){
                    console.log("Socket " + user.sockets[i] + " of user " + user.userID + " is no longer active, splicing socket from roster")
                    if (roster.indexOf(user) !== -1){
                        roster[roster.indexOf(user)].sockets.splice(i, 1)
                        i = 0
                        io.emit("roster update", roster);
                    }
            
                }
            }
        } catch(TypeError){
            return
        }
        if (user.sockets.length <= 0){
                console.log(roster.indexOf(user))
                if (roster.indexOf(user) !== -1){
                    
                    
                    console.log(user.userID + " is no longer active, splicing from roster")
                    roster[roster.indexOf(user)] = null
                    console.log(roster)
                    io.emit("roster update", roster)
                }
                
            }
        })
        
    }, 100);


// Open the server, and listen for connections.
http.listen(process.env.PORT, function(){
    console.log("Main Server is Listening");
});