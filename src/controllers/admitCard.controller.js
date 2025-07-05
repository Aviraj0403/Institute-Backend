import AdmitCard from "../models/admitCard.model.js";
import Student from "../models/student.model.js";
import Document from "../models/document.model.js";
import generateAdmitCardPDF from "../services/generateAdmitCardPDF.js";
// import Course from "../models/Course.model.js";
import ExamSubject from "../models/ExamSubject.model.js";
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

    const student = await Student.findById(studentId).populate('userId');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const subjects = await ExamSubject.find({ courseId: student.courseId }).populate('subjectId');
    if (!subjects.length) return res.status(400).json({ message: 'No subjects found for this course' });

    const pdfBuffer = await generateAdmitCardPDF(student, subjects);

    // Set headers to serve PDF directly
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=admit_${student.rollNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({ message: 'Error generating admit card' });
  }
};


export const generateBulkAdmitCards = async (req, res) => {
  const { subjects, batch } = req.body;
  const students = await Student.find({ passingYear: batch }).populate('userId');
  if (!students.length) return res.status(404).json({ error: 'No students found' });

  const result = [];

  for (const student of students) {
    if (await AdmitCard.findOne({ studentId: student._id })) {
      result.push({ rollNumber: student.rollNumber, status: 'skipped' });
      continue;
    }

    const pdfBuffer = await generateAdmitCardPDF(student, subjects);
    const uploadResult = await uploadToCloud(pdfBuffer, `admit_${student.rollNumber}.pdf`);

    const admitCard = await AdmitCard.create({
      studentId: student._id,
      rollNumber: student.rollNumber,
      course: student.educationDetails[0].degree,
      batch: `${student.passingYear}`,
      dob: student.dob,
      institutionName: student.institutionName,
      subjects: subjects.map(s => ({
        subjectId: s.subjectId, examDate: s.examDate
      })),
      pdfPath: uploadResult.secure_url
    });

    await Document.create({
      studentId: student._id,
      documentType: 'admit-card',
      documentName: `AdmitCard_${student.rollNumber}.pdf`,
      certificateNo: generateCertificateNo(student.rollNumber, 'ADM'),
      filePath: admitCard.pdfPath,
      fileSize: uploadResult.bytes,
      releaseStatus: 'released'
    });

    result.push({ rollNumber: student.rollNumber, status: 'generated' });
  }

  res.status(200).json({ message: 'Bulk generation complete', details: result });
};
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