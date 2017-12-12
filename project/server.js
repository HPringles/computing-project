// Set Up External File Variables

var express = require("express"),
    app     = express(),
    http    = require("http").Server(app),
    io      = require("socket.io")(http),
    routes  = require("./routes/index.js"),
    path    = require("path");
    
app.set("view engine", "ejs") // Set the type of file to use to make pages dynamic
app.set('views', path.join(__dirname, '/views')); // Set the location for all views files(pages) to be stored
app.use(express.static(__dirname + "/public")); // Set the public directory.

app.use("/", routes);

var roster = []; // Roster - Array of all usernames currently online

io.on("connection", function(socket){
    var userName = "";
    
    // Detect the message sent by the client to supply the server with the clients username
    socket.on("new user", function(username){
        userName = username;
        roster.push(username); // Add the username to the end of the roster
        io.emit("roster update", roster); // Send the updated roster to all users
        
    });
    
    // Detect a message recieved from the client
    socket.on("chat message", function(message){
        // Send the message to all users with the userName of the sending user before the message
        io.emit("chat message", userName + ": " + message);
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