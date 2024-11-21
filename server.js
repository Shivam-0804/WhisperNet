const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const http = require("http");
const path = require("path"); 
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const app = require("./app"); // Importing the app instance

dotenv.config({ path: path.join(__dirname, ".env") });

const secure = require("./end_to_end"); // For encryption

const server = http.createServer(app);
const io = new Server(server);

// MongoDB Connection
mongoose
  .connect(
    process.env.MONGO_URL.replace("<DB_PASSWORD>", process.env.DB_PASSWORD)
  )
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Socket.io setup
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    socket.broadcast.emit("userStatus", { userId, status: "online" });
  });

  socket.on("join", (chatId) => {
    socket.join(chatId); // Join the chat room
  });

  socket.on("message", async (message) => {
    try {
      console.log("Original message:", message.text);

      if (typeof message.text !== "string") {
        throw new Error("Message text must be a string");
      }

      let encryptedMessage = await secure.encryptMessage(message.text);
      console.log("Encrypted message:", encryptedMessage);

      // Store the message in the database (this part depends on your Message model)
      const Message = require("./models/chatModel");
      let messageDb = await Message.findOne({ chatId: message.chatId });
      
      if (!messageDb) {
        messageDb = new Message({
          chatId: message.chatId,
          content: [{
            message: encryptedMessage,
            senderId: message.senderId,
            receiverId: message.receiverId,
            timestamp: Date.now(),
          }],
        });
        await messageDb.save();
      } else {
        messageDb.content.push({
          message: encryptedMessage,
          senderId: message.senderId,
          receiverId: message.receiverId,
        });
        await messageDb.save();
      }

      const msg = {
        text: message.text,
        date: Date.now(),
      };

      io.to(message.chatId).emit("message", {
        message: msg,
        senderId: message.senderId,
      });
    } catch (err) {
      console.error("Error handling message:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
        socket.broadcast.emit("userStatus", { userId, status: "offline" });
        break;
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

