import './Cursor.css';

export function Cursor({ frame }) {
  if (!frame) {
    return null;
  }

  const topShift = 0;
  const leftShift = (frame.bbox().x1 - frame.bbox().x0) / 5;
  const width = (frame.bbox().x1 - frame.bbox().x0) / 5;

  return (
    <div
      id="cursor"
      style={{
        left: `${frame.bbox().x0 - leftShift}px`,
        top: `${frame.bbox().y0 + topShift}px`,
        height: `${frame.bbox().y1 - frame.bbox().y0}px`,
        width,
      }}></div>
  );
}
