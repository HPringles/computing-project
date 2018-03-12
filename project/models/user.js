// IMPORT MONGOOSE + SCHEMA PROTOTYPE
var mongoose    = require("mongoose"),
    Schema      = mongoose.Schema,
    bcrypt      = require("bcrypt-nodejs");

//Set Schema
var userSchema = new Schema({
    username: String,
    authenticationKey: String,
    password: String,
});

userSchema.methods.generateHash = function(password){
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

userSchema.methods.validPassword = function(password){
    return bcrypt.compareSync(password, this.password);
};

// save the message schema as a mongoose model(allows it to be accessed and used)
var User = mongoose.model('User', userSchema);

//Export the model so that it can be used in the server.js file
module.exports = User;