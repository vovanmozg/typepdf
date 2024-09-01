// src/App.jsx
import React, { useState, useEffect } from 'react';
import { PdfUpload } from './PdfUpload';
import { Page } from './Page';
import { useRecognize } from './hooks/useRecognize';
import './App.css';
import { generatePdfId } from './lib/generatePdfId';
import { useStorage } from './hooks/useStorage';

const App = () => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(null);
  const [page, setPage] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [image, setImage] = useState(null);
  const [shouldDisplayOcrBorders, setShouldDisplayOcrBorders] = useState(false);

  const storage = useStorage(pdfDoc ? generatePdfId(pdfDoc) : null);

  const goToPrevPage = () => {
    setPageNumber(prev => {
      const newPageNumber = prev > 1 ? prev - 1 : prev;
      storage.setPdfRelated('pageNumber', newPageNumber);
      return newPageNumber;
    });
  };

  const goToNextPage = () => {
    setPageNumber(prev => {
      const newPageNumber = prev < pdfDoc.numPages ? prev + 1 : prev;
      storage.setPdfRelated('pageNumber', newPageNumber);
      return newPageNumber;
    });
  };

  const toggleOcrBorders = () => {
    setShouldDisplayOcrBorders(prev => !prev);
  };

  const handlePageChange = event => {
    const newPageNumber = Number(event.target.value);
    setPageNumber(newPageNumber);
    storage.setCurrentPdfId(newPageNumber);
  };

  const handlePdfUploaded = async pdfDoc => {
    setPdfDoc(pdfDoc);
  };

  useEffect(() => {
    if (!pdfDoc || !storage) {
      return;
    }

    storage.setCurrentPdfId(generatePdfId(pdfDoc));
    setPageNumber(storage.getPdfRelated('pageNumber', 1));
  }, [pdfDoc, storage]);

  useEffect(() => {
    (async () => {
      if (!pdfDoc || !pageNumber) {
        return;
      }

      const page = await pdfDoc.getPage(pageNumber);
      setPage(page);
    })();
  }, [pdfDoc, pageNumber]);

  useEffect(() => {
    if (!page) {
      return;
    }

    (async () => {
      const viewport = page.getViewport({ scale: 2.38 });
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport,
      };

      await page.render(renderContext).promise;

      setBase64Image('' + canvas.toDataURL());
    })();
  }, [page]);

  useEffect(() => {
    if (!base64Image) {
      return;
    }

    const image = new Image();
    image.onload = () => setImage(image);
    image.src = base64Image;
  }, [base64Image]);

  const ocr = useRecognize(base64Image);

  const pageNumbers = (
    pdfDoc?.numPages ? [...Array(pdfDoc.numPages).keys()] : []
  ).map(i => i + 1);

  const hidden = pdfDoc ? '' : 'hidden';

  return (
    <div id="app">
      <div id="menu">
        <PdfUpload onPdfLoaded={handlePdfUploaded} />
        <div id="page-navigation" className={hidden}>
          <button onClick={goToPrevPage}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <span id="page-info">
            <select onChange={handlePageChange} value={pageNumber || ''}>
              {pageNumbers.map(pageNum => (
                <option key={pageNum} value={pageNum}>
                  {pageNum}
                </option>
              ))}
            </select>{' '}
            / {pdfDoc ? pdfDoc.numPages : 1}
          </span>
          <button onClick={goToNextPage}>
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
        <div className="actions">
          <button onClick={toggleOcrBorders}>
            <i className="fas fa-border-all"></i>
          </button>
        </div>
      </div>

      <Page
        page={page}
        base64Image={base64Image}
        image={image}
        ocr={ocr}
        shouldDisplayOcrBorders={shouldDisplayOcrBorders}
      />

      <div className="shortcuts">Shift + Space - skip symbol</div>
    </div>
  );
};

export default App;
