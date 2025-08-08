import express from 'express';
import {  
  changePassword, 
  raiseSupportTicket, 
  downloadDocument, 
  checkDocumentReleaseStatus, 
  releaseDocument 
} from '../controllers/student.controller.js'; // Import the controller functions

import { getStudentProfile,
  updateStudent, 
  deleteStudent
 } from '../controllers/admin.controller.js '; 
const router = express.Router();

// 1. Get Student Profile Details
// router.get('/profile', getStudentProfile); // Get student profile details
router.get('/student/:studentId', getStudentProfile);
router.put('/student/:studentId', updateStudent);  // 🔄 update
router.delete('/student/:studentId', deleteStudent);

// 2. Change Password
router.post('/change-password', changePassword); // Student changes password

// 3. Raise a Support Ticket
router.post('/raise-ticket', raiseSupportTicket); // Raise a support ticket for any issues

// 4. Download Document (Hall Ticket / Result)
router.get('/download-document/:documentType', downloadDocument); // Download hall ticket or result

// 5. Check Document Release Status (Hall Ticket / Result)
router.get('/document-release-status/:documentType', checkDocumentReleaseStatus); // Check release status of hall ticket or result

export default router;
