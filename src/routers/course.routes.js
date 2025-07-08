import express from 'express';
import {
  createCourse,
  getAllCourses,
  getCourseById,
  deleteCourse,
  updateCourse
} from '../controllers/course.controller.js';

const router = express.Router();

// Create a new course
router.post('/createCourse', createCourse);

// Get all courses
router.get('/getAllCourses', getAllCourses);

// Get a single course by ID
router.get('/getCourseById/:courseId', getCourseById);

// Update an existing course
router.put('/updateCourse/:courseId', updateCourse);

// Delete a course
router.delete('/deleteCourse/:courseId', deleteCourse);

export default router;
