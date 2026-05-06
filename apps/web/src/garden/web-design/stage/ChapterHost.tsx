import { useEffect, useRef, useState } from 'react';
import { chapters } from '../chapters';
import { useStep } from '../store/useStep';

/**
 * 裝載當前章節，並處理章節間的極輕交叉轉場。
 * 轉場只在 chapterIndex 切換時發生；同章節內的 step 變化由章節自己負責。
 */
export function ChapterHost() {
  const { chapterIndex, localStep, direction } = useStep();
  const Current = chapters[chapterIndex];
  if (!Current) return null;

  const [renderedIdx, setRenderedIdx] = useState(chapterIndex);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const pendingRef = useRef<number | null>(null);

  useEffect(() => {
    if (chapterIndex === renderedIdx) return;
    pendingRef.current = chapterIndex;
    setPhase('out');
    const t = setTimeout(() => {
      setRenderedIdx(pendingRef.current!);
      setPhase('in');
    }, 220);
    return () => clearTimeout(t);
  }, [chapterIndex, renderedIdx]);

  const Active = chapters[renderedIdx] ?? Current;
  const themeClass = Active.theme === 'ink' ? 'theme-ink' : '';
  const Component = Active.Component;

  return (
    <div
      className={`chapter-host ${themeClass}`}
      data-phase={phase}
      data-chapter-id={Active.id}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--bg)',
        color: 'var(--fg)',
        opacity: phase === 'in' ? 1 : 0,
        transform: phase === 'in' ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 220ms var(--ease-exit), transform 220ms var(--ease-exit), background 480ms var(--ease-enter), color 480ms var(--ease-enter)',
      }}
    >
      <Component
        localStep={renderedIdx === chapterIndex ? localStep : Active.steps - 1}
        steps={Active.steps}
        direction={direction}
      />
    </div>
  );
}
