import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  examDate: { type: Date, required: true }
}, { _id: false });

const admitCardSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  rollNumber: { type: String, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  courseName: { type: String, required: true },
  batch: { type: String, required: true },
  dob: { type: Date, required: true },
  institutionName: { type: String, required: true },
  subjects: [subjectSchema],
  generatedAt: { type: Date, default: Date.now },
  pdfPath: { type: String }, // Optional: path or URL to PDF
}, { timestamps: true });

const AdmitCard = mongoose.model('AdmitCard', admitCardSchema);
export default AdmitCard;
