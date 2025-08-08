import express from 'express';
import {
  authMe,
  profile,
  createEmployeeAccount,
  getAllStudents,
  getVerificationLogs,
  updateEmployeeStatus,
  login,
  logout,
  refreshToken
} from '../controllers/admin.controller.js';

import { verifyToken } from '../middlewares/verifyToken.js';

const router = express.Router();


router.post('/user/login', login);
router.post('/auth/refresh-token', refreshToken);

router.post("/user/logout", logout);
router.get('/me', verifyToken, authMe);

// ✅ Get logged-in user's profile
router.get('/user/profile', verifyToken, profile);

// ✅ Create an employee account (Only admin should be allowed ideally)
router.post('/employee', verifyToken, createEmployeeAccount);

// ✅ Get all students
router.get('/user/students', verifyToken, getAllStudents);

// ✅ Get verification logs
router.get('/verification-logs', verifyToken, getVerificationLogs);

// ✅ Update employee status (e.g., activate/inactivate)
router.patch('/employee/status', verifyToken, updateEmployeeStatus);

export default router;
