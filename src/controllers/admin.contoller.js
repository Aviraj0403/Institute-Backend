import { User } from '../models/user.js';
import { Employee } from '../models/employee.js';
import { VerificationLog } from '../models/verificationLog.js';

// Admin: Create new employee account
export const createEmployeeAccount = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } = req.body;

    // Check if employee already exists
    const existingEmployee = await User.findOne({ email });
    if (existingEmployee) return res.status(400).json({ message: 'Employee with this email already exists' });

    // Create new employee
    const employee = new User({
      firstName,
      lastName,
      email,
      password,
      role: 'employer',  // Always set role as 'employer' for employee account
    });

    await employee.save();

    const newEmployee = new Employee({
      userId: employee._id,
      adminName: req.user.firstName, // Admin who is creating this employee
      adminEmail: req.user.email, // Admin's email
    });

    await newEmployee.save();
    res.status(201).json({ message: 'Employee account created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating employee account', error: error.message });
  }
};

// Admin: View verification logs
export const getVerificationLogs = async (req, res) => {
  try {
    const logs = await VerificationLog.find().populate('studentId').populate('employerId');
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching verification logs', error: error.message });
  }
};

// Admin: View all students
export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('userId');
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
};

// Admin: Update employee status (Activate/Deactivate)
export const updateEmployeeStatus = async (req, res) => {
  try {
    const { employeeId, status } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    employee.status = status;
    await employee.save();

    res.status(200).json({ message: 'Employee status updated successfully', status });
  } catch (error) {
    res.status(500).json({ message: 'Error updating employee status', error: error.message });
  }
};
