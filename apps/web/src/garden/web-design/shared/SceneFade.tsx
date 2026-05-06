import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
  active: boolean;
  /** 退出漸隱時長（ms） */
  exitMs?: number;
  /** 進入前的等待時長，留給上一幕退出（ms） */
  enterDelayMs?: number;
  children: ReactNode;
  className?: string;
}

/**
 * 場景級漸入漸出 + 延遲解除安裝。
 *
 * - active 為 true 時立刻掛載（預設延遲 enterDelayMs 後再淡入），讓上一幕先 fade out
 * - active 為 false 時先淡出 exitMs 再解除安裝
 *
 * 用於章節內多幕之間的優雅切換，避免硬切 / 重疊。
 */
export function SceneFade({
  active,
  exitMs = 360,
  enterDelayMs = 220,
  children,
  className = '',
}: Props) {
  const [mounted, setMounted] = useState(active);
  const [shown, setShown] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (active) {
      setMounted(true);
      // 讓上一幕先開始 fade out，再淡入本幕
      timerRef.current = window.setTimeout(() => setShown(true), enterDelayMs);
    } else {
      setShown(false);
      timerRef.current = window.setTimeout(() => setMounted(false), exitMs);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [active, exitMs, enterDelayMs]);

  if (!mounted) return null;

  return (
    <div
      className={`scene-fade ${className}`}
      data-shown={shown}
      style={{
        position: 'absolute',
        inset: 0,
        opacity: shown ? 1 : 0,
        transition: `opacity ${shown ? enterDelayMs + 80 : exitMs}ms cubic-bezier(.4,0,1,1)`,
        pointerEvents: shown ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}
