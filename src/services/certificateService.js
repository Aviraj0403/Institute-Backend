import fs from 'fs';
import path from 'path';
import pdfkit from 'pdfkit';
import cloudinary from '../utils/cloudinaryConfig.js'; // Cloudinary config
import Document from '../models/Document.js'; // Document model

// Function to generate and upload the certificate
const generateCertificate = async (studentId, studentName, certificateDetails) => {
  try {
    // 1. Generate the certificate PDF using PDFKit
    const doc = new pdfkit();
    const fileName = `${studentName}_certificate.pdf`;
    const filePath = path.join(__dirname, '../uploads', fileName);
    
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    
    doc.fontSize(25).text('Certificate of Completion', 100, 100);
    doc.fontSize(20).text(`Student Name: ${studentName}`, 100, 150);
    doc.fontSize(15).text(`Certificate Details: ${certificateDetails}`, 100, 200);
    doc.fontSize(12).text(`Issued by: XYZ Institute`, 100, 250);
    doc.fontSize(10).text(`Date: ${new Date().toLocaleDateString()}`, 100, 270);
    
    doc.end();

    // Wait for the stream to finish
    stream.on('finish', async () => {
      // 2. Upload PDF to Cloudinary
      try {
        const result = await cloudinary.v2.uploader.upload(filePath, { resource_type: 'auto' });

        // 3. Save the document metadata in the database
        const document = new Document({
          studentId: studentId, // Reference to the student who is getting the certificate
          documentType: 'certificate',
          documentName: fileName,
          filePath: result.secure_url, // Cloudinary URL of the uploaded PDF
          fileSize: fs.statSync(filePath).size, // File size of the generated PDF
        });

        await document.save();

        // Clean up the local file after upload
        fs.unlinkSync(filePath);

        // 4. Return the Cloudinary URL of the certificate
        return {
          success: true,
          message: 'Certificate generated and uploaded successfully.',
          fileUrl: result.secure_url, // Cloudinary URL
        };
      } catch (err) {
        fs.unlinkSync(filePath); // Clean up local file on error
        console.error('Error uploading certificate to Cloudinary:', err);
        throw new Error('Error uploading certificate to Cloudinary.');
      }
    });

  } catch (error) {
    console.error('Error generating certificate:', error);
    throw new Error('Error generating certificate.');
  }
};

export default generateCertificate;
