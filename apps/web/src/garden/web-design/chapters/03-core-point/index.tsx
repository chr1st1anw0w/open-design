import type { ChapterContext, ChapterDef } from '../types';
import { Reveal } from '../../shared/Reveal';
import { SceneFade } from '../../shared/SceneFade';
import { NumberTicker } from '../../shared/NumberTicker';
import './CorePoint.css';

/**
 * Chapter 03 · 核心觀點
 *
 * 口播主旨：
 *  「Claude Design 之所以強，一半靠 Opus 4.7，另一半靠精心設計的提示詞。
 *   上線不到 24 小時，完整系統提示詞被扒出來。下面，我們逐條拆解。」
 *
 * 節奏（6 步 / step 0..5）：
 *  0  環境（深墨底 + 網格氛圍，一行小標 eyebrow）
 *  1  hero 問句："Claude Design · 為什麼這麼強？"
 *  2  答案展開：50/50 分屏，左 OPUS 4.7 / 右 SYSTEM PROMPT
 *  3  右側"提示詞從天而降"——真實片段逐條落入檔案預覽
 *  4  leaked 事件徽章："< 24 HOURS · LEAKED"
 *  5  轉場指引："下面，我們逐條拆解 ↓"
 */

const PROMPT_LINES: string[] = [
  'You are an expert designer working with the user as a manager.',
  'You produce design artifacts on behalf of the user using HTML.',
  'HTML is your tool, but your medium and output format vary.',
  'You must embody an expert in that domain:',
  '  animator, UX designer, slide designer, prototyper, etc.',
  'Avoid web design tropes and conventions',
  '  unless you are making a web page.',
  '## Your workflow',
  '1. Understand user needs. Ask clarifying questions ...',
  '2. Explore provided resources. Read the design system ...',
];

function CorePoint({ localStep }: ChapterContext) {
  const at = (n: number) => localStep >= n;

  // 場景：1+ 進入分析；2 之前是單獨 hero 居中
  const sceneHero = localStep <= 1;
  const sceneSplit = localStep >= 2;

  return (
    <section className="cp">
      {/* 裝飾性背景網格 + 角落座標 */}
      <div className="cp__grid" aria-hidden />
      <div className="cp__cornerTL" aria-hidden>
        <span /><span />
      </div>
      <div className="cp__cornerBR" aria-hidden>
        <span /><span />
      </div>

      {/* ───────── Scene HERO（step 0..1）───────── */}
      <SceneFade active={sceneHero} exitMs={420} enterDelayMs={120}>
        <div className="cp__hero">
          <Reveal kind="fade" duration={700} delay={120} className="cp__hero-eyebrow">
            <span className="cp__hero-eyebrow-bar" />
            <span>03 · 核心觀點</span>
            <span className="cp__hero-eyebrow-bar" />
          </Reveal>

          {at(1) && (
            <Reveal kind="rise" duration={1100} delay={80} className="cp__hero-title" as="h1">
              Claude Design<br />
              <em className="cp__hero-em">為什麼這麼強？</em>
            </Reveal>
          )}
        </div>
      </SceneFade>

      {/* ───────── Scene SPLIT（step 2..5）───────── */}
      <SceneFade active={sceneSplit} exitMs={420} enterDelayMs={420}>
        <div className="cp__split">
          {/* 頂部留下問句的小回響（不再是大字） */}
          <Reveal kind="fade" duration={620} delay={120} className="cp__split-eyebrow">
            <span>為什麼這麼強？</span>
            <span className="cp__split-eyebrow-arrow">→</span>
            <span>答案是</span>
          </Reveal>

          {/* 中央分隔線 */}
          <Reveal kind="fade" duration={900} delay={300} className="cp__split-divider">
            <span className="cp__split-divider-line" />
            <span className="cp__split-divider-knob">+</span>
            <span className="cp__split-divider-line" />
          </Reveal>

          <div className="cp__columns">
            {/* —— 左：OPUS 4.7 —— */}
            <Reveal kind="rise" duration={900} delay={420} className="cp__col cp__col--left">
              <div className="cp__col-pct">
                <NumberTicker to={50} duration={1100} decimals={0} />
                <span className="cp__col-pct-sign">%</span>
              </div>
              <div className="cp__col-kicker">MODEL</div>
              <h2 className="cp__col-title">Opus 4.7</h2>
              <p className="cp__col-desc">
                Anthropic 當前旗艦模型 ——<br />
                決策力、品味、長鏈推理與程式碼能力的綜合上限
              </p>

              <div className="cp__col-meter">
                <div className="cp__col-meter-bar" style={{ width: at(2) ? '50%' : '0%' }} />
                <div className="cp__col-meter-ticks">
                  <span /><span /><span /><span /><span />
                </div>
              </div>

              <div className="cp__col-tags">
                <span>reasoning</span>
                <span>taste</span>
                <span>code</span>
              </div>
            </Reveal>

            {/* —— 右：SYSTEM PROMPT —— */}
            <Reveal kind="rise" duration={900} delay={560} className="cp__col cp__col--right">
              <div className="cp__col-pct">
                <NumberTicker to={50} duration={1100} delay={140} decimals={0} />
                <span className="cp__col-pct-sign">%</span>
              </div>
              <div className="cp__col-kicker">SYSTEM PROMPT</div>
              <h2 className="cp__col-title">提示詞工程</h2>
              <p className="cp__col-desc">
                ~420 行專家級 system prompt ——<br />
                對模型的"角色 / 流程 / 邊界 / 品味"做了極強約束
              </p>

              {/* 檔案預覽 */}
              <div className="cp__doc">
                <div className="cp__doc-bar">
                  <span className="cp__doc-bar-dot" />
                  <span className="cp__doc-bar-dot" />
                  <span className="cp__doc-bar-dot" />
                  <span className="cp__doc-bar-name">claude-design.system.md</span>
                </div>
                <div className="cp__doc-body">
                  {at(3) && PROMPT_LINES.map((line, i) => (
                    <Reveal
                      key={`pl-${i}-${localStep}`}
                      kind="fall"
                      duration={520}
                      delay={i * 90}
                      className="cp__doc-line"
                    >
                      <span className="cp__doc-line-no">{String(i + 1).padStart(2, '0')}</span>
                      <span className="cp__doc-line-text">{line}</span>
                    </Reveal>
                  ))}
                  {at(3) && (
                    <Reveal kind="fade" duration={400} delay={PROMPT_LINES.length * 90 + 200}>
                      <span className="cp__doc-cursor">▍</span>
                    </Reveal>
                  )}
                </div>
              </div>
            </Reveal>
          </div>

          {/* leaked 徽章 */}
          {at(4) && (
            <Reveal kind="rise" duration={780} className="cp__leaked">
              <div className="cp__leaked-stamp">
                <span className="cp__leaked-stamp-dot" />
                LEAKED
              </div>
              <div className="cp__leaked-meta">
                <div className="cp__leaked-meta-time">
                  <span className="cp__leaked-meta-lt">&lt;</span>
                  <NumberTicker to={24} duration={900} decimals={0} />
                  <span className="cp__leaked-meta-unit">HOURS</span>
                </div>
                <div className="cp__leaked-meta-text">
                  上線不到 24 小時，完整系統提示詞被扒出，<br />
                  在安全 / 提示詞圈廣為流傳
                </div>
              </div>
            </Reveal>
          )}

          {/* 轉場指引 */}
          {at(5) && (
            <Reveal kind="rise" duration={760} delay={120} className="cp__pivot">
              <span className="cp__pivot-arrow" />
              <span className="cp__pivot-text">下面，我們逐條拆解這套提示詞</span>
            </Reveal>
          )}
        </div>
      </SceneFade>
    </section>
  );
}

const def: ChapterDef = {
  id: 'core-point',
  title: '核心觀點',
  eyebrow: '03',
  steps: 6,
  theme: 'ink',
  Component: CorePoint,
};

export default def;
