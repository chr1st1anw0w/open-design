import React, { useEffect, useState } from 'react';
import { listArchive } from '../../lib/archive-client';
import type { ArchiveEntry } from '../../types';

interface ArchiveBrowserProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchiveBrowser: React.FC<ArchiveBrowserProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      listArchive().then(res => {
        setEntries(res.entries);
        setLoading(false);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="archive-browser-overlay" onClick={onClose}>
      <div className="archive-browser-sidebar" onClick={e => e.stopPropagation()}>
        <div className="sidebar-header">
          <h2 className="serif">Archive</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="sidebar-content">
          {loading ? (
            <div className="mono" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-faint)' }}>
              Loading logs...
            </div>
          ) : entries.length === 0 ? (
            <div className="mono" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-faint)' }}>
              Archive is empty.
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div key={idx} className="archive-entry-item">
                <div className="entry-meta">
                  <span>{new Date(entry.timestamp).toLocaleDateString()}</span>
                  <span>{entry.format}</span>
                </div>
                <span className="entry-template">{entry.template}</span>
                <p className="entry-snippet">{entry.renderedPrompt}</p>
                {entry.tags && entry.tags.length > 0 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                    {entry.tags.map(tag => (
                      <span key={tag} className="eyebrow" style={{ fontSize: '9px', background: 'var(--line)', padding: '2px 6px', borderRadius: '2px' }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
