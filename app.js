const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");

const userRoute = require("./routers/userRouter");
const AppError = require("./utils/appError");
const globalErrorHandler = require("./controllers/errorController");
const authController = require("./controllers/authController");
const chatRouter = require("./routers/chatRouter");

const app = express();

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

// Routes
app.use("/chat", authController.protect, chatRouter);
app.use("/user/login", (req, res) => {
  res.render("login");
});
app.use("/user/signup", (req, res) => {
  res.render("signup");
});
app.use("/api", userRoute);

// Root route
app.get("/", (req, res) => {
  res.render("base");
});

// Catch-all for undefined routes
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
