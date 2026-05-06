import type { ChapterContext, ChapterDef } from '../types';
import { Reveal } from '../../shared/Reveal';
import { SceneFade } from '../../shared/SceneFade';
import './Workflow.css';

/**
 * Chapter 05 · 第二部分：工作流
 *
 * 口播主旨：
 *   - 六步流程：理解需求 → 探索資源 → 制定計劃 → 搭建結構 → 完成驗證 → 極簡總結
 *   - 細節①：什麼時候問 / 什麼時候直接幹 —— 資訊夠就幹，不夠才問
 *       使用者: "做個 PPT"               → AI 先問幾個問題
 *       使用者: "做個 PPT, 工程全員 All Hands, 10 min" → AI 直接動手
 *   - 細節②：極簡總結 —— "Summarize EXTREMELY BRIEFLY"
 *
 * 節奏（7 步 / step 0..6）：
 *  0  環境（eyebrow）
 *  1  原文 prompt block + 六站流水線（空）
 *  2  點亮第 1-3 站（line 推進）
 *  3  點亮第 4-6 站
 *  4  pivot：細節① "何時問 vs 何時幹"
 *  5  雙欄對話氣泡對比
 *  6  細節② "Summarize EXTREMELY BRIEFLY" 原文 + 反例 / 正例對比
 */

interface Station {
  no: string;
  en: string;
  cn: string;
}

const STATIONS: Station[] = [
  { no: '1', en: 'Understand',  cn: '理解需求' },
  { no: '2', en: 'Explore',     cn: '探索資源' },
  { no: '3', en: 'Plan',        cn: '制定計劃' },
  { no: '4', en: 'Build',       cn: '搭建結構' },
  { no: '5', en: 'Verify',      cn: '完成驗證' },
  { no: '6', en: 'Brief',       cn: '極簡總結' },
];

function Workflow({ localStep }: ChapterContext) {
  const at = (n: number) => localStep >= n;

  // —— 三幕 ——
  const scenePipe    = localStep <= 3;
  const sceneDecide  = localStep === 4 || localStep === 5;
  const sceneSummary = localStep >= 6;

  // 流水線點亮進度 0..6
  const litCount = (() => {
    if (localStep < 1) return 0;
    if (localStep === 1) return 0;
    if (localStep === 2) return 3;
    return 6;
  })();
  const linePct = (litCount / 6) * 100;

  return (
    <section className="wf">
      {/* ════════════ Scene PIPELINE（step 0..3）════════════ */}
      <SceneFade active={scenePipe} exitMs={420} enterDelayMs={120}>
        <div className="wf__pipe-scene">
          {at(1) && (
            <Reveal kind="rise" duration={780} delay={80} className="wf__excerpt">
              <div className="wf__excerpt-head">
                <span className="wf__src-bracket">[</span>
                <span className="wf__src-label">SYSTEM PROMPT</span>
                <span className="wf__src-sep">·</span>
                <span className="wf__src-line">L17-23</span>
                <span className="wf__src-sep">/</span>
                <span className="wf__src-mute">原文</span>
                <span className="wf__src-bracket">]</span>
              </div>
              <div className="wf__excerpt-body">
                <div className="wf__excerpt-title">## Your workflow</div>
                <div className="wf__excerpt-list">
                  <span><b>1.</b> Understand user needs ...</span>
                  <span><b>2.</b> Explore provided resources ...</span>
                  <span><b>3.</b> Plan and/or make a todo list.</span>
                  <span><b>4.</b> Build folder structure ...</span>
                  <span><b>5.</b> Finish: call <code>done</code> ...</span>
                  <span><b>6.</b> Summarize <em>EXTREMELY BRIEFLY</em> — caveats and next steps only.</span>
                </div>
              </div>
            </Reveal>
          )}

          {at(1) && (
            <Reveal kind="rise" duration={900} delay={520} className="wf__pipeline">
              {/* 底部基線 */}
              <div className="wf__line">
                <div className="wf__line-fill" style={{ width: `${linePct}%` }} />
              </div>

              {/* 6 站 */}
              <div className="wf__stations">
                {STATIONS.map((s, i) => {
                  const lit = i < litCount;
                  return (
                    <div
                      key={s.no}
                      className={`wf__station ${lit ? 'is-lit' : ''}`}
                      style={{ transitionDelay: `${i * 90}ms` }}
                    >
                      <div className="wf__station-cn">{s.cn}</div>
                      <div className="wf__station-node">
                        <span className="wf__station-no">{s.no}</span>
                        <span className="wf__station-pulse" />
                      </div>
                      <div className="wf__station-en">{s.en}</div>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          )}
        </div>
      </SceneFade>

      {/* ════════════ Scene DECIDE（step 4..5）════════════ */}
      <SceneFade active={sceneDecide} exitMs={420} enterDelayMs={420}>
        <div className="wf__decide-scene">
          <Reveal kind="rise" duration={780} delay={80} className="wf__decide-head">
            <span className="wf__decide-num">細節①</span>
            <h2 className="wf__decide-title">
              什麼時候<em>問</em>？什麼時候<em className="wf__decide-do">直接幹</em>？
            </h2>
            <div className="wf__decide-rule">
              <span className="wf__src-bracket">[</span>
              <span className="wf__src-label">RULE</span>
              <span className="wf__src-bracket">]</span>
              <span className="wf__decide-rule-text">資訊充足就幹 · 資訊不足才問</span>
            </div>
          </Reveal>

          <div className="wf__decide-grid">
            {/* —— 左：模糊請求 → 反覆問 —— */}
            <Reveal kind="rise" duration={780} delay={260} className="wf__chat wf__chat--ask">
              <div className="wf__chat-tag">
                <span className="wf__chat-tag-dot" />
                AMBIGUOUS · 模糊請求
              </div>

              <div className="wf__bubble wf__bubble--user">
                <span className="wf__bubble-meta">USER</span>
                <p>幫我做個 PPT</p>
              </div>

              <div className="wf__bubble wf__bubble--ai">
                <span className="wf__bubble-meta">CLAUDE</span>
                <p>受眾？時長？正式度？品牌？資料有嗎？...</p>
                <div className="wf__qmarks">
                  <span style={{ animationDelay: '0ms'   }}>?</span>
                  <span style={{ animationDelay: '180ms' }}>?</span>
                  <span style={{ animationDelay: '360ms' }}>?</span>
                  <span style={{ animationDelay: '540ms' }}>?</span>
                </div>
              </div>

              <div className="wf__chat-verdict wf__chat-verdict--ask">
                → ASK QUESTIONS
              </div>
            </Reveal>

            {/* —— 中央分隔 —— */}
            <div className="wf__decide-vs">
              <span className="wf__decide-vs-line" />
              <span className="wf__decide-vs-knob">vs</span>
              <span className="wf__decide-vs-line" />
            </div>

            {/* —— 右：詳細請求 → 直接動手 —— */}
            {at(5) && (
              <Reveal kind="rise" duration={780} delay={120} className="wf__chat wf__chat--do">
                <div className="wf__chat-tag">
                  <span className="wf__chat-tag-dot wf__chat-tag-dot--do" />
                  ENOUGH INFO · 資訊夠
                </div>

                <div className="wf__bubble wf__bubble--user">
                  <span className="wf__bubble-meta">USER</span>
                  <p>幫我做個 PPT，工程全員 All Hands，10&nbsp;分鐘</p>
                </div>

                <div className="wf__bubble wf__bubble--ai">
                  <span className="wf__bubble-meta">CLAUDE</span>
                  <p>好的，開始 ——</p>
                  <div className="wf__action">
                    <span className="wf__action-bar" />
                    <span className="wf__action-bar" />
                    <span className="wf__action-bar" />
                  </div>
                </div>

                <div className="wf__chat-verdict wf__chat-verdict--do">
                  → NO QUESTIONS · GO BUILD
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </SceneFade>

      {/* ════════════ Scene SUMMARY（step 6）════════════ */}
      <SceneFade active={sceneSummary} exitMs={420} enterDelayMs={420}>
        <div className="wf__sum-scene">
          <Reveal kind="fade" duration={620} delay={80} className="wf__sum-num">
            細節②
          </Reveal>

          <Reveal kind="rise" duration={1100} delay={180} className="wf__sum-hero" as="h1">
            <span className="wf__sum-hero-en">Summarize <em>EXTREMELY BRIEFLY</em></span>
            <span className="wf__sum-hero-cn">只說 <em>注意事項</em> 與 <em>下一步</em>。</span>
          </Reveal>

          <Reveal kind="rise" duration={780} delay={520} className="wf__sum-source">
            <span className="wf__src-bracket">[</span>
            <span className="wf__src-label">SYSTEM PROMPT</span>
            <span className="wf__src-sep">·</span>
            <span className="wf__src-line">L23</span>
            <span className="wf__src-bracket">]</span>
            <span className="wf__sum-source-quote">
              &ldquo;Summarize EXTREMELY BRIEFLY — caveats and next steps only.&rdquo;
            </span>
          </Reveal>

          <Reveal kind="rise" duration={780} delay={760} className="wf__sum-grid">
            {/* 反例 */}
            <div className="wf__sum-card wf__sum-card--bad">
              <div className="wf__sum-card-tag">
                <span className="wf__sum-x">×</span> 複述自己幹了什麼
              </div>
              <div className="wf__sum-card-body">
                我先建立了 <s>Header.tsx</s>，然後又新增了 <s>Hero.tsx</s>，
                接著把樣式拆分到 <s>theme.ts</s>，又給按鈕加了 hover ...
              </div>
              <div className="wf__sum-strike" />
            </div>

            {/* 正例 */}
            <div className="wf__sum-card wf__sum-card--good">
              <div className="wf__sum-card-tag">
                <span className="wf__sum-check">✓</span> 注意事項 + 下一步
              </div>
              <div className="wf__sum-card-body">
                <p><b>caveats</b> — 暫未做響應式 / 文案為佔位</p>
                <p><b>next</b> — 加 hover 狀態 / 替換真實文案</p>
              </div>
            </div>
          </Reveal>
        </div>
      </SceneFade>
    </section>
  );
}

const def: ChapterDef = {
  id: 'workflow',
  title: '第二部分 · 工作流',
  eyebrow: '05',
  steps: 7,
  theme: 'ink',
  Component: Workflow,
};

export default def;
