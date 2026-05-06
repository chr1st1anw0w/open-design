import type { ChapterContext, ChapterDef } from '../types';
import { Reveal } from '../../shared/Reveal';
import { SceneFade } from '../../shared/SceneFade';
import './Outro.css';

/**
 * Chapter 14 · Outro · 專案預告 + 三連
 *
 * 口播原順序（嚴格對齊 article/口播稿.md L284-295）：
 *   1. "Skill 的完整程式碼、原始參考的 Claude Design 的提示詞、幾個 DEMO 網站，
 *       我都已經打包到一起開源了。大家需要的可以到簡介和評論區自取。"
 *   2. "最後推薦下我最近在做的 Easy Agent 開源專案。"
 *   3. "做這個專案的目的是 —— 學習 Claude Code 的 Harness 是如何做的，
 *       最終完整跟下來的同學都能具備從零開發企業級 Agent 的能力。"
 *   4. "如果本期教程對你有所幫助，希望得到一個免費的三連 ——"
 *   5. "我們下期見。"
 *
 * 節奏（5 步 / step 0..4）：
 *  0  開源資源卡 · "已打包開源" + 三個內容標籤卡（Skill / Prompt / DEMOs）
 *  1  Easy Agent · 專案大字 hero + 副 "從零復刻 Claude Code · Harness"
 *  2  專案目標 · "完整跟下來 → 企業級 Agent 開發能力"
 *  3  三連 CTA · 自繪幾何 like / star / follow（無 emoji）
 *  4  下期見 · 大字告別
 */

interface Resource {
  id: string;
  num: string;
  name: string;
  cn: string;
  desc: string;
}

const RESOURCES: Resource[] = [
  { id: 'skill',  num: '01', name: 'web-design-engineer',         cn: 'Skill 完整程式碼',  desc: '本期主角 · SKILL.md + references' },
  { id: 'prompt', num: '02', name: 'claude-design / system.md',   cn: '原始參考 Prompt', desc: 'Claude Design 系統提示詞原文 · ≈ 420 行' },
  { id: 'demo',   num: '03', name: 'demos /',                     cn: '幾個 DEMO 網站',  desc: '本期演示用到的所有產物站點' },
];

/* ──────────────────────────────────────────────────────────────────
 * 自繪幾何三連圖示（line-art · 不用 emoji）
 *   - like:   拇指（圓角矩形 + 半圓）
 *   - star:   五角星
 *   - follow: 圓 + 內嵌 +
 * ────────────────────────────────────────────────────────────────── */

function IconLike() {
  return (
    <svg className="ot__icon" viewBox="0 0 64 64" aria-hidden>
      <path
        d="M22 28 L22 56 L46 56 C50 56 52 53 52 50 L54 36 C54.5 33 52.5 31 50 31 L40 31 L42 22 C43 18 41 14 37 14 C35 14 34 15 33 17 L26 28 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect
        x="10" y="28" width="10" height="28"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
    </svg>
  );
}

function IconStar() {
  return (
    <svg className="ot__icon" viewBox="0 0 64 64" aria-hidden>
      <path
        d="M32 8 L40 24 L58 26.5 L45 39 L48 56 L32 47.5 L16 56 L19 39 L6 26.5 L24 24 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconFollow() {
  return (
    <svg className="ot__icon" viewBox="0 0 64 64" aria-hidden>
      <circle
        cx="32" cy="32" r="22"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <path
        d="M32 21 L32 43 M21 32 L43 32"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const TRIPLE = [
  { id: 'like',   icon: <IconLike   />, label: '點贊', mono: 'LIKE'    },
  { id: 'star',   icon: <IconStar   />, label: '收藏', mono: 'COLLECT' },
  { id: 'follow', icon: <IconFollow />, label: '關注', mono: 'FOLLOW'  },
];

function Outro({ localStep }: ChapterContext) {
  const sceneOpen     = localStep <= 0;
  const sceneEasy     = localStep === 1;
  const sceneGoal     = localStep === 2;
  const sceneTriple   = localStep === 3;
  const sceneBye      = localStep >= 4;

  return (
    <section className="ot">
      {/* ════════ Scene OPEN（step 0）—— 開源資源卡 ════════ */}
      <SceneFade active={sceneOpen} exitMs={420} enterDelayMs={120}>
        <div className="ot__open">
          <Reveal kind="fade" duration={620} delay={80} className="ot__open-eyebrow">
            最後 ——
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={300} className="ot__open-title" as="h1">
            <em>已打包開源</em> · 簡介 / 評論區 自取
          </Reveal>

          <div className="ot__open-grid">
            {RESOURCES.map((r, i) => (
              <div
                key={r.id}
                className="ot__open-card"
                style={{ animationDelay: `${700 + i * 160}ms` }}
              >
                <div className="ot__open-card-num">{r.num}</div>
                <div className="ot__open-card-name">{r.name}</div>
                <div className="ot__open-card-cn">{r.cn}</div>
                <div className="ot__open-card-desc">{r.desc}</div>
                <div className="ot__open-card-foot">
                  <span className="ot__open-card-foot-arrow">↗</span>
                  <span className="ot__open-card-foot-text">open</span>
                </div>
              </div>
            ))}
          </div>

          <Reveal kind="fade" duration={780} delay={1500} className="ot__open-foot">
            一鍵打包 —— 不用四處找
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene EASY（step 1）—— Easy Agent 專案預告 ════════ */}
      <SceneFade active={sceneEasy} exitMs={420} enterDelayMs={420}>
        <div className="ot__easy">
          <Reveal kind="fade" duration={620} delay={80} className="ot__easy-eyebrow">
            <span className="ot__src-bracket">[</span>
            <span className="ot__src-label">還在做的 · 開源專案</span>
            <span className="ot__src-bracket">]</span>
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={260} className="ot__easy-pre" as="p">
            最後推薦 ——
          </Reveal>

          <Reveal kind="rise" duration={1300} delay={620} className="ot__easy-name" as="h1">
            <em>Easy Agent</em>
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={1300} className="ot__easy-sub" as="h2">
            從零復刻 Claude Code 的 <em>Harness</em>
          </Reveal>

          <Reveal kind="fade" duration={780} delay={1900} className="ot__easy-meta">
            <span>open source</span>
            <span className="ot__easy-meta-dot" />
            <span>step-by-step</span>
            <span className="ot__easy-meta-dot" />
            <span>企業級 Agent</span>
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene GOAL（step 2）—— 專案目標 ════════ */}
      <SceneFade active={sceneGoal} exitMs={420} enterDelayMs={420}>
        <div className="ot__goal">
          <Reveal kind="fade" duration={620} delay={80} className="ot__goal-eyebrow">
            完整跟下來 ——
          </Reveal>

          <div className="ot__goal-flow">
            <Reveal kind="rise" duration={780} delay={260} className="ot__goal-step ot__goal-step--from">
              <div className="ot__goal-step-tag">YOU · 現在</div>
              <div className="ot__goal-step-line">想 轉 AI Agent 開發</div>
            </Reveal>

            <Reveal kind="fade" duration={780} delay={620} className="ot__goal-arrow" as="span">
              <span className="ot__goal-arrow-line" />
              <span className="ot__goal-arrow-text">Easy Agent</span>
              <span className="ot__goal-arrow-head">→</span>
            </Reveal>

            <Reveal kind="rise" duration={780} delay={900} className="ot__goal-step ot__goal-step--to">
              <div className="ot__goal-step-tag ot__goal-step-tag--alt">YOU · 之後</div>
              <div className="ot__goal-step-line">具備<em>企業級</em> Agent 開發能力</div>
            </Reveal>
          </div>

          <Reveal kind="fade" duration={780} delay={1500} className="ot__goal-foot">
            "AI 轉型 —— <em>不容錯過</em>"
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene TRIPLE（step 3）—— 自繪三連 ════════ */}
      <SceneFade active={sceneTriple} exitMs={420} enterDelayMs={420}>
        <div className="ot__triple">
          <Reveal kind="fade" duration={620} delay={80} className="ot__triple-eyebrow">
            如果本期對你有幫助 ——
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={260} className="ot__triple-title" as="h1">
            希望得到一個 <em>免費的三連</em>
          </Reveal>

          <div className="ot__triple-row">
            {TRIPLE.map((t, i) => (
              <div
                key={t.id}
                className="ot__triple-card"
                style={{ animationDelay: `${600 + i * 200}ms` }}
              >
                <div className="ot__triple-icon-wrap">
                  {t.icon}
                </div>
                <div className="ot__triple-label">{t.label}</div>
                <div className="ot__triple-mono">{t.mono}</div>
              </div>
            ))}
          </div>

          <Reveal kind="fade" duration={780} delay={1700} className="ot__triple-foot">
            後續 —— 持續分享更多<em>有價值的 AI 教程</em>
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene BYE（step 4）—— 下期見 ════════ */}
      <SceneFade active={sceneBye} exitMs={420} enterDelayMs={420}>
        <div className="ot__bye">
          <Reveal kind="fade" duration={780} delay={120} className="ot__bye-eyebrow">
            感謝觀看 ——
          </Reveal>
          <Reveal kind="rise" duration={1300} delay={500} className="ot__bye-line" as="h1">
            我們 <em>下期見</em>
            <span className="ot__bye-arrow">↗</span>
          </Reveal>
          <Reveal kind="fade" duration={780} delay={1500} className="ot__bye-sig">
            <span className="ot__bye-sig-bar" />
            <span className="ot__bye-sig-text">claude-design / web-design-engineer</span>
            <span className="ot__bye-sig-bar" />
          </Reveal>
        </div>
      </SceneFade>
    </section>
  );
}

const def: ChapterDef = {
  id: 'outro',
  title: 'Outro · 專案預告 + 三連',
  eyebrow: '14',
  steps: 5,
  theme: 'light',
  Component: Outro,
};

export default def;
