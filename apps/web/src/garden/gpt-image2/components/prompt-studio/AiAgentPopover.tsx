import React, { useState, useRef, useEffect } from 'react';

export const SparkleIcon = ({ size = 14, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
  </svg>
);

export const AutoIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);

interface AiAgentPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onRefine: (intent: string) => void;
  onAutoRefine?: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  title: string;
  placeholder?: string;
  isLoading?: boolean;
}

export const AiAgentPopover: React.FC<AiAgentPopoverProps> = ({
  isOpen,
  onClose,
  onRefine,
  onAutoRefine,
  anchorRef,
  title,
  placeholder = '告訴 AI 你想怎麼調整...',
  isLoading = false
}) => {
  const [intent, setIntent] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen || !anchorRef.current) return null;

  const rect = anchorRef.current.getBoundingClientRect();
  
  // 簡易位置計算 (定位在 Icon 的左上方或正下方，避免超出螢幕)
  const top = rect.bottom + window.scrollY + 8;
  const left = rect.right + window.scrollX - 300; // 寬度約 300px，向左延伸

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent.trim()) return;
    onRefine(intent);
    setIntent('');
  };

  return (
    <div 
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: `${top}px`,
        left: `${Math.max(16, left)}px`,
        width: '300px',
        backgroundColor: 'var(--surface-2)',
        border: '1px solid var(--vermilion)',
        borderRadius: 'var(--r-md)',
        padding: 'var(--s-4)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        zIndex: 1000,
        animation: 'fadeUp var(--t-fast) var(--ease-out)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--s-3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--vermilion)', letterSpacing: '0.1em' }}>
          <SparkleIcon size={12} /> AI Copilot
        </div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>
          {title}
        </div>
      </div>

      {onAutoRefine && (
        <button 
          type="button"
          onClick={() => {
            if (!isLoading) onAutoRefine();
          }}
          disabled={isLoading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            background: 'var(--surface-3)',
            color: 'var(--text)',
            border: '1px solid var(--line-strong)',
            padding: '8px 12px',
            borderRadius: 'var(--r-xs)',
            fontSize: '12px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            marginBottom: 'var(--s-3)'
          }}
        >
          <AutoIcon size={14} /> 自動最佳化內容
        </button>
      )}
      
      {onAutoRefine && (
        <div style={{ fontSize: '11px', color: 'var(--text-mute)', marginBottom: 'var(--s-2)' }}>
          或輸入自訂指令：
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          autoFocus
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          placeholder={placeholder}
          disabled={isLoading}
          style={{
            width: '100%',
            height: '60px',
            background: 'var(--bg)',
            border: '1px solid var(--line-strong)',
            borderRadius: 'var(--r-xs)',
            padding: 'var(--s-2)',
            color: 'var(--text)',
            fontFamily: 'var(--font-sans)',
            fontSize: '13px',
            resize: 'none',
            marginBottom: 'var(--s-3)'
          }}
        />
        <div style={{ display: 'flex', gap: 'var(--s-2)' }}>
          <button 
            type="submit" 
            disabled={!intent.trim() || isLoading}
            style={{
              flex: 1,
              background: 'var(--vermilion)',
              color: 'white',
              border: 'none',
              padding: '6px 12px',
              borderRadius: 'var(--r-xs)',
              fontSize: '12px',
              cursor: (!intent.trim() || isLoading) ? 'not-allowed' : 'pointer',
              opacity: (!intent.trim() || isLoading) ? 0.6 : 1
            }}
          >
            {isLoading ? '處理中...' : '送出'}
          </button>
          <button 
            type="button" 
            onClick={onClose}
            disabled={isLoading}
            style={{
              background: 'transparent',
              color: 'var(--text-mute)',
              border: '1px solid var(--line-strong)',
              padding: '6px 12px',
              borderRadius: 'var(--r-xs)',
              fontSize: '12px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
            }}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
};
