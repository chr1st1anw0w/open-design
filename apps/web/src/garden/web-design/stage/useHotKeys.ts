import { useEffect } from 'react';
import { stepStore } from '../store/useStep';

/**
 * 全域性快捷鍵 + 點選驅動 step。
 * - 點選 stage 任意空白處：next
 * - Space / →：next
 * - ←：prev
 * - Backspace：歸零（debug）
 * - 1..9：跳到對應章節（章節序號 1-indexed）
 *
 * 進度條 / 任意 [data-no-step] 元素的 click 必須 stopPropagation。
 *
 * 注意：使用 capture 階段監聽 + stopImmediatePropagation，
 * 否則一旦 <video> / <audio> 等媒體元素拿到焦點，原生控制元件會優先吃掉
 * Space / ← / → 等鍵，導致全域性快捷鍵失效。
 */
export function useHotKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 真正的輸入框 / 可編輯區放過
      const tgt = e.target as HTMLElement | null;
      if (
        tgt instanceof HTMLInputElement ||
        tgt instanceof HTMLTextAreaElement ||
        (tgt && (tgt as HTMLElement).isContentEditable)
      ) {
        return;
      }

      let handled = false;

      switch (e.key) {
        case ' ':
        case 'Spacebar':
        case 'Enter':
        case 'ArrowRight':
          stepStore.next();
          handled = true;
          break;
        case 'ArrowLeft':
          stepStore.prev();
          handled = true;
          break;
        case 'Backspace':
          stepStore.goToGlobal(0);
          handled = true;
          break;
        default: {
          if (/^[1-9]$/.test(e.key)) {
            stepStore.goToChapter(parseInt(e.key, 10) - 1);
            handled = true;
          }
        }
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // 關鍵：把焦點從 <video>/<audio> 等媒體元素奪回來，
        // 否則下一次按鍵又會被原生控制元件吃掉。
        if (
          tgt instanceof HTMLVideoElement ||
          tgt instanceof HTMLAudioElement ||
          tgt instanceof HTMLButtonElement
        ) {
          tgt.blur();
        }
      }
    };
    // capture 階段：搶在 video / audio 原生快捷鍵之前
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as EventListenerOptions);
  }, []);
}
