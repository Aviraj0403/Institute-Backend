import PDFDocument from 'pdfkit';
import bwipjs from 'bwip-js';
import qr from 'qr-image';
import pkg from 'number-to-words';
const { toWords } = pkg;

const base64Logo = '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'; 

// Replace this with your actual logo base64 string
const logoBuffer = Buffer.from(base64Logo, 'base64');

export default async function generateMarksheetPDFBuffer(student, marksheet) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });
  const pageWidth = doc.page.width;

  // === HEADER ===
  const headerHeight = 100;
  doc.rect(0, 0, pageWidth, headerHeight).fill('#002B5B');
  doc.image(logoBuffer, 50, 20, { width: 60 });

  doc
    .fillColor('#ffffff')
    .fontSize(26)
    .font('Helvetica-Bold')
    .text('RESULT', 0, 30, { align: 'center' });

  doc
    .fontSize(14)
    .font('Helvetica')
    .fillColor('#e0e0e0')
    .text(student.institutionName || 'Champaran Institute of Health and Safety Studies Private Limited', {
      align: 'center'
    });

  const qrData = `https://institute-backend-8u6d.onrender.com/verify/${student.rollNumber}`;
  const qrCodeBuffer = qr.imageSync(qrData, { type: 'png' });
  doc.image(qrCodeBuffer, pageWidth - 100, 20, { width: 60 });

  doc.moveTo(50, headerHeight + 10).lineTo(pageWidth - 50, headerHeight + 10).stroke('#004080');

  // === STUDENT DETAILS ===
  const leftX = 70;
  const rightX = pageWidth / 2 + 10;
  let y = headerHeight + 30;
  const lineHeight = 22;

  doc.fontSize(12).fillColor('#004080').font('Helvetica-Bold').text('Student Details:', leftX, y);

  y += lineHeight;
  doc.fontSize(11).fillColor('#000').font('Helvetica');
  doc.text(`Name: ${student.userId.firstName} ${student.userId.lastName}`, leftX, y);
  doc.text(`Roll No: ${student.rollNumber}`, rightX, y);

  y += lineHeight;
  doc.text(`DOB: ${new Date(student.dob).toLocaleDateString()}`, leftX, y);
  doc.text(`Course: ${student.courseName || '-'}`, rightX, y);

  y += lineHeight;
  doc.text(`Batch: ${student.passingYear}`, leftX, y);

  // === MARKS TABLE ===
  const tableTop = y + 40;

  doc
    .fontSize(14)
    .fillColor('#004080')
    .font('Helvetica-Bold')
    .text('Subject-wise Marks', leftX, tableTop);

  const tableHeaderY = tableTop + 30;
  doc.rect(leftX - 5, tableHeaderY - 5, pageWidth - 140, 25).fill('#D6E4F0');

  // Table Header Layout
  doc
    .fontSize(11)
    .fillColor('#003366')
    .font('Helvetica-Bold')
    .text('Code', leftX, tableHeaderY, { width: 50 })
    .text('Subject', leftX + 50, tableHeaderY, { width: 100 })
    .text('Type', leftX + 150, tableHeaderY, { width: 50 })
    .text('Min', leftX + 200, tableHeaderY, { width: 40 })
    .text('Max', leftX + 240, tableHeaderY, { width: 40 })
    .text('Obt.', leftX + 280, tableHeaderY, { width: 40 })
    .text('In Words', leftX + 320, tableHeaderY, { width: 150 });

  // === Rows ===
  let rowY = tableHeaderY + 30;
  const rowHeight = 24;

  for (let i = 0; i < marksheet.subjects.length; i++) {
    const ms = marksheet.subjects[i];
    const subject = ms.subjectId;
    if (!subject) continue;

    if (i % 2 === 0) {
      doc.fillColor('#F4F8FB').rect(leftX - 5, rowY - 3, pageWidth - 140, rowHeight).fill();
    }

    doc
      .fillColor('#000')
      .font('Helvetica')
      .fontSize(10)
      .text(subject.code || '-', leftX, rowY, { width: 50 })
      .text(subject.name || '-', leftX + 50, rowY, { width: 100 })
      .text(subject.type || '-', leftX + 150, rowY, { width: 50 })
      .text(subject.minMarks?.toString() || '-', leftX + 200, rowY, { width: 40 })
      .text(subject.maxMarks?.toString() || '100', leftX + 240, rowY, { width: 40 })
      .text(ms.marksObtained.toString(), leftX + 280, rowY, { width: 40 })
      .text(ms.inWords || toWords(ms.marksObtained), leftX + 320, rowY, { width: 150 });

    rowY += rowHeight;
  }

  // === TOTALS ===
  rowY += 30;
  doc.fontSize(12).font('Helvetica-Bold').fillColor('#000');
  doc.text(`Total Theory: ${marksheet.totalTheory}`, leftX, rowY);
  doc.text(`Total Practical: ${marksheet.totalPractical}`, rightX, rowY);
  rowY += lineHeight;
  doc.text(`Grand Total: ${marksheet.grandTotal}`, leftX, rowY);
  doc.text(`Percentage: ${marksheet.percentage.toFixed(2)}%`, rightX, rowY);
  rowY += lineHeight;
  doc.text(`Division: ${marksheet.division}`, leftX, rowY);

  // === BARCODE ===
  const barcodeBuffer = await bwipjs.toBuffer({
    bcid: 'code128',
    text: student.rollNumber,
    scale: 2,
    height: 10,
    includetext: true,
    textxalign: 'center'
  });

  doc.image(barcodeBuffer, leftX, rowY + 20, { width: 200 });

  // === FOOTER ===
  const footerY = doc.page.height - 100;
  doc.moveTo(50, footerY).lineTo(pageWidth - 50, footerY).stroke('#004080');

  doc
    .fontSize(10)
    .fillColor('#666')
    .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 10);

  doc
    .fontSize(12)
    .fillColor('#004080')
    .font('Helvetica-Bold')
    .text('Authorized Signature', pageWidth - 200, footerY + 10);

  doc
    .moveTo(pageWidth - 250, footerY + 30)
    .lineTo(pageWidth - 50, footerY + 30)
    .stroke('#004080');

  doc.end();

  const buffers = [];
  for await (const chunk of doc) buffers.push(chunk);
  return Buffer.concat(buffers);
}
