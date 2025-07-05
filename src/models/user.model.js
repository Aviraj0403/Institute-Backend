import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  email: { type: String, required: true, unique: true, lowercase: true },
  role: { type: String, enum: ['student', 'employer', 'admin'], default: 'student' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  avatar: { type: String }, // Cloudinary URL
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  isEmailVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});
const User = mongoose.model('User', userSchema);

export default User;
