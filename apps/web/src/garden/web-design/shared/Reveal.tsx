import { createElement, type CSSProperties, type ReactNode } from 'react';
import './Reveal.css';

type RevealKind =
  | 'rise'      // 預設：下方 24px + opacity
  | 'fall'      // 頂部 -24px + opacity
  | 'fade'      // 僅 opacity
  | 'blur'      // blur 16px → 0
  | 'wipe-r'    // 自左 wipe
  | 'tight'     // letter-spacing 0.4em → 0
  ;

type AsTag = 'div' | 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'em' | 'strong';

interface Props {
  children: ReactNode;
  delay?: number;          // ms
  duration?: number;       // ms，預設 720
  kind?: RevealKind;
  className?: string;
  style?: CSSProperties;
  as?: AsTag;
}

/**
 * 入場動畫包裝 —— 透過 React 條件掛載觸發每次重新進入時重播。
 * 配合上層 `localStep >= n && <Reveal>...</Reveal>` 即可。
 */
export function Reveal({
  children,
  delay = 0,
  duration = 720,
  kind = 'rise',
  className = '',
  style,
  as = 'div',
}: Props) {
  return createElement(
    as,
    {
      className: `reveal reveal--${kind} ${className}`.trim(),
      style: {
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        ...style,
      },
    },
    children,
  );
}
