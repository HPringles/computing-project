// Set Up External File Variables

var express     = require("express"),
    app         = express(),
    http        = require("http").Server(app),
    io          = require("socket.io")(http),
    routes      = require("./routes/index.js"),
    path        = require("path"),
    mongoose    = require("mongoose"),
    Message     = require("./models/message.js"),
    User        = require("./models/user.js"),
    Chat        = require("./models/chat.js"),
    dotenv      = require("dotenv").config(),
    cookieParser = require('cookie-parser'),
    seed        = require("./seed.js");
    
app.set("view engine", "ejs") // Set the type of file to use to make pages dynamic
app.set('views', path.join(__dirname, '/views')); // Set the location for all views files(pages) to be stored
app.use(express.static(__dirname + "/public")); // Set the public directory.
app.use(cookieParser(process.env.COOKIE_SECRETS))

mongoose.connect(process.env.DATABASE_URL, { useMongoClient: true });

/*
USE THIS TO SEED THE DATABASE WITH TWO TEST USERS AND A TEST CHAT

seed.seedUsers()
seed.seedChat()

*/
app.use("/", routes);


var roster = []; // Roster - Array of all usernames currently online

io.on("connection", function(socket){
    var userName = "";
    var authenticated = false
    
    // PM UPDATE
    
    // socket on 'auth'
    //  check the authentication key corresponds with the one in the database
    // send all chats in the chats database that correspond with the userID
    
    
    
    
/*    // Detect the message sent by the client to supply the server with the clients username
    socket.on("new user", function(username){
        var sockID = socket.id
        userName = username;
        roster.push({username: username, socketID: sockID}); // Add the username and socketID to the roster
        io.emit("roster update", roster); // Send the updated roster to all users

        // Find all messages in the database
        Message.find({}, function(err,data){
            // if there is no error and there is data
            if(!err){
                if(data.length != 0){
                    // send each message object to the client and only the client - notice socket.emit instead of io.emit
                    data.forEach(function(message){
                      socket.emit("database message", message);  
                    });
                }
                // Notify the client that the database messages have all been sent
                socket.emit("initialisation complete", true);
            } else {
                // If there is an error, log it in the serverside terminal
                console.log(err);
            }
        });
        
    });
*/

    // DETECT INITIALISATION MESSAGE FROM CLIENT AND ALLOW ACCESS TO SERVER
    
    socket.on('authentication message', function(data){
        User.findById(data.userID, function(err, user){
            if(err){return console.log(err)}
            
            if(user && user.authenticationKey === data.authKey){
                userName = user.username;
                authenticated = true
                
                
            }
        })
    })
    
    // Detect a message recieved from the client
    
    //ADD it to the chat it is associated with
    //SEND it only to the recipient
    socket.on("chat message", function(message){
        if (authenticated){
           // Create a new instance of the Message prototype, and assign it the appropriate values
        var newMessage = new Message(
            {
                messageText: message,
                sender: userName,
                timeSent: new Date(Date.now())
        });
        
        // Send the new instance to the database
        
        newMessage.save(function(err, message){
          if (err) console.error(err);
          else {
            io.emit("chat message", message);
          }
        }); 
        }
        
        
        
    });
    
    // socket on NEW CHAT
    // create new chat
    // Send chat to both recipients as a database update
    
    
    // reimplement to work with users
    socket.on("update user", function(username){
        if(authenticated){
            // Replace the current version of the username with the new one
        var index = roster.indexOf(userName);
        userName = username;
        roster[index].username = username;
        // Send the updated roster to all users
        io.emit("roster update", roster);
        }    
        
    });

    
});

// SHOULD NOT CHANGE
setInterval(function(){
    roster.forEach(function(user){
        if(!io.nsps["/"].sockets.hasOwnProperty(user.socketID)){
            roster.splice(roster.indexOf(user), 1);
            io.emit("roster update", roster);
        }
    });
});


// Open the server, and listen for connections.
http.listen(process.env.PORT, function(){
    console.log("Listening");
});