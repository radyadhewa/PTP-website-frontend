import { useEffect, useRef } from 'react';
import styles from '@/styles/Home.module.css';
import type { POSType, VocabularySettings } from '@/types/domain';

interface ReadingSettingsModalProps {
  settings: VocabularySettings;
  onSave: (newSettings: VocabularySettings) => void;
  onClose: () => void;
}

const POS_OPTIONS: { type: POSType; label: string }[] = [
  { type: 'noun', label: 'Nouns' },
  { type: 'verb', label: 'Verbs' },
  { type: 'adjective', label: 'Adjectives' },
  { type: 'adverb', label: 'Adverbs' },
];

export default function ReadingSettingsModal({
  settings,
  onSave,
  onClose,
}: ReadingSettingsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const togglePOS = (pos: POSType) => {
    const exists = settings.highlightPOS.includes(pos);
    const newPOS = exists
      ? settings.highlightPOS.filter((p) => p !== pos)
      : [...settings.highlightPOS, pos];
    onSave({ ...settings, highlightPOS: newPOS });
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vocab-settings-title"
    >
      <div className={styles.modalCard} ref={dialogRef} style={{ maxWidth: '480px' }}>
        <div className={styles.modalHeader}>
          <h2 id="vocab-settings-title" className={styles.modalTitle}>
            Reading & Vocabulary Settings
          </h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className={styles.modalBody} style={{ gap: '16px', display: 'flex', flexDirection: 'column' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={settings.highlightEnabled}
              onChange={(e) => onSave({ ...settings, highlightEnabled: e.target.checked })}
            />
            Enable Vocabulary Highlighting
          </label>

          {settings.highlightEnabled && (
            <>
              <fieldset style={{ border: '1px solid var(--card-border)', borderRadius: '8px', padding: '12px' }}>
                <legend style={{ fontWeight: 600, padding: '0 6px', fontSize: '0.9rem' }}>
                  Highlight Parts of Speech
                </legend>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '4px' }}>
                  {POS_OPTIONS.map((opt) => (
                    <label key={opt.type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input
                        type="checkbox"
                        checked={settings.highlightPOS.includes(opt.type)}
                        onChange={() => togglePOS(opt.type)}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input
                  type="checkbox"
                  checked={settings.includeUnknown}
                  onChange={(e) => onSave({ ...settings, includeUnknown: e.target.checked })}
                />
                Include Unknown & Technical Scientific Terms
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.95rem' }}>
                <input
                  type="checkbox"
                  checked={settings.autoAdd}
                  onChange={(e) => onSave({ ...settings, autoAdd: e.target.checked })}
                />
                Automatically add hovered/tapped words to Vocabulary Jar
              </label>
            </>
          )}
        </div>

        <div className={styles.modalFooter} style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className={`${styles.button} ${styles.primaryButton}`} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
