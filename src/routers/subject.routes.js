// routes/subject.routes.js
import express from 'express';
import {
  createSubject,
  getAllSubjects,
  deleteSubject
} from '../controllers/subject.controller.js';

const router = express.Router();

router.post('/createSubject', createSubject);
router.get('/getAllSubjects', getAllSubjects);
router.delete('/deleteSubject/:subjectId', deleteSubject);

export default router;
