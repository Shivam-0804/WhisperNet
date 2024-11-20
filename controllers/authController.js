const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { promisify } = require("util");

const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECURITY_KEY, {
    expiresIn: process.env.EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const { name, user_name, email, password, confirmPassword } = req.body;

  const newUser = new User({
    name,
    email,
    password,
    user_name,
    confirmPassword,
  });

  await newUser.save();

  // const token = signToken(newUser._id);
  res.status(201).json({
    status: "success",
    message: "User created successfully!",
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const user_name=req.body.email;
  const email=req.body.email;
  const password=req.body.password;
  const user = await User.findOne({ $or: [{ user_name }, { email }] }).select(
    "+password"
  );
  if (!user || !(await user.comparePassword(password, user.password))) {
    return next(new AppError("Incorrect username/email or password!", 401));
  }
  const token = signToken(user._id);

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });
  console.log(user);
  res.status(200).json({
    status: "success",
    token,
    user,
  });
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    $or: [{ email: req.body.email }, { user_name: req.body.user_name }],
  });

  if (!user) {
    return next(
      new AppError("User not found with that email or username!", 404)
    );
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    message: "Token sent to email!",
    resetToken,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired!", 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();

  res.status(200).json({
    status: "success",
    message: "Password updated successfully!",
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  let token = "";
  if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(new AppError("You are not logged in!", 401));
  }

  const decode = await promisify(jwt.verify)(token, process.env.SECURITY_KEY);

  const currentUser = await User.findOne({ _id: decode.id });
  if (!currentUser) {
    return next(new AppError("You are not logged in!", 401));
  }
  req.user = currentUser;
  return next();
});
