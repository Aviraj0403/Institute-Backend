import express from 'express';
import multer from 'multer';
import {
  uploadMarksheetExcel,
  upsertMarksheet,
  generateMarksheetPDF,
  getPaginatedMarksheetList,
  isResultAvailable,
  verifyStudentAndMarksheet,
  verifyMarksheet,
} from '../controllers/marksheet.controller.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/marksheet/upload-excel', upload.single('file'), uploadMarksheetExcel);

router.post('/marksheet/upsert', upsertMarksheet);

router.get('/marksheet/pdf/:studentId', generateMarksheetPDF);
router.get('/marksheet/list', getPaginatedMarksheetList);
router.get('/marksheet/check', isResultAvailable);

// Verification endpoint
router.get('/verify/:rollNumber', async (req, res) => {
  try {
    const { rollNumber } = req.params;

    // Call the verify function to get student and marksheet details
    const verificationResult = await verifyStudentAndMarksheet(rollNumber);

    // Check if there was an error
    if (verificationResult.error) {
      return res.status(404).json({ message: verificationResult.error });
    }

    // If student and marksheet are found, send the verification response
    return res.status(200).json({
      message: 'Marksheet Verified',
      student: verificationResult.student,
      marksheet: verificationResult.marksheet,
    });
  } catch (error) {
    console.error('Error during verification:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/marksheet/verify/:rollNumber', verifyMarksheet);

export default router;
