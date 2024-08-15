const Section = require("../models/Section");
const Course = require("../models/Course");

exports.createSection = async (req, res) => {
  try {
    // Data Fetch
    const { sectionName, courseId } = req.body;
    // Data Validation
    if (!sectionName || !courseId) {
      return res.status(400).json({
        success: false,
        message: "Missing Properties",
      });
    }
    // Create Section
    const newSection = await Section.create({ sectionName });
    // Update Course with section objectid
    const updatedCourseDetails = await Course.findByIdAndUpdate(
      courseId,
      {
        $push: {
          courseContent: newSection._id,
        },
      },
      { new: true }
    );
    // HW : use populate to replace sections/sub-sections both in the updatedCourseDetails
    // return success
    return res.status(200).json({
      success: true,
      message: "Section created successfully",
      updatedCourseDetails,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create Section, Please try again",
      error: error.message,
    });
  }
};

exports.updateSection = async (req, res) => {
  try {
    // Data Input
    const { sectionName, sectionId } = req.body;
    // Data Validation
    if (!sectionName || !sectionId) {
      return res.status(400).json({
        success: false,
        message: "Missing Properties",
      });
    }
    // Update Data
    const section = await Section.findByIdAndUpdate(
      sectionId,
      { sectionName },
      { new: true }
    );
    // Return Response
    return res.status(200).json({
      success: true,
      message: "Section Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update Section, Please try again",
      error: error.message,
    });
  }
};

exports.deleteSection = async (req, res) => {
  try {
    // Get ID - Assuming that we are sending ID in the param
    const { sectionId } = req.params;
    // Use findByIdAndDelete
    await Section.findByIdAndDelete(sectionId);
    // Return Response
    return res.status(200).json({
      success: true,
      message: "Section Deleted Successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to delete Section, Please try again",
      error: error.message,
    });
  }
};
