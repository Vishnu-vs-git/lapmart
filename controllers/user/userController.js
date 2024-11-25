const User = require("../../model/userSchema");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const Product=require('../../model/productSchema')
const Banner=require('../../model/bannerSchema');
dotenv.config();
let msg = "";

//------NodeMailer Configuration----///

const { EMAIL_USER, EMAIL_PASS } = process.env;

let transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  service: "gmail",
  auth: {
    user: EMAIL_USER, // Using destructured EMAIL_USER
    pass: EMAIL_PASS, // Using destructured EMAIL_PASS
  },
});

// Custom validation function
const validateSignupData = (userData) => {
  const { email, userName, phone, password } = userData;
  let errors = [];

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push("Invalid email address.");
  }

  // Username validation
  if (!userName || userName.trim().length === 0) {
    errors.push("Username cannot be empty.");
  }

  // Phone number validation
  if (!/^\d{10}$/.test(phone)) {
    errors.push("Phone number must be 10 digits.");
  }

  // Password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  if (!passwordRegex.test(password)) {
    errors.push(
      "Password must be at least 8 characters long, include uppercase, lowercase, a number, and a special character."
    );
  }

  return errors;
};

// Render Signup Page
const loadSignup = async (req, res) => {
  let message = "";
  try {
    res.render("user/userSignup", { message });
  } catch (error) {
    console.log(error);
  }
};

// Sending OTP & Settings
let email;
let otp;
let otpExpirationTime;

// Insert User and Send OTP
const insertUser = async (req, res) => {
  try {
    // Destructure the properties from req.body
    const { email, userName, phone, password } = req.body;

    // Validate the signup data before proceeding
    const validationErrors = validateSignupData({
      email,
      userName,
      phone,
      password,
    });
    if (validationErrors.length > 0) {
      return res.render("user/userSignup", {
        message: validationErrors.join(", "),
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("user/userSignup", {
        message: "User already exists with this email.",
      });
    }

    // Generate OTP
    otp = Math.floor(Math.random() * 100000);
    otpExpirationTime = Date.now() + 2 * 60 * 1000; // OTP valid for 2 minutes
    console.log('otp for signUP',otp);

    // Store form data in session temporarily
    req.session.tempUserData = { userName, email, phone, password };

    // Email options
    let mailOptions = {
      to: email,
      subject: "Your OTP code",
      text: `Your OTP code is ${otp}. It is valid for 2 minutes. Please do not share it with anyone.`,
    };

    // Send OTP email
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log(err);
        return res.render("user/userSignup", { message: "Failed to send OTP" });
      }
      res.render("user/verificationOTP", { msg: "" });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Hashing the Password
const securePassword = async (password) => {
  try {
    const hashPassword = await bcrypt.hash(password, 10);
    return hashPassword;
  } catch (error) {
    console.log(error);
  }
};

// Verify OTP and Create User after OTP Verification
const verifyOtp = async (req, res) => {
  try {
    const { otp: userOtp } = req.body;
    const currentTime = Date.now();

    if (currentTime > otpExpirationTime) {
      return res.render("user/verificationOTP", { msg: "Time expired" });
    } else if (userOtp == otp) {
      const { userName, email, phone, password } = req.session.tempUserData;
      if (userName && email && phone && password) {
        const spassword = await securePassword(password);

        const user = new User({
          userName,
          email,
          phone,
          password: spassword,
        });

        const userData = await user.save();

        req.session.user_id = userData._id;
        res.redirect("/user/login");
      } else {
        res.render("user/userSignup", {
          message: "Session expired, please try signing up again",
        });
      }
    } else {
      res.render("user/verificationOTP", { msg: "OTP is incorrect" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// Resend OTP
const resendOtp = async (req, res) => {
  try {
    // Generate a new OTP
    otp = Math.floor(Math.random() * 100000);
    otpExpirationTime = Date.now() + 2 * 60 * 1000;
    console.log(`New OTP: ${otp}`);
    console.log(`otp = ${otp}`);
    // Destructure tempUserData from the session
    const { email } = req.session.tempUserData || {};
    if (!email) {
      return res.render("user/userSignup", {
        message: "Session expired, please try signing up again",
      });
    }
    console.log('otp for  resent',otp)
    // Email options with the new OTP
    let mailOptions = {
      to: email, // Using destructured email
      subject: "Your new OTP code",
      text: `Your new OTP code is ${otp}. It is valid for 2 minutes. Please do not share it with anyone.`,
    };

    // Send the new OTP via email
    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log(err);
        return res.render("user/verificationOTP", {
          msg: "Failed to send new OTP",
        });
      }
      res.render("user/verificationOTP", {
        msg: "A new OTP has been sent to your email.",
      });
    });
  } catch (error) {
    console.log(error.message);
    res.render("user/verificationOTP", {
      msg: "An error occurred, please try again",
    });
  }
};

// --rendering landing page---///
const loadLandingPage = async (req, res) => {
  try {
    const blockbusterDeals = [];
    const newArrivals = [];
    res.render("user/landingPage", { blockbusterDeals, newArrivals });
  } catch (error) {
    console.log(error.message);
  }
};

const loadLogin = async (req, res) => {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    let message = "";
    res.render("user/userLogin", { message });
  }
};

//----submmission -login details....//

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    req.session.user_id = user._id;
  
    if (!user) {
      return res.render("user/userSignup", {
        message: "Email doesn't exist require signUp",
      });
    }
    if(user.isBlocked===true){
      return res.render('user/userSignup',{
        message:'Your account is blocked'
      })
    }
    //----veryfying password---//

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.render("user/userLogin", {
        message: "invalid email or password",
      });
    }
    req.session.user = user;
    req.session.user.IsBlocked = user.isBlocked;
    req.session.message={type:'success',text:'user Logged in successfully'}
    return res.redirect("/user/home");
  } catch (error) {
    console.error(error); // Logs the actual error
    return res.status(500).json({ message: "Server error" }); // Clean error message for the response
  }
};

//---user-home---//
const userHome = async (req, res) => {
  try {
    const message=req.session.message||null
    req.session.message=null
    const banners=await Banner.findOne({title:"Festivale Sale",status:true})
    const blockbusterDeals = await Product.find({isfeatured:true}).limit(5);
    const newArrivals = await Product.find().sort({createdAt:-1}).limit(5);
    res.render("user/userHome", { blockbusterDeals, newArrivals, message,banners });
  } catch (error) {
    console.error(error);
    return res.status(500).send("server error" + "hello");
  }
};

//----forgot-password---//
const loadForgotPassword = async (req, res) => {
  try {
    const message = "";
    res.render("user/forgotPassword", { message });
  } catch (error) {
    console.error(error);
  }
};

//---sending password resetting---otp--
const sendPasswordResetOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.render("user/forgotPassword", {
        message: "Email not registered",
      });
    }
    //--otp-generation//
    req.session.resetOtp = Math.floor(100000 + Math.random() * 900000);
    req.session.otpExpirationTime = Date.now() + 1 * 60 * 1000;
    req.session.email = email;
    //send otp//
    let mailOptions = {
      to: email,
      subject: "Password Reset Otp",
      text: `Your otp for resetting password is ${req.session.resetOtp}.It is valid for one minute`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log(err);
        return res.render("user/forgotPassword", {
          msg: "Failed to send new OTP",
        });
      }
      res.render("user/resetOTP", {
        msg: "A  OTP has been sent to your email.",
        email,
      });
    });
  } catch (error) {
    console.error(error);
  }
};
//---verification of reset password otp----///
const verifyResetOtp = async (req, res) => {
  try {
    const { resetOtp, otpExpirationTime } = req.session;
  
    const { email, otp } = req.body;

    if (otp != resetOtp || Date.now() > otpExpirationTime) {
      return res.render("user/resetOTP", {
        msg: "Otp doesnt match or time expired",
      });
    } else {
      return res.render("user/resetPassword", { message: null });
    }
  } catch (error) {
    console.error(error);
  }
};

//----inputting new password---///
const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { email } = req.session;
    if (newPassword !== confirmPassword) {
      return res.render("user/resetPassword", {
        message: "password do not match.",
      });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("user/resetPassword", { message: "User not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    res.redirect("/login");
  } catch (error) {
    console.log(error);
    res.render("user/resetPassword", {
      message: "An error occured.Please try again later",
    });
  }
};

//---resending passwordReset Otp--//
const resendPasswordResetOtp = async (req, res) => {
  try {
    console.log(req.session.email);
    const { email } = req.session;
    if (!email) {
      return res.render("user/forgotPassword", {
        message: "session expired try again",
      });
    }

    // generating otp----///
    const newOtp = Math.floor(100000 + Math.random() * 900000);
    req.session.resetOtp = newOtp;
    req.session.otpExpirationTime = Date.now() + 1 * 60 * 1000;
    console.log(`new password reset otp:${newOtp}`);

    //----resending otp through email---/
    let mailOptions = {
      to: email,
      subject: "Your password Reset new Otp",
      text: `Your new otp for resetting your password is ${newOtp}.It is valid for i minute.Please do not share it with anyone.`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.log(err);
        return res.render("user/resetOTP", { msg: "failed to send new Otp" });
      }
      res.render("user/resetOTP", {
        msg: "A new Otp has been sent to your email.",
      });
    });
  } catch (error) {
    console.log(error);
    res.render("user/resetOTP", {
      msg: "an error occured .Please try again later",
    });
  }
};
//---------------------completed--------resending otp----//
const getLogout = async (req, res) => {
;

  req.session.destroy((err) => {
    if (err) {
      req.session.logout = { type: false, message: "Error in logout" };
      return res.redirect("/userProfile"); // Error message
    }

    res.redirect("/home"); // Success message
  });
};

module.exports = {
  loadSignup,
  insertUser,
  verifyOtp,
  loadLandingPage,
  resendOtp,
  loadLogin,
  userLogin,
  userHome,
  loadForgotPassword,
  sendPasswordResetOtp,
  verifyResetOtp,
  resendPasswordResetOtp,
  resetPassword,
  getLogout,
};
