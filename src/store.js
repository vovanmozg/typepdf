import { atom } from 'nanostores';

export const stateStore = atom({
  typingHistory: [],
  speed: 0,
  errorCount: 0,
});
