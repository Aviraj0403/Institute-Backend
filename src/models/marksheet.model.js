import mongoose from 'mongoose';

const subjectMarksSchema = new mongoose.Schema({
  subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  marksObtained: { type: Number, required: true },
  isPass: { type: Boolean, default: true },
  inWords: { type: String }
}, { _id: false });

const marksheetSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subjects: { type: [subjectMarksSchema], required: true },
  totalTheory: { type: Number, default: 0 },
  totalPractical: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  percentage: { type: Number }, // ✅ New
  division: { type: String, enum: ['Fail', '2nd Division', '1st Division'] },
  createdAt: { type: Date, default: Date.now }
});

const Marksheet = mongoose.model('Marksheet', marksheetSchema);
export default Marksheet;
