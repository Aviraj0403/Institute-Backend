import PDFDocument from 'pdfkit';
import fs from 'fs';
import qr from 'qr-image';

export default async function generateAdmitCardPDF(student, subjects) {
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  const pageWidth = doc.page.width;

  // === Header with Logo and QR ===
  doc.rect(0, 0, pageWidth, 100).fill('#003366');

  // Logo
  const logoPath = 'public/assets/logo.png';
  if (fs.existsSync(logoPath)) {
    doc.image(logoPath, 50, 20, { width: 50 });
  } else {
    doc.fillColor('#fff').fontSize(10).text('LOGO', 60, 50);
  }

  doc
    .fillColor('#fff')
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('ADMIT CARD', 0, 30, { align: 'center' });

  doc
    .fontSize(14)
    .font('Helvetica')
    .fillColor('#f0f0f0')
    .text(student.institutionName || 'Institution Name', { align: 'center' });

  const qrData = `https://z9v2jnvh-5001.inc1.devtunnels.ms/verify/${student.rollNumber}`;
  const qrCodeImage = qr.imageSync(qrData, { type: 'png' });
  doc.image(qrCodeImage, pageWidth - 100, 20, { width: 60 });

  doc.moveTo(50, 110).lineTo(pageWidth - 50, 110).stroke('#003366');

  // === Two Column Info Box ===
  const infoTop = 130;
  const leftX = 70;
  const rightX = pageWidth / 2 + 10;
  let y = infoTop;
  const lineHeight = 20;

  doc
    .fontSize(12)
    .fillColor('#003366')
    .font('Helvetica-Bold')
    .text('Student Details:', leftX, y);

  y += lineHeight;
  doc.fontSize(11).font('Helvetica').fillColor('#000');
  doc.text(`Name: ${student.userId.firstName} ${student.userId.lastName}`, leftX, y);
  doc.text(`Roll No: ${student.rollNumber}`, rightX, y);

  y += lineHeight;
  doc.text(`DOB: ${new Date(student.dob).toLocaleDateString()}`, leftX, y);
  doc.text(`Course: ${student.educationDetails[0]?.degree || '-'}`, rightX, y);

  y += lineHeight;
  doc.text(`Batch: ${student.passingYear}`, leftX, y);

  // === Subjects Table ===
  const tableTop = y + 40;
  doc
    .fontSize(14)
    .fillColor('#003366')
    .font('Helvetica-Bold')
    .text('Subjects & Exam Schedule', leftX, tableTop);

  doc
    .moveTo(leftX, tableTop + 20)
    .lineTo(pageWidth - 70, tableTop + 20)
    .stroke('#003366');

  const headerY = tableTop + 30;
  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#000')
    .text('No.', leftX, headerY)
    .text('Subject Name', leftX + 30, headerY)
    .text('Exam Date', rightX + 100, headerY);

  let rowY = headerY + 20;
  doc.font('Helvetica').fontSize(11).fillColor('#333');

  subjects.forEach((s, i) => {
    const subjectName =
      typeof s.subjectId === 'object' ? s.subjectId.name : `Subject ID: ${s.subjectId}`;
    doc.text(`${i + 1}.`, leftX, rowY);
    doc.text(subjectName, leftX + 30, rowY);
    doc.text(new Date(s.examDate).toLocaleDateString(), rightX + 100, rowY);
    rowY += 20;
  });

  // === Footer ===
  const footerY = doc.page.height - 100;
  doc
    .moveTo(50, footerY)
    .lineTo(pageWidth - 50, footerY)
    .stroke('#003366');

  doc
    .fontSize(10)
    .fillColor('#666')
    .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 10);

  doc
    .fontSize(12)
    .fillColor('#003366')
    .font('Helvetica-Bold')
    .text('Authorized Signature', pageWidth - 200, footerY + 10);

  doc
    .moveTo(pageWidth - 250, footerY + 30)
    .lineTo(pageWidth - 50, footerY + 30)
    .stroke('#003366');

  // === Stream the doc ===
  doc.end();

  // Use async iterable to get buffer (replacement for get-stream.buffer)
  const buffers = [];
  for await (const chunk of doc) {
    buffers.push(chunk);
  }
  return Buffer.concat(buffers);
}



//slower 
// import puppeteer from 'puppeteer';
// import { generateAdmitCardHTML } from './pdf/generateAdmitCardPDF.js';

// const generateAdmitCardPDF = async (student, subjects) => {
//   const htmlContent = generateAdmitCardHTML(student, subjects);

//   const browser = await puppeteer.launch({
//     headless: 'new',
//     args: ['--no-sandbox', '--disable-setuid-sandbox']
//   });

//   const page = await browser.newPage();
//   await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

//   const pdfBuffer = await page.pdf({
//     format: 'A4',
//     printBackground: true,
//     margin: { top: '40px', bottom: '40px', left: '30px', right: '30px' }
//   });

//   await browser.close();
//   return pdfBuffer;
// };

// export default generateAdmitCardPDF;

// import puppeteer from 'puppeteer';
// import { generateAdmitCardHTML } from './pdf/generateAdmitCardPDF.js';

// let browser;  // singleton browser instance

// export async function startBrowser() {
//   if (!browser) {
//     browser = await puppeteer.launch({
//       headless: 'new',
//       args: ['--no-sandbox', '--disable-setuid-sandbox']
//     });
//   }
//   return browser;
// }

// async function generateAdmitCardPDF(student, subjects) {
//   const htmlContent = generateAdmitCardHTML(student, subjects);
//   const browser = await startBrowser();
//   const page = await browser.newPage();

//   await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
//   const pdfBuffer = await page.pdf({
//     format: 'A4',
//     printBackground: true,
//     margin: { top: '40px', bottom: '40px', left: '30px', right: '30px' }
//   });

//   await page.close();  // close the page but keep the browser open
//   return pdfBuffer;
// }

// export default generateAdmitCardPDF;


// somewhere on app shutdown or when you want to close browser:
// await browser.close();
