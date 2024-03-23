const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const bcrypt = require("bcryptjs");

// Resent Password Token
exports.resetPasswordToken = async (req, res) => {
  try {
    // Get email from req body
    const email = req.body.email;

    // Check user for this email, email validation
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.json({
        success: false,
        message: "Your email is not registered with us",
      });
    }
    // Generate Token
    const token = crypto.randomUUID();
    // Update User by adding token and expiration time
    const updatedDetails = await User.findOneAndUpdate(
      { email: email },
      {
        token: token,
        resetPasswordExpires: Date.now() + 5 * 60 * 1000,
      },
      { new: true }
    );
    // Create URL
    const url = `http://localhost:3000/update-password/${token}`;
    // Send mail containing the url
    await mailSender(
      email,
      "Password Reset Link",
      `Password Reset Link : ${url}`
    );
    // return response
    return res.json({
      success: true,
      message:
        "Email sent Successfully, Please check email and change Password",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while reset password, Please try again",
    });
  }
};
// Reset Password
exports.resetPassword = async (req, res) => {
  try {
    // Data Fetch
    const { password, confirmPassword, token } = req.body;

    // Validation
    if (password !== confirmPassword) {
      return res.json({
        success: false,
        message: "Password not Matching",
      });
    }
    // Get user Details from db using token
    const userDetails = await user.findOne({ token: token });
    // if no entry - Invalid token
    if (!userDetails) {
      return res.json({
        success: false,
        message: "Token is invalid",
      });
    }
    // Token time check
    if (userDetails.resetPasswordExpires < Date.now()) {
      return res.json({
        success: false,
        message: "Token is expired, Please regenerate your token",
      });
    }
    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Password Update
    await User.findOneAndUpdate(
      { token: token },
      { password: hashedPassword },
      { new: true }
    );
    // Return Response
    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong, Please try after sometime",
    });
  }
};
