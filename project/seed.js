var mongoose = require('mongoose'),
    User = require('./models/user.js'),
    Chat = require('./models/chat.js'),
    crypto      = require('crypto'),
    object      = {}


object.seedUsers =  function seed(){
        var newUserOne = new User({
        username: "Test User One",
        
    })
    
    var newUserTwo = new User({
        username: "Test User Two",
        authenticationKey: crypto.randomBytes(12).toString('hex')
    })
    
    // var newChatOne = new Chat({
    //     chatParticipants: []
    // })
    
    newUserOne.save(function(err, user){
        if(err){return console.log(err)}
        console.log("new user one added")
    })
    
    newUserTwo.save(function(err, user){
        if(err) {return console.log(err)}
        console.log("new user one added")
    })
}

object.seedChat = function() {
    User.find({}, function(err, users){
        if(err){return console.log(err)}
            var newChat = new Chat({
                chatParticipants: [users[0].id, users[1].id],
                chatMessages:[]
            })
            newChat.save(function(err, created){
                if(err){return console.log(err)}
                console.log(created)

            })
    })
}
module.exports = object;