import User from '../models/user.model.js';
import Student from '../models/student.model.js';
// import Document from '../models/document.model.js';
import VerificationLog from '../models/verificationlog.model.js';

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
export const profile = async (req, res) => {
  try {
    // 1. Get user details
    const userProfileDetail = await User.findById(req.user.id).select('-password');

    if (!userProfileDetail) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Try fetching student record linked to this user
    const studentDetail = await Student.findOne({ userId: req.user.id }).populate("courseId");;

    res.status(200).json({
      userProfileDetail,
      studentDetail, // ✅ add this to your response
    });
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    const userData = decoded.data;

    const accessToken = jwt.sign(
      { data: userData },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV !== "development",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Access token refreshed" });
  } catch (error) {
    return res.status(401).json({ message: "Invalid refresh token" });
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

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Validate password
    const isPasswordValid = await comparePassword(user.password, password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update lastLogin timestamp
    user.lastLogin = new Date();
    await user.save();

    // Prepare payload (omit password)
    const userDetails = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      lastLogin: user.lastLogin, // include it in response if needed
    };

    // Generate tokens
    const { accessToken, refreshToken } = await generateToken(res, userDetails);

    // Success response
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
export const logout = async (req, res) => {
  try {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      path: "/", // must match cookie path during login
    };

    // Clear both tokens
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error.message);
    res.status(500).json({ message: "Error logging out", error: error.message });
  }
};


/////STUDENT_______________/
export const getStudentProfile = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Validate ID
    if (!studentId || !studentId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const student = await Student.findById(studentId)
      .populate({
        path: 'userId',
        select: 'username  email role firstName lastName avatar status isEmailVerified lastLogin createdAt '
      })
      .populate({
        path: 'courseId',
        select: 'name code description'
      });

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.status(200).json({ student });
  } catch (error) {
    console.error('❌ Error fetching student profile:', error);
    res.status(500).json({
      message: 'Error fetching student profile',
      error: error.message,
    });
  }
};

export const updateStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { userData, studentData, educationDetails, courseId } = req.body;

    // Check if studentId is provided in params
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID is required' });
    }

    // Log to verify what data is being passed for updating
    console.log('Request body:', req.body); // Debugging: log entire request body
    console.log('Updating student:', studentId);
    console.log('User Data:', userData);
    console.log('Student Data:', studentData);
    console.log('Education Details:', educationDetails);
    console.log('Course ID:', courseId);

    // Prepare the data to update
    let updatedStudentData = {
      ...studentData,         // All other student data
      courseId,               // Updated courseId
    };

    // If educationDetails is provided and is an array, include it in the update
    if (Array.isArray(educationDetails)) {
      updatedStudentData.educationDetails = educationDetails;
    } else if (educationDetails !== undefined) {
      console.log('Education details provided but not in the expected array format');
    }

    // Proceed with updating the student profile data
    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updatedStudentData,
      { new: true, runValidators: true }
    )
      .populate('userId')  // Populate user details
      .populate('courseId'); // Populate course details

    if (!updatedStudent) return res.status(404).json({ message: 'Student not found' });

    // Update associated user data if provided
    if (userData) {
      await User.findByIdAndUpdate(updatedStudent.userId._id, userData, {
        new: true,
        runValidators: true,
      });
    }

    // Send a successful response
    res.status(200).json({ message: 'Student updated successfully', student: updatedStudent });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Failed to update student', error: error.message });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByIdAndDelete(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // Optional: Also delete the associated User
    await User.findByIdAndDelete(student.userId);

    res.status(200).json({ message: 'Student and associated user deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete student', error: error.message });
  }
};