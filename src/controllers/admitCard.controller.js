import AdmitCard from "../models/admitCard.model.js";
import Student from "../models/student.model.js";
import Document from "../models/document.model.js";
import generateAdmitCardPDF from "../services/generateAdmitCardPDF.js";
import Course from "../models/Course.model.js";
import ExamSubject from "../models/ExamSubject.model.js";
import { PDFDocument } from 'pdf-lib';

import archiver from 'archiver';
import { Readable } from 'stream';
// import { uploadToCloudinary } from "../services/cloudinary.js";
// import { generateCertificateNo } from "../utils/generateCertificateNo.js";

// export const generateSingleAdmitCard = async (req, res) => {
//   try {
//     const { studentId } = req.body;

//     const student = await Student.findById(studentId)
//       .populate('userId')
//       .populate('courseId'); // useful for logging/debugging
//     if (!student) return res.status(404).json({ message: 'Student not found' });

//     // Prevent duplicate generation
//     const existingCard = await AdmitCard.findOne({ studentId });
//     if (existingCard)
//       return res.status(409).json({ message: 'Admit card already exists for this student' });

//     // Fetch subjects for the student's course
//     const examSubjects = await ExamSubject.find({ courseId: student.courseId }).populate('subjectId');
//     if (!examSubjects.length)
//       return res.status(400).json({ message: 'No subjects found for the student’s course' });

//     // Generate PDF
//     const pdfBuffer = await generateAdmitCardPDF(student, examSubjects);

//     // Upload to Cloudinary (or your storage)
//     const uploadResult = await uploadToCloudinary(
//       pdfBuffer,
//       `admit-cards/admit_${student.rollNumber}.pdf`
//     );

//     // Create AdmitCard
//     const admitCard = await AdmitCard.create({
//       studentId,
//       rollNumber: student.rollNumber,
//       course: student.courseId?.name || '-', // 💡 Use populated course name
//       batch: `${student.passingYear}`,
//       dob: student.dob,
//       institutionName: student.institutionName,
//       subjects: examSubjects.map((s) => ({
//         subjectId: s.subjectId._id,
//         examDate: s.examDate
//       })),
//       pdfPath: uploadResult.secure_url
//     });

//     // Optional: Save in Documents table for records
//     await Document.create({
//       studentId,
//       documentType: 'admit-card',
//       documentName: `AdmitCard_${student.rollNumber}.pdf`,
//       certificateNo: generateCertificateNo(student.rollNumber, 'ADM'),
//       filePath: uploadResult.secure_url,
//       fileSize: uploadResult.bytes,
//       releaseStatus: 'released'
//     });

//     return res.status(201).json({ message: 'Admit card generated', data: admitCard });

//   } catch (err) {
//     console.error('❌ Error generating single admit card:', err);
//     return res.status(500).json({ message: 'Internal server error' });
//   }
// };
// export const generateSingleAdmitCard = async (req, res) => {
//   try {
//     const { studentId } = req.body;

//     const student = await Student.findById(studentId).populate('userId');
//     if (!student) return res.status(404).json({ message: 'Student not found' });

//     const subjects = await ExamSubject.find({ courseId: student.courseId }).populate('subjectId');
//     if (!subjects.length) return res.status(400).json({ message: 'No subjects found for this course' });

//     const pdfBuffer = await generateAdmitCardPDF(student, subjects);

//     // Dummy file info since we're skipping upload
//     const file = {
//       secure_url: `https://dummy.storage/admit-cards/${student.rollNumber}.pdf`,
//       public_id: `admit-cards/${student.rollNumber}`
//     };

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

// export const generateBulkAdmitCards = async (req, res) => {
//   try {
//     const { batch } = req.body;

//     // Fetch all students for the given batch
//     const students = await Student.find({ passingYear: batch }).populate('userId');
//     if (!students.length) {
//       return res.status(404).json({ message: 'No students found' });
//     }

//     // Prepare response headers for ZIP
//     res.set({
//       'Content-Type': 'application/zip',
//       'Content-Disposition': `attachment; filename=admit_cards_batch_${batch}.zip`
//     });

//     // Create ZIP archive stream
//     const archive = archiver('zip', { zlib: { level: 9 } });
//     archive.pipe(res);

//     for (const student of students) {
//       // Fetch subjects for the student's course
//       const subjects = await ExamSubject.find({ courseId: student.courseId }).populate({
//         path: 'subjectId',
//         select: 'name code type'
//       });

//       if (!subjects.length) {
//         console.warn(`No subjects found for ${student.rollNumber}, skipping...`);
//         continue;
//       }

//       const pdfBuffer = await generateAdmitCardPDF(student, subjects);

//       // Append to ZIP using a stream
//       const stream = Readable.from(pdfBuffer);
//       archive.append(stream, { name: `admit_${student.rollNumber}.pdf` });
//     }

//     // Finalize and send ZIP
//     await archive.finalize();
//   } catch (error) {
//     console.error('Error generating bulk admit cards:', error);
//     res.status(500).json({ message: 'Error generating bulk admit cards' });
//   }
// };

// export const generateBulkAdmitCards = async (req, res) => {
//   const { subjects, batch } = req.body;
//   const students = await Student.find({ passingYear: batch }).populate('userId');
//   if (!students.length) return res.status(404).json({ error: 'No students found' });

//   const result = [];

//   for (const student of students) {
//     if (await AdmitCard.findOne({ studentId: student._id })) {
//       result.push({ rollNumber: student.rollNumber, status: 'skipped' });
//       continue;
//     }

//     const pdfBuffer = await generateAdmitCardPDF(student, subjects);
//     const uploadResult = await uploadToCloud(pdfBuffer, `admit_${student.rollNumber}.pdf`);

//     const admitCard = await AdmitCard.create({
//       studentId: student._id,
//       rollNumber: student.rollNumber,
//       course: student.educationDetails[0].degree,
//       batch: `${student.passingYear}`,
//       dob: student.dob,
//       institutionName: student.institutionName,
//       subjects: subjects.map(s => ({
//         subjectId: s.subjectId, examDate: s.examDate
//       })),
//       pdfPath: uploadResult.secure_url
//     });

//     await Document.create({
//       studentId: student._id,
//       documentType: 'admit-card',
//       documentName: `AdmitCard_${student.rollNumber}.pdf`,
//       certificateNo: generateCertificateNo(student.rollNumber, 'ADM'),
//       filePath: admitCard.pdfPath,
//       fileSize: uploadResult.bytes,
//       releaseStatus: 'released'
//     });

//     result.push({ rollNumber: student.rollNumber, status: 'generated' });
//   }

//   res.status(200).json({ message: 'Bulk generation complete', details: result });
// };
// export const generateSingleAdmitCard = async (req, res) => {
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