import { logVerification } from '../services/verificationService';

export const logVerificationController = async (req, res) => {
  try {
    const { employerId, studentId, certificateNo, documentId, verificationResult, verificationComments } = req.body;

    // Log the verification process
    const result = await logVerification(employerId, studentId, certificateNo, documentId, verificationResult, verificationComments);

    res.status(200).json({
      message: 'Verification logged successfully!',
      result,
    });
  } catch (error) {
    console.error('Error logging verification:', error);
    res.status(500).json({ error: 'Something went wrong while logging verification.' });
  }
};
