import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import studentRoutes from './routers/student.routes.js';
import authRoutes from './routers/auth.routes.js';
import employeeRoutes from './routers/employee.routes.js';
import admitRoutes from './routers/admitCard.routes.js';
import courseRoutes from './routers/course.routes.js';
import examSubjectRoutes from './routers/examSubject.routes.js';
import subjectRoutes from './routers/subject.routes.js';
import marksheetRoutes from './routers/marksheet.routes.js';
import ticketRoutes from './routers/ticket.routes.js';
import { logSessionActivity } from './middlewares/logSessionActivity.js';

// Directory helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize app
const app = express();

// ✅ Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',
  'https://institute-frontend-mocha.vercel.app',
  'https://institute-backend-8u6d.onrender.com',
  'https://www.champaransafetybysahilkhan.com',
  'https://champaransafetybysahilkhan.com'
];

// ✅ CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// ✅ Use CORS globally, including for preflight
app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // important for preflight

// ✅ Other middleware
app.use(express.json());
app.use(cookieParser());
app.use(logSessionActivity);

// ✅ API routes
app.use('/api', studentRoutes);
app.use('/api', authRoutes);
app.use('/api', employeeRoutes);
app.use('/api', admitRoutes);
app.use('/api', courseRoutes);
app.use('/api', examSubjectRoutes);
app.use('/api', subjectRoutes);
app.use('/api', marksheetRoutes);
app.use('/api', ticketRoutes);

// ✅ Serve static files (e.g. images)
app.use(express.static(join(__dirname, 'public')));

// ✅ Health check route
app.get('/', (req, res) => {
  res.send('Hello AviRaj! Production is running smoothly!');
});

// ✅ Serve robots.txt if needed
app.get('/robots.txt', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'robots.txt'));
});

// ✅ Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: 'CORS policy does not allow this origin.' });
  }
  res.status(500).send('Something went wrong!');
});

export default app;
