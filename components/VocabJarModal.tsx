import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/Home.module.css';
import type { VocabularyItem } from '@/types/domain';

interface VocabJarModalProps {
  jar: VocabularyItem[];
  onClose: () => void;
  onRemoveWord: (word: string) => void;
  onToggleLearned: (word: string) => void;
  onUpdateNote: (word: string, note: string) => void;
  onInsertToDraft?: (word: string) => void;
}

export default function VocabJarModal({
  jar,
  onClose,
  onRemoveWord,
  onToggleLearned,
  onUpdateNote,
  onInsertToDraft,
}: VocabJarModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'learning' | 'learned'>('all');
  const [editingWord, setEditingWord] = useState<string | null>(null);
  const [tempNote, setTempNote] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const filteredJar = jar.filter((item) => {
    const matchesSearch =
      item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.definition.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.note && item.note.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterMode === 'learning') return !item.learned;
    if (filterMode === 'learned') return Boolean(item.learned);
    return true;
  });

  const handleStartEditNote = (item: VocabularyItem) => {
    setEditingWord(item.word);
    setTempNote(item.note || '');
  };

  const handleSaveNote = (word: string) => {
    onUpdateNote(word, tempNote);
    setEditingWord(null);
  };

  return (
    <div
      className={styles.modalBackdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vocab-jar-title"
    >
      <div className={styles.modalCard} ref={modalRef} style={{ maxWidth: '680px', width: '90vw' }}>
        <div className={styles.modalHeader}>
          <div>
            <h2 id="vocab-jar-title" className={styles.modalTitle}>
              🏺 Vocabulary Jar ({jar.length})
            </h2>
            <p className={styles.modalSubtitle} style={{ marginTop: '4px', color: 'var(--muted)', fontSize: '0.9rem' }}>
              Review and reuse words you encountered while reading.
            </p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close Vocabulary Jar">
            ✕
          </button>
        </div>

        <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls bar */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search words or definitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.input}
              style={{ flex: '1 1 200px', minHeight: '38px', fontSize: '0.9rem' }}
            />
            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'learning', 'learned'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  className={`${styles.button} ${filterMode === mode ? styles.primaryButton : styles.secondaryButton}`}
                  style={{ minHeight: '34px', padding: '4px 12px', fontSize: '0.85rem' }}
                  onClick={() => setFilterMode(mode)}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Words List */}
          <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {filteredJar.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--muted)', background: 'var(--subtle-bg)', borderRadius: '12px' }}>
                {jar.length === 0 ? 'Your Vocabulary Jar is currently empty. Highlight and add words while reading!' : 'No words match your current search/filter criteria.'}
              </div>
            ) : (
              filteredJar.map((item) => (
                <div
                  key={item.id || item.word}
                  style={{
                    border: '1px solid var(--card-border)',
                    borderRadius: '10px',
                    padding: '14px',
                    backgroundColor: item.learned ? 'rgba(230, 245, 230, 0.4)' : 'var(--card-bg)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', marginRight: '8px', color: 'var(--foreground)' }}>
                        {item.word}
                      </span>
                      <span className={`${styles.tooltipPosBadge} ${styles['pos' + item.pos.charAt(0).toUpperCase() + item.pos.slice(1)]}`}>
                        {item.pos}
                      </span>
                      {item.learned && (
                        <span style={{ marginLeft: '8px', fontSize: '0.8rem', color: '#2e7d32', fontWeight: 600 }}>
                          ✓ Known
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      Added {new Date(item.dateAdded).toLocaleDateString()}
                    </span>
                  </div>

                  <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--foreground)', lineHeight: 1.4 }}>
                    {item.definition}
                  </p>

                  {/* Note Section */}
                  {editingWord === item.word ? (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <input
                        type="text"
                        value={tempNote}
                        placeholder="Add personal note or example..."
                        onChange={(e) => setTempNote(e.target.value)}
                        className={styles.input}
                        style={{ flex: 1, minHeight: '32px', fontSize: '0.85rem' }}
                      />
                      <button
                        type="button"
                        className={`${styles.button} ${styles.primaryButton}`}
                        style={{ minHeight: '32px', padding: '2px 10px', fontSize: '0.8rem' }}
                        onClick={() => handleSaveNote(item.word)}
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>{item.note ? `Note: "${item.note}"` : 'No note added.'}</span>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}
                        onClick={() => handleStartEditNote(item)}
                      >
                        {item.note ? 'Edit Note' : '+ Add Note'}
                      </button>
                    </div>
                  )}

                  {/* Actions bar */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.secondaryButton}`}
                      style={{ minHeight: '30px', padding: '2px 10px', fontSize: '0.8rem' }}
                      onClick={() => onToggleLearned(item.word)}
                    >
                      {item.learned ? 'Mark as Unlearned' : 'Mark as Known'}
                    </button>

                    {onInsertToDraft && (
                      <button
                        type="button"
                        className={`${styles.button} ${styles.primaryButton}`}
                        style={{ minHeight: '30px', padding: '2px 10px', fontSize: '0.8rem' }}
                        onClick={() => onInsertToDraft(item.word)}
                      >
                        ✍️ Use in Writing
                      </button>
                    )}

                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#c62828', cursor: 'pointer', fontSize: '0.8rem', marginLeft: 'auto' }}
                      onClick={() => onRemoveWord(item.word)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.modalFooter} style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button type="button" className={`${styles.button} ${styles.secondaryButton}`} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
