function setCurrentPage(callback) {
  state.currentPage = callback(state);
}

function goToPrevPage() {
  state.setCurrentPage(state =>
    state.currentPage > 1 ? state.currentPage - 1 : state.currentPage,
  );
}

function goToNextPage() {
  state.setCurrentPage(state =>
    state.currentPage < state.pdfDoc.numPages
      ? state.currentPage + 1
      : state.currentPage,
  );
}

export const state = {
  pdfDoc: null,
  currentPage: 1,
  setCurrentPage,
  goToPrevPage,
  goToNextPage,
};
