import type { ChapterContext, ChapterDef } from '../types';
import { Reveal } from '../../shared/Reveal';
import { SceneFade } from '../../shared/SceneFade';
import './Role.css';

/**
 * Chapter 04 · 第一部分：角色定位
 *
 * 口播主旨：
 *   "你是一個專家設計師，使用者是你的產品經理。"
 *   - 不說 "AI 助手"，說 designer / manager 關係 → 決策果斷 + 關鍵徵詢
 *   - 而且角色還會變：動畫時 = Motion Designer；原型時 = UX Designer；幻燈時 = Deck Designer
 *   - 好的角色定位 = 動態的
 *
 * 節奏（8 步 / step 0..7）：
 *  0  環境（eyebrow）
 *  1  hero 引文（英文 italic + 中文）
 *  2  關鍵詞高亮（designer / manager 圈出）
 *  3  雙 benefit 卡片（果斷 / 徵詢）
 *  4  名片切到 Motion Designer
 *  5  → UX Designer
 *  6  → Deck Designer
 *  7  收尾：三張名片並列 + 結論"好的角色定位 · 是動態的"
 */

interface Role {
  id: string;
  en: string;
  cn: string;
  ctx: string;
  ctxEn: string;
  icon: 'motion' | 'ux' | 'deck';
}

const ROLES: Role[] = [
  { id: 'motion', en: 'Motion Designer',  cn: '動效設計師',   ctx: '做動畫時',     ctxEn: 'when animating',     icon: 'motion' },
  { id: 'ux',     en: 'UX Designer',      cn: 'UX 設計師',    ctx: '做原型時',     ctxEn: 'when prototyping',   icon: 'ux'     },
  { id: 'deck',   en: 'Deck Designer',    cn: 'Deck 設計師',  ctx: '做幻燈片時',   ctxEn: 'when decking',       icon: 'deck'   },
];

function RoleIcon({ kind }: { kind: Role['icon'] }) {
  switch (kind) {
    case 'motion':
      return (
        <svg viewBox="0 0 60 60" className="role__icon">
          <circle cx="14" cy="30" r="6" fill="currentColor" opacity="0.25" />
          <circle cx="30" cy="30" r="6" fill="currentColor" opacity="0.55" />
          <circle cx="46" cy="30" r="6" fill="currentColor" opacity="1" />
          <path d="M6 44 Q30 4 54 44" stroke="currentColor" fill="none" strokeWidth="1.2" opacity="0.6" />
        </svg>
      );
    case 'ux':
      return (
        <svg viewBox="0 0 60 60" className="role__icon">
          <rect x="6"  y="10" width="22" height="14" stroke="currentColor" fill="none" strokeWidth="1.2" />
          <rect x="32" y="10" width="22" height="34" stroke="currentColor" fill="none" strokeWidth="1.2" />
          <rect x="6"  y="28" width="22" height="22" stroke="currentColor" fill="none" strokeWidth="1.2" />
          <path d="M16 18 H22 M40 18 H48 M16 36 H22" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case 'deck':
      return (
        <svg viewBox="0 0 60 60" className="role__icon">
          <rect x="6" y="14" width="48" height="32" stroke="currentColor" fill="none" strokeWidth="1.2" />
          <path d="M14 24 H40 M14 32 H32 M14 40 H26" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="46" cy="38" r="3" fill="currentColor" />
        </svg>
      );
  }
}

function RoleCard({ role, size = 'lg' }: { role: Role; size?: 'lg' | 'sm' }) {
  return (
    <div className={`role__card role__card--${size}`}>
      <div className="role__card-strip">
        <span>ROLE / {role.id.toUpperCase()}</span>
        <span className="role__card-strip-dot" />
        <span>WHEN ACTIVE</span>
      </div>

      <div className="role__card-body">
        <div className="role__card-meta">
          <RoleIcon kind={role.icon} />
        </div>
        <div className="role__card-text">
          <div className="role__card-en">{role.en}</div>
          <div className="role__card-cn">{role.cn}</div>
        </div>
      </div>

      <div className="role__card-foot">
        <span className="role__card-ctx">{role.ctx}</span>
        <span className="role__card-ctx-en">{role.ctxEn}</span>
      </div>

      <span className="role__card-corner role__card-corner--tl" />
      <span className="role__card-corner role__card-corner--tr" />
      <span className="role__card-corner role__card-corner--bl" />
      <span className="role__card-corner role__card-corner--br" />
    </div>
  );
}

function Role({ localStep }: ChapterContext) {
  const at = (n: number) => localStep >= n;

  // 三幕：引文 / 單卡片切換 / 收尾全卡
  const sceneQuote = localStep <= 3;
  const sceneFlip  = localStep >= 4 && localStep <= 6;
  const sceneAll   = localStep >= 7;

  const roleIndex = Math.min(2, Math.max(0, localStep - 4));

  return (
    <section className="role">
      {/* ═════════ Scene QUOTE（step 0..3）═════════ */}
      <SceneFade active={sceneQuote} exitMs={420} enterDelayMs={120}>
        <div className="role__quote-scene">
          {at(1) && (
            <Reveal kind="fade" duration={620} delay={80} className="role__src">
              <span className="role__src-bracket">[</span>
              <span className="role__src-label">SYSTEM PROMPT</span>
              <span className="role__src-sep">·</span>
              <span className="role__src-line">L01</span>
              <span className="role__src-sep">/</span>
              <span className="role__src-mute">原文</span>
              <span className="role__src-bracket">]</span>
            </Reveal>
          )}

          {at(1) && (
            <Reveal kind="rise" duration={1100} delay={180} className="role__quote-en" as="p">
              <span className="role__quote-marks">"</span>
              You are an expert{' '}
              <em className={`role__quote-keyword ${at(2) ? 'is-marked' : ''}`}>
                designer
                <span className="role__quote-mark" />
              </em>
              , working with the user as a{' '}
              <em className={`role__quote-keyword role__quote-keyword--alt ${at(2) ? 'is-marked' : ''}`}>
                manager
                <span className="role__quote-mark" />
              </em>
              .
              <span className="role__quote-marks">"</span>
            </Reveal>
          )}

          {at(1) && (
            <Reveal kind="rise" duration={900} delay={420} className="role__quote-cn" as="p">
              <span>你是一個專家</span>
              <span className={`role__quote-cn-key ${at(2) ? 'is-marked' : ''}`}>設計師</span>
              <span> ——  而使用者，是你的</span>
              <span className={`role__quote-cn-key role__quote-cn-key--alt ${at(2) ? 'is-marked' : ''}`}>產品經理</span>
              <span>。</span>
            </Reveal>
          )}

          {at(2) && (
            <Reveal kind="fade" duration={620} delay={120} className="role__quote-note">
              注意 —— 這裡 <u>沒有</u> 說 "你是一個 AI 助手"
            </Reveal>
          )}

          {at(3) && (
            <div className="role__benefits">
              <Reveal kind="rise" duration={780} delay={80} className="role__benefit">
                <div className="role__benefit-num">A</div>
                <div className="role__benefit-title">決策更果斷</div>
                <div className="role__benefit-desc">
                  設計師本就該有判斷力 —— AI 不再事事徵詢，<br />
                  能直接拍板的，自己拍。
                </div>
              </Reveal>

              <Reveal kind="rise" duration={780} delay={220} className="role__benefit">
                <div className="role__benefit-num">B</div>
                <div className="role__benefit-title">關鍵節點 · 請示你</div>
                <div className="role__benefit-desc">
                  因為你是 PM —— 在方向 / 取捨 / 命名這種<br />
                  關鍵節點上，最終還是你說了算。
                </div>
              </Reveal>
            </div>
          )}
        </div>
      </SceneFade>

      {/* ═════════ Scene FLIP（step 4..6）═════════ */}
      <SceneFade active={sceneFlip} exitMs={420} enterDelayMs={420}>
        <div className="role__flip-scene">
          {/* 原文參考塊 —— 來自系統提示詞 L04 */}
          <Reveal kind="rise" duration={780} delay={80} className="role__excerpt">
            <div className="role__excerpt-head">
              <span className="role__src-bracket">[</span>
              <span className="role__src-label">SYSTEM PROMPT</span>
              <span className="role__src-sep">·</span>
              <span className="role__src-line">L04</span>
              <span className="role__src-sep">/</span>
              <span className="role__src-mute">緊接下一句</span>
              <span className="role__src-bracket">]</span>
            </div>
            <div className="role__excerpt-body">
              <span className="role__excerpt-gt">&gt;</span>
              <span className="role__excerpt-text">
                HTML is your tool, but your{' '}
                <em className="role__excerpt-em">medium and output format vary</em>.<br />
                You must <em className="role__excerpt-em">embody an expert</em> in that domain:{' '}
                <span className="role__excerpt-list">
                  animator, UX designer, slide designer, prototyper, etc.
                </span>
              </span>
            </div>
          </Reveal>

          <Reveal kind="fade" duration={520} delay={520} className="role__flip-eyebrow">
            <span className="role__flip-eyebrow-arrow">↓</span>
            <span>翻成大白話 ——</span>
            <span className="role__flip-eyebrow-em">角色，還會變</span>
          </Reveal>

          {/* 名片"翻牌"窗 */}
          <div className="role__flip-window">
            {ROLES.map((r, i) => {
              const state = i === roleIndex
                ? 'current'
                : i < roleIndex ? 'prev' : 'next';
              return (
                <div
                  key={r.id}
                  className="role__flip-slot"
                  data-state={state}
                >
                  <RoleCard role={r} size="lg" />
                </div>
              );
            })}
          </div>

          {/* 步進刻度 */}
          <div className="role__flip-ticks">
            {ROLES.map((r, i) => (
              <div
                key={r.id}
                className={`role__flip-tick ${i === roleIndex ? 'is-active' : ''}`}
              >
                <span className="role__flip-tick-num">0{i + 1}</span>
                <span className="role__flip-tick-name">{r.cn}</span>
              </div>
            ))}
          </div>
        </div>
      </SceneFade>

      {/* ═════════ Scene ALL（step 7）═════════ */}
      <SceneFade active={sceneAll} exitMs={420} enterDelayMs={420}>
        <div className="role__all-scene">
          <Reveal kind="rise" duration={780} delay={120} className="role__all-row">
            {ROLES.map((r, i) => (
              <div
                key={r.id}
                className="role__all-slot"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <RoleCard role={r} size="sm" />
              </div>
            ))}
          </Reveal>

          <Reveal kind="rise" duration={900} delay={520} className="role__all-takeaway" as="h2">
            好的角色定位 ——<br />
            <em>不是固定的，而是 <span className="role__all-em">動態</span> 的。</em>
          </Reveal>

          <Reveal kind="fade" duration={620} delay={900} className="role__all-foot">
            <span>不會用做網頁的腦子做 PPT</span>
            <span className="role__all-foot-dot" />
            <span>不會給動畫加頁尾</span>
            <span className="role__all-foot-dot" />
            <span>不會給幻燈片加導航欄</span>
          </Reveal>
        </div>
      </SceneFade>
    </section>
  );
}

const def: ChapterDef = {
  id: 'role',
  title: '第一部分 · 角色定位',
  eyebrow: '04',
  steps: 8,
  theme: 'light',
  Component: Role,
};

export default def;
