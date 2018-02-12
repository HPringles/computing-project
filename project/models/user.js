// IMPORT MONGOOSE + SCHEMA PROTOTYPE
var mongoose    = require("mongoose"),
    Schema      = mongoose.Schema;

//Set Schema
var userSchema = new Schema({
    username: String,
    authenticationKey: String
});

// save the message schema as a mongoose model(allows it to be accessed and used)
var User = mongoose.model('User', userSchema);

//Export the model so that it can be used in the server.js file
module.exports = User;