import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminName: { type: String, required: true },
  adminEmail: { type: String, required: true, unique: true },  // Ensure admin email is unique
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

adminSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Admin = mongoose.model('Admin', adminSchema);

export default Admin;
