import CryptoJS from 'crypto-js';

export function generatePdfId(pdfDoc) {
  const pdfString = JSON.stringify(pdfDoc.fingerprints);
  return `pdf_doc_${CryptoJS.MD5(pdfString).toString()}`;
}
