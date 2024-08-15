const Profile = require("../models/Profile");
const User = require("../models/User");

exports.updateProfile = async (req, res) => {
  try {
    // Get data
    const { dateOfBirth = "", about = "", contactNumber, gender } = req.body;
    // Get userId
    const id = req.user.id;
    // validation
    if (!contactNumber || !gender || !id) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    // find profile
    const userDetails = await User.findById(id);
    const profileId = userDetails.additionalDetails;
    const profileDetails = await Profile.findById(profileId);

    // Update Profile
    profileDetails.dateOfBirth = dateOfBirth;
    profileDetails.about = about;
    profileDetails.contactNumber = contactNumber;
    profileDetails.gender = gender;
    await profileDetails.save();

    // Return Response
    return res.status(200).json({
      success: true,
      message: "Profile Details Updated Successfully",
      profileDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update profile, Please try again",
      error: error.message,
    });
  }
};

// Delete Account
// HW : How can we schedule this deletion operation
exports.deleteAccount = async (req, res) => {
  try {
    // get id
    const id = req.user.id;
    // validation
    const userDetails = await User.findById(id);
    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
    // Delete Profile
    await Profile.findByIdAndDelete({ _id: userDetails.additionalDetails });
    // TODO: HW unenroll user from all enrolled courses
    // Delete User
    await User.findByIdAndDelete({ _id: id });
    // return response
    return res.status(200).json({
      success: true,
      message: "User Deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to delete User, Please try again",
      error: error.message,
    });
  }
};

exports.getAllUserDetails = async (req, res) => {
  try {
    // Get id
    const id = req.user.id;

    // Validation and get user details
    const userDetails = await User.findById(id)
      .populate("additionalDetails")
      .exec();
    // return Response
    return res.status(200).json({
      success: true,
      message: "User Data Fetched Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to get user details, Please try again",
      error: error.message,
    });
  }
};
