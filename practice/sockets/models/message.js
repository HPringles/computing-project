var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var messageSchema = new Schema({
    text: String,
    user: String
});

messageSchema.index({'$**': 'text' });

var Message = mongoose.model('Message', messageSchema);

module.exports = Message;