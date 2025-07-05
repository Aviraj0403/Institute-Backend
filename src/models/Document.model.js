// models/document.js
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  documentType: { type: String, required: true }, // E.g., 'certificate', 'id-card', 'hall-ticket', 'admit-card'
  documentName: { type: String, required: true }, // E.g., 'certificate_2023.pdf'
  certificateNo: { type: String, required: true }, // Certificate Number
  filePath: { type: String, required: true },     // Cloud URL or file path
  uploadedAt: { type: Date, default: Date.now },
  fileSize: { type: Number, required: true },
  verified: { type: Boolean, default: false }, // Whether the document is verified
  releaseStatus: { 
    type: String, 
    enum: ['released', 'not-released', 'coming-soon'], 
    default: 'not-released'
  }, // Track document release status
});

documentSchema.index({ studentId: 1, certificateNo: 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;
