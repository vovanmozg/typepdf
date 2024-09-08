import React, { useEffect, useRef } from 'react';
import './RenderedPdf.css';

export function RenderedPdf({ image }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!image) {
      return;
    }

    const newCanvas = canvasRef.current;
    const context = newCanvas.getContext('2d');
    newCanvas.width = image.width;
    newCanvas.height = image.height;
    context.drawImage(image, 0, 0);
  }, [image]);

  return <canvas ref={canvasRef} id="pdf-canvas"></canvas>;
}
