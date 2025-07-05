import mongoose from 'mongoose';

const educationSchema = new mongoose.Schema({
  degree: { type: String, required: true },
  major: { type: String, required: true },
  grade: { type: String, required: true },
}, { _id: false });

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fatherName: { type: String, required: true },
  dob: { type: Date, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  passingYear: { type: Number, required: true },
  institutionName: { type: String, required: true },
  institutionAddress: { type: String, required: true },
  educationDetails: {
    type: [educationSchema],
    required: true,
    validate: v => Array.isArray(v) && v.length > 0
  },
  profilePicture: { type: String, default: 'https://res.cloudinary.com/default-avatar.png' },
  aadharNumber: { type: String, unique: true, required: true },
  rollNumber: { type: String, unique: true, required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' }, // 🔑 for subject lookup
  status: { type: String, enum: ['active', 'inactive', 'pending'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

studentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

studentSchema.index({ aadharNumber: 1, rollNumber: 1 }, { unique: true });

const Student = mongoose.model('Student', studentSchema);
export default Student;
