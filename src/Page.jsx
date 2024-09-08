import { RenderedPdf } from './RenderedPdf';
import { Overlay } from './Overlay';
import './Page.css';
import React from 'react';
export function Page({ image, ocr, shouldDisplayOcrBorders }) {
  if (!image) {
    return null;
  }

  return (
    <div id="pdf-container">
      <RenderedPdf image={image} />
      <Overlay ocr={ocr} shouldDisplayOcrBorders={shouldDisplayOcrBorders} />
    </div>
  );
}
