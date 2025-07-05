export function generateAdmitCardHTML(student, subjects) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            padding: 40px;
            background: #f9f9f9;
            color: #333;
          }
          .card {
            max-width: 800px;
            margin: auto;
            border: 2px solid #003366;
            padding: 30px;
            background: #fff;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          h1, h2 {
            text-align: center;
            color: #003366;
          }
          .info {
            margin-top: 20px;
            border-top: 1px solid #ccc;
            padding-top: 20px;
            font-size: 14px;
          }
          .info p {
            margin: 5px 0;
          }
          table {
            width: 100%;
            margin-top: 20px;
            border-collapse: collapse;
          }
          th, td {
            padding: 10px;
            border: 1px solid #ccc;
            text-align: left;
          }
          th {
            background: #003366;
            color: #fff;
          }
          .footer {
            margin-top: 40px;
            font-size: 12px;
            color: #888;
            text-align: right;
          }
          .signature {
            margin-top: 60px;
            text-align: right;
            font-size: 14px;
            color: #003366;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Institution Admit Card</h1>
          <h2>${student.institutionName || 'Institution Name'}</h2>
          <div class="info">
            <p><strong>Name:</strong> ${student.userId.firstName} ${student.userId.lastName}</p>
            <p><strong>Roll Number:</strong> ${student.rollNumber}</p>
            <p><strong>DOB:</strong> ${new Date(student.dob).toLocaleDateString()}</p>
            <p><strong>Course:</strong> ${student.educationDetails[0]?.degree || '-'}</p>
            <p><strong>Batch Year:</strong> ${student.passingYear}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Subject</th>
                <th>Exam Date</th>
              </tr>
            </thead>
            <tbody>
              ${subjects.map((s, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td>${s.subjectId.name}</td>
                  <td>${new Date(s.examDate).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="signature">
            Authorized Signature
            <hr style="width: 200px; margin-left: auto;" />
          </div>
          <div class="footer">
            Generated on ${new Date().toLocaleString()}
          </div>
        </div>
      </body>
    </html>
  `;
}
