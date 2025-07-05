// routes/course.routes.js
import express from 'express';
import {
  createCourse,
  getAllCourses,
  getCourseById,
  deleteCourse
} from '../controllers/course.controller.js';

const router = express.Router();

router.post('/createCourse', createCourse);
router.get('/getAllCourses', getAllCourses);
router.get('/getCourseById/:courseId', getCourseById);
router.delete('/deleteCourse/:courseId', deleteCourse);

export default router;
