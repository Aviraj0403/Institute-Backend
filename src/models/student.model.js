import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to User Model
  fatherName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  address: { type: String, required: true },
  passingYear: { type: Number, required: true }, // Year of passing
  institutionName: { type: String, required: true }, // Institution name
  institutionAddress: { type: String, required: true }, // Institution address
  educationDetails: { 
    degree: { type: String, required: true },
    major: { type: String, required: true },
    grade: { type: String, required: true }
  },
  profilePicture: { type: String }, // Cloud URL for student photo
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }, // Active / Inactive
});

studentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Student = mongoose.model('Student', studentSchema);

export default Student;
