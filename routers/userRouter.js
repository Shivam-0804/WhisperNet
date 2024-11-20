const express = require("express");
const path = require("path");

const authController = require("../controllers/authController");
const userController = require("../controllers/userController");
const Message = require("./../models/chatModel");

const router = express.Router();

router.get("/user", authController.protect, userController.user);
router.post("/contactDetial",authController.protect,userController.details);

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.post("/resetPassword/:token", authController.resetPassword);
router.patch("/update", authController.protect, userController.updateMe);
router.post("/addContact", authController.protect, userController.addContacts);
router.post("/removeContact",authController.protect, userController.removeContact)

router.post("/messages", async (req, res) => {
  const { senderId, receiverId } = req.body;
  try {
    const messages = await Message.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId },
      ],
    }).sort({ timestamp: 1 });
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch messages" });
  }
});
module.exports = router;
