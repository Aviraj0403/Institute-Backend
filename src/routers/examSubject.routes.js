// routes/examSubject.routes.js
import express from 'express';
import {
  assignSubjectToCourse,
  getSubjectsForCourse,
  updateExamSubject,
  deleteExamSubject
} from '../controllers/examSubject.controller.js';

const router = express.Router();

router.post('/assignSubjectToCourse', assignSubjectToCourse);
router.get('/getSubjectsForCourse/:courseId', getSubjectsForCourse);
router.put('/updateExamSubject/:id', updateExamSubject);
router.delete('/deleteExamSubject/:id', deleteExamSubject);

export default router;
