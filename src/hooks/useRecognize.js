import { useEffect, useState } from 'react';
import { createWorker } from 'tesseract.js';

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

export function useRecognize(image) {
  const [worker, setWorker] = useState(null);
  const [progress, setProgress] = useState(0);
  const [jobInProgress, setJobInProgress] = useState(false);
  const [dataset, setDataset] = useState({});

  useEffect(() => {
    (async () => {
      const newWorker = await createWorker('eng', 1, {
        logger: ({ status, progress }) =>
          status === 'recognizing text' ? setProgress(progress) : null,
      });
      setWorker(newWorker);
    })();

    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  useEffect(() => {
    if (!image || !worker) {
      return;
    }

    if (dataset[image.src]) {
      return;
    }

    if (jobInProgress === false) {
      setJobInProgress(true);
    }

    (async () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;

      const result = await worker.recognize(image);

      richifyOcr(result.data);
      setDataset({ ...dataset, [image.src]: result.data });
      setJobInProgress(false);
    })();
  }, [image, worker]);

  return { data: dataset[image?.src], progress };
}
