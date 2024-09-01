import { useEffect, useState } from 'react';
import { recognize } from 'tesseract.js';

function richifyOcr(ocr) {
  if (!ocr) {
    return;
  }

  ocr.blocks.forEach((block, blockIndex) => {
    block.index = blockIndex;
    block.paragraphs.forEach((paragraph, paragraphIndex) => {
      paragraph.index = paragraphIndex;
      paragraph.lines.forEach((line, lineIndex) => {
        line.index = lineIndex;
        line.words.forEach((word, wordIndex) => {
          word.index = wordIndex;
          word.line = line;
          word.symbols.forEach((symbol, symbolIndex) => {
            symbol.index = symbolIndex;
            symbol.word = word;
          });
        });
      });
    });
  });
}

export function useRecognize(base64Image) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!base64Image) {
      return;
    }

    setData(null);

    (async () => {
      const canvas = document.createElement('canvas');
      const image = new Image();
      image.src = base64Image;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      canvas.width = image.width;
      canvas.height = image.height;
      const result = await recognize(image, 'eng');

      richifyOcr(result.data);
      setData(result.data);
    })();
  }, [base64Image]);

  return data;
}
