async function readPdf(typedArray) {
  return await pdfjsLib.getDocument(typedArray).promise;
}

export function getPdfFromInput(event) {
  return new Promise((resolve, reject) => {
    const file = event.target.files[0];

    if (!file || file.type !== 'application/pdf') {
      reject(new Error('Invalid file type'));
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async function () {
      const typedArray = new Uint8Array(this.result);
      const pdfDoc = await readPdf(typedArray);
      resolve(pdfDoc);
    };
    fileReader.readAsArrayBuffer(file);
  });
}
