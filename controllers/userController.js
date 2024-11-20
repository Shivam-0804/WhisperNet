const catchAsync = require("../utils/catchAsync");
const User = require("./../models/userModel");
const crypto = require("crypto");

exports.updateMe = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name: req.body.name },
    {
      new: true,
      runValidators: true,
    }
  );
  console.log(user);

  res.status(200).json({
    status: "success",
    message: "User information updated successfully!",
  });
});

exports.addContacts = catchAsync(async (req, res, next) => {
  const newContact = await User.findOne({ user_name: req.body.user_name });

  if (!newContact) {
    return res.status(404).json({
      status: "fail",
      message: "Contact not found!",
    });
  }
  const chatId = crypto.randomBytes(32).toString("hex");
  await User.updateOne(
    { _id: req.user.id },
    { $addToSet: { contacts: { contactId: newContact._id, chatId: chatId } } },
    { runValidators: false }
  );
  await User.updateOne(
    { _id: newContact._id },
    { $addToSet: { contacts: { contactId: req.user.id, chatId: chatId } } },
    { runValidators: false }
  );
  res.status(200).json({
    status: "success",
    message: "Contact added successfully!",
  });
});

exports.removeContact = catchAsync(async (req, res) => {
  const removerUser = await User.findById(req.body.contactId);
  await User.updateOne(
    { _id: req.user.id },
    { $pull: { contacts: { contactId: removerUser._id } } },
    { runValidators: false }
  );

  await User.updateOne(
    { _id: removerUser._id },
    { $pull: { contacts: { contactId: req.user.id } } },
    { runValidators: false }
  );

  res.status(200).json({
    status: "success",
    message: "Contact removed successfully!",
  });
});
exports.user = (req, res) => {
  res.status(200).json({ user: req.user });
};

exports.details = catchAsync(async (req, res) => {
  const user = await User.findById(req.body.id);
  if (user) {
    res.status(200).json({ user: user });
  }
});
