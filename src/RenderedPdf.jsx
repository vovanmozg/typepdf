import React, { useEffect, useRef } from 'react';
import './RenderedPdf.css';

export function RenderedPdf({ base64Image, image }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    (async () => {
      if (!base64Image) {
        return;
      }

      const newCanvas = canvasRef.current;
      const context = newCanvas.getContext('2d');
      const image = new Image();

      // newCanvas.width = image.width;
      // newCanvas.height = image.height;

      image.onload = () => {
        newCanvas.width = image.width;
        newCanvas.height = image.height;
        context.drawImage(image, 0, 0);
      };

      image.src = base64Image;
    })();
  }, [base64Image]);

  return <canvas ref={canvasRef} id="pdf-canvas"></canvas>;
}
