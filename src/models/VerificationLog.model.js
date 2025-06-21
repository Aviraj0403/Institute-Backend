import mongoose from 'mongoose';

const verificationLogSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },  // Employer who initiated verification
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true }, // Student whose document is verified
  certificateNo: { type: String, required: true }, // The certificate number being verified
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true }, // The document being verified
  verificationResult: { type: Boolean, required: true }, // True = verified, False = failed verification
  verifiedAt: { type: Date, default: Date.now }, // Timestamp when the verification happened
  verificationComments: { type: String }, // Optional comments on verification result
});

verificationLogSchema.index({ employerId: 1, studentId: 1, certificateNo: 1 });

const VerificationLog = mongoose.model('VerificationLog', verificationLogSchema);

export default VerificationLog;
