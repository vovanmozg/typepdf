import { useCallback, useEffect, useState } from 'react';
import { useStorage } from './useStorage';

function isSymbolsEqual(key, expectedChar) {
  if (key === "'" && expectedChar === '’') {
    return true;
  }

  // &mdash; &ndash; &minus;
  if (
    key === '-' &&
    (expectedChar === '—' || expectedChar === '–' || expectedChar === '−')
  ) {
    return true;
  }

  if (key === '.' && expectedChar === 'o') {
    return true;
  }

  return key === expectedChar;
}

const DEFAULT_POSITION = {
  b: 0,
  p: 0,
  l: 0,
  w: 0,
  s: 0,
  isSpace: false,
};

export function useFrame(ocr) {
  const storage = useStorage();
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (!ocr || ocr.blocks.length === 0) {
      return;
    }

    const pageNumber = storage.getPdfRelated('pageNumber');
    const allPositions = storage.getPdfRelated('positions', {});
    const positionFromStore = allPositions[pageNumber] || DEFAULT_POSITION;
    setPosition(positionFromStore);
    setErrors([]);
  }, [ocr]);

  const {
    currentBlock,
    currentParagraph,
    currentLine,
    currentWord,
    currentSymbol,
  } = useCallback(() => {
    if (!ocr || ocr.blocks.length === 0) {
      return {};
    }

    const currentBlock = ocr.blocks[position.b];
    const currentParagraph = currentBlock.paragraphs[position.p];
    const currentLine = currentParagraph.lines[position.l];
    const currentWord = currentLine.words[position.w];
    const currentSymbol = currentWord.symbols[position.s];

    return {
      currentBlock,
      currentParagraph,
      currentLine,
      currentWord,
      currentSymbol,
    };
  }, [position, ocr])();

  // frame bounding box
  const bbox = () => {
    if (position.isSpace) {
      const spaceWidth = currentSymbol.bbox.x1 - currentSymbol.bbox.x0;
      return {
        x0: currentSymbol.bbox.x0 + spaceWidth,
        y0: currentSymbol.word.line.bbox.y0,
        x1: currentSymbol.bbox.x1 + spaceWidth,
        y1: currentSymbol.word.line.bbox.y1,
      };
    } else {
      return {
        x0: currentSymbol.bbox.x0,
        y0: currentSymbol.word.line.bbox.y0,
        x1: currentSymbol.bbox.x1,
        y1: currentSymbol.word.line.bbox.y1,
      };
    }
  };

  const isLastSymbolInWord = position.s === currentWord?.symbols?.length - 1;
  const isLastWordInLine = position.w === currentLine?.words?.length - 1;

  function isCorrect({ key, shiftKey }) {
    // Кодовое сочетание - пробел + shift пропускает любой символ
    if (key === ' ' && shiftKey) {
      return true;
    }

    if (isLastSymbolInWord && !isLastWordInLine) {
      if (position.isSpace) {
        // обработка пробела после слова
        return key === ' ';
      } else {
        // обработка последнего символа в слове
        const isEqual = isSymbolsEqual(key, currentSymbol.text);
        if (!isEqual) {
          setErrors(prev => [...prev, currentSymbol]);
        }
        return isEqual;
      }
    } else {
      // обработка обычного символа
      const isEqual = isSymbolsEqual(key, currentSymbol.text);
      if (!isEqual) {
        setErrors(prev => [...prev, currentSymbol]);
      }
      return isEqual;
    }
  }

  const next = () => {
    const newPosition = { ...position };

    if (isLastSymbolInWord && !isLastWordInLine) {
      if (position.isSpace) {
        newPosition.isSpace = false;

        newPosition.s = position.s + 1;

        if (newPosition.s >= currentWord.symbols.length) {
          newPosition.w = position.w + 1;
          newPosition.s = 0;
        }

        if (newPosition.w >= currentLine.words.length) {
          newPosition.l = position.l + 1;
          newPosition.w = 0;
        }

        if (newPosition.l >= currentParagraph.lines.length) {
          newPosition.p = position.p + 1;
          newPosition.l = 0;
        }

        if (newPosition.p >= currentBlock.paragraphs.length) {
          newPosition.b = position.b + 1;
          newPosition.p = 0;
        }
      } else {
        // передвинуть фрейм с последней буквы слова на пробел
        newPosition.isSpace = true;
      }
    } else {
      newPosition.s = position.s + 1;

      if (newPosition.s >= currentWord.symbols.length) {
        newPosition.w = position.w + 1;
        newPosition.s = 0;
      }

      if (newPosition.w >= currentLine.words.length) {
        newPosition.l = position.l + 1;
        newPosition.w = 0;
      }

      if (newPosition.l >= currentParagraph.lines.length) {
        newPosition.p = position.p + 1;
        newPosition.l = 0;
      }

      if (newPosition.p >= currentBlock.paragraphs.length) {
        newPosition.b = position.b + 1;
        newPosition.p = 0;
      }

      if (newPosition.b >= ocr.blocks.length) {
        // TODO: если кончился документ
        return;
      }
    }

    setPosition(newPosition);
    storage.setPdfRelated('positions', {
      ...storage.getPdfRelated('positions'),
      [storage.getPdfRelated('pageNumber')]: newPosition,
    });
  };

  const typo = () => {};

  if (!ocr || ocr.blocks.length === 0) {
    return;
  }

  return {
    next,
    typo,
    isCorrect,
    position,
    bbox,
    currentSymbol,
    currentWord,
    currentLine,
    currentParagraph,
    currentBlock,
    errors,
  };
}
