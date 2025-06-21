import express from 'express';
import {
  createStudentAccount,
  generateStudentCertificate,
  generateStudentHallTicket,
  updateDocumentVerification,
  verifyQRCode,
  logDocumentVerification,
} from '../controllers/employeeController.js';

const router = express.Router();

// Employee routes for managing students
router.post('/create-student', createStudentAccount); // Employee creates a student account
router.post('/generate-certificate', generateStudentCertificate); // Employee generates certificate
router.post('/generate-hallticket', generateStudentHallTicket); // Employee generates hall ticket
router.post('/update-document-verification', updateDocumentVerification); // Employee updates document verification status
router.post('/verify-qr-code', verifyQRCode); // Employee scans QR code to verify documents
router.post('/log-verification', logDocumentVerification); // Employee logs verification result

export default router;
