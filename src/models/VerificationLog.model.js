import mongoose from 'mongoose';

const verificationLogSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Employer who initiated the verification
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },   // Student being verified
  certificateNo: { type: String, required: true }, // The certificate number for verification
  studentName: { type: String, required: true },   // Name of the student being verified
  passingYear: { type: Number, required: true },   // Passing year of the student
  verificationResult: { type: Boolean, required: true }, // Verification result (True / False)
  verifiedAt: { type: Date, default: Date.now },    // Timestamp when the verification happened
});

verificationLogSchema.index({ employerId: 1, studentId: 1 });

const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema);

export default VerificationLog;
