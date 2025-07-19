import Ticket from '../models/ticket.model.js';
import Student from '../models/student.model.js';

// Student: Raise new ticket
export const createTicket = async (req, res) => {
  try {
    const { issueType, description } = req.body;

    const student = await Student.findOne({ userId: req.user.id }); // ✅ corrected

    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const ticket = new Ticket({
      studentId: student._id,
      issueType,
      description
    });

    await ticket.save();
    res.status(201).json({ message: 'Ticket created', ticket });
  } catch (err) {
    console.error("Create Ticket Error:", err);
    res.status(500).json({ message: 'Error creating ticket', error: err.message });
  }
};

// Student: Fetch own tickets
export const getMyTickets = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.id }); // ✅ corrected
    if (!student) {
      return res.status(404).json({ message: "Student profile not found" });
    }

    const tickets = await Ticket.find({ studentId: student._id }).sort({ createdAt: -1 });
    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
};

// Admin: Fetch all tickets
export const getAllTickets = async (req, res) => {
  try {
   const tickets = await Ticket.find()
  .populate({
    path: 'studentId',
    populate: {
      path: 'userId',
      select: 'firstName lastName'
    }
  })
  .sort({ createdAt: -1 });


    res.json({ tickets });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching tickets' });
  }
};

// Admin: Update ticket status
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    const ticket = await Ticket.findByIdAndUpdate(ticketId, { status }, { new: true });
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    res.json({ message: 'Status updated', ticket });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating status' });
  }
};
