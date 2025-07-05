export default function generateCertificateNo(roll, prefix = 'ADM') {
  const random = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${roll}-${random}`;
}
