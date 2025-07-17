import  User  from '../models/user.model.js';
import  Student  from '../models/student.model.js';
import  Course  from '../models/Course.model.js';
// import  CourseStudent  from '../models/courseStudent.model.js';
import { generateCertificate,generateHallTicket,logVerification,scanQRCode, updateDocumentVerificationStatus } from '../services/document.service.js'; // For certificate generation
import { generateToken } from '../utils/generateJWTToken.js'; // For token generation
import hashPassword from '../utils/hashPassword.js';
import sendMailer from '../utils/emailService.js';  // Optional for email notification
import dotenv from 'dotenv';
import { validationResult } from 'express-validator'; // Optional for validation

dotenv.config();

export const createStudentAccount = async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      firstName,
      lastName,
      aadharNumber,
      dob,                // ⬅️ Added here
      rollNumber,
      institutionName,
      institutionAddress,
      passingYear,
      fatherName,
      educationDetails,
      phoneNumber,
      address,
      courseId,
      ...studentDetails
    } = req.body;

    // Express-validator errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check required fields presence
    const missingFields = [];
    if (!dob) missingFields.push('dob');
    if (!institutionAddress) missingFields.push('institutionAddress');
    if (!passingYear) missingFields.push('passingYear');
    if (!fatherName) missingFields.push('fatherName');
    if (!courseId) missingFields.push('courseId');
    if (!educationDetails || !educationDetails.length || !educationDetails[0].degree || !educationDetails[0].major || !educationDetails[0].grade) {
      missingFields.push('educationDetails (degree, major, grade)');
    }

    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Validate dob is a valid date and not in the future
    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format for dob' });
    }
    if (dobDate > new Date()) {
      return res.status(400).json({ message: 'dob cannot be a future date' });
    }

    // Validate courseId
    const course = await Course.findById(courseId).lean();
    if (!course) {
      return res.status(400).json({ message: 'Invalid courseId provided' });
    }

    // Check for existing user or student
    const [existingUser, existingStudent] = await Promise.all([
      User.findOne({ $or: [{ username }, { email }] }).lean(),
      Student.findOne({ $or: [{ aadharNumber }, { rollNumber }] }).lean()
    ]);
    if (existingUser) return res.status(400).json({ message: 'Username or Email already exists' });
    if (existingStudent) return res.status(400).json({ message: 'Aadhar Number or Roll Number already exists' });

    // Hash password
    const hashedPassword = await hashPassword(password);
    if (!hashedPassword) return res.status(500).json({ message: 'Error hashing password' });

    // Create user
    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
      role: 'student',
    });

    // Create student (including dob)
    const student = await Student.create({
      userId: user._id,
      aadharNumber,
      dob: dobDate,
      rollNumber,
      institutionName,
      institutionAddress,
      passingYear,
      fatherName,
      educationDetails,
      phoneNumber,
      address,
      courseId,
      ...studentDetails
    });

    // Generate token and send welcome mail (don't block response)
    generateToken(res, user);
    sendMailer(email, 'Welcome to the platform', 'Your account has been created successfully.');

    return res.status(201).json({ message: 'Student account created successfully', student });

  } catch (error) {
    console.error('Error creating student account:', error);
    return res.status(500).json({ message: 'Error creating student account', error: error.message });
  }
};



// 2. Get student by name (first or last name)
export const getStudentByName = async (req, res) => {
  try {
    const { name } = req.params;
    const users = await User.find({
      role: 'student',
      $or: [
        { firstName: new RegExp(name, 'i') },
        { lastName: new RegExp(name, 'i') }
      ]
    });

    if (!users.length) {
      return res.status(404).json({ message: 'No student user found with this name' });
    }

    const userIds = users.map(u => u._id);
    const students = await Student.find({ userId: { $in: userIds } }).populate('userId');

    return res.status(200).json({ students });

  } catch (error) {
    console.error('Error fetching student by name:', error);
    return res.status(500).json({ message: 'Error fetching student' });
  }
};


// 3. Get all students (optional filter by passing year)
export const getAllStudents = async (req, res) => {
  try {
    const { passingYear } = req.query;
    const filter = {};

    // 🎯 Validate and apply passingYear filter
    if (passingYear) {
      const year = parseInt(passingYear);
      if (isNaN(year)) {
        return res.status(400).json({ message: 'Invalid passing year provided' });
      }
      filter.passingYear = year;
    }

    // 📦 Query with filters and populate
    const students = await Student.find(filter)
      .populate('userId', 'firstName lastName username email status')
      .populate('courseId', 'name code department');

    // ✅ Don't treat 0 students as error — just return an empty array
    return res.status(200).json({ students });

  } catch (error) {
    console.error('Error fetching all students:', error);
    return res.status(500).json({ message: 'Error fetching students' });
  }
};



// 4. Delete student account
export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByIdAndDelete(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await User.findByIdAndDelete(student.userId);
    return res.status(200).json({ message: 'Student account deleted successfully' });
  } catch (error) {
    console.error('Error deleting student account:', error);
    return res.status(500).json({ message: 'Error deleting student account' });
  }
};

// OLDER CODE BELOW

// 5. Generate Certificate for a Student
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

// 6. Generate Hall Ticket for a Student
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

// 7. Update Document Verification Status
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

// 8. Scan QR Code for Document Verification
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

// 9. Log Document Verification
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

export const manualVerificationController = async (req, res) => {
  try {
    const { studentId, certificateNo, isVerified } = req.body;

    // Validate inputs
    if (!studentId || !certificateNo || typeof isVerified !== 'boolean') {
      return res.status(400).json({ error: 'Invalid input data. Ensure all fields are provided correctly.' });
    }

    // Directly update the document verification status
    const updateResult = await updateDocumentVerificationStatus(studentId, certificateNo, isVerified);

    if (!updateResult) {
      return res.status(404).json({ error: 'Document or student not found.' });
    }

    return res.status(200).json({
      message: 'Verification status updated successfully!',
      result: updateResult,
    });
  } catch (error) {
    console.error('Error performing manual verification:', error);
    res.status(500).json({ error: 'Something went wrong during manual verification.' });
  }
};








