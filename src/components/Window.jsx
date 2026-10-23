import { useRef, useState } from "react";

export default function Window({ title, children, onClose, onMinimize, zIndex, onFocus }) {
  const windowRef = useRef(null);
  const dragRef = useRef(null);
  const [position, setPosition] = useState({ x: 20, y: 20 });
  const [maximized, setMaximized] = useState(false);


  const startDrag = (event) => {
    if (event.target.closest("button")) return;
    if (maximized) return;
    onFocus?.();
    const element = windowRef.current;
    if (!element) return;
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: position.x,
      startY: position.y,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const moveDrag = (event) => {
    if (!dragRef.current || maximized) return;
    const drag = dragRef.current;
    const parent = windowRef.current?.offsetParent;
    const parentWidth = parent?.clientWidth || window.innerWidth;
    const parentHeight = parent?.clientHeight || window.innerHeight;
    const width = windowRef.current?.offsetWidth || 420;
    const height = windowRef.current?.offsetHeight || 260;
    const x = drag.startX + event.clientX - drag.pointerX;
    const y = drag.startY + event.clientY - drag.pointerY;
    setPosition({
      x: Math.min(Math.max(0, x), Math.max(0, parentWidth - Math.min(width, parentWidth))),
      y: Math.min(Math.max(0, y), Math.max(0, parentHeight - Math.min(height, parentHeight))),
    });
  };

  const stopDrag = () => { dragRef.current = null; };

  return (
    <section
      ref={windowRef}
      className={`window${maximized ? " window-maximized" : ""}`}
      style={maximized ? { zIndex } : { top: position.y, left: position.x, zIndex }}
      onPointerDown={onFocus}
      aria-label={`${title} window`}
    >
      <header className="titlebar" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={stopDrag} onPointerCancel={stopDrag}>
        <button type="button" className="window-control close" aria-label={`Close ${title} window`} onPointerDown={(event) => event.stopPropagation()} onClick={onClose} />
        <button type="button" className="window-control min" aria-label={`Minimize ${title} window`} onPointerDown={(event) => event.stopPropagation()} onClick={onMinimize} />
        <button type="button" className="window-control max" aria-label={maximized ? `Restore ${title} window` : `Maximize ${title} window`} onPointerDown={(event) => event.stopPropagation()} onClick={() => { setMaximized((previous) => !previous); onFocus?.(); }} />
        <span className="title">{title.charAt(0).toUpperCase() + title.slice(1)}</span>
      </header>
      <div className="content">{children}</div>
    </section>
  );
}
