// controllers/examSubject.controller.js
import ExamSubject from '../models/ExamSubject.model.js';
import Course from '../models/Course.model.js';
import Subject from '../models/subject.model.js';


// Assign subject to course with exam date
export const assignSubjectToCourse = async (req, res) => {
  try {
    const { courseId, subjectId, examDate, startTime, endTime } = req.body;

    // Validate required fields
    if (!courseId || !subjectId || !examDate || !startTime || !endTime) {
      return res.status(400).json({ message: 'All fields (courseId, subjectId, examDate, startTime, endTime) are required' });
    }

    // Optional checks
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    // Prevent duplicate entry
    const exists = await ExamSubject.findOne({ courseId, subjectId });
    if (exists) return res.status(409).json({ message: 'This subject is already assigned to the course' });

    // Create subject with time
    const examSubject = await ExamSubject.create({
      courseId,
      subjectId,
      examDate,
      startTime,
      endTime
    });

    res.status(201).json({ message: 'Subject assigned to course', examSubject });

  } catch (error) {
    console.error('Error assigning subject:', error);
    res.status(500).json({ message: 'Error assigning subject to course', error: error.message });
  }
};


// Get subjects for a course
export const getSubjectsForCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const examSubjects = await ExamSubject.find({ courseId }).populate('subjectId');

    res.status(200).json({ subjects: examSubjects });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects for course', error: error.message });
  }
};
