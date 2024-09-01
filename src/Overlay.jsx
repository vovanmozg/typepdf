import React, { useRef, useEffect } from 'react';
import { Cursor } from './Cursor';
import useDocumentKeyPress from './hooks/useDocumentKeyPress';
import { useOverlayLines } from './hooks/useOverlayLines';
import { useFrame } from './hooks/useFrame';
import './Overlay.css';

export function Overlay({ ocr, shouldDisplayOcrBorders }) {
  const lines = useOverlayLines(ocr);
  const frame = useFrame(ocr);
  const containerRef = useRef(null);

  const typeCharacterHandle = event => {
    if (frame.isCorrect(event)) {
      frame.next();
    } else {
      frame.typo();
    }
  };

  useDocumentKeyPress(event => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.key.length > 1) {
      return;
    }

    typeCharacterHandle(event);

    event.preventDefault();
  });

  useEffect(() => {
    if (!frame?.currentLine) {
      return;
    }

    document.getElementById('pdf-container').scrollTo({
      top: frame.currentLine.bbox.y0 - 150,
      behavior: 'smooth',
    });
  }, [frame?.currentSymbol]);

  function lineSizeAndPosition(line, lineIndex) {
    const margin = 5;
    const sizeAndPosition = {
      top: `${line.bbox.y0 - margin}px`,
      height: `${line.bbox.y1 - line.bbox.y0 + margin * 2}px`,
    };

    if (lineIndex === frame.currentSymbol.word.line.absoluteIndex) {
      sizeAndPosition.left = `${frame.bbox().x0}px`;
      sizeAndPosition.width = `${line.bbox.x1 - frame.bbox().x0}px`;
    } else {
      sizeAndPosition.left = `${line.bbox.x0}px`;
      sizeAndPosition.width = `${line.bbox.x1 - line.bbox.x0}px`;
    }

    return sizeAndPosition;
  }

  const isLineTheSameOrBelowFrame = (line, lineIndex) => {
    return lineIndex >= frame.currentSymbol.word.line.absoluteIndex;
  };

  if (!ocr || !frame) {
    return null;
  }

  const lineClassName = shouldDisplayOcrBorders
    ? 'line-cover with-borders'
    : 'line-cover';

  return (
    <div id="overlay" ref={containerRef}>
      <div>
        {lines.map((line, lineIndex) =>
          isLineTheSameOrBelowFrame(line, lineIndex) ? (
            <div
              key={line.text}
              className={lineClassName}
              data-line-index={lineIndex}
              style={{
                ...lineSizeAndPosition(line, lineIndex),
              }}
            />
          ) : null,
        )}
      </div>

      {frame?.errors?.map((symbol, index) => (
        <div
          key={index}
          className="error-highlight"
          style={{
            top: `${symbol.bbox.y0 - 2}px`,
            left: `${symbol.bbox.x0 - 2}px`,
            width: `${symbol.bbox.x1 - symbol.bbox.x0 + 4}px`,
            height: `${symbol.bbox.y1 - symbol.bbox.y0 + 4}px`,
          }}
        />
      ))}

      <Cursor frame={frame} />
    </div>
  );
}
