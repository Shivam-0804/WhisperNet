const mongoose = require("mongoose");
const slugify = require("slugify");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const validator = require("validator");
const { constants } = require("buffer");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required."],
    trim: true,
  },
  user_name: {
    type: String,
    required: [true, "Username is required."],
    trim: true,
    unique: [true, "Username must be unique."],
  },
  slug: String,
  email: {
    type: String,
    required: [true, "Email is required."],
    unique: [true, "An account with this email already exists."],
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email address."],
  },
  password: {
    type: String,
    required: [true, "Password is required."],
    minlength: [8, "Password must be at least 8 characters long."],
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your password."],
    minlength: [8, "Confirm password must be at least 8 characters long."],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: "Passwords do not match.",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  contacts: [
    {
      contactId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      chatId: String,
    },
  ],
  socketId: {
    type: String,
    default: null,
  },
  imagePath: String,

  passwordResetToken: String,
  passwordResetExpires: Date,
});

userSchema.pre("save", function (next) {
  this.slug = slugify(this.user_name, { lower: true });
  next();
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
