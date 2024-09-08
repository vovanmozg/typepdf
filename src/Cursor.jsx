import './Cursor.css';
import { useScale } from './Scaler';

export function Cursor({ frame }) {
  const { scale: s } = useScale();

  if (!frame) {
    return null;
  }

  const topShift = 0;
  const leftShift = (frame.bbox().x1 - frame.bbox().x0) / 5;
  // толщина курсора должна быть постоянной на протяжении строки и равна 1/5 ширины символа
  // нужно поделить ширину строки frame.currentLine на количество символов в строке и на 5
  const width =
    (frame.currentLine.bbox.x1 - frame.currentLine.bbox.x0) /
    frame.currentLine.text.length /
    5;

  return (
    <div
      id="cursor"
      style={{
        left: `${s(frame.bbox().x0 - leftShift)}px`,
        top: `${s(frame.bbox().y0 + topShift)}px`,
        height: `${s(frame.bbox().y1 - frame.bbox().y0)}px`,
        width,
      }}></div>
  );
}
