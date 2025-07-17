import  Document  from '../models/document.model.js';
import  Student  from '../models/student.model.js';
import  User  from '../models/user.model.js';
import { Ticket } from '../models/ticket.model.js'; // Assuming a ticket model for student issues
import bcrypt from 'bcryptjs'; // For password hashing

// 1. Get Student Profile Details


// 2. Change Password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate the new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    // Fetch the student user details
    const student = await User.findById(req.user.id);
    
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Compare the current password with the one in the database
    const isMatch = await bcrypt.compare(currentPassword, student.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    student.password = hashedPassword;
    await student.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Error changing password", error: error.message });
  }
};

// 3. Raise a Support Ticket
export const raiseSupportTicket = async (req, res) => {
  try {
    const { issueType, description } = req.body;

    // Validate input data
    if (!issueType || !description) {
      return res.status(400).json({ message: "Issue type and description are required" });
    }

    // Create a new ticket for the student
    const ticket = new Ticket({
      studentId: req.user.id,
      issueType,
      description,
      status: 'Open', // Ticket starts as 'Open'
      createdAt: new Date(),
    });

    await ticket.save();

    // Notify the employee about the new ticket (Optional: Email or notification logic can go here)
    res.status(201).json({ message: "Support ticket raised successfully", ticket });
  } catch (error) {
    console.error("Error raising support ticket:", error);
    res.status(500).json({ message: "Error raising support ticket", error: error.message });
  }
};

// 4. Download Document (Hall Ticket or Result)
export const downloadDocument = async (req, res) => {
  try {
    const { documentType } = req.params;

    // Validate documentType
    if (!['hall-ticket', 'result'].includes(documentType)) {
      return res.status(400).json({ message: "Invalid document type. Must be 'hall-ticket' or 'result'." });
    }

    // Fetch the document based on student ID and document type
    const document = await Document.findOne({ 
      studentId: req.user.id, 
      documentType, 
      releaseStatus: 'released' // Only released documents can be downloaded
    });

    if (!document) {
      return res.status(404).json({
        message: documentType === 'hall-ticket' ? "Hall Ticket not released yet!" : "Result not released yet!"
      });
    }

    // Document is released, proceed to download
    res.redirect(document.filePath); // Redirect to Cloud URL or file path for download
  } catch (error) {
    console.error("Error downloading document:", error);
    res.status(500).json({ message: "Error downloading document", error: error.message });
  }
};

// 5. Check Document Release Status
export const checkDocumentReleaseStatus = async (req, res) => {
  try {
    const { documentType } = req.params;

    // Validate documentType
    if (!['hall-ticket', 'result'].includes(documentType)) {
      return res.status(400).json({ message: "Invalid document type. Must be 'hall-ticket' or 'result'." });
    }

    // Fetch the document release status based on student ID and document type
    const document = await Document.findOne({ 
      studentId: req.user.id, 
      documentType 
    });

    if (!document) {
      return res.status(404).json({
        message: documentType === 'hall-ticket' ? "Hall Ticket not found!" : "Result not found!"
      });
    }

    // Return the release status
    res.status(200).json({
      message: documentType === 'hall-ticket' ? "Hall Ticket status" : "Result status",
      releaseStatus: document.releaseStatus,
    });
  } catch (error) {
    console.error("Error fetching document release status:", error);
    res.status(500).json({ message: "Error fetching document release status", error: error.message });
  }
};

// 6. Release Hall Ticket / Result (Admin functionality to update status)
export const releaseDocument = async (req, res) => {
  try {
    const { documentType, studentId } = req.body;

    // Validate documentType
    if (!['hall-ticket', 'result'].includes(documentType)) {
      return res.status(400).json({ message: "Invalid document type. Must be 'hall-ticket' or 'result'." });
    }

    // Check if the student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if the document exists for this student and update the release status
    const updatedDocument = await Document.findOneAndUpdate(
      { studentId: student._id, documentType },
      { releaseStatus: 'released' },
      { new: true }
    );

    if (!updatedDocument) {
      return res.status(404).json({ message: "Document not found for the student" });
    }

    res.status(200).json({ message: `${documentType} released successfully`, document: updatedDocument });
  } catch (error) {
    console.error("Error releasing document:", error);
    res.status(500).json({ message: "Error releasing document", error: error.message });
  }
};
