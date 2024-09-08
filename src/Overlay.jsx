import React, { useEffect } from 'react';
import { Cursor } from './Cursor';
import useDocumentKeyPress from './hooks/useDocumentKeyPress';
import { useOverlayLines } from './hooks/useOverlayLines';
import { useFrame } from './hooks/useFrame';
import { useScale } from './Scaler';
import './Overlay.css';

function useInitialScroll(ocr) {
  // при переключении на новую страницу по деволту просрроллить в начало
  useEffect(() => {
    document.getElementById('pdf-container').scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }, [ocr]);
}

function useScrollToCurrentLine(frame) {
  const { scale: s } = useScale();

  useEffect(() => {
    if (!frame?.currentLine) {
      return;
    }

    document.getElementById('pdf-container').scrollTo({
      top: s(frame.currentLine.bbox.y0 - 150),
      behavior: 'smooth',
    });
  }, [frame?.currentSymbol]);
}

export function Overlay({ ocr, shouldDisplayOcrBorders }) {
  const lines = useOverlayLines(ocr);
  const frame = useFrame(ocr);
  const { scale: s } = useScale();

  const typeCharacterHandle = event => {
    if (frame.isCorrect(event)) {
      frame.next(event);
    } else {
      frame.typo();
    }
  };

  useDocumentKeyPress(event => {
    if (!frame) {
      return;
    }

    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    if (event.shiftKey && event.key === 'ArrowDown') {
      frame.nextLine();
    }

    if (event.key.length > 1 && event.key !== 'Enter') {
      return;
    }

    typeCharacterHandle(event);

    event.preventDefault();
  });

  useInitialScroll(ocr);
  useScrollToCurrentLine(frame, lines);

  function lineSizeAndPosition(line, lineIndex) {
    const margin = 5;
    const sizeAndPosition = {
      top: `${s(line.bbox.y0 - margin)}px`,
      height: `${s(line.bbox.y1 - line.bbox.y0 + margin)}px`,
    };

    if (lineIndex === frame.currentSymbol.word.line.absoluteIndex) {
      sizeAndPosition.left = `${s(line.bbox.x0)}px`;
      sizeAndPosition.width = `${s(frame.bbox().x0 - line.bbox.x0)}px`;
    } else {
      sizeAndPosition.left = `${s(line.bbox.x0)}px`;
      sizeAndPosition.width = `${s(line.bbox.x1 - line.bbox.x0)}px`;
    }

    return sizeAndPosition;
  }

  const isLineTheSameOrAboveFrame = (line, lineIndex) => {
    return lineIndex <= frame.currentSymbol.word.line.absoluteIndex;
  };

  if (!frame?.currentSymbol) {
    return null;
  }

  const lineClassName = shouldDisplayOcrBorders
    ? 'line-cover with-borders'
    : 'line-cover';

  return (
    <div id="overlay">
      <div>
        {lines.map((line, lineIndex) =>
          isLineTheSameOrAboveFrame(line, lineIndex) ? (
            <div
              key={`${lineIndex}${line.text}`}
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
            top: `${s(symbol.bbox.y0 - 2)}px`,
            left: `${s(symbol.bbox.x0 - 2)}px`,
            width: `${s(symbol.bbox.x1 - symbol.bbox.x0 + 4)}px`,
            height: `${s(symbol.bbox.y1 - symbol.bbox.y0 + 4)}px`,
          }}
        />
      ))}

      <Cursor frame={frame} />
    </div>
  );
}
