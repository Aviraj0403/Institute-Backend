import fs from 'fs';
import path from 'path';
import pdfkit from 'pdfkit';
import QRCode from 'qrcode';
import  cloudinary from '../config/cloudinaryConfig.js'; // Cloudinary config
import  Document  from '../models/document.model.js';
import  Student  from '../models/student.model.js';
import  VerificationLog  from '../models/verificationLog.model.js';

// Function to generate and upload the certificate
export const generateCertificate = async (studentId, studentName, certificateDetails) => {
  try {
    const doc = new pdfkit({ size: 'A4' });
    const fileName = `${studentName}_certificate.pdf`;
    const filePath = path.join(__dirname, '../uploads', fileName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Header with CIHS Studies Branding
    doc.image(path.join(__dirname, '../assets/cihs_logo.png'), 50, 50, { width: 100 });  // CIHS logo
    doc.fontSize(35).font('Helvetica-Bold').text('CIHS Studies', 170, 50, { align: 'center' });  // Institution name

    // Title
    doc.fontSize(25).font('Helvetica-Bold').text('Certificate of Completion', { align: 'center' });

    // Body of the certificate
    doc.moveDown(1);
    doc.fontSize(20).font('Helvetica').text(`This is to certify that`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(30).font('Helvetica-Bold').text(`${studentName}`, { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(15).font('Helvetica').text(`has successfully completed the course: ${certificateDetails}`, { align: 'center' });

    // Footer with Date and Institution
    doc.moveDown(1.5);
    doc.fontSize(12).font('Helvetica').text(`Issued by: CIHS Studies`, { align: 'left' });
    doc.fontSize(12).font('Helvetica').text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });

    // Optional: add a border at the bottom
    doc.moveDown(2);
    doc.strokeColor('#000').lineWidth(2).moveTo(50, 750).lineTo(550, 750).stroke();

    doc.end();

    // Wait for the stream to finish
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    // Upload PDF to Cloudinary
    const result = await cloudinary.v2.uploader.upload(filePath, {
      resource_type: 'auto',
      folder: 'certificates',
      fetch_format: 'auto',
      quality: 'auto',
    });

    // Save the document metadata in the database
    const document = new Document({
      studentId,
      documentType: 'certificate',
      documentName: fileName,
      filePath: result.secure_url,
      fileSize: fs.statSync(filePath).size,
    });

    await document.save();

    // Clean up the local file after upload
    fs.unlinkSync(filePath);

    return {
      success: true,
      message: 'Certificate generated and uploaded successfully.',
      fileUrl: result.secure_url,
    };
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    console.error('Error generating certificate:', error);
    throw new Error('Error generating certificate.');
  }
};

// Function to generate Hall Ticket PDF with QR code
export const generateHallTicket = async (studentId, certificateNo) => {
  const student = await Student.findById(studentId);
  if (!student) throw new Error('Student not found.');

  const qrCodeUrl = `https://example.com/verify?studentId=${studentId}&certificateNo=${certificateNo}`;
  const qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl);

  const doc = new pdfkit({ size: 'A4' });
  const buffers = [];

  doc.on('data', buffers.push.bind(buffers));
  doc.on('end', async () => {
    const pdfBuffer = Buffer.concat(buffers);

    try {
      const result = await cloudinary.v2.uploader.upload_stream(
        { resource_type: 'auto', folder: 'hallTickets' },
        async (error, result) => {
          if (error) {
            console.error('Error uploading to Cloudinary:', error);
            throw new Error('Error uploading Hall Ticket to Cloudinary.');
          }

          const document = new Document({
            studentId: student._id,
            documentType: 'hall-ticket',
            documentName: `hall_ticket_${studentId}.pdf`,
            certificateNo,
            filePath: result.secure_url,
            fileSize: pdfBuffer.length,
            verified: false,
          });

          await document.save();

          return result.secure_url;
        }
      );

      doc.pipe(uploadStream);

      // Header with CIHS Studies Branding
      doc.image(path.join(__dirname, '../assets/cihs_logo.png'), 50, 50, { width: 100 });
      doc.fontSize(35).font('Helvetica-Bold').text('CIHS Studies', 170, 50, { align: 'center' });

      // Hall Ticket Title
      doc.fontSize(25).font('Helvetica-Bold').text('Hall Ticket', { align: 'center' });

      // Certificate Details
      doc.moveDown(1);
      doc.fontSize(20).font('Helvetica').text(`Student: ${student.firstName} ${student.lastName}`, { align: 'center' });
      doc.fontSize(15).font('Helvetica').text(`Certificate No: ${certificateNo}`, { align: 'center' });
      doc.fontSize(15).font('Helvetica').text(`Institution: CIHS Studies`, { align: 'center' });
      doc.fontSize(15).font('Helvetica').text(`Passing Year: ${student.passingYear}`, { align: 'center' });

      // QR Code
      doc.image(qrCodeDataUrl, 400, 300, { width: 100, height: 100 });

      // Footer with CIHS Details
      doc.moveDown(1.5);
      doc.fontSize(12).font('Helvetica').text(`Date: ${new Date().toLocaleDateString()}`, { align: 'left' });

      // Optional: add a border at the bottom
      doc.moveDown(2);
      doc.strokeColor('#000').lineWidth(2).moveTo(50, 750).lineTo(550, 750).stroke();

      doc.end();
    } catch (error) {
      console.error('Error during Hall Ticket generation or upload:', error);
      throw new Error('Error generating or uploading the Hall Ticket.');
    }
  });

  doc.end();
};

// Function to update the document verification status
export const updateDocumentVerificationStatus = async (studentId, certificateNo, isVerified) => {
  const document = await Document.findOneAndUpdate(
    { studentId, certificateNo },
    { verified: isVerified },
    { new: true }
  );

  if (!document) throw new Error('Document not found.');

  return document;
};

// Function to scan and verify QR code
export const scanQRCode = async (qrCodeUrl) => {
  const parsedUrl = new URL(qrCodeUrl);
  const studentId = parsedUrl.searchParams.get('studentId');
  const certificateNo = parsedUrl.searchParams.get('certificateNo');
  
  const student = await Student.findById(studentId);
  if (!student) return { status: 'Student not found' };

  const document = await Document.findOne({ certificateNo, studentId: student._id });
  if (!document) return { status: 'Document not found' };

  return {
    status: document.verified ? 'Verified' : 'Not Verified',
    student,
    document,
  };
};

// Function to log verification details
export const logVerification = async (employerId, studentId, certificateNo, documentId, verificationResult, verificationComments) => {
  const verificationLog = new VerificationLog({
    employerId,
    studentId,
    certificateNo,
    documentId,
    verificationResult,
    verificationComments,
  });

  await verificationLog.save();

  return verificationLog;
};
