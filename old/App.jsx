import React, { useState, useEffect, useRef } from 'react';
import { getPdfFromInput } from './readPdf';
import * as pdfjsLib from 'pdfjs-dist';
import * as Tesseract from 'tesseract.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

const PdfTypingPractice = () => {
  const [state, setState] = useState({
    pdfDoc: null,
    currentPage: 1,
    pageRendering: false,
    words: [],
    blocks: [],
    currentWordNumber: 0,
    currentSymbolNumber: 0,
    currentLineNumber: 0,
    currentParagraphNumber: 0,
    currentBlockNumber: 0,
    mistakes: 0,
    isCurrentSpace: false,
  });

  const pdfCanvasRef = useRef(null);
  const overlayRef = useRef(null);
  const cursorRef = useRef(null);

  useEffect(() => {
    if (state.pdfDoc) {
      renderPage(state.currentPage);
    }
  }, [state.pdfDoc, state.currentPage]);

  const renderPage = async num => {
    setState(prev => ({ ...prev, pageRendering: true }));
    const page = await state.pdfDoc.getPage(num);

    const viewport = page.getViewport({ scale: 2.38 });
    const canvas = pdfCanvasRef.current;
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: canvas.getContext('2d'),
      viewport: viewport,
    };

    await page.render(renderContext);
    setState(prev => ({ ...prev, pageRendering: false }));

    if (overlayRef.current) overlayRef.current.innerHTML = '';
    const data = await extractTextFromPage(canvas, viewport);

    renderData(data, canvas);
  };

  const extractTextFromPage = async (canvas, viewport) => {
    const image = new Image();
    image.src = canvas.toDataURL();

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const result = await Tesseract.recognize(image, 'eng');
    return result.data;
  };

  const renderData = (data, canvas) => {
    const blocks = data.blocks;
    const words = [];
    const overlay = overlayRef.current;
    if (overlay) overlay.innerHTML = '';

    blocks.forEach((block, blockIndex) => {
      block.paragraphs.forEach((paragraph, paragraphIndex) => {
        paragraph.lines.forEach((line, lineIndex) => {
          const lineCover = createLineCover(line);
          overlay.appendChild(lineCover);

          line.words.forEach((word, wordIndex) => {
            word.line = line;
            words.push(word);

            word.symbols.forEach((symbol, symbolIndex) => {
              symbol.word = word;
              symbol.lineCover = lineCover;
              const highlight = document.createElement('div');
              highlight.className = 'highlight';

              const scaleX = 1;
              const scaleY = 1;

              highlight.style.left = `${symbol.bbox.x0 * scaleX}px`;
              highlight.style.top = `${symbol.bbox.y0 * scaleY}px`;
              highlight.style.width = `${(symbol.bbox.x1 - symbol.bbox.x0) * scaleX}px`;
              highlight.style.height = `${(symbol.bbox.y1 - symbol.bbox.y0) * scaleY}px`;

              highlight.dataset.path = getPath({
                b: blockIndex,
                p: paragraphIndex,
                l: lineIndex,
                w: wordIndex,
                s: symbolIndex,
              });

              overlay.appendChild(highlight);
            });
          });
        });
      });
    });

    setState(prev => ({
      ...prev,
      blocks,
      words,
      currentWordNumber: 0,
      currentSymbolNumber: 0,
      mistakes: 0,
    }));

    unhighlightCurrentSymbol();
    moveCursor(words[0].symbols[0]);
  };

  const getPath = ({ b, p, l, w, s } = {}) => {
    const blockNumber = b || state.currentBlockNumber;
    const paragraphNumber = p || state.currentParagraphNumber;
    const lineNumber = l || state.currentLineNumber;
    const wordNumber = w || state.currentWordNumber;
    const symbolNumber = s || state.currentSymbolNumber;

    return `${blockNumber}-${paragraphNumber}-${lineNumber}-${wordNumber}-${symbolNumber}`;
  };

  const goToNextSymbol = () => {
    setState(prev => {
      let {
        currentBlockNumber,
        currentParagraphNumber,
        currentLineNumber,
        currentWordNumber,
        currentSymbolNumber,
      } = prev;

      const currentBlock = prev.blocks[currentBlockNumber];
      const currentParagraph = currentBlock.paragraphs[currentParagraphNumber];
      const currentLine = currentParagraph.lines[currentLineNumber];
      const currentWord = currentLine.words[currentWordNumber];

      currentSymbolNumber++;

      if (currentSymbolNumber >= currentWord.symbols.length) {
        currentWordNumber++;
        currentSymbolNumber = 0;
      }

      if (currentWordNumber >= currentLine.words.length) {
        currentLineNumber++;
        currentWordNumber = 0;
      }

      if (currentLineNumber >= currentParagraph.lines.length) {
        currentParagraphNumber++;
        currentLineNumber = 0;
      }

      if (currentParagraphNumber >= currentBlock.paragraphs.length) {
        currentBlockNumber++;
        currentParagraphNumber = 0;
      }

      if (currentBlockNumber >= prev.blocks.length) {
        console.log('Завершено! Ошибок: ' + prev.mistakes);
      }

      return {
        ...prev,
        currentBlockNumber,
        currentParagraphNumber,
        currentLineNumber,
        currentWordNumber,
        currentSymbolNumber,
      };
    });
  };

  const getCurrentSymbol = () => {
    const {
      blocks,
      currentBlockNumber,
      currentParagraphNumber,
      currentLineNumber,
      currentWordNumber,
      currentSymbolNumber,
    } = state;
    return blocks[currentBlockNumber].paragraphs[currentParagraphNumber].lines[
      currentLineNumber
    ].words[currentWordNumber].symbols[currentSymbolNumber];
  };

  const isSymbolsEqual = (key, expectedChar) => {
    if (key === "'" && expectedChar === '’') {
      return true;
    }
    return key === expectedChar;
  };

  const handleRegularCharacter = (key, expectedChar) => {
    highlightCurrentSymbol(isSymbolsEqual(key, expectedChar));
    if (!isSymbolsEqual(key, expectedChar)) {
      setState(prev => ({ ...prev, mistakes: prev.mistakes + 1 }));
      return;
    }
    goToNextSymbol();
    moveCursor(getCurrentSymbol());
    unhighlightCurrentSymbol();
  };

  const handleSpace = key => {
    if (key !== ' ') {
      setState(prev => ({ ...prev, mistakes: prev.mistakes + 1 }));
      return;
    }
    goToNextSymbol();
    moveCursor(getCurrentSymbol());
    unhighlightCurrentSymbol();
  };

  const moveCursorToEndOfWord = currentSymbol => {
    const cursor = cursorRef.current;
    if (cursor) {
      const cursorHeight =
        currentSymbol.word.line.bbox.y1 - currentSymbol.word.line.bbox.y0;
      cursor.style.left = `${Number(currentSymbol.bbox.x1)}px`;
      cursor.style.top = `${Number(currentSymbol.word.line.bbox.y1) - cursorHeight}px`;
      cursor.style.height = `${cursorHeight}px`;
    }
  };

  const unhighlightCurrentSymbol = () => {
    const currentSymbol = getCurrentSymbol();
    const lineCover = currentSymbol.lineCover;
    const currentLine =
      state.blocks[state.currentBlockNumber].paragraphs[
        state.currentParagraphNumber
      ].lines[state.currentLineNumber];

    lineCover.style.left = `${parseFloat(currentSymbol.bbox.x0)}px`;
    lineCover.style.width = `${parseFloat(currentLine.bbox.x1 - currentSymbol.bbox.x0)}px`;
  };

  const typeCharacterHandle = key => {
    const currentSymbol = getCurrentSymbol();
    const currentWord =
      state.blocks[state.currentBlockNumber].paragraphs[
        state.currentParagraphNumber
      ].lines[state.currentLineNumber].words[state.currentWordNumber];
    const currentLine =
      state.blocks[state.currentBlockNumber].paragraphs[
        state.currentParagraphNumber
      ].lines[state.currentLineNumber];
    const expectedChar = currentSymbol.text;

    if (
      state.currentSymbolNumber === currentWord.symbols.length - 1 &&
      state.currentWordNumber < currentLine.words.length - 1
    ) {
      if (state.isCurrentSpace) {
        handleSpace(key);
        setState(prev => ({ ...prev, isCurrentSpace: false }));
      } else {
        moveCursorToEndOfWord(currentSymbol);
        setState(prev => ({ ...prev, isCurrentSpace: true }));
      }
    } else {
      setState(prev => ({ ...prev, isCurrentSpace: false }));
      handleRegularCharacter(key, expectedChar);
    }

    const nextSymbol = getCurrentSymbol();
    if (nextSymbol.word.line !== currentSymbol.word.line) {
      nextSymbol.lineCover.style.width = `${nextSymbol.word.line.bbox.x1 - nextSymbol.word.line.bbox.x0}px`;
      nextSymbol.lineCover.style.left = `${nextSymbol.word.line.bbox.x0}px`;
    }
  };

  const createLineCover = line => {
    const cover = document.createElement('div');
    cover.className = 'line-cover';
    cover.style.position = 'absolute';
    cover.style.left = `${line.bbox.x0}px`;
    cover.style.top = `${line.bbox.y0}px`;
    cover.style.width = `${line.bbox.x1 - line.bbox.x0}px`;
    cover.style.height = `${line.bbox.y1 - line.bbox.y0}px`;
    cover.style.pointerEvents = 'none';
    return cover;
  };

  const highlightCurrentSymbol = isCorrect => {
    const highlight = overlayRef.current.querySelector(
      `[data-path="${getPath()}"]`,
    );
    if (highlight) {
      if (isCorrect) {
        highlight.style.backgroundColor = 'transparent';
      } else {
        highlight.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
      }
      highlight.classList.remove('current');
    }
  };

  const moveCursor = symbol => {
    const cursor = cursorRef.current;
    if (cursor) {
      const cursorHeight = symbol.word.line.bbox.y1 - symbol.word.line.bbox.y0;
      cursor.style.left = `${Number(symbol.bbox.x0 - 5)}px`;
      cursor.style.top = `${Number(symbol.word.line.bbox.y1) - cursorHeight}px`;
      cursor.style.height = `${cursorHeight}px`;
    }
  };

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.key.length > 1) {
        return;
      }

      typeCharacterHandle(event.key);
      event.preventDefault();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [state]);

  const handlePdfAttached = async event => {
    const pdfDoc = await getPdfFromInput(event);
    setState(prev => ({ ...prev, pdfDoc, currentPage: 1 }));
  };

  const goToPrevPage = () => {
    setState(prev => ({
      ...prev,
      currentPage:
        prev.currentPage > 1 ? prev.currentPage - 1 : prev.currentPage,
    }));
  };

  const goToNextPage = () => {
    setState(prev => ({
      ...prev,
      currentPage:
        prev.currentPage < prev.pdfDoc.numPages
          ? prev.currentPage + 1
          : prev.currentPage,
    }));
  };

  return (
    <div>
      <h1>PDF Typing Practice</h1>
      <input
        type="file"
        accept="application/pdf"
        onChange={handlePdfAttached}
      />
      <div id="navigation">
        <button onClick={goToPrevPage}>Предыдущая</button>
        <span id="page-info">
          Страница {state.currentPage} из{' '}
          {state.pdfDoc ? state.pdfDoc.numPages : 1}
        </span>
        <button onClick={goToNextPage}>Следующая</button>
      </div>
      <div id="pdf-container">
        <canvas ref={pdfCanvasRef} id="pdf-canvas"></canvas>
        <div ref={overlayRef} id="overlay"></div>
        <div ref={cursorRef} id="cursor"></div>
      </div>
    </div>
  );
};

export default PdfTypingPractice;
