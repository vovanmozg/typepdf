import { RenderedPdf } from './RenderedPdf';
import { Overlay } from './Overlay';
import './Page.css';
import React from 'react';
export function Page({
  page,
  base64Image,
  image,
  ocr,
  shouldDisplayOcrBorders,
}) {
  if (!page || !base64Image) {
    return null;
  }

  return (
    <div id="pdf-container" style={{ width: image?.width }}>
      <RenderedPdf base64Image={base64Image} image={image} />
      <Overlay ocr={ocr} shouldDisplayOcrBorders={shouldDisplayOcrBorders} />
    </div>
  );
}
