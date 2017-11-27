var express = require("express"),
    app     = express(),
    http    = require("http").Server(app),
    io      = require("socket.io")(http),
    routes  = require("./routes/index.js"),
    path    = require("path"),
    mongoose= require("mongoose"),
    dotenv  = require("dotenv"),
    url     = process.env.DATAURL,
    Message= require("./models/message");
    
app.set("view engine", "ejs")
app.set('views', path.join(__dirname, '/views'));
app.use(express.static(__dirname + "/public"));
mongoose.connect("mongodb://root:root@ds121726.mlab.com:21726/computing-project", { useMongoClient: true })

app.use("/", routes);

var roster = []

io.on("connection", function(socket){
    console.log(socket.id)
    var userName = ""
    
    console.log("user connected");
    Message.find({}, function(err, docs) {
        if (!err){ 
            console.log(docs);
            docs.forEach(function(msg){
                
                io.to(socket.id).emit("chat message", msg.user + ": " + msg.text)
            })
            
        } else {throw err;}
});
    
    
    // socket.on("disconnect", function(){
    //     console.log("user disconnected")
    // })
    
    socket.on('chat message', function(msg){
        io.emit('chat message', userName + ": " + msg);
        var message = new Message({
            text: msg,
            user: userName
        })
        .save(function(err){
            if(err) console.error(err);
        })
    });
    
    socket.on('new user', function(username){
        roster.push(username);
        userName = username
        console.log(roster)
        io.emit('roster update', roster);
    })
    
    socket.on("update user", function(olduser, username){
        roster.push(username);
        roster.pop(olduser);
        userName = username
        io.emit("roster update", roster)
    })
})






http.listen(process.env.PORT, function(){
    console.log("listening on *:" + process.env.PORT);
})