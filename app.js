const express = require("express");
const app = express();
const path = require("path");
const body = require("body-parser");
//const adminRouter=require('./routes/admin/admin');
const adminRouter = require("./routes/admin/admin");
const userRouter = require("./routes/user/user");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require("express-session");
const morgan = require("morgan");
const nocache = require("nocache");
const flash = require("connect-flash");
const passport = require("passport");
dotenv.config();
require("./passport");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Middleware to serve static files (like CSS, images)
app.use(express.static(path.join(__dirname, "public")));
app.use(morgan("dev"));

mongoose
  .connect(process.env.MONGOURI)
  
  .then(() => {  
   console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
app.use(nocache());

app.use(
  session({
    secret: "34547fgfhh55r",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60000 * 30 }, // example: 30 minutes
  })
);

app.use(flash());
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});  

app.use(passport.initialize());
app.use(passport.session());

// Import the authentication routes
const authRoutes = require("./routes/user/user");
app.use(authRoutes);

app.use(userRouter);
app.use("/admin", adminRouter);
app.use("/user", userRouter);
app.use("*", (req, res) => {
  res.render("user/servererror");
});

const port = 7010;

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
