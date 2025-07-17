import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['Theory', 'Practical'], required: true },
  maxMarks: { type: Number, default: 100 },
  minMarks: { type: Number, default: 40 }
}, { timestamps: true });

const Subject = mongoose.model('Subject', subjectSchema);
export default Subject;
