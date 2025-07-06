import mongoose from 'mongoose';

const examSubjectSchema = new mongoose.Schema({
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true }, // Link to course
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  examDate: { type: Date, required: true },
  startTime: { type: String, required: true }, // e.g., '09:00 AM'
  endTime: { type: String, required: true } 
}, { timestamps: true });

const ExamSubject = mongoose.model('ExamSubject', examSubjectSchema);
export default ExamSubject;
