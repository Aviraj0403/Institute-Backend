import express from 'express';
import { createTicket, getMyTickets, getAllTickets, updateTicketStatus } from '../controllers/ticket.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';
// import authMiddleware from '../middlewares/auth.js';
// import { authorizeAdmin, authorizeStudent } from '../middlewares/roles.js';

const router = express.Router();


// Student routes
router.post('/ticketStudent', verifyToken, createTicket);
router.get('/ticket/mine', verifyToken, getMyTickets);

// Admin routes
router.get('/ticketAdmin/', verifyToken, getAllTickets);
router.patch('/ticket/:ticketId/status',verifyToken, updateTicketStatus);

export default router;
