// IMPORT MONGOOSE + SCHEMA PROTOTYPE
var mongoose    = require("mongoose"),
    Schema      = mongoose.Schema;

//Set Schema
var messageSchema = new Schema({
    messageText: String,
    sender: String,
    timeSent: Date
});

// save the message schema as a mongoose model(allows it to be accessed and used)
var Message = mongoose.model('Message', messageSchema);

//Export the model so that it can be used in the server.js file
module.exports = Message;