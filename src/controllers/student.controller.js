import { generateCertificate, generateHallTicket, updateDocumentVerificationStatus, logVerification, scanQRCode } from '../services/documentService.js';
import { Document } from '../models/document.js';
import { Student } from '../models/student.js';

// Get student profile
export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }).populate('userId', 'username firstName lastName email');
    
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    res.status(200).json({ student });
  } catch (error) {
    res.status(500).json({ message: "Something went wrong", error: error.message });
  }
};

// Download hall ticket or result
export const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    // Check if document exists for this student
    const document = await Document.findOne({ _id: documentId, studentId: req.user.id });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Call utility to handle file download
    res.redirect(document.filePath); // Use file URL from Cloudinary
  } catch (error) {
    res.status(500).json({ message: "Error downloading document", error: error.message });
  }
};


