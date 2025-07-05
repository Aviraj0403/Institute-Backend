// controllers/course.controller.js
import Course from '../models/Course.model.js';

// Create a new course
export const createCourse = async (req, res) => {
  try {
    const { name, code, duration, department, description } = req.body;

    const existing = await Course.findOne({ $or: [{ name }, { code }] });
    if (existing) return res.status(409).json({ message: 'Course already exists' });

    const course = await Course.create({ name, code, duration, department, description });
    res.status(201).json({ message: 'Course created', course });
  } catch (error) {
    res.status(500).json({ message: 'Error creating course', error: error.message });
  }
};

// Get all courses
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    res.status(200).json({ courses });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching courses', error: error.message });
  }
};

// Get one course
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    res.status(200).json({ course });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching course', error: error.message });
  }
};

// Delete course
export const deleteCourse = async (req, res) => {
  try {
    const deleted = await Course.findByIdAndDelete(req.params.courseId);
    if (!deleted) return res.status(404).json({ message: 'Course not found' });

    res.status(200).json({ message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting course', error: error.message });
  }
};
