import express from 'express';
import {
  createStudentAccount,
  getStudentByName,
  getAllStudents,
  deleteStudent,
  generateStudentCertificate,
  generateStudentHallTicket,
  updateDocumentVerification,
  verifyQRCode,
  logDocumentVerification,
  manualVerificationController,
} from '../controllers/employee.controller.js';

const router = express.Router();

// 1. Create a new student account
router.post('/create-student', createStudentAccount);

// 2. Get student by name (search by first name)
router.get('/student/:name', getStudentByName);

// 3. Get all students with optional filter by passing year
router.get('/getAllStudents', getAllStudents);

// 4. Delete a student account
router.delete('/student/:studentId', deleteStudent);

// 5. Generate Certificate for a student
router.post('/generate-certificate', generateStudentCertificate);

// 6. Generate Hall Ticket for a student
router.post('/generate-hallticket', generateStudentHallTicket);

// 7. Update Document Verification Status (Manual)
router.post('/update-document-verification', updateDocumentVerification);

// 8. Scan QR Code for Document Verification
router.post('/verify-qr-code', verifyQRCode);

// 9. Log Document Verification Result
router.post('/log-verification', logDocumentVerification);

// 10. Manually update document verification status
router.post('/manual-verification', manualVerificationController);

export default router;
