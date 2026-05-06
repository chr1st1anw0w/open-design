import type { ChapterContext, ChapterDef } from '../types';
import { Reveal } from '../../shared/Reveal';
import { SceneFade } from '../../shared/SceneFade';
import './Restraint.css';

/**
 * Chapter 08 · 第五部分：內容克制
 *
 * 口播原順序（嚴格對齊）：
 *   1. "提示詞裡引了喬布斯一句經典的話：'一千個 No 換一個 Yes'。"
 *   2. "AI 做設計有個毛病——恨不得把空間塞滿。"
 *      "Hero、特性、評價、資料、FAQ、聯絡方式…一股腦全上了，但每塊都很平庸。"
 *   3. "Claude Design 的態度很明確：每個元素得證明自己為什麼該在那。"
 *   4. "想加東西？先問使用者。頁面看著空？那是排版的問題，用留白來解決，別靠塞東西。"
 *   5. "一個大膽的留白，比十個湊數的板塊有表現力得多。"
 *
 * 節奏（6 步 / step 0..5）：
 *  0  hero "1000 No · 1 Yes" 大字開場 + Steve Jobs + 原文 prompt(L75)
 *  1  轉場到 AI 落地頁：6 段 section 線框依次出現
 *  2  filler 內容塞滿（"恨不得把空間塞滿"）
 *  3  紅 × 一段段砍掉（"每個元素得證明自己"）
 *  4  留白後中央立原則: "想加？先問。空？用留白" + earn-its-place 提示詞
 *  5  收尾: "一個大膽的留白 > 十個湊數的板塊"
 */

interface Section {
  id: string;
  label: string;
  cn: string;
}

const SECTIONS: Section[] = [
  { id: 'hero',     label: 'HERO',         cn: '主視覺' },
  { id: 'feat',     label: 'FEATURES',     cn: '6 大特性' },
  { id: 'social',   label: 'TESTIMONIALS', cn: '客戶評價' },
  { id: 'data',     label: 'DATA',         cn: '資料展示' },
  { id: 'faq',      label: 'FAQ',          cn: '常見問題' },
  { id: 'contact',  label: 'CONTACT',      cn: '聯絡方式' },
];

function SectionBlock({
  s,
  index,
  filled,
  pruned,
}: {
  s: Section;
  index: number;
  filled: boolean;
  pruned: boolean;
}) {
  return (
    <div
      className={`re__sec ${filled ? 'is-filled' : ''} ${pruned ? 'is-pruned' : ''}`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <div className="re__sec-head">
        <span className="re__sec-num">{String(index + 1).padStart(2, '0')}</span>
        <span className="re__sec-label">{s.label}</span>
        <span className="re__sec-dot" />
        <span className="re__sec-cn">{s.cn}</span>
      </div>
      <div className="re__sec-body">
        {!filled && (
          <>
            <span className="re__sec-bar re__sec-bar--w70" />
            <span className="re__sec-bar re__sec-bar--w50" />
          </>
        )}
        {filled && s.id === 'hero' && (
          <div className="re__filler re__filler--hero">
            <span className="re__filler-h">Build the Future. Today.</span>
            <span className="re__filler-sub">The all-in-one platform for the modern team — fast, simple, powerful.</span>
            <span className="re__filler-cta">Get Started →</span>
          </div>
        )}
        {filled && s.id === 'feat' && (
          <div className="re__filler re__filler--feat">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="re__filler-card">
                <span className="re__filler-card-icon">★</span>
                <span className="re__filler-card-t" />
                <span className="re__filler-card-l" />
              </span>
            ))}
          </div>
        )}
        {filled && s.id === 'social' && (
          <div className="re__filler re__filler--social">
            {[0, 1, 2].map((i) => (
              <span key={i} className="re__filler-quote">
                <span className="re__filler-quote-mark">"</span>
                Best product I've ever used. 10/10.
                <span className="re__filler-quote-by">— User #{i + 1}</span>
              </span>
            ))}
          </div>
        )}
        {filled && s.id === 'data' && (
          <div className="re__filler re__filler--data">
            <span><b>10k+</b> users</span>
            <span><b>99.9%</b> uptime</span>
            <span><b>4.9★</b> rating</span>
            <span><b>+42%</b> growth</span>
          </div>
        )}
        {filled && s.id === 'faq' && (
          <div className="re__filler re__filler--faq">
            <span>＋ How does it work?</span>
            <span>＋ Is there a free trial?</span>
            <span>＋ Can I cancel anytime?</span>
          </div>
        )}
        {filled && s.id === 'contact' && (
          <div className="re__filler re__filler--contact">
            <span className="re__filler-input" />
            <span className="re__filler-input" />
            <span className="re__filler-btn">Send Message</span>
          </div>
        )}
      </div>

      <div className="re__sec-prune" aria-hidden>
        <span className="re__sec-prune-mark">×</span>
        <span className="re__sec-prune-line" />
      </div>
    </div>
  );
}

function Restraint({ localStep }: ChapterContext) {
  const at = (n: number) => localStep >= n;
  void at;

  const sceneJobs   = localStep <= 0;
  const scenePage   = localStep >= 1 && localStep <= 3;
  const scenePrinc  = localStep === 4;
  const sceneClose  = localStep >= 5;

  const filled = localStep >= 2;
  const pruned = localStep >= 3;

  return (
    <section className="re">
      {/* ════════ Scene JOBS（step 0）—— 喬布斯名言開場 ════════ */}
      <SceneFade active={sceneJobs} exitMs={420} enterDelayMs={120}>
        <div className="re__jobs">
          <Reveal kind="fade" duration={780} delay={120} className="re__jobs-by">
            —— STEVE JOBS · 提示詞原文引用
          </Reveal>

          <div className="re__jobs-row">
            <Reveal kind="rise" duration={1100} delay={300} className="re__jobs-num re__jobs-num--no">
              <span className="re__jobs-num-figure">1000</span>
              <span className="re__jobs-num-label">No</span>
            </Reveal>

            <Reveal kind="fade" duration={780} delay={760} className="re__jobs-arrow" as="span">
              換
            </Reveal>

            <Reveal kind="rise" duration={1100} delay={1000} className="re__jobs-num re__jobs-num--yes">
              <span className="re__jobs-num-figure">1</span>
              <span className="re__jobs-num-label">Yes</span>
            </Reveal>
          </div>

          <Reveal kind="fade" duration={780} delay={1500} className="re__jobs-quote" as="p">
            <em>"</em>
            One thousand no's for every yes.
            <em>"</em>
          </Reveal>

          <Reveal kind="rise" duration={780} delay={1900} className="re__jobs-src">
            <span className="re__src-bracket">[</span>
            <span className="re__src-label">SYSTEM PROMPT</span>
            <span className="re__src-sep">·</span>
            <span className="re__src-line">L77</span>
            <span className="re__src-bracket">]</span>
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene PAGE（step 1..3）—— AI 把 6 段塞滿 → 砍 ════════ */}
      <SceneFade active={scenePage} exitMs={420} enterDelayMs={420}>
        <div className="re__page-scene">
          <Reveal kind="fade" duration={620} delay={80} className="re__page-cap">
            <span className="re__page-cap-tag">A TYPICAL "AI" LANDING PAGE</span>
            <span className="re__page-cap-sep">/</span>
            <span className="re__page-cap-text">
              {!filled && 'AI 一上來就把 6 段全擺好了 ——'}
              {filled && !pruned && '然後把每一格都塞滿 ——'}
              {pruned && '一一拷問：你為什麼在這？'}
            </span>
          </Reveal>

          <div className="re__browser">
            <div className="re__browser-bar">
              <span className="re__browser-dot" />
              <span className="re__browser-dot" />
              <span className="re__browser-dot" />
              <span className="re__browser-url">claude-design.demo / fake-landing-page</span>
            </div>
            <div className="re__browser-body">
              <div className="re__page">
                {SECTIONS.map((s, i) => (
                  <SectionBlock
                    key={s.id}
                    s={s}
                    index={i}
                    filled={filled}
                    pruned={pruned}
                  />
                ))}
              </div>
            </div>
          </div>

          {pruned && (
            <Reveal kind="fade" duration={620} delay={620} className="re__page-verdict">
              <span className="re__page-verdict-mark">×</span>
              每一塊都"還行"，加在一起 —— 還是<em>平庸</em>
            </Reveal>
          )}
        </div>
      </SceneFade>

      {/* ════════ Scene PRINCIPLE（step 4）—— 立原則 ════════ */}
      <SceneFade active={scenePrinc} exitMs={420} enterDelayMs={420}>
        <div className="re__princ">
          <Reveal kind="rise" duration={780} delay={80} className="re__princ-head" as="h2">
            Claude Design 的態度 ——
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={360} className="re__princ-line" as="p">
            每個元素，得<em>證明自己</em>為什麼該在那。
          </Reveal>

          <div className="re__princ-rules">
            <Reveal kind="rise" duration={720} delay={760} className="re__princ-rule">
              <span className="re__princ-q">想加東西？</span>
              <span className="re__princ-arrow">→</span>
              <span className="re__princ-a">先問使用者</span>
            </Reveal>
            <Reveal kind="rise" duration={720} delay={1000} className="re__princ-rule">
              <span className="re__princ-q">頁面看著空？</span>
              <span className="re__princ-arrow">→</span>
              <span className="re__princ-a">用<em>留白</em>解決，不是塞內容</span>
            </Reveal>
          </div>

          <Reveal kind="rise" duration={780} delay={1400} className="re__princ-excerpt">
            <div className="re__princ-excerpt-head">
              <span className="re__src-bracket">[</span>
              <span className="re__src-label">SYSTEM PROMPT</span>
              <span className="re__src-sep">·</span>
              <span className="re__src-line">L75</span>
              <span className="re__src-bracket">]</span>
            </div>
            <div className="re__princ-excerpt-body">
              <span className="re__princ-excerpt-gt">&gt;</span>
              <span className="re__princ-excerpt-text">
                Never pad a design with{' '}
                <em>placeholder text, dummy sections</em>{' '}
                just to fill space. <em>Every element should earn its place.</em>
              </span>
            </div>
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene CLOSE（step 5）—— 大膽留白 ════════ */}
      <SceneFade active={sceneClose} exitMs={420} enterDelayMs={420}>
        <div className="re__close">
          <Reveal kind="rise" duration={1300} delay={120} className="re__close-line" as="h1">
            一個大膽的<em>留白</em>，
          </Reveal>

          <Reveal kind="rise" duration={1300} delay={780} className="re__close-line re__close-line--alt" as="h1">
            比十個湊數的板塊更有<em>表現力</em>。
          </Reveal>

          <Reveal kind="fade" duration={780} delay={1700} className="re__close-foot">
            <span>留白</span>
            <span className="re__close-foot-eq">=</span>
            <span>設計</span>
          </Reveal>
        </div>
      </SceneFade>
    </section>
  );
}

const def: ChapterDef = {
  id: 'restraint',
  title: '第五部分 · 內容克制',
  eyebrow: '08',
  steps: 6,
  theme: 'light',
  Component: Restraint,
};

export default def;
