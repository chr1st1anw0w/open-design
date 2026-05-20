import { useAssistant } from './assistant-context';

// Thesys logo SVG mark (geometric "T" with brand gradient)
function ThesysLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id="thesys-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#e0d8ff" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      {/* horizontal bar */}
      <rect x="4" y="6" width="24" height="5" rx="2.5" fill="url(#thesys-grad)" />
      {/* vertical stem */}
      <rect x="13.5" y="11" width="5" height="16" rx="2.5" fill="url(#thesys-grad)" />
    </svg>
  );
}

export function AssistantFab() {
  const { open, toggle } = useAssistant();
  return (
    <button
      type="button"
      className="assistant-fab"
      data-testid="assistant-fab"
      aria-label={open ? '關閉 Open Design 助理' : '開啟 Open Design 助理'}
      aria-expanded={open}
      onClick={toggle}
    >
      {open ? (
        <span className="assistant-fab-close" aria-hidden>×</span>
      ) : (
        <ThesysLogo size={28} />
      )}
    </button>
  );
}
