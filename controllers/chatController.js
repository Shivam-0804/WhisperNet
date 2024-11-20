const User = require("./../models/userModel");
const catchAsync = require("./../utils/catchAsync");
const fs = require("fs");
const path = require("path");

exports.overview = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("contacts.contactId");
  const contacts = user.contacts;

  contacts.forEach(async (contact) => {
    const imagePath = path.join(
      __dirname,
      "..",
      "public",
      "userImg",
      `${contact.contactId.user_name}.jpg`
    );
    const defaultImagePath = "/userImg/default.png";

    contact.contactId.imagePath = fs.existsSync(imagePath)
      ? `/userImg/${contact.contactId.user_name}.jpg`
      : defaultImagePath;
  });

  res.render("chat", {
    title: "WhisperNet: Chat",
    contacts,
  });
});

exports.user_chats = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate("contacts.contactId");
  const contacts = user.contacts;
  res.render("chat", {
    title: "WhisperNet: Chat",
    contacts,
  });
});
