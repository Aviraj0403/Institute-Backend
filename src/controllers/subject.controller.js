// controllers/subject.controller.js
import Subject from '../models/subject.model.js';

// Utility: Validate required fields
const validateSubjectPayload = ({ code, name, type, maxMarks, minMarks }) => {
  if (!code || !name || !type || maxMarks == null || minMarks == null) {
    return 'All fields (code, name, type, maxMarks, minMarks) are required.';
  }
  if (isNaN(maxMarks) || isNaN(minMarks)) {
    return 'maxMarks and minMarks must be numbers.';
  }
  return null;
};

// ✅ Create Subject
export const createSubject = async (req, res) => {
  try {
    const { code, name, type, maxMarks, minMarks } = req.body;

    const validationError = validateSubjectPayload(req.body);
    if (validationError) return res.status(400).json({ message: validationError });

    const existing = await Subject.findOne({ code });
    if (existing) return res.status(409).json({ message: 'Subject code already exists' });

    const subject = await Subject.create({
      code,
      name,
      type,
      maxMarks: Number(maxMarks),
      minMarks: Number(minMarks),
    });

    return res.status(201).json({ message: 'Subject created successfully', subject });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while creating subject', error: error.message });
  }
};

// ✅ Get All Subjects
export const getAllSubjects = async (_req, res) => {
  try {
    const subjects = await Subject.find();
    return res.status(200).json({ subjects });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while fetching subjects', error: error.message });
  }
};

// ✅ Delete Subject
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.subjectId);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });

    return res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while deleting subject', error: error.message });
  }
};

// ✅ Update Subject
export const updateSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { code, name, type, maxMarks, minMarks } = req.body;

    const validationError = validateSubjectPayload(req.body);
    if (validationError) return res.status(400).json({ message: validationError });

    const updated = await Subject.findByIdAndUpdate(
      subjectId,
      {
        code,
        name,
        type,
        maxMarks: Number(maxMarks),
        minMarks: Number(minMarks),
      },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ message: 'Subject not found' });

    return res.status(200).json({ message: 'Subject updated successfully', subject: updated });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while updating subject', error: error.message });
  }
};
