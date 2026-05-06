import { useEffect, useRef } from 'react';
import type { ChapterContext, ChapterDef } from '../types';
import { Reveal } from '../../shared/Reveal';
import './Video.css';

/**
 * Chapter 02 · Anthropic 官方宣傳片嵌入
 *
 * 淺色紙感背景 + 虛擬電視外框 + 16:9 影片。影片源：/video.mp4
 *
 * 僅保留電視外框 —— 不放任何文案 / eyebrow / caption。
 * - 進入時靜音自動播放（繞過瀏覽器策略），使用者可透過 controls 解除靜音 / 暫停
 * - TV + 底座 data-no-step，操作 controls 不會推進
 * - 點選 TV 之外的留白才會推進到 Ch03
 */
function VideoChapter(_: ChapterContext) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    const play = v.play();
    if (play && typeof play.catch === 'function') {
      play.catch(() => {/* 使用者必須自行點選播放 */});
    }
    return () => {
      v.pause();
    };
  }, []);

  return (
    <section className="vid">
      <Reveal kind="rise" duration={900} delay={120} className="vid__tv-wrap">
        <div className="vid__tv" data-no-step>
          {/* 角注 4 顆螺絲 */}
          <span className="vid__screw vid__screw--tl" />
          <span className="vid__screw vid__screw--tr" />
          <span className="vid__screw vid__screw--bl" />
          <span className="vid__screw vid__screw--br" />

          {/* 頂部狀態條 */}
          <div className="vid__topstrip">
            <span className="vid__led" />
            <span>ON · CH · 02</span>
            <span className="vid__topstrip-spacer" />
            <span>SIGNAL · STABLE</span>
          </div>

          {/* 螢幕 */}
          <div className="vid__screen">
            <div className="vid__scanlines" aria-hidden />
            <video
              ref={videoRef}
              src="/garden/web-design/video.mp4"
              className="vid__video"
              controls
              playsInline
              muted
              autoPlay
            />
          </div>

          {/* 底部品牌條 */}
          <div className="vid__brandstrip">
            <span className="vid__brand-mark" />
            <span className="vid__brand-name">ANTHROPIC</span>
          </div>
        </div>

        {/* 底座 */}
        <div className="vid__stand" data-no-step>
          <span className="vid__stand-neck" />
          <span className="vid__stand-base" />
        </div>
      </Reveal>
    </section>
  );
}

const def: ChapterDef = {
  id: 'video',
  title: '官方宣傳片',
  eyebrow: '02',
  steps: 1,
  theme: 'light',
  Component: VideoChapter,
};

export default def;
