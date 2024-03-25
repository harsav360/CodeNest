const User = require("../models/User");
const OTP = require("../models/OTP");
const otpGenerator = require("otp-generator");
const bcrypt = require("bcryptjs");
const Profile = require("../models/Profile");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const mailSender = require("../utils/mailSender");

// Send OTP
exports.sendOTP = async (req, res) => {
  try {
    // Fetch email from request body
    const { email } = req.body;

    //Check if user already exist
    const checkUserPresent = await User.findOne({ email });

    // If user already exist, then return a response
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already registered",
      });
    }

    // Generate OTP
    var otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // Check Unique OTP or not
    const result = await OTP.findOne({ otp: otp });

    // Check until you got Unique OTP

    while (result) {
      otp = otpGenerator(6, {
        upperCaseAlphabets: false,
        lowerCaseAlphabets: false,
        specialChars: false,
      });
      result = await OTP.findOne({ otp: otp });
    }

    console.log("OTP-Generated", otp);

    const otpPayload = { email, otp };

    // Create entry for database
    const otpBody = await OTP.create(otpPayload);
    console.log(otpBody);

    // Return Response Success
    res.status(200).json({
      success: true,
      message: "OTP Sent Successfully",
      otp,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Sign Up
exports.signUp = async (req, res) => {
  try {
    // Data Fetch from the request Body
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    // Do Validation

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !confirmPassword ||
      !otp
    ) {
      return res.status(403).json({
        success: false,
        message: "All fields are required",
      });
    }

    //Check Password and Confirm Password
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Password and ConfirmPassword Value does not match, Please try again",
      });
    }

    // Check User already exist or not
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User is already registered",
      });
    }

    // Find most recent OTP stored for the user
    const recentOtp = await OTP.find({ email })
      .sort({ createdAt: -1 })
      .limit(1);
    console.log(recentOtp);
    // Validate OTP
    if (recentOtp.length == 0) {
      // OTP not found
      return res.status(400).json({
        success: false,
        message: "OTP not Found",
      });
    } else if (otp !== recentOtp) {
      // Invalid OTP
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }
    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);
    // create entry in database
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      additionalDetails: profileDetails._id,
      image: `https://api.dicebear.com/5.x/initials/svg?seed=${firstName} ${lastName}`,
    });
    // Return Success Response
    return res.status(200).json({
      success: true,
      message: "User is registered Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "User is not Registered, Please try again",
    });
  }
};

//Login

exports.login = async (req, res) => {
  try {
    // Get data from req body
    const { email, password } = req.body;

    // Validation of data
    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "All fields are required, Please try again",
      });
    }
    // Check Existing User or not
    const user = await User.findOne({ email }).populate("additionalDetails");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered, Please signup first",
      });
    }
    // Generate JWT, after password matching
    if (await bcrypt.compare(password, user.password)) {
      const payload = {
        email: user.email,
        id: user._id,
        accountType: user.accountType,
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "2h",
      });
      user.token = token;
      user.password = undefined;

      // Create Cookie and send response
      const options = {
        expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 100),
        httpOnly: true,
      };

      res.cookie("token", token, options).status(200).json({
        success: true,
        token,
        user,
        message: "Logged in Successfully",
      });
    } else {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Login Failure, Please try again",
    });
  }
};

//Change Password
exports.changePassword = async (req, res) => {
  try {
    // Get data from Request body
    // Get oldPassword,newPassword, and confirmNewPassword
    const { oldPassword, newPassword, confirmPassword } = req.body;
    const userId = req.user.id;
    const user = await User.findById(userId);
    // Validation
    if (bcrypt.compare(oldPassword, user.password)) {
      if (newPassword !== confirmPassword) {
        return res.status(401).json({
          success: false,
          message: "Password didn't match",
        });
      } else {
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Password Update
        await User.findOneAndUpdate(
          userId,
          { password: hashedPassword },
          { new: true }
        );
        // Send Mail - Password Changed
        try {
          const mailResponse = await mailSender(
            user.email,
            "Password update email from CodeNest",
            "Password Updated Successfully"
          );
          console.log("Email Sent Successfully : ", mailResponse);
        } catch (error) {
          console.log("Error Occured while sending mails : ", error);
          throw error;
        }
        // Return Response
        return res.status(200).json({
          success: true,
          message: "Password Updated successfully",
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Old Password didn't match",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong during password update, Please try again",
    });
  }
};
