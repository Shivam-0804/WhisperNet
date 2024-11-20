const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
  },
  content: [
    {
      message: Object,
      senderId: String,
      receiverId: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
