/**
 * narration_stage.jsx · 解說驅動 Stage
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  🛑 用這套工具之前必讀：references/voiceover-pipeline.md         ║
 * ║                                                                  ║
 * ║  鐵律 #1: 整片是一個連續的運動敘事，不是一組獨立場景             ║
 * ║          You are not making 7 slides. You are directing 1 movie. ║
 * ║                                                                  ║
 * ║  鐵律 #2: 選定 hero element 跨 scene 持續存在，不要每段一個新佈局║
 * ║                                                                  ║
 * ║  鐵律 #3: scene 之間禁止硬切（opacity 1→0/0→1）                  ║
 * ║          要 morph，不要 cut                                      ║
 * ║                                                                  ║
 * ║  失敗模式 #1（本 skill v1 實戰踩坑）：                           ║
 * ║          每個 Scene 各自獨立 layout + cue 用 fade-up + scene 切換║
 * ║          整頁 opacity 切換 = 帶配音的 PowerPoint = 質感歸零       ║
 * ║                                                                  ║
 * ║  正確做法：把 hero 直接放在 <NarrationStage> 子級（不進 Scene）  ║
 * ║          用 useNarration() 在 hero 裡讀 time/scene/cue 狀態      ║
 * ║          hero 自己根據當前時間決定形態 → 跨 scene 連續運動       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * 用法（inline 進 HTML 的 <script type="text/babel">）：
 *   const { NarrationStage, Scene, Cue, useNarration } = NarrationStageLib;
 *
 *   const App = () => (
 *     <NarrationStage timeline={TIMELINE} audioSrc="voiceover.mp3"
 *                     width={1920} height={1080}>
 *       <Scene id="intro">
 *         <h1>什麼是 token</h1>
 *         <Cue id="question">
 *           {(triggered) => triggered && <p>↑ 這是問題</p>}
 *         </Cue>
 *       </Scene>
 *       <Scene id="token-2">
 *         <Cue id="split">
 *           {(triggered, progress) => (
 *             <div style={{opacity: triggered ? 1 : 0.3}}>...</div>
 *           )}
 *         </Cue>
 *       </Scene>
 *     </NarrationStage>
 *   );
 *
 * 時間源（自動二選一）：
 *   - 錄影片模式（window.__recording === true）：走 window.__time（外部 driver 推幀）
 *   - 實播模式：走 <audio> 的 currentTime（使用者點播放時和音訊嚴格同步）
 *
 * 與 render-video.js 相容：
 *   - tick 第一幀設 window.__ready = true
 *   - 錄影片時檢測 window.__recording 強制不播 audio、用 window.__time
 *   - 暴露 window.__totalDuration 給 driver 算總幀數
 *
 * 依賴：React 18 + ReactDOM 18 + Babel standalone（同 animations.jsx）
 */

const NarrationStageLib = (() => {
  const NarrationContext = React.createContext({
    time: 0,
    scene: null,
    sceneTime: 0,
    isCueTriggered: () => false,
    cueProgress: () => 0,
  });

  /**
   * 主元件：吃 timeline + audio，提供 context
   *
   * Props:
   *   timeline       timeline.json 物件（必需）
   *   audioSrc       voiceover.mp3 路徑（必需）
   *   width/height   Stage 尺寸，預設 1920x1080
   *   background     預設 '#0e0e0e'
   *   controls       是否顯示底部播放條，預設 true
   *   children       動畫內容（用 <Scene>/<Cue> 組織）
   */
  function NarrationStage({
    timeline,
    audioSrc,
    width = 1920,
    height = 1080,
    background = '#0e0e0e',
    controls = true,
    children,
  }) {
    const audioRef = React.useRef(null);
    const [time, setTime] = React.useState(0);
    const [playing, setPlaying] = React.useState(false);
    const recording = typeof window !== 'undefined' && window.__recording === true;

    // 暴露給 render-video.js
    React.useEffect(() => {
      if (typeof window === 'undefined') return;
      window.__totalDuration = timeline.totalDuration;
      window.__ready = true;
    }, [timeline.totalDuration]);

    // 時間 tick
    React.useEffect(() => {
      let raf;
      if (recording) {
        // 錄影片模式：rAF wall-clock 自驅動從 0 開始
        // 相容 render-video.js（它依賴動畫自然推進 + window.__seek 復位）
        let startedAt = null;
        const tick = (now) => {
          if (startedAt === null) startedAt = now;
          setTime(Math.min((now - startedAt) / 1000, timeline.totalDuration));
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        // 暴露 __seek 給 render-video.js 在 ready 後調 __seek(0) 復位
        if (typeof window !== 'undefined') {
          window.__seek = (t) => {
            startedAt = performance.now() - t * 1000;
            setTime(t);
          };
        }
      } else {
        // 實播模式：跟隨 audio.currentTime
        const tick = () => {
          if (audioRef.current && !audioRef.current.paused) {
            setTime(audioRef.current.currentTime);
          }
          raf = requestAnimationFrame(tick);
        };
        tick();
      }
      return () => cancelAnimationFrame(raf);
    }, [recording, timeline.totalDuration]);

    // 當前 scene
    const currentScene = React.useMemo(() => {
      if (!timeline.scenes) return null;
      // 找到 start <= time < end 的段。最後一段保留到 end
      for (let i = 0; i < timeline.scenes.length; i++) {
        const s = timeline.scenes[i];
        const next = timeline.scenes[i + 1];
        if (time >= s.start && (!next || time < next.start)) return s;
      }
      return timeline.scenes[0];
    }, [time, timeline.scenes]);

    const sceneTime = currentScene ? Math.max(0, time - currentScene.start) : 0;

    // 找 cue 狀態（按 absoluteTime 比較，跨 scene 也能查）
    const allCues = React.useMemo(() => {
      const map = {};
      for (const s of timeline.scenes || []) {
        for (const c of s.cues || []) {
          map[c.id] = c;
        }
      }
      return map;
    }, [timeline.scenes]);

    const isCueTriggered = React.useCallback(
      (cueId) => {
        const c = allCues[cueId];
        if (!c) return false;
        return time >= c.absoluteTime;
      },
      [allCues, time],
    );

    /** 觸發後多少秒 0→1，>1 後保持 1。用於 cue 後做漸入動畫 */
    const cueProgress = React.useCallback(
      (cueId, ramp = 0.5) => {
        const c = allCues[cueId];
        if (!c) return 0;
        const dt = time - c.absoluteTime;
        if (dt <= 0) return 0;
        if (dt >= ramp) return 1;
        return dt / ramp;
      },
      [allCues, time],
    );

    const ctx = { time, scene: currentScene, sceneTime, isCueTriggered, cueProgress, timeline };

    // play/pause/seek 控制
    const handlePlayPause = () => {
      if (!audioRef.current) return;
      if (audioRef.current.paused) {
        audioRef.current.play();
        setPlaying(true);
      } else {
        audioRef.current.pause();
        setPlaying(false);
      }
    };

    const handleSeek = (e) => {
      if (!audioRef.current) return;
      const t = parseFloat(e.target.value);
      audioRef.current.currentTime = t;
      setTime(t);
    };

    const handleAudioEnded = () => setPlaying(false);

    return (
      <NarrationContext.Provider value={ctx}>
        <div
          style={{
            position: 'relative',
            width,
            height,
            background,
            overflow: 'hidden',
            color: '#fff',
            fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif',
          }}
        >
          {children}
        </div>
        {!recording && (
          <audio
            ref={audioRef}
            src={audioSrc}
            preload="auto"
            onEnded={handleAudioEnded}
          />
        )}
        {!recording && controls && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              background: '#1a1a1a',
              color: '#ddd',
              fontFamily: 'monospace',
              fontSize: 13,
              width,
              boxSizing: 'border-box',
            }}
          >
            <button
              onClick={handlePlayPause}
              style={{
                padding: '6px 14px',
                background: '#fff',
                color: '#000',
                border: 0,
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              {playing ? '❚❚ Pause' : '▶ Play'}
            </button>
            <input
              type="range"
              min={0}
              max={timeline.totalDuration}
              step={0.01}
              value={time}
              onChange={handleSeek}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 110, textAlign: 'right' }}>
              {time.toFixed(2)} / {timeline.totalDuration.toFixed(2)}s
            </span>
            <span
              style={{
                padding: '4px 10px',
                background: '#2a2a2a',
                borderRadius: 4,
                minWidth: 100,
                textAlign: 'center',
              }}
            >
              {currentScene ? currentScene.id : '—'}
            </span>
          </div>
        )}
      </NarrationContext.Provider>
    );
  }

  /**
   * Scene 包裹器：只在指定 scene id 啟用時渲染 children
   *
   * Props:
   *   id        scene id（對應 timeline.scenes[].id）
   *   children  渲染內容；可以是 ReactNode 或 (sceneTime, sceneInfo) => ReactNode
   *   keepMounted 預設 false。設 true 則一直掛載只切換 visibility（動畫連貫需要時用）
   */
  function Scene({ id, children, keepMounted = false }) {
    const { scene, sceneTime } = React.useContext(NarrationContext);
    const isActive = scene && scene.id === id;
    if (!isActive && !keepMounted) return null;
    const content = typeof children === 'function' ? children(sceneTime, scene) : children;
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: isActive ? 1 : 0,
          pointerEvents: isActive ? 'auto' : 'none',
          transition: keepMounted ? 'opacity 0.2s' : undefined,
        }}
      >
        {content}
      </div>
    );
  }

  /**
   * Cue 包裹器：監聽 cue 觸發狀態
   *
   * Props:
   *   id        cue id（對應 timeline.scenes[].cues[].id）
   *   ramp      cue 觸發後 progress 0→1 的 ramp 時長（秒），預設 0.5
   *   children  必須是函式：(triggered: bool, progress: 0-1) => ReactNode
   */
  function Cue({ id, ramp = 0.5, children }) {
    const { isCueTriggered, cueProgress } = React.useContext(NarrationContext);
    const triggered = isCueTriggered(id);
    const progress = cueProgress(id, ramp);
    return children(triggered, progress);
  }

  /** Hook：在自定義元件裡直接拿 narration 狀態 */
  function useNarration() {
    return React.useContext(NarrationContext);
  }

  /**
   * splitChunkToLines · 把一段文字按標點切成 ≤maxLen 字的短行
   *
   * 用於字幕顯示——B 站標準是單行 ≤12 字便於閱讀。本函式：
   * 1. 先按強標點（。！？\n）切句，絕不跨句號截斷
   * 2. 每句 ≤ maxLen 直接用，否則按弱標點（，、；：）切片合併
   * 3. 中英混合：英文/數字按 0.5 字算視覺寬度
   * 4. 兜底硬切（罕見：單個標點段超 maxLen）
   *
   * @param text   原文
   * @param maxLen 單行最大視覺長度，預設 13（≈12 字 + 一個標點）
   * @returns 切好的字幕行陣列
   */
  function visualLen(s) {
    let n = 0;
    for (const ch of s) n += /[a-zA-Z0-9 .,'":;\-]/.test(ch) ? 0.5 : 1;
    return n;
  }
  function splitChunkToLines(text, maxLen = 13) {
    const lines = [];
    const sentences = [];
    let buf = '';
    for (const ch of text) {
      buf += ch;
      if ('。！？\n'.includes(ch)) { if (buf.trim()) sentences.push(buf.trim()); buf = ''; }
    }
    if (buf.trim()) sentences.push(buf.trim());
    for (const sent of sentences) {
      if (visualLen(sent) <= maxLen) { lines.push(sent); continue; }
      const parts = [];
      let pbuf = '';
      for (const ch of sent) {
        pbuf += ch;
        if ('，、；：'.includes(ch)) { parts.push(pbuf); pbuf = ''; }
      }
      if (pbuf) parts.push(pbuf);
      let merged = '';
      for (const p of parts) {
        if (visualLen(merged) + visualLen(p) <= maxLen) merged += p;
        else { if (merged) lines.push(merged); merged = p; }
      }
      if (merged) {
        if (visualLen(merged) <= maxLen) lines.push(merged);
        else {
          let hbuf = '';
          for (const ch of merged) { hbuf += ch; if (visualLen(hbuf) >= maxLen) { lines.push(hbuf); hbuf = ''; } }
          if (hbuf) lines.push(hbuf);
        }
      }
    }
    return lines.filter(l => l.trim());
  }

  /**
   * Subtitles · B 站風格字幕元件（白光暈深墨字，無背景，按 chunks 時間顯示）
   *
   * 自動從當前 scene.chunks 取活動 chunk，按 splitChunkToLines 切成短行，
   * 按字數比例分配 chunk 時間窗給每行顯示。
   *
   * 必需：timeline.scenes[].chunks[]（narrate-pipeline.mjs 已預設輸出）
   *
   * Props（可覆蓋預設樣式）：
   *   bottom    距底部畫素，預設 90（不貼邊）
   *   fontSize  字號，預設 32
   *   color     字色，預設深墨 #1a1a1a（適合淺紙白底）
   *   haloColor 光暈色，預設 rgba(245,241,232,0.9)（適合 #f5f1e8 底）
   *   maxLen    單行最大視覺長度，預設 13
   *
   * 深底場景：把 color 改成 '#fff'，haloColor 改成 'rgba(0,0,0,0.85)' 即可。
   */
  function Subtitles({ bottom = 90, fontSize = 32, color = '#1a1a1a', haloColor = 'rgba(245,241,232,0.9)', maxLen = 13 } = {}) {
    const { time, scene } = React.useContext(NarrationContext);
    if (!scene || !scene.chunks) return null;
    const active = scene.chunks.find(c => time >= c.absoluteStart && time < c.absoluteEnd);
    if (!active) return null;
    const lines = splitChunkToLines(active.text, maxLen);
    if (lines.length === 0) return null;
    const totalLen = lines.reduce((s, l) => s + visualLen(l), 0);
    const chunkDur = active.absoluteEnd - active.absoluteStart;
    let acc = active.absoluteStart;
    let activeLine = lines[lines.length - 1];
    let lineStart = active.absoluteStart;
    for (const line of lines) {
      const dur = (visualLen(line) / totalLen) * chunkDur;
      if (time < acc + dur) { activeLine = line; lineStart = acc; break; }
      acc += dur;
    }
    const lineProg = Math.min(1, (time - lineStart) / 0.15);
    return React.createElement('div', {
      style: { position: 'absolute', left: 0, right: 0, bottom, display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 },
    }, React.createElement('div', {
      key: lineStart,
      style: {
        fontFamily: '"PingFang SC", "Noto Sans SC", -apple-system, sans-serif',
        fontSize, fontWeight: 600, color,
        letterSpacing: '0.04em', lineHeight: 1.2, textAlign: 'center',
        textShadow: `0 0 6px ${haloColor}, 0 0 12px ${haloColor}, 0 1px 2px rgba(255,255,255,0.5)`,
        opacity: lineProg, transform: `translateY(${(1 - lineProg) * 4}px)`,
      },
    }, activeLine));
  }

  /**
   * useSceneFade · scene 內輔助元素的軟淡入淡出 helper
   *
   * 鐵律第二條要求 scene 之間禁止硬切——但 scene 內輔助元素（資料卡、引用塊）
   * 一旦 cue 觸發後預設會一直亮到 scene 結束。如果不淡出，離開本段進入下段時
   * 這些元素會突兀地存在或瞬間消失。本 hook 提供 [入場淡入 → hold → 出場淡出] 的統一軟切換。
   *
   * 用法（把 op 乘進輔助元素的 opacity）：
   *   const op = useSceneFade('md-side', 0.6, 0.8);  // 進 0.6s, 出 0.8s
   *   <Cue id="agents-md">{(t, p) => (
   *     <div style={{ opacity: op * p }}>...</div>
   *   )}</Cue>
   *
   * 這樣資料卡片在 md-side 段開始 0.6s 內淡入，在段結束前 0.8s 開始淡出，
   * 與下一段的輔助元素淡入形成 overlap，畫面不出現硬切。
   *
   * @param sceneId  scene id
   * @param fadeIn   入場淡入秒數（預設 0.5）
   * @param fadeOut  出場淡出秒數（預設 0.5）
   * @returns 0-1 之間的不透明度倍率
   */
  function useSceneFade(sceneId, fadeIn = 0.5, fadeOut = 0.5) {
    const { time, timeline } = React.useContext(NarrationContext);
    if (!timeline) return 0;
    const s = timeline.scenes.find(x => x.id === sceneId);
    if (!s) return 0;
    const inT = (time - s.start) / fadeIn;
    const outT = (s.end - time) / fadeOut;
    const v = Math.min(1, Math.min(inT, outT));
    return Math.max(0, v);
  }

  return { NarrationStage, Scene, Cue, useNarration, useSceneFade, Subtitles, splitChunkToLines };
})();

if (typeof window !== 'undefined') {
  Object.assign(window, { NarrationStageLib });
}
