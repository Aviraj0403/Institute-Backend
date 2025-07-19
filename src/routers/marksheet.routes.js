import express from 'express';
import multer from 'multer';
import {
  uploadMarksheetExcel,
  upsertMarksheet,
  generateMarksheetPDF,
  getPaginatedMarksheetList,
  isResultAvailable
} from '../controllers/marksheet.controller.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/marksheet/upload-excel', upload.single('file'), uploadMarksheetExcel);

router.post('/marksheet/upsert', upsertMarksheet);

router.get('/marksheet/pdf/:studentId', generateMarksheetPDF);
router.get('/marksheet/list', getPaginatedMarksheetList);
router.get('/marksheet/check', isResultAvailable);

export default router;
