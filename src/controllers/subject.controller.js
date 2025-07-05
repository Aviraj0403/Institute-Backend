// controllers/subject.controller.js
import Subject from '../models/subject.model.js';

// Create subject
export const createSubject = async (req, res) => {
  try {
    const { code, name, type, maxMarks, minMarks } = req.body;

    const existing = await Subject.findOne({ code });
    if (existing) return res.status(409).json({ message: 'Subject code already exists' });

    const subject = await Subject.create({ code, name, type, maxMarks, minMarks });
    res.status(201).json({ message: 'Subject created', subject });
  } catch (error) {
    res.status(500).json({ message: 'Error creating subject', error: error.message });
  }
};

// Get all subjects
export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find();
    res.status(200).json({ subjects });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
};

// Delete subject
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    res.status(200).json({ message: 'Subject deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subject', error: error.message });
  }
};
