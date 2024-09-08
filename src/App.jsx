import { useStore } from '@nanostores/react';
import { stateStore } from './store';

import React, { useState, useEffect, useRef } from 'react';
import { PdfUpload } from './PdfUpload';
import { useRecognize } from './hooks/useRecognize';
import './App.css';
import { generatePdfId } from './lib/generatePdfId';
import { useStorage } from './hooks/useStorage';
import { Modal } from './Modal';
import { useScale } from './Scaler';
import { RenderedPdf } from './RenderedPdf';
import { Overlay } from './Overlay';

const SCALE = 5;

function Shortcuts() {
  return (
    <div className="shortcuts">
      <div className="shortcut">
        <div className="shortcut-key">Shift</div>+
        <div className="shortcut-key">Space</div> - skip symbol
      </div>
      <div className="shortcut" title="Shift + Arrow down">
        <div className="shortcut-key">Shift</div>+
        <div className="shortcut-key">↓</div> - skip line
      </div>
      <div className="shortcut">
        <div className="shortcut-key">F11</div>
        for comfortable typing
      </div>
    </div>
  );
}

const App = () => {
  const [pdfDoc, setPdfDoc] = useState(null);
  const [pageNumber, setPageNumber] = useState(null);
  const [pdfPage, setPdfPage] = useState(null);
  const [base64Image, setBase64Image] = useState(null);
  const [image, setImage] = useState(null);
  const [shouldDisplayOcrBorders, setShouldDisplayOcrBorders] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { setScale } = useScale();
  const containerRef = useRef(null);
  const state = useStore(stateStore);

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
      setPdfPage(page);
    })();
  }, [pdfDoc, pageNumber]);

  useEffect(() => {
    if (!pdfPage) {
      return;
    }

    setBase64Image(null);

    (async () => {
      const viewport = pdfPage.getViewport({ scale: 5 });
      const canvas = document.createElement('canvas');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport,
      };

      await pdfPage.render(renderContext).promise;

      setBase64Image('' + canvas.toDataURL());
    })();
  }, [pdfPage]);

  useEffect(() => {
    if (!base64Image) {
      return;
    }

    const image = new Image();
    image.onload = () => setImage(image);
    image.src = base64Image;
  }, [base64Image]);

  const { data: ocr, progress } = useRecognize(image);

  const pageNumbers = (
    pdfDoc?.numPages ? [...Array(pdfDoc.numPages).keys()] : []
  ).map(i => i + 1);

  const hidden = pdfDoc ? '' : 'hidden';

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.ctrlKey) {
        if (event.key === 'ArrowRight') {
          goToNextPage();
        } else if (event.key === 'ArrowLeft') {
          goToPrevPage();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [pdfDoc]);

  // setScale on resize
  useEffect(() => {
    const handleResize = () => {
      setScale({
        imageWidth: image?.width,
        containerWidth: containerRef.current?.clientWidth,
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [image, containerRef.current, setScale]);

  return (
    <div id="app">
      <div id="progress-container">
        <div
          className={`progress-bar ${[progress] < 1 ? 'processing' : ''}`}
          style={{ width: `${progress * 100}%` }}></div>
      </div>
      <div id="menu">
        <PdfUpload onPdfLoaded={handlePdfUploaded} />
        <div id="page-navigation" className={hidden}>
          <button onClick={goToPrevPage} title="Ctrl + ←">
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
          <button onClick={goToNextPage} title="Ctrl + →">
            <i className="fas fa-arrow-right"></i>
          </button>
        </div>
        <div className="actions">
          <button onClick={toggleOcrBorders}>
            <i className="fas fa-border-all"></i>
          </button>
          <button onClick={() => setIsModalOpen(true)}>
            <i className="fas fa-eye"></i>
          </button>
        </div>
        <div className="typing-speed">
          Speed (lpm): {state?.speed}, Errors/min: {state?.errorCount}
        </div>
      </div>

      <div id="pdf-container" ref={containerRef}>
        <RenderedPdf image={image} />
        <Overlay ocr={ocr} shouldDisplayOcrBorders={shouldDisplayOcrBorders} />
      </div>

      {image ? <Shortcuts /> : null}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recognizedText={ocr?.text || ''}
      />
    </div>
  );
};

export default App;
