// POST /api/marksheet/upload-excel
import xlsx from 'xlsx';
import Marksheet from '../models/marksheet.model.js';
import Student from '../models/student.model.js';
import Subject from '../models/subject.model.js';
import AdmitCard from '../models/admitCard.model.js';
import Course from '../models/Course.model.js';
import  generateMarksheetPDFBuffer  from '../services/pdf/generateMarksheetPDFBuffer.js';
import pkg from 'number-to-words';
const { toWords } = pkg;

export const convertNumberToWords = async (num) => {
  return toWords(num).replace(/\b\w/g, c => c.toUpperCase());
};

export const isResultAvailable = async (req, res) => {
  try {
    const { studentId } = req.query;

    if (!studentId) {
      return res.status(400).json({ message: "Missing studentId in query" });
    }

    const result = await Marksheet.findOne({ studentId });

    if (!result) {
      return res.status(200).json({ available: false });
    }

    return res.status(200).json({ available: true });
  } catch (error) {
    console.error("Error checking result availability:", error);
    return res.status(500).json({ message: "Server error while checking result availability." });
  }
};
export const uploadMarksheetExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Excel file is required' });

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet);

    const groupedMarks = {};

    for (const row of rows) {
      const roll = String(row['Roll Number']).trim();
      const code = String(row['Subject Code']).trim();
      const marks = Number(row['Marks Obtained']);

      if (!roll || !code || isNaN(marks)) continue;

      if (!groupedMarks[roll]) groupedMarks[roll] = [];
      groupedMarks[roll].push({ code, marks });
    }

    const results = [];

    for (const rollNumber in groupedMarks) {
      const student = await Student.findOne({ rollNumber });
      if (!student) {
        results.push({ rollNumber, status: 'Student not found' });
        continue;
      }

      const admitCard = await AdmitCard.findOne({ studentId: student._id }).populate('subjects.subjectId');
      if (!admitCard) {
        results.push({ rollNumber, status: 'No admit card' });
        continue;
      }

      const subjectMap = {};
      admitCard.subjects.forEach(s => subjectMap[s.subjectId.code] = s.subjectId);

      let totalTheory = 0, totalPractical = 0, grandTotal = 0;
      const marksArr = [];

      for (const entry of groupedMarks[rollNumber]) {
        const subject = subjectMap[entry.code];
        if (!subject) continue;

        const obtained = entry.marks;
        const inWords = convertNumberToWords(obtained);
        const isPass = obtained >= subject.minMarks;

        if (subject.type === 'theory') totalTheory += obtained;
        else totalPractical += obtained;

        grandTotal += obtained;

        marksArr.push({
          subjectId: subject._id,
          marksObtained: obtained,
          inWords,
          isPass
        });
      }

      const totalSubjects = marksArr.length;
      const maxTotal = totalSubjects * 100;
      const percentage = (grandTotal / maxTotal) * 100;

      const hasFail = marksArr.some(m => !m.isPass);
      let division = 'Fail';
      if (!hasFail) {
        if (percentage >= 60) division = '1st Division';
        else if (percentage >= 40) division = '2nd Division';
      }

      const marksheetData = {
        studentId: student._id,
        subjects: marksArr,
        totalTheory,
        totalPractical,
        grandTotal,
        percentage,
        division
      };

      await Marksheet.findOneAndUpdate(
        { studentId: student._id },
        marksheetData,
        { upsert: true, new: true }
      );

      results.push({ rollNumber, status: 'Saved' });
    }

    res.status(200).json({ message: 'Upload complete', results });
  } catch (err) {
    console.error('Excel upload error:', err);
    res.status(500).json({ message: 'Error processing file' });
  }
};

// PUT /api/marksheet/upsert
export const upsertMarksheet = async (req, res) => {
  try {
    const { studentId, marks } = req.body;

    if (!studentId || !Array.isArray(marks)) {
      return res.status(400).json({ message: 'Invalid data' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const admitCard = await AdmitCard.findOne({ studentId }).populate('subjects.subjectId');
    if (!admitCard) return res.status(400).json({ message: 'Admit card not found for this student' });

    let totalTheory = 0, totalPractical = 0, grandTotal = 0;

    const subjectMap = {};
    admitCard.subjects.forEach(sub => {
      subjectMap[sub.subjectId._id.toString()] = sub.subjectId;
    });

    const processedSubjects = [];

    for (const m of marks) {
      const subj = subjectMap[m.subjectId];
      if (!subj) return res.status(400).json({ message: `Subject ${m.subjectId} not in admit card` });

      const obtained = m.marksObtained;
      const inWords = m.inWords || await convertNumberToWords(obtained);

      const isPass = obtained >= subj.minMarks;

      if (subj.type === 'Theory') totalTheory += obtained;
      else if (subj.type === 'Practical') totalPractical += obtained;

      grandTotal += obtained;

      processedSubjects.push({
        subjectId: m.subjectId,
        marksObtained: obtained,
        inWords,
        isPass
      });
    }

    const totalSubjects = processedSubjects.length;
    const maxTotal = totalSubjects * 100;
    const percentage = (grandTotal / maxTotal) * 100;

    const hasFail = processedSubjects.some(m => !m.isPass);
    let division = 'Fail';
    if (!hasFail) {
      if (percentage >= 60) division = '1st Division';
      else if (percentage >= 40) division = '2nd Division';
    }

    const update = {
      studentId,
      subjects: processedSubjects,
      totalTheory,
      totalPractical,
      grandTotal,
      percentage,
      division
    };

    const marksheet = await Marksheet.findOneAndUpdate(
      { studentId },
      update,
      { upsert: true, new: true }
    );

    return res.status(200).json({ message: 'Marksheet saved', marksheet });

  } catch (err) {
    console.error('Error saving marksheet:', err);
    res.status(500).json({ message: 'Error saving marksheet' });
  }
};


// GET /api/marksheet/pdf/:studentId
export const generateMarksheetPDF = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId).populate('userId');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    const course = await Course.findById(student.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found for this student' });

    const marksheet = await Marksheet.findOne({ studentId }).populate('subjects.subjectId');
    if (!marksheet) return res.status(404).json({ message: 'Marksheet not found' });
    
    student.courseName = course.name;

    const pdfBuffer = await generateMarksheetPDFBuffer(student, marksheet); // Create separately

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=marksheet_${student.rollNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating marksheet PDF:', error);
    res.status(500).json({ message: 'Error generating marksheet PDF' });
  }
};
export const getPaginatedMarksheetList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;
    const skip = (page - 1) * pageSize;

    const [marksheets, total] = await Promise.all([
      Marksheet.find()
        .skip(skip)
        .limit(pageSize)
        .populate({
          path: 'studentId',
          populate: [
            { path: 'userId', select: 'firstName lastName email' },
            { path: 'courseId', select: 'name code' }  // <-- populate course here
          ]
        })
        .populate('subjects.subjectId'),
      Marksheet.countDocuments()
    ]);

    res.status(200).json({ marksheets, total });
  } catch (err) {
    console.error('Error fetching paginated marksheets:', err);
    res.status(500).json({ message: 'Failed to fetch marksheets' });
  }
};

export const verifyStudentAndMarksheet = async (rollNumber) => {
  try {
    // Fetch the student details using the roll number
    const student = await Student.findOne({ rollNumber }).populate('courseId');
    if (!student) return { error: 'Student not found' };
    console.log('Student found:', student);

    // Fetch the marksheet details using the student ID
    const marksheet = await Marksheet.findOne({ studentId: student._id }).populate('subjects.subjectId');
    if (!marksheet) return { error: 'Marksheet not found' };
    console.log('Marksheet found:', marksheet);

    // Return student and marksheet details for verification
    return {
      student: {
        name: `${student.userId.firstName} ${student.userId.lastName}`,
        rollNumber: student.rollNumber,
        course: student.courseName || 'N/A',
        passingYear: student.passingYear,
      },
      marksheet: {
        totalMarks: marksheet.grandTotal,
        percentage: marksheet.percentage,
        division: marksheet.division,
      },
    };
  } catch (error) {
    console.error('Error during verification:', error);
    return { error: 'Internal server error' };
  }
};

// GET /api/marksheet/verify/:rollNumber
export const verifyMarksheet1 = async (req, res) => {
  try {
    const { rollNumber } = req.params;

    // Step 1: Find the student by roll number
    const student = await Student.findOne({ rollNumber }).populate('userId');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Step 2: Find the course linked to the student
    const course = await Course.findById(student.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found for this student' });

    // Step 3: Find the marksheet for the student using studentId
    const marksheet = await Marksheet.findOne({ studentId: student._id }).populate('subjects.subjectId');
    if (!marksheet) return res.status(404).json({ message: 'Marksheet not found' });

    // Step 4: Add course name to student info
    student.courseName = course.name;

    // Step 5: Generate PDF Buffer using the custom function
    const pdfBuffer = await generateMarksheetPDFBuffer(student, marksheet);

    // Step 6: Set PDF response headers and send the PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=marksheet_${student.rollNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating marksheet PDF:', error);
    res.status(500).json({ message: 'Error generating marksheet PDF' });
  }
};


// modification 26 april 2025
export const verifyMarksheet = async (req, res) => {
  try {
    const { rollNumber } = req.params;
    const { fullName } = req.body; // e.g., "Avi Raj"

    if (!fullName) {
      return res.status(400).json({ message: 'Full name is required' });
    }

    // Step 1: Find the student by roll number and populate user
    const student = await Student.findOne({ rollNumber }).populate('userId');
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const user = student.userId;
    if (!user) return res.status(404).json({ message: 'User not found for this student' });

    // Step 2: Compare full name
    const studentFullName = `${user.firstName} ${user.lastName}`.toLowerCase().trim();
    if (studentFullName !== fullName.toLowerCase().trim()) {
      return res.status(403).json({ message: 'Name and roll number do not match' });
    }

    // Step 3: Get course
    const course = await Course.findById(student.courseId);
    if (!course) return res.status(404).json({ message: 'Course not found for this student' });

    // Step 4: Get marksheet
    const marksheet = await Marksheet.findOne({ studentId: student._id }).populate('subjects.subjectId');
    if (!marksheet) return res.status(404).json({ message: 'Marksheet not found' });

    // Step 5: Add course name and full name
    student.courseName = course.name;
    student.fullName = studentFullName;

    // Step 6: Generate PDF
    const pdfBuffer = await generateMarksheetPDFBuffer(student, marksheet);

    // Step 7: Send PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=marksheet_${student.rollNumber}.pdf`,
      'Content-Length': pdfBuffer.length
    });

    return res.send(pdfBuffer);

  } catch (error) {
    console.error('Error generating marksheet PDF:', error);
    res.status(500).json({ message: 'Error generating marksheet PDF' });
  }
};





 