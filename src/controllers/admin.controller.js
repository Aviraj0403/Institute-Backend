import User from '../models/user.model.js';
import Student from '../models/student.model.js';
import VerificationLog from '../models/verificationLog.model.js';
import bcrypt from 'bcryptjs';  // For password hashing
import { comparePassword } from '../utils/comparePassword.js'; // Make sure this path is correct
import { generateToken } from '../utils/generateJWTToken.js';

// Create Employee Account (User with role 'employer')
export const createEmployeeAccount = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if employee already exists
    const existingEmployee = await User.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new employee user
    const employee = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'employer',
      status: 'active',
    });

    await employee.save();

    res.status(201).json({ message: 'Employee account created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating employee account', error: error.message });
  }
};

// Get Verification Logs with populated fields
export const getVerificationLogs = async (req, res) => {
  try {
    const logs = await VerificationLog.find()
      .populate('employerId', 'firstName lastName email')
      .populate({
        path: 'studentId',
        populate: { path: 'userId', select: 'firstName lastName email' }
      })
      .populate('documentId'); // Assuming you have a Document model
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verification logs', error: error.message });
  }
};

// Get All Students with their User info
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find()
      .populate('userId', 'firstName lastName email status');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

// Update Employee Status (active/inactive)
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId, status } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'employer') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.status = status;
    await employee.save();

    res.status(200).json({ message: 'Employee status updated successfully', status });
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee status', error: error.message });
  }
};

// Get current logged-in user profile (excluding password)
export const profile = async (req, res) => {
  try {
    const userProfileDetail = await User.findById(req.user.id).select('-password');
    res.status(200).json({ userProfileDetail });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// Check Authentication (returns logged in user data)
export const authMe = async (req, res) => {
  try {
    const data = req.user;
    if (!data) return res.status(401).json({ message: 'Auth failed, login again' });
    res.status(200).json({ data });
  } catch (error) {
    res.status(401).json({ message: 'Failed to authenticate', error: error.message });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare passwords
    const isPasswordValid = await comparePassword(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Prepare user payload for token (exclude password)
    const userDetails = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    };

    // Generate access + refresh tokens
    const { accessToken, refreshToken } = await generateToken(res, userDetails);

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: userDetails,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

