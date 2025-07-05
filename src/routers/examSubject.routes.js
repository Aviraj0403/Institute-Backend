// routes/examSubject.routes.js
import express from 'express';
import {
  assignSubjectToCourse,
  getSubjectsForCourse
} from '../controllers/examSubject.controller.js';

const router = express.Router();

router.post('/assignSubjectToCourse', assignSubjectToCourse);
router.get('/getSubjectsForCourse/:courseId', getSubjectsForCourse);

export default router;
