import { useEffect } from 'react';

const useDocumentKeyPress = callback => {
  useEffect(() => {
    const handleKeyPress = event => {
      callback(event);
    };

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [callback]);
};

export default useDocumentKeyPress;
