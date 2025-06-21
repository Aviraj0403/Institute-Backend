import { generateHallTicket } from '../services/hallTicketService';
import { scanQRCode } from '../services/verificationService';
import { updateDocumentVerificationStatus } from '../services/documentService';

export const generateHallTicketController = async (req, res) => {
  try {
    const { studentId, certificateNo } = req.body;

    // Generate Hall Ticket PDF and QR code
    const filePath = await generateHallTicket(studentId, certificateNo);

    res.status(200).json({
      message: 'Hall Ticket generated successfully!',
      filePath,
    });
  } catch (error) {
    console.error('Error generating hall ticket:', error);
    res.status(500).json({ error: 'Something went wrong while generating the Hall Ticket.' });
  }
};

export const verifyQRCodeController = async (req, res) => {
  try {
    const { qrCodeUrl } = req.body;

    // Scan QR code and verify student details
    const verificationResult = await scanQRCode(qrCodeUrl);

    res.status(200).json(verificationResult);
  } catch (error) {
    console.error('Error scanning QR code:', error);
    res.status(500).json({ error: 'Something went wrong during QR code scanning.' });
  }
};

export const manualVerificationController = async (req, res) => {
  try {
    const { studentId, certificateNo, isVerified } = req.body;

    // Update the document verification status manually
    const result = await updateDocumentVerificationStatus(studentId, certificateNo, isVerified);

    res.status(200).json({
      message: 'Verification status updated successfully!',
      result,
    });
  } catch (error) {
    console.error('Error performing manual verification:', error);
    res.status(500).json({ error: 'Something went wrong during manual verification.' });
  }
};
