import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  documentType: { type: String, required: true },
  documentName: { type: String, required: true },
  certificateNo: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  fileSize: { type: Number, required: true },
  verified: { type: Boolean, default: false },
  releaseStatus: { 
    type: String, 
    enum: ['released', 'not-released', 'coming-soon'], 
    default: 'not-released'
  },
});

documentSchema.index({ studentId: 1, certificateNo: 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
