import mongoose from 'mongoose';

const verificationLogSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  certificateNo: { type: String, required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  verificationResult: { type: Boolean, required: true },
  verifiedAt: { type: Date, default: Date.now },
  verificationComments: { type: String },
});

verificationLogSchema.index({ employerId: 1, studentId: 1, certificateNo: 1 });

// ✅ Fix here:
const VerificationLog = mongoose.models.VerificationLog || mongoose.model('VerificationLog', verificationLogSchema);

export default VerificationLog;
