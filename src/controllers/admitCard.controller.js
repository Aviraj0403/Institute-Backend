import AdmitCard from "../models/admitCard.model.js";
import Student from "../models/student.model.js";
// import Document from "../models/document.model.js";
import generateAdmitCardPDF from "../services/generateAdmitCardPDF.js";
import Course from "../models/Course.model.js";
import ExamSubject from "../models/ExamSubject.model.js";
import { PDFDocument } from 'pdf-lib';

import archiver from 'archiver';
import { Readable } from 'stream';


export const isAdmitCardAvailable = async (req, res) => {
  const { studentId } = req.query;

  const admitCard = await AdmitCard.findOne({ studentId });
  if (!admitCard) {
    return res.status(200).json({ available: false });
  }

  return res.status(200).json({ available: true });
};
export const generateSingleAdmitCard = async (req, res) => {
  try {
    const { studentId } = req.body;

    // 1. Fetch student with user details
    const student = await Student.findById(studentId).populate('userId');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // 2. Fetch course info
    const course = await Course.findById(student.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found for this student' });

    // 3. Fetch subject list for this course
    const subjects = await ExamSubject.find({ courseId: course._id }).populate({
      path: 'subjectId',
      select: 'name code type'
    });

    if (!subjects.length) {
      return res.status(400).json({ message: 'No subjects found for this course' });
    }

    // 4. Prepare subjects for saving to AdmitCard
    const admitSubjects = subjects.map(sub => ({
      subjectId: sub.subjectId._id,
      examDate: sub.examDate
    }));

    // 5. Save AdmitCard with course info
    const admitCard = await AdmitCard.findOneAndUpdate(
      { studentId: student._id },
      {
        studentId: student._id,
        rollNumber: student.rollNumber,
        dob: student.dob,
        batch: student.passingYear,
        institutionName: student.institutionName || 'Champaran Institute of Health and Safety Studies Private Limited',
        courseId: course._id,
        courseName: course.name,
        subjects: admitSubjects
      },
      { upsert: true, new: true }
    );

    // 6. Generate PDF
    student.courseName = course.name;
    const pdfBuffer = await generateAdmitCardPDF(student, subjects);

    // 7. Send response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=admit_${student.rollNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);

  } catch (err) {
    console.error('Error generating admit card:', err);
    return res.status(500).json({ message: 'Error generating admit card' });
  }
};

export const generateBulkAdmitCards = async (req, res) => {
  try {
    const { batch } = req.body;

    const students = await Student.find({ passingYear: batch }).populate('userId');
    if (!students.length) {
      return res.status(404).json({ message: 'No students found for this batch' });
    }

    const mergedPdf = await PDFDocument.create();

    for (const student of students) {
      const course = await Course.findById(student.courseId);
      if (!course) {
        console.warn(`Course not found for student ${student.rollNumber}, skipping...`);
        continue;
      }

      const subjects = await ExamSubject.find({ courseId: course._id }).populate({
        path: 'subjectId',
        select: 'name code type'
      });

      if (!subjects.length) {
        console.warn(`No subjects found for student ${student.rollNumber}, skipping...`);
        continue;
      }

      // Prepare subject data for DB save
      const admitSubjects = subjects.map(sub => ({
        subjectId: sub.subjectId._id,
        examDate: sub.examDate
      }));

      // Save or update admit card
      await AdmitCard.findOneAndUpdate(
        { studentId: student._id },
        {
          studentId: student._id,
          rollNumber: student.rollNumber,
          dob: student.dob,
          batch: student.passingYear,
          institutionName: student.institutionName || 'Champaran Institute of Health and Safety Studies Private Limited',
          courseId: course._id,
          courseName: course.name,
          subjects: admitSubjects
        },
        { upsert: true, new: true }
      );

      // Generate PDF for the student
      student.courseName = course.name;

      const pdfBuffer = await generateAdmitCardPDF(student, subjects);

      // Add to merged PDF
      const studentPdf = await PDFDocument.load(pdfBuffer);
      const copiedPages = await mergedPdf.copyPages(studentPdf, studentPdf.getPageIndices());
      copiedPages.forEach(page => mergedPdf.addPage(page));
    }

    // Send the merged PDF as response
    const mergedPdfBytes = await mergedPdf.save();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=admit_cards_batch_${batch}.pdf`,
      'Content-Length': mergedPdfBytes.length
    });

    return res.send(Buffer.from(mergedPdfBytes));

  } catch (error) {
    console.error('Error generating bulk admit cards:', error);
    return res.status(500).json({ message: 'Error generating bulk admit cards' });
  }
};

export const getAdmitCardList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [cards, total] = await Promise.all([
      AdmitCard.find()
        .populate({
          path: 'studentId',
          select: 'userId',
          populate: {
            path: 'userId',
            select: 'firstName lastName'
          }
        })
        .select('rollNumber studentId batch courseName updatedAt')
        .skip(skip)
        .limit(limit)
        .lean(),
      AdmitCard.countDocuments()
    ]);

    // Map cards to add full name string
    const formatted = cards.map(card => {
      const user = card.studentId?.userId;
      const studentName = user ? `${user.firstName} ${user.lastName}` : 'N/A';

      return {
        _id: card._id,
        rollNumber: card.rollNumber,
        studentId: card.studentId?._id,
        studentName,
        batch: card.batch,
        courseName: card.courseName,
        updatedAt: card.updatedAt
      };
    });

    res.json({ cards: formatted, total });
  } catch (err) {
    console.error('Error listing admit cards:', err);
    res.status(500).json({ message: 'Failed to list admit cards' });
  }
};
export const downloadAdmitCardById = async (req, res) => {
  try {
    const { id } = req.params;
    const admitCard = await AdmitCard.findById(id)
      .populate('studentId courseId')
      .lean();
    if (!admitCard) return res.status(404).json({ message: 'Admit card not found' });

    const student = await Student.findById(admitCard.studentId).populate('userId');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const subjects = await ExamSubject.find({ courseId: admitCard.courseId })
      .populate({ path: 'subjectId', select: 'name code type' });

    const pdfBuffer = await generateAdmitCardPDF(student, subjects);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=admit_${admitCard.rollNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });
    res.send(pdfBuffer);
  } catch (err) {
    console.error('Error downloading admit card:', err);
    res.status(500).json({ message: 'Failed to download admit card' });
  }
};
// GET /api/admit-card/:studentId
export const getAdmitCardByStudentId = async (req, res) => {
  try {
    const { studentId } = req.params;

    const admitCard = await AdmitCard.findOne({ studentId })
      .populate({
        path: 'subjects.subjectId',
        select: 'name code type'
      })
      .populate({
        path: 'studentId',
        populate: {
          path: 'userId',
          select: 'firstName lastName email'
        }
      })
      .lean();

    if (!admitCard) {
      return res.status(404).json({ message: 'Admit card not found for this student' });
    }

    res.status(200).json({ data: admitCard });

  } catch (err) {
    console.error('Error fetching admit card by studentId:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/admit-card/by-name?name=John
export const getAdmitCardByStudentName = async (req, res) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({ message: 'Student name is required' });
    }

    const regex = new RegExp(name, 'i'); // case-insensitive search

    const student = await Student.findOne()
      .populate({
        path: 'userId',
        match: { firstName: regex }
      });

    if (!student || !student.userId) {
      return res.status(404).json({ message: 'Student not found with this name' });
    }

    const admitCard = await AdmitCard.findOne({ studentId: student._id })
      .populate({
        path: 'subjects.subjectId',
        select: 'name code type minMarks'
      })
      .lean();

    if (!admitCard) {
      return res.status(404).json({ message: 'Admit card not found' });
    }

    res.status(200).json({
      data: {
        studentName: `${student.userId.firstName} ${student.userId.lastName}`,
        studentId: student._id,
        subjects: admitCard.subjects.map((s) => ({
          subjectId: s.subjectId._id,
          subjectName: s.subjectId.name,
          subjectCode: s.subjectId.code,
          type: s.subjectId.type,
          minMarks: s.subjectId.minMarks || 0
        }))
      }
    });
  } catch (err) {
    console.error('Error fetching admit card by name:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
};


//   try {
//     const { studentId } = req.body;
//     const student = await Student.findById(studentId).populate('userId');
//     if (!student) return res.status(404).json({ message: 'Student not found' });

//     const subjects = await ExamSubject.find({ courseId: student.courseId });
//     const pdfBuffer = await generateAdmitCardPDF(student, subjects);
//     // const file = await uploadToCloudinary(pdfBuffer, `admit-cards/${student.rollNumber}.pdf`);

//     const saved = await AdmitCard.create({
//       studentId,
//       fileUrl: file.secure_url,
//       fileId: file.public_id,
//       createdAt: new Date(),
//     });

//     res.status(200).json({ message: 'Admit card generated', fileUrl: file.secure_url, saved });
//   } catch (err) {
//     console.error('Error:', err);
//     res.status(500).json({ message: 'Error generating admit card' });
//   }
// };