import React, { createContext, useContext, useState } from 'react';

const ScaleContext = createContext();

export const ScaleProvider = ({ children }) => {
  const [scaleFactor, setScaleFactor] = useState(1);

  const scale = value => value * scaleFactor;

  const setScale = ({ imageWidth, containerWidth }) => {
    setScaleFactor(containerWidth / imageWidth);
  };

  return (
    <ScaleContext.Provider value={{ scale, setScale }}>
      {children}
    </ScaleContext.Provider>
  );
};

export const useScale = () => useContext(ScaleContext);
