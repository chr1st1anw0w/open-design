import type { ChapterContext, ChapterDef } from '../types';
import { Reveal } from '../../shared/Reveal';
import { SceneFade } from '../../shared/SceneFade';
import './Verification.css';

/**
 * Chapter 09 · 第六部分：驗證閉環
 *
 * 口播原順序（嚴格對齊）：
 *   1. "第六個點，驗證。"
 *   2. "在開發完成後，它會 Fork 出一個獨立的子 Agent，然後對當前完成的網頁做全面檢查。"
 *   3. "同一個 Agent 檢查自己的輸出的時候，天然會傾向於覺得沒問題。"
 *   4. "換一個全新的上下文，這種'自我感覺良好'就容易被打破。"
 *
 * 原文（L22）：
 *   "Finish: call `done` to surface the file to the user and check it loads cleanly.
 *    If errors, fix and `done` again. If clean, call `fork_verifier_agent`."
 *
 * 節奏（5 步 / step 0..4）：
 *  0  hero · 提示詞原文 (L22) + 大字 "驗證 —— 不信任自己的輸出"
 *  1  主 Agent 節點出現，自帶 self-loop（"我做的沒問題吧？"）→ 標 "確認偏誤"
 *  2  fork → 子 Agent 節點彈出，標 "fresh context"
 *  3  子 Agent 跑 4 項檢查：SCREENSHOT / CONSOLE / LAYOUT / JS PROBE 錯峰打勾
 *  4  收尾大字："換個新腦子 / 才能跳出 自我感覺良好"
 */

interface Check {
  id: string;
  label: string;
  cn: string;
}

const CHECKS: Check[] = [
  { id: 'shot',   label: 'SCREENSHOT',   cn: '截圖比對' },
  { id: 'cons',   label: 'CONSOLE LOGS', cn: '控制台錯誤' },
  { id: 'lay',    label: 'LAYOUT',       cn: '佈局偏移' },
  { id: 'js',     label: 'JS PROBE',     cn: 'DOM 探測' },
];

function Verification({ localStep }: ChapterContext) {
  const at = (n: number) => localStep >= n;

  const sceneIntro  = localStep <= 0;
  const sceneAgent  = localStep === 1;
  const sceneFork   = localStep === 2;
  const sceneCheck  = localStep === 3;
  const sceneClose  = localStep >= 4;

  return (
    <section className="vf">
      {/* ════════ Scene INTRO（step 0）════════ */}
      <SceneFade active={sceneIntro} exitMs={420} enterDelayMs={120}>
        <div className="vf__intro">
          <Reveal kind="fade" duration={620} delay={80} className="vf__intro-tag">
            <span className="vf__src-bracket">[</span>
            <span className="vf__src-label">SYSTEM PROMPT</span>
            <span className="vf__src-sep">·</span>
            <span className="vf__src-line">L22</span>
            <span className="vf__src-bracket">]</span>
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={300} className="vf__intro-code">
            <span className="vf__intro-code-num">5.</span>
            <span className="vf__intro-code-text">
              Finish: call <em className="vf__intro-fn">done</em>.<br />
              If errors, <em>fix</em> and <em className="vf__intro-fn">done</em> again.<br />
              If clean, call <em className="vf__intro-fn">fork_verifier_agent()</em>.
            </span>
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={1700} className="vf__intro-title" as="h1">
            驗證 —— 不信任<em>自己</em>的輸出
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene AGENT（step 1）—— 主 Agent + 自迴圈 ════════ */}
      <SceneFade active={sceneAgent} exitMs={420} enterDelayMs={420}>
        <div className="vf__agent-scene">
          <Reveal kind="fade" duration={620} delay={80} className="vf__agent-cap">
            一個 Agent —— <em>檢查自己</em>會發生什麼？
          </Reveal>

          <div className="vf__board">
            {/* 主 Agent 節點 */}
            <div className="vf__node vf__node--main">
              <div className="vf__node-tag">MAIN AGENT</div>
              <div className="vf__node-title">opus 4.7</div>
              <div className="vf__node-meta">role · designer · L01</div>

              {/* 自迴圈箭頭（SVG） */}
              <svg className="vf__loop" viewBox="0 0 200 200" aria-hidden>
                <defs>
                  <marker
                    id="vf-loop-head"
                    viewBox="0 0 10 10"
                    refX="6" refY="5"
                    markerWidth="8" markerHeight="8"
                    orient="auto-start-reverse"
                  >
                    <path d="M0 0 L10 5 L0 10 Z" fill="var(--accent)" />
                  </marker>
                </defs>
                <circle
                  cx="100" cy="100" r="86"
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  strokeDasharray="6 8"
                  className="vf__loop-ring"
                  markerEnd="url(#vf-loop-head)"
                  pathLength="100"
                  strokeDashoffset="0"
                />
              </svg>

              {/* 自言自語氣泡 */}
              <div className="vf__bubble vf__bubble--self">
                "我做的應該沒問題吧？"
              </div>
            </div>
          </div>

          <Reveal kind="rise" duration={780} delay={1500} className="vf__agent-verdict">
            <span className="vf__agent-verdict-x">×</span>
            天然會傾向於<em>覺得沒問題</em> —— 這就是<em>確認偏誤</em>
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene FORK（step 2）—— fork 出子 Agent ════════ */}
      <SceneFade active={sceneFork} exitMs={420} enterDelayMs={420}>
        <div className="vf__fork-scene">
          <Reveal kind="fade" duration={620} delay={80} className="vf__fork-cap">
            <span className="vf__fork-cap-fn">fork_verifier_agent()</span>
            <span className="vf__fork-cap-arrow">→</span>
            <span>另開一個 <em>新腦子</em></span>
          </Reveal>

          <div className="vf__board vf__board--fork">
            {/* 主 Agent（左側） */}
            <div className="vf__node vf__node--main vf__node--small">
              <div className="vf__node-tag">MAIN AGENT</div>
              <div className="vf__node-title">opus 4.7</div>
              <div className="vf__node-meta">已完成 · 等待審稿</div>
            </div>

            {/* fork 連線 */}
            <svg className="vf__fork-link" viewBox="0 0 600 220" preserveAspectRatio="none">
              <defs>
                <marker
                  id="vf-fork-head"
                  viewBox="0 0 10 10"
                  refX="9" refY="5"
                  markerWidth="10" markerHeight="10"
                  orient="auto"
                >
                  <path d="M0 0 L10 5 L0 10 Z" fill="var(--accent)" />
                </marker>
              </defs>
              {/* 主線 */}
              <path
                d="M0 110 L240 110"
                stroke="var(--line-strong)"
                strokeWidth="2"
                fill="none"
              />
              {/* 分叉線（彈性曲線） */}
              <path
                className="vf__fork-link-branch"
                d="M240 110 C 320 110, 360 40, 580 40"
                stroke="var(--accent)"
                strokeWidth="2.5"
                strokeDasharray="8 6"
                fill="none"
                markerEnd="url(#vf-fork-head)"
              />
              {/* 節點圓點 */}
              <circle cx="240" cy="110" r="6" fill="var(--accent)" />
            </svg>

            {/* 子 Agent（右上） */}
            <div className="vf__node vf__node--verifier">
              <div className="vf__node-tag vf__node-tag--alt">VERIFIER AGENT</div>
              <div className="vf__node-title">subagent · 0x9c</div>
              <div className="vf__node-meta">
                <span className="vf__node-fresh">● fresh context</span>
              </div>
              <div className="vf__node-iframe">
                <span className="vf__node-iframe-bar">
                  <span className="vf__node-iframe-dot" />
                  <span className="vf__node-iframe-dot" />
                  <span className="vf__node-iframe-dot" />
                  <span className="vf__node-iframe-url">about:blank</span>
                </span>
                <span className="vf__node-iframe-body">
                  <span className="vf__node-iframe-flash" />
                </span>
              </div>
            </div>
          </div>

          <Reveal kind="rise" duration={780} delay={1100} className="vf__fork-verdict">
            <em>獨立 iframe</em> · <em>獨立上下文</em> · 跑全面檢查後再回報
          </Reveal>
        </div>
      </SceneFade>

      {/* ════════ Scene CHECK（step 3）—— 子 Agent 跑檢查清單 ════════ */}
      <SceneFade active={sceneCheck} exitMs={420} enterDelayMs={420}>
        <div className="vf__check-scene">
          <Reveal kind="fade" duration={620} delay={80} className="vf__check-cap">
            子 Agent · 全面檢查
          </Reveal>

          <div className="vf__check-panel">
            <div className="vf__check-panel-bar">
              <span className="vf__check-panel-dot" />
              <span className="vf__check-panel-dot" />
              <span className="vf__check-panel-dot" />
              <span className="vf__check-panel-name">verifier · subagent · 0x9c</span>
              <span className="vf__check-panel-status">RUNNING…</span>
            </div>
            <div className="vf__check-list">
              {CHECKS.map((c, i) => (
                <div
                  key={c.id}
                  className={`vf__check-row vf__check-row--${c.id}`}
                  style={{ animationDelay: `${i * 220}ms` }}
                >
                  <span className="vf__check-num">0{i + 1}</span>
                  <span className="vf__check-label">{c.label}</span>
                  <span className="vf__check-cn">/ {c.cn}</span>
                  <span className="vf__check-bar" />
                  <span className="vf__check-mark">
                    <span className="vf__check-mark-spin" />
                    <span className="vf__check-mark-tick">✓</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="vf__check-foot">
              <span className="vf__check-foot-tag vf__check-foot-tag--pass">PASS</span>
              <span>silent on pass · 不打斷主 Agent</span>
            </div>
          </div>
        </div>
      </SceneFade>

      {/* ════════ Scene CLOSE（step 4）════════ */}
      <SceneFade active={sceneClose} exitMs={420} enterDelayMs={420}>
        <div className="vf__close">
          <Reveal kind="rise" duration={1100} delay={120} className="vf__close-l1" as="h1">
            換個<em>新腦子</em>
          </Reveal>
          <Reveal kind="rise" duration={1100} delay={680} className="vf__close-l2" as="h1">
            才能跳出 <em>自我感覺良好</em>
          </Reveal>
          <Reveal kind="fade" duration={780} delay={1500} className="vf__close-cap" as="p">
            AI 也需要審稿人
          </Reveal>
        </div>
      </SceneFade>
    </section>
  );
}

const def: ChapterDef = {
  id: 'verification',
  title: '第六部分 · 驗證閉環',
  eyebrow: '09',
  steps: 5,
  theme: 'ink',
  Component: Verification,
};

export default def;
