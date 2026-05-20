import { useCallback, useEffect, useRef, useState } from 'react';
import { useAssistant } from './assistant-context';
import { AssistantPanel } from './AssistantPanel';

const DEFAULT_WIDTH = 400;
const MIN_WIDTH = 280;
const MIN_HEIGHT = 320;

type Pos = { x: number; y: number };
type Size = { w: number; h: number };

function defaultGeometry(): { pos: Pos; size: Size } {
  const w = DEFAULT_WIDTH;
  const h = Math.round(window.innerHeight * 0.88);
  return {
    pos: { x: window.innerWidth - w - 24, y: Math.round((window.innerHeight - h) / 2) },
    size: { w, h },
  };
}

export function AssistantSidebar() {
  const { open, setOpen } = useAssistant();
  const [pos, setPos] = useState<Pos | null>(null);
  const [size, setSize] = useState<Size | null>(null);

  const dragRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);
  const resizeRef = useRef<{ sx: number; sy: number; ow: number; oh: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    if (open && pos === null) {
      const g = defaultGeometry();
      setPos(g.pos);
      setSize(g.size);
    }
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, setOpen]);

  const onHeaderMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.assistant-float-close')) return;
    const p = pos ?? defaultGeometry().pos;
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: p.x, oy: p.y };
    e.preventDefault();
  }, [pos]);

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    const p = pos ?? defaultGeometry().pos;
    const s = size ?? defaultGeometry().size;
    resizeRef.current = { sx: e.clientX, sy: e.clientY, ow: s.w, oh: s.h, ox: p.x, oy: p.y };
    e.preventDefault();
    e.stopPropagation();
  }, [pos, size]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        const d = dragRef.current;
        setPos({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
      }
      if (resizeRef.current) {
        const r = resizeRef.current;
        const dx = e.clientX - r.sx;
        const dy = e.clientY - r.sy;
        const newW = Math.max(MIN_WIDTH, r.ow - dx);
        const newH = Math.max(MIN_HEIGHT, r.oh - dy);
        setSize({ w: newW, h: newH });
        setPos({ x: r.ox + (r.ow - newW), y: r.oy + (r.oh - newH) });
      }
    };
    const onUp = () => { dragRef.current = null; resizeRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, []);

  if (!open || pos === null || size === null) return null;

  return (
    <div
      className="assistant-float-panel"
      style={{ left: pos.x, top: pos.y, width: size.w, height: size.h }}
      data-testid="assistant-sidebar"
      role="complementary"
      aria-label="Open Design 助理"
    >
      <div className="assistant-float-resize" onMouseDown={onResizeMouseDown} aria-hidden />
      <header className="assistant-float-header" onMouseDown={onHeaderMouseDown}>
        <div className="assistant-float-title">
          <span className="assistant-sidebar-badge">C1</span>
          <span>Open Design 助理</span>
        </div>
        <button
          type="button"
          className="assistant-float-close assistant-sidebar-close"
          aria-label="關閉"
          onClick={() => setOpen(false)}
        >
          ×
        </button>
      </header>
      <div className="assistant-sidebar-body">
        <AssistantPanel />
      </div>
    </div>
  );
}
