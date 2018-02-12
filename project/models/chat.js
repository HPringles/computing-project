// IMPORT MONGOOSE + SCHEMA PROTOTYPE
var mongoose    = require("mongoose"),
    Schema      = mongoose.Schema;

//Set Schema
var chatSchema = new Schema({
    chatParticipants: [String],
    chatMessages: [{
        messageText: String,
        sender: String,
        senderID: String,
        timeSent: Date
        
    }],
});

// save the message schema as a mongoose model(allows it to be accessed and used)
var Chat = mongoose.model('Chat', chatSchema);

//Export the model so that it can be used in the server.js file
module.exports = Chat;