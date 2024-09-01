// storage data structure
// {
//   currendPdfId: 'pdf_doc_XXX',
//   pdfDocs: {
//     pdf_doc_XXX: {
//       pageNumber: 1,
//       positions: { 1: {}, 2: {}, ... }
//     }
//   }
//
// Example usage:
// const storage = useStorage(pdfDoc ? generatePdfId(pdfDoc) : null);
// storage.getPdfRelated('pageNumber', 1)
// storage.setPdfRelated('pageNumber', newPageNumber);

import { useCallback, useMemo } from 'react';

const LOCAL_STORAGE_KEY = 'pdfDocStorage';

function getCurrentPdfId() {
  return localStorage.getItem('currendPdfId');
}

function setCurrentPdfId(id) {
  localStorage.setItem('currendPdfId', id);
}

function getStorageData() {
  const data = localStorage.getItem(LOCAL_STORAGE_KEY);
  return data ? JSON.parse(data) : { currentPdfId: null, pdfDocs: {} };
}

function setStorageData(data) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export function useStorage(pdfId2) {
  const pdfId = pdfId2 || getCurrentPdfId();

  return useMemo(() => {
    function getPdfRelated(key, defaultValue = undefined) {
      if (!pdfId) {
        console.error('Storage is not initialized');
        return;
      }

      const allData = getStorageData();
      return allData?.pdfDocs?.[pdfId]?.[key] || defaultValue;
    }

    function setPdfRelated(key, value) {
      if (!pdfId) {
        console.error('Storage is not initialized');
        return;
      }

      const data = getStorageData();
      if (!data.pdfDocs[pdfId]) {
        data.pdfDocs[pdfId] = {};
      }
      data.pdfDocs[pdfId][key] = value;
      data.currentPdfId = pdfId;
      setStorageData(data);
    }

    return { getPdfRelated, setPdfRelated, setCurrentPdfId };
  }, [pdfId]);
}
