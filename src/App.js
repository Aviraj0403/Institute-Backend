import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import studentRoutes from './routers/student.routes.js';
import authRoutes from './routers/auth.routes.js'; // Assuming authRoutes is defined in your routers
import employeeRoutes from './routers/employee.routes.js';
import admitRoutes from './routers/admitCard.routes.js';
import courseRoutes from './routers/course.routes.js';
import examSubjectRoutes from './routers/examSubject.routes.js';
import subjectRoutes from './routers/subject.routes.js';
import marksheetRoutes from './routers/marksheet.routes.js';
import ticketRoutes from './routers/ticket.routes.js';

import { logSessionActivity } from './middlewares/logSessionActivity.js';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';  // Import 'join' and 'dirname' from 'path'
import { time } from 'console';
import Ticket from './models/ticket.model.js';

// Get the current directory name in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  'https://institute-frontend-mocha.vercel.app',
  'https://institute-backend-8u6d.onrender.com',
  'https://institute-backend-8u6d.onrender.com/api',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
// Middleware for JSON body parsing and cookies
app.use(express.json());
app.use(cookieParser());

// Session activity logging middleware
app.use(logSessionActivity);

// API Routes
app.use('/api', studentRoutes);
app.use('/api', authRoutes); // Assuming authRoutes is defined in your routers
app.use('/api', employeeRoutes);
app.use('/api', admitRoutes);
app.use('/api', courseRoutes);
app.use('/api', examSubjectRoutes);
app.use('/api', subjectRoutes);
app.use('/api', marksheetRoutes);
app.use('/api', ticketRoutes);

  // In development, serve assets (e.g., images, JavaScript) from 'public' folder
app.use(express.static(join(__dirname, 'public')));

app.get('/robots.txt', (req, res) => {
    res.sendFile(join(__dirname, 'public', 'robots.txt'));
  });

// Root route (Health check or default response)
app.get('/', (req, res) => {
  res.send('Hello AviRaj! PRoduction is running smoothly! ');
});

// Centralized error handling (for unhandled errors)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something went wrong!');
});

export default app;
