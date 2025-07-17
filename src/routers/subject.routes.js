// routes/subject.routes.js
import express from 'express';
import {
  createSubject,
  getAllSubjects,
  deleteSubject,
  updateSubject
} from '../controllers/subject.controller.js';

const router = express.Router();

router.post('/createSubject', createSubject);
router.get('/getAllSubjects', getAllSubjects);
router.delete('/deleteSubject/:subjectId', deleteSubject);

router.put('/updateSubject/:subjectId', updateSubject);

export default router;
