import type { ChapterContext, ChapterDef } from '../types';
import { Reveal } from '../../shared/Reveal';
import { SceneFade } from '../../shared/SceneFade';
import './ToSkill.css';

/**
 * Chapter 10 · 過渡到 Skill
 *
 * 口播原順序（嚴格對齊）：
 *   1. "以上就是 Claude Design 提示詞裡最核心的東西。"
 *   2. "但有個現實問題 — Anthropic 的產品在國內用起來都非常的難。"
 *      "我自己被封了三個號，徹底放棄官方渠道了。"
 *      "而且沒有 API，沒法接到自己的工作流裡。"
 *   3. "不過好訊息是：它的提示詞已經洩出來了。
 *       Claude Design 厲害的另一半，主要就這套提示詞裡。"
 *   4. "所以我做了個 Skill，叫 web-design-engineer，
 *       把這套提示詞的精華提煉了出來。"
 *   5. "Claude Code、Cursor、Codex 都能直接用，人人都能成為頂級網頁設計師。"
 *
 * 節奏（6 步 / step 0..5）：
 *  0  回顧："以上 —— 提示詞原文最核心的東西" + 五塊小鉤
 *  1  轉折大字 "但..." + "Anthropic 在國內 —— 難"
 *  2  三張賬號卡片依次倒下 + BANNED 紅章 + "沒 API"小注
 *  3  Pivot："好訊息 —— 提示詞 已經洩出來了"
 *  4  Skill 卡：web-design-engineer 終端式呈現 + 三個適用工具
 *  5  收尾大字 "人人都能成為 頂級網頁設計師"
 */

const RECAP_POINTS = [
  '角色定位',
  '工作流',
  '去 AI 味',
  'oklch 配色',
  '內容克制',
  '驗證閉環',
];

const TOOLS = [
  { id: 'cc', name: 'Claude Code', mono: 'claude.code' },
  { id: 'cu', name: 'Cursor',      mono: 'cursor.sh'   },
  { id: 'cx', name: 'Codex',       mono: 'codex.cli'   },
];

function ToSkill({ localStep }: ChapterContext) {
  const at = (n: number) => localStep >= n;
  void at;

  const sceneRecap   = localStep <= 0;
  const sceneProb    = localStep === 1;
  const sceneBanned  = localStep === 2;
  const scenePivot   = localStep === 3;
  const sceneSkill   = localStep === 4;
  const sceneClose   = localStep >= 5;

  return (
    <section className="ts">
      {/* ════════ Scene RECAP（step 0）════════ */}
      <SceneFade active={sceneRecap} exitMs={420} enterDelayMs={120}>
        <div className="ts__recap">
          <Reveal kind="rise" duration={1100} delay={120} className="ts__recap-title" as="h1">
            以上 —— 提示詞裡<br />
            <em>最核心</em>的東西
          </Reveal>

          <div className="ts__recap-list">
            {RECAP_POINTS.map((p, i) => (
              <div
                key={p}
                className="ts__recap-item"
                style={{ animationDelay: `${640 + i * 120}ms` }}
              >
                <span className="ts__recap-num">0{i + 1}</span>
                <span className="ts__recap-name">{p}</span>
                <span className="ts__recap-tick">✓</span>
              </div>
            ))}
          </div>
        </div>
      </SceneFade>

      {/* ════════ Scene PROBLEM（step 1）—— "但..." ════════ */}
      <SceneFade active={sceneProb} exitMs={420} enterDelayMs={420}>
        <div className="ts__prob">
          <Reveal kind="rise" duration={1100} delay={120} className="ts__prob-but" as="h1">
            但 ——
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={680} className="ts__prob-line" as="h2">
            Anthropic 的產品 ——<br />
            在國內 <em>真的難用</em>
          </Reveal>

          <Reveal kind="fade" duration={780} delay={1500} className="ts__prob-meta">
            <span>無官方支付</span>
            <span className="ts__prob-meta-dot" />
            <span>無 API</span>
            <span className="ts__prob-meta-dot" />
            <span>賬號易被封</span>
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene BANNED（step 2）—— 三張賬號倒下 ════════ */}
      <SceneFade active={sceneBanned} exitMs={420} enterDelayMs={420}>
        <div className="ts__banned-scene">
          <Reveal kind="fade" duration={620} delay={80} className="ts__banned-cap">
            "我自己被封了 <em>三個號</em>，徹底放棄官方渠道了。"
          </Reveal>

          <div className="ts__banned-row">
            {[1, 2, 3].map((n, i) => (
              <div
                key={n}
                className={`ts__card ts__card--n${n}`}
                style={{ animationDelay: `${i * 320 + 380}ms` }}
              >
                <div className="ts__card-bar">
                  <span className="ts__card-bar-dot" />
                  <span className="ts__card-bar-dot" />
                  <span className="ts__card-bar-dot" />
                  <span className="ts__card-bar-name">claude.ai / account</span>
                </div>
                <div className="ts__card-body">
                  <div className="ts__card-avatar">{['F', 'G', 'H'][i]}</div>
                  <div className="ts__card-info">
                    <div className="ts__card-name">花園老師 #{n}</div>
                    <div className="ts__card-mail">flower-{i + 1}@anthropic.user</div>
                    <div className="ts__card-plan">
                      <span className="ts__card-plan-tag">Pro</span>
                      <span>activated · 2026.0{i + 1}</span>
                    </div>
                  </div>
                </div>
                {/* BANNED 印章 */}
                <div className="ts__stamp" aria-hidden>
                  <span className="ts__stamp-text">BANNED</span>
                  <span className="ts__stamp-sub">violation · #{n}</span>
                </div>
              </div>
            ))}
          </div>

          <Reveal kind="fade" duration={780} delay={1700} className="ts__banned-foot">
            <span className="ts__banned-foot-x">×</span>
            而且 —— <em>沒有 API</em>，接不進自己的工作流
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene PIVOT（step 3）—— "好訊息" ════════ */}
      <SceneFade active={scenePivot} exitMs={420} enterDelayMs={420}>
        <div className="ts__pivot">
          <Reveal kind="fade" duration={620} delay={120} className="ts__pivot-eyebrow">
            不過 ——
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={320} className="ts__pivot-good" as="h1">
            <em>好訊息</em>是：
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={920} className="ts__pivot-line" as="h2">
            提示詞 —— <em>已經洩出來了</em>
          </Reveal>

          <Reveal kind="fade" duration={780} delay={1700} className="ts__pivot-cap">
            "Claude Design 厲害的另一半，主要就<em>這套提示詞</em>裡。"
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene SKILL（step 4）—— web-design-engineer ════════ */}
      <SceneFade active={sceneSkill} exitMs={420} enterDelayMs={420}>
        <div className="ts__skill-scene">
          <Reveal kind="fade" duration={620} delay={80} className="ts__skill-eyebrow">
            <span className="ts__src-bracket">[</span>
            <span className="ts__src-label">SKILL · OPEN SOURCE</span>
            <span className="ts__src-bracket">]</span>
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={300} className="ts__skill-card">
            <div className="ts__skill-bar">
              <span className="ts__skill-bar-dot" />
              <span className="ts__skill-bar-dot" />
              <span className="ts__skill-bar-dot" />
              <span className="ts__skill-bar-path">.claude / skills / web-design-engineer / SKILL.md</span>
            </div>
            <div className="ts__skill-body">
              <div className="ts__skill-tag">SKILL.md</div>
              <h2 className="ts__skill-name">web-design-engineer</h2>
              <p className="ts__skill-desc">
                把 Claude Design 提示詞的精華，<br />
                提煉成一個<em>可複用</em>的 Skill
              </p>
              <div className="ts__skill-meta">
                <span>≈ 400 行</span>
                <span className="ts__skill-meta-dot" />
                <span>開源</span>
                <span className="ts__skill-meta-dot" />
                <span>免費</span>
              </div>
            </div>
          </Reveal>

          <Reveal kind="fade" duration={620} delay={1100} className="ts__tools-cap">
            <span>適用於 ——</span>
          </Reveal>

          <div className="ts__tools-row">
            {TOOLS.map((t, i) => (
              <div
                key={t.id}
                className="ts__tool"
                style={{ animationDelay: `${1300 + i * 180}ms` }}
              >
                <div className="ts__tool-glyph">[ {t.id} ]</div>
                <div className="ts__tool-name">{t.name}</div>
                <div className="ts__tool-mono">{t.mono}</div>
              </div>
            ))}
          </div>
        </div>
      </SceneFade>

      {/* ════════ Scene CLOSE（step 5）════════ */}
      <SceneFade active={sceneClose} exitMs={420} enterDelayMs={420}>
        <div className="ts__close">
          <Reveal kind="rise" duration={1100} delay={120} className="ts__close-l1" as="h1">
            人人都能成為
          </Reveal>
          <Reveal kind="rise" duration={1300} delay={760} className="ts__close-l2" as="h1">
            <em>頂級網頁設計師</em>
          </Reveal>
        </div>
      </SceneFade>
    </section>
  );
}

const def: ChapterDef = {
  id: 'to-skill',
  title: '過渡 · Skill 是怎麼來的',
  eyebrow: '10',
  steps: 6,
  theme: 'light',
  Component: ToSkill,
};

export default def;
