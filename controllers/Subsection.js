const SubSection = require("../models/SubSection");
const Section = require("../models/Section");
const { uploadImageToCloudinary } = require("../utils/imageUploader");

// Create Subsection

exports.createSubsection = async (req, res) => {
  try {
    // Fetch data from Req body
    const { sectionId, title, timeDuration, description } = req.body;
    // extract file/video
    const video = req.files.videoFile;
    // Validation
    if (!sectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    // upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );
    // Create a sub section
    const subSectionDetails = await SubSection.create({
      title: title,
      timeDuration: timeDuration,
      description: description,
      videoUrl: uploadDetails.secure_url,
    });
    // Update section with this sub section objectId
    const updatedSection = await Section.findByIdAndUpdate(
      { _id: sectionId },
      {
        $push: {
          subSection: subSectionDetails._id,
        },
      },
      { new: true }
    );
    // HW: log updated section here, after adding populate query
    // Return response
    return res.status(200).json({
      success: true,
      message: "SubSection created successfully",
      updatedSection,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create SubSection, Please try again",
      error: error.message,
    });
  }
};

// Update Sub-Section
exports.updateSubSection = async (req, res) => {
  try {
    // Data Input
    const { subSectionId, title, timeDuration, description } = req.body;
    const video = req.files.videoFile;
    // Validation
    if (!subSectionId || !title || !timeDuration || !description || !video) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }
    // upload video to cloudinary
    const uploadDetails = await uploadImageToCloudinary(
      video,
      process.env.FOLDER_NAME
    );
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

// delete Sub-Section
