// Set Up External File Variables

var express     = require("express"),
    app         = express(),
    http        = require("http").Server(app),
    io          = require("socket.io")(http),
    routes      = require("./routes/index.js"),
    path        = require("path"),
    mongoose    = require("mongoose"),
    Message     = require("./models/message.js"),
    dotenv      = require("dotenv").config();
    
app.set("view engine", "ejs") // Set the type of file to use to make pages dynamic
app.set('views', path.join(__dirname, '/views')); // Set the location for all views files(pages) to be stored
app.use(express.static(__dirname + "/public")); // Set the public directory.

mongoose.connect(process.env.DATABASE_URL, { useMongoClient: true });


app.use("/", routes);

var roster = []; // Roster - Array of all usernames currently online

io.on("connection", function(socket){
    var userName = "";
    
    // Detect the message sent by the client to supply the server with the clients username
    socket.on("new user", function(username){
        var sock = socket.id
        userName = username;
        roster.push(username); // Add the username to the end of the roster
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
    
    // Detect a message recieved from the client
    socket.on("chat message", function(message){
        
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
        
        
    });
    
    socket.on("update user", function(username){
        // Replace the current version of the username with the new one
        var index = roster.indexOf(userName);
        roster[index] = username;
        // Send the updated roster to all users
        io.emit("roster update", roster);
    })

    
});
// Open the server, and listen for connections.
http.listen(process.env.PORT, function(){
    console.log("Listening");
});