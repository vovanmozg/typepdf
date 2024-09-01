import React, { useState } from 'react';
import { pdfjs } from 'react-pdf';
import './PdfUpload.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Import Font Awesome CSS

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

export const PdfUpload = ({ onPdfLoaded }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const readPdf = async typedArray => {
    return await pdfjs.getDocument(typedArray).promise;
  };

  const getPdfFromInput = async file => {
    if (!file || file.type !== 'application/pdf') {
      throw new Error('Invalid file type');
    }

    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async function () {
        try {
          const typedArray = new Uint8Array(this.result);
          const pdfDoc = await readPdf(typedArray);
          resolve(pdfDoc);
        } catch (error) {
          reject(error);
        }
      };
      fileReader.onerror = reject;
      fileReader.readAsArrayBuffer(file);
    });
  };

  const handlePdfAttached = async event => {
    const file = event.target.files[0];
    setError(null);
    setLoading(true);

    try {
      const pdfDoc = await getPdfFromInput(file);
      onPdfLoaded(pdfDoc);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="upload-pdf">
      <label className="file-upload-icon">
        <i className="fas fa-upload"></i> {/* Font Awesome upload icon */}
        <input
          type="file"
          accept="application/pdf"
          onChange={handlePdfAttached}
          disabled={loading}
          className="file-upload-input"
        />
      </label>
      {loading && <p>Loading PDF...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};
