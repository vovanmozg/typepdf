import { useEffect, useState } from 'react';

export function useOverlayLines(ocr) {
  const [lines, setLines] = useState([]);

  useEffect(() => {
    if (!ocr) {
      setLines([]);
      return;
    }

    const linesCollector = [];
    ocr.blocks.forEach((block, blockIndex) => {
      // block.index = blockIndex;
      block.paragraphs.forEach((paragraph, paragraphIndex) => {
        // paragraph.index = paragraphIndex;
        paragraph.lines.forEach((line, lineIndex) => {
          // line.index = lineIndex;
          line.absoluteIndex = linesCollector.length;
          linesCollector.push(line);
          line.words.forEach((word, wordIndex) => {
            // word.index = wordIndex;
            // word.line = line;

            word.symbols.forEach((symbol, symbolIndex) => {
              // symbol.index = symbolIndex;
              // symbol.word = word;
              // symbol.line = line;
            });
          });
        });
      });
    });
    setLines(linesCollector);
  }, [ocr]);

  return lines;
}
