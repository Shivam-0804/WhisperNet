const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const cookieParser = require("cookie-parser");
const Message = require("./models/chatModel");

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express(); // Changed this to avoid naming conflict
const server = http.createServer(app); // Using app directly
const io = new Server(server);

const secure = require("./end_to_end");

app.use(express.json());
app.use(cookieParser());

// MongoDB connection
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

let messages = [];
let chats = {};
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    socket.broadcast.emit("userStatus", { userId, status: "online" });
  });

  socket.on("join", (chatId) => {
    if (!chats[chatId]) {
      chats[chatId] = [];
    }
    socket.join(chatId);
  });

  socket.on("message", async (message) => {
    try {
      console.log("Original message:", message.text);

      if (typeof message.text !== "string") {
        throw new Error("Message text must be a string");
      }

      // Encrypt the message
      let encryptedMessage = await secure.encryptMessage(message.text);
      console.log("Encrypted message:", encryptedMessage);

      // Save message in the database
      let existingMessage = await Message.findOne({ chatId: message.chatId });
      if (!existingMessage) {
        const messageDb = new Message({
          chatId: message.chatId,
          content: [
            {
              message: encryptedMessage,
              senderId: message.senderId,
              receiverId: message.receiverId,
              timestamp: Date.now(),
            },
          ],
        });
        await messageDb.save();
      } else {
        await Message.findOneAndUpdate(
          { chatId: message.chatId },
          {
            $push: {
              content: {
                message: encryptedMessage,
                senderId: message.senderId,
                receiverId: message.receiverId,
              },
            },
          },
          { new: true, useFindAndModify: false }
        );
      }

      // Emit the message to the chat room
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

  socket.on("typing", (chatId) => {
    io.to(chatId.currentChat).emit("typing", {
      currentChat: chatId.currentChat,
      currentId: chatId.receiverId,
    });
  });

  socket.on("stop-typing", (chatId) => {
    io.to(chatId.currentChat).emit("stop-typing", {
      currentChat: chatId.currentChat,
      currentId: chatId.receiverId,
    });
  });

  socket.on("history", async (chatId) => {
    try {
      let data = await Message.findOne({ chatId: chatId.currentChat }).sort({
        "content.timestamp": 1,
      });

      if (!data) {
        data = "undefined";
      } else {
        for (let i = 0; i < data.content.length; i++) {
          data.content[i].message = await secure.decryptMessage(
            data.content[i].message
          );
        }
      }

      io.to(chatId.currentChat).emit("history", {
        data: data.content,
        userId: chatId.userId,
      });
    } catch (err) {
      console.error("Error fetching history:", err.message);
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

// Ensure the application listens on the correct port for Render or local development
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
