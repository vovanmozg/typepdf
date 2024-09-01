// import { lib } from './lib.js';
import { getPdfFromInput } from './app/readPdf.js';
import { state } from './app/state.js';

state.currentPage = 23;

let pageRendering = false,
  pdfCanvas = document.getElementById('pdf-canvas'),
  canvasContext = pdfCanvas.getContext('2d'),
  overlay = document.getElementById('overlay'),
  cursor = document.getElementById('cursor');

let currentWordNumber = 0,
  currentSymbolNumber = 0,
  currentLineNumber = 0,
  currentParagraphNumber = 0,
  currentBlockNumber = 0,
  mistakes = 0,
  words = [],
  blocks = [];

async function renderPage(num) {
  pageRendering = true;
  const page = await state.pdfDoc.getPage(num);

  const viewport = page.getViewport({ scale: 2.38 }); // Оставляем масштаб для отображения
  pdfCanvas.height = viewport.height;
  pdfCanvas.width = viewport.width;

  const renderContext = {
    canvasContext: canvasContext,
    viewport: viewport,
  };

  await page.render(renderContext);
  pageRendering = false;
  overlay.innerHTML = '';
  const data = await extractTextFromPage(pdfCanvas, viewport);

  renderData(data, pdfCanvas);

  document.getElementById('page-info').textContent =
    `Страница ${num} из ${state.pdfDoc.numPages}`;
}

function renderData(data, canvas) {
  blocks = data.blocks;

  words = [];
  overlay.innerHTML = '';

  blocks.forEach((block, blockIndex) => {
    block.paragraphs.forEach((paragraph, paragraphIndex) => {
      paragraph.lines.forEach((line, lineIndex) => {
        // // create div with border to outline line
        // const lineDiv = document.createElement('div');
        // lineDiv.className = 'line';
        // lineDiv.style.left = `${line.bbox.x0}px`;
        // lineDiv.style.top = `${line.bbox.y0}px`;
        // lineDiv.style.width = `${line.bbox.x1 - line.bbox.x0}px`;
        // lineDiv.style.height = `${line.bbox.y1 - line.bbox.y0}px`;
        // overlay.appendChild(lineDiv);

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

            const scaleX = 1; //canvas.width / image.width;
            const scaleY = 1; //canvas.height / image.height;

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
            // `${blockIndex}-${paragraphIndex}-${lineIndex}-${wordIndex}-${symbolIndex}`;
            // highlight.dataset.word = wordIndex;
            // highlight.dataset.symbol = symbolIndex;
            // highlight.dataset.char = symbol.text;

            overlay.appendChild(highlight);
          });
        });
      });
    });
  });

  //
  // words.forEach((word, wordIndex) => {
  //   word.symbols.forEach((symbol, symbolIndex) => {
  //
  //   });
  // });

  currentWordNumber = 0;
  currentSymbolNumber = 0;
  mistakes = 0;
  unhighlightCurrentSymbol();
  moveCursor(words[0].symbols[0]);
}

async function extractTextFromPage(canvas, viewport) {
  // 1. Create a new Image object and set its source:
  const image = new Image();
  image.src = canvas.toDataURL();

  // 2. Handle image loading asynchronously using await:
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = reject;
  });

  // 3. Perform Tesseract recognition and return the result:
  const result = await Tesseract.recognize(image, 'eng');
  return result.data;
}

function getPath({ b, p, l, w, s } = {}) {
  const blockNumber = b || currentBlockNumber;
  const paragraphNumber = p || currentParagraphNumber;
  const lineNumber = l || currentLineNumber;
  const wordNumber = w || currentWordNumber;
  const symbolNumber = s || currentSymbolNumber;

  return `${blockNumber}-${paragraphNumber}-${lineNumber}-${wordNumber}-${symbolNumber}`;
}

function goToNextSymbol() {
  const currentBlock = blocks[currentBlockNumber];
  const currentParagraph = currentBlock.paragraphs[currentParagraphNumber];
  const currentLine = currentParagraph.lines[currentLineNumber];
  const currentWord = currentLine.words[currentWordNumber];
  const currentSymbol = currentWord.symbols[currentSymbolNumber];

  // Если после слова есть пробел, то нужно заставить пользователя напечатать
  // его перед переходом к следующему слову

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

  if (currentBlockNumber >= blocks.length) {
    console.log('Завершено! Ошибок: ');
  }
}

function getCurrentBlock() {
  return blocks[currentBlockNumber];
}

function getCurrentParagraph() {
  return getCurrentBlock().paragraphs[currentParagraphNumber];
}

function getCurrentLine() {
  return getCurrentParagraph().lines[currentLineNumber];
}

function getCurrentWord() {
  return getCurrentLine().words[currentWordNumber];
}

function getCurrentSymbol() {
  return getCurrentWord().symbols[currentSymbolNumber];
}

let isCurrentSpace = false;

// Вспомогательные функции
function isLastSymbolInWord(currentSymbolNumber, currentWord) {
  return currentSymbolNumber === currentWord.symbols.length - 1;
}

function isLastWordInLine(currentWordNumber, currentLine) {
  return currentWordNumber === currentLine.words.length - 1;
}

function isSymbolsEqual(key, expectedChar) {
  if (key === "'" && expectedChar === '’') {
    return true;
  }

  return key === expectedChar;
}

function moveCursorToEndOfWord(currentSymbol) {
  const cursorHeight =
    currentSymbol.word.line.bbox.y1 - currentSymbol.word.line.bbox.y0;
  cursor.style.left = `${Number(currentSymbol.bbox.x1)}px`;
  cursor.style.top = `${Number(currentSymbol.word.line.bbox.y1) - cursorHeight}px`;
  cursor.style.height = `${cursorHeight}px`;
}

function unhighlightCurrentSymbol() {
  const currentSymbol = getCurrentSymbol();
  const lineCover = currentSymbol.lineCover;
  const symbolWidth = currentSymbol.bbox.x1 - currentSymbol.bbox.x0;
  const currentLine = getCurrentLine();

  lineCover.style.left = `${parseFloat(currentSymbol.bbox.x0)}px`;
  lineCover.style.width = `${parseFloat(currentLine.bbox.x1 - currentSymbol.bbox.x0)}px`;
  //
  // const nextHighlight = overlay.querySelector(`[data-path="${getPath()}"]`);
  // if (nextHighlight) {
  //   // nextHighlight.classList.add('current');
  // }
}

function handleRegularCharacter(key, expectedChar) {
  highlightCurrentSymbol(isSymbolsEqual(key, expectedChar));
  if (!isSymbolsEqual(key, expectedChar)) {
    mistakes++;
    return;
  }
  goToNextSymbol();
  moveCursor(getCurrentSymbol());
  unhighlightCurrentSymbol();
}

function handleSpace(key) {
  if (key !== ' ') {
    mistakes++;
    return;
  }
  goToNextSymbol();
  moveCursor(getCurrentSymbol());
  unhighlightCurrentSymbol();
}

// Основная функция
function typeCharacterHandle(key) {
  const currentSymbol = getCurrentSymbol();
  const currentWord = getCurrentWord();
  const currentLine = getCurrentLine();
  const expectedChar = currentSymbol.text;

  if (
    isLastSymbolInWord(currentSymbolNumber, currentWord) &&
    !isLastWordInLine(currentWordNumber, currentLine)
  ) {
    if (isCurrentSpace) {
      handleSpace(key);
      isCurrentSpace = false;
    } else {
      moveCursorToEndOfWord(currentSymbol);
      isCurrentSpace = true;
    }
  } else {
    isCurrentSpace = false;
    handleRegularCharacter(key, expectedChar);
  }

  // Обновляем затенение строки
  const nextSymbol = getCurrentSymbol();
  if (nextSymbol.word.line !== currentSymbol.word.line) {
    // Если перешли на новую строку, сбрасываем затенение

    nextSymbol.lineCover.style.width = `${nextSymbol.word.line.bbox.x1 - nextSymbol.word.line.bbox.x0}px`;
    nextSymbol.lineCover.style.left = `${nextSymbol.word.line.bbox.x0}px`;
  }
}

// Добавьте эту функцию для создания затенения строки
function createLineCover(line) {
  const cover = document.createElement('div');
  cover.className = 'line-cover';
  cover.style.position = 'absolute';
  cover.style.left = `${line.bbox.x0}px`;
  cover.style.top = `${line.bbox.y0}px`;
  cover.style.width = `${line.bbox.x1 - line.bbox.x0}px`;
  cover.style.height = `${line.bbox.y1 - line.bbox.y0}px`;
  //cover.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
  cover.style.pointerEvents = 'none';
  return cover;
}

function highlightCurrentSymbol(isCorrect) {
  const highlight = overlay.querySelector(`[data-path="${getPath()}"]`);
  if (isCorrect) {
    highlight.style.backgroundColor = 'transparent'; //'rgba(0, 255, 0, 0.3)';
  } else {
    highlight.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
  }
  highlight.classList.remove('current');
}

function moveCursor(symbol) {
  const cursorHeight = symbol.word.line.bbox.y1 - symbol.word.line.bbox.y0;
  cursor.style.left = `${Number(symbol.bbox.x0 - 5)}px`;
  cursor.style.top = `${Number(symbol.word.line.bbox.y1) - cursorHeight}px`;
  cursor.style.height = `${cursorHeight}px`;
}

document.addEventListener('keydown', event => {
  console.log(event.key);

  if (event.altKey || event.ctrlKey || event.metaKey) {
    return;
  }

  // if (currentWordNumber >= words.length) {
  //   console.log('Завершено! Ошибок: ' + mistakes);
  //   return;
  // }

  if (event.key.length > 1) {
    return;
  }

  typeCharacterHandle(event.key);

  event.preventDefault();
});

document.getElementById('prev-page').addEventListener('click', () => {
  state.goToPrevPage();
  renderPage(state.currentPage);
});

document.getElementById('next-page').addEventListener('click', () => {
  state.goToNextPage();
  renderPage(state.currentPage);
});

async function handlePdfAttached(event) {
  state.pdfDoc = await getPdfFromInput(event);

  document.getElementById('page-info').textContent =
    `Страница ${state.currentPage} из ${state.pdfDoc.numPages}`;

  renderPage(state.currentPage);
}

document
  .getElementById('pdf-input')
  .addEventListener('change', handlePdfAttached);
