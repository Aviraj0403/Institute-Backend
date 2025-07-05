// models/course.model.js
import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true },
  duration: { type: Number, required: true },
  department: { type: String },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

courseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});


const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default Course;
