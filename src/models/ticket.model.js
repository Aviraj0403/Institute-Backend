// /models/ticket.js
import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  issueType: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, default: 'Open' }, // 'Open' or 'Closed'
  createdAt: { type: Date, default: Date.now },
});

export const Ticket = mongoose.model('Ticket', ticketSchema);
