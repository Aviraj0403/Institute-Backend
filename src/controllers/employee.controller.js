import { generateCertificate, generateHallTicket, updateDocumentVerificationStatus, scanQRCode, logVerification } from '../services/documentService.js';
import { Student } from '../models/student.js';
import { User } from '../models/user.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwtUtils.js'; // For token generation

// 1. Create a new student account
export const createStudentAccount = async (req, res) => {
  try {
    const { username, password, email, firstName, lastName, ...studentDetails } = req.body;

    // Check if the username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or Email already exists' });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create a new user for the student
    const user = new User({ username, password: hashedPassword, email, firstName, lastName, role: 'student' });
    await user.save();

    // Create a student profile
    const student = new Student({
      userId: user._id,
      ...studentDetails,
    });
    await student.save();

    // Generate access and refresh tokens
    await generateToken(res, user);

    return res.status(201).json({ message: 'Student account created successfully', student });
  } catch (error) {
    console.error('Error creating student account:', error);
    return res.status(500).json({ message: 'Error creating student account' });
  }
};

// 2. Generate Certificate for a Student
export const generateStudentCertificate = async (req, res) => {
  try {
    const { studentId, certificateDetails } = req.body;
    const student = await Student.findById(studentId);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const certificate = await generateCertificate(studentId, `${student.firstName} ${student.lastName}`, certificateDetails);
    res.status(200).json({ message: 'Certificate generated successfully', fileUrl: certificate.fileUrl });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ message: 'Error generating certificate' });
  }
};

// 3. Generate Hall Ticket for a Student
export const generateStudentHallTicket = async (req, res) => {
  try {
    const { studentId, certificateNo } = req.body;
    const hallTicketUrl = await generateHallTicket(studentId, certificateNo);
    res.status(200).json({ message: 'Hall Ticket generated successfully', fileUrl: hallTicketUrl });
  } catch (error) {
    console.error('Error generating hall ticket:', error);
    res.status(500).json({ message: 'Error generating hall ticket' });
  }
};

// 4. Update Document Verification Status
export const updateDocumentVerification = async (req, res) => {
  try {
    const { studentId, certificateNo, isVerified } = req.body;
    const updatedDocument = await updateDocumentVerificationStatus(studentId, certificateNo, isVerified);
    res.status(200).json({ message: 'Document verification updated', document: updatedDocument });
  } catch (error) {
    console.error('Error updating document verification:', error);
    res.status(500).json({ message: 'Error updating document verification' });
  }
};

// 5. Scan QR Code for Document Verification
export const verifyQRCode = async (req, res) => {
  try {
    const { qrCodeUrl } = req.body;
    const verificationResult = await scanQRCode(qrCodeUrl);

    if (verificationResult.status === 'Student not found' || verificationResult.status === 'Document not found') {
      return res.status(404).json({ message: verificationResult.status });
    }

    res.status(200).json({ status: verificationResult.status, student: verificationResult.student, document: verificationResult.document });
  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({ message: 'Error scanning QR code' });
  }
};

// 6. Log Document Verification
export const logDocumentVerification = async (req, res) => {
  try {
    const { employerId, studentId, certificateNo, documentId, verificationResult, verificationComments } = req.body;
    const verificationLog = await logVerification(employerId, studentId, certificateNo, documentId, verificationResult, verificationComments);
    res.status(200).json({ message: 'Verification logged successfully', verificationLog });
  } catch (error) {
    console.error('Error logging verification:', error);
    res.status(500).json({ message: 'Error logging verification' });
  }
};
