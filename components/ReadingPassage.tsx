import { useEffect, useMemo, useRef, useState } from 'react';
import styles from '@/styles/Home.module.css';
import { parsePassageToTokens, type WordAnalysis } from '@/lib/vocabulary';
import type { POSType, VocabularyItem, VocabularySettings } from '@/types/domain';
import { DEFAULT_VOCAB_SETTINGS } from '@/types/domain';

export interface ReadingPassageProps {
  passage: string;
  onVisualize: () => void;
  onReadComplete: () => void;
  isCompleting?: boolean;
  settings?: VocabularySettings;
  jar?: VocabularyItem[];
  onAddToJar?: (item: Omit<VocabularyItem, 'id' | 'dateAdded' | 'learned'>) => void;
  onRemoveFromJar?: (word: string) => void;
  onOpenSettings?: () => void;
}

function posStyleClass(pos: POSType): string {
  switch (pos) {
    case 'noun':
      return styles.posNoun;
    case 'verb':
      return styles.posVerb;
    case 'adjective':
      return styles.posAdjective;
    case 'adverb':
      return styles.posAdverb;
    case 'technical':
      return styles.posTechnical;
  }
}

export default function ReadingPassage({
  passage,
  onVisualize,
  onReadComplete,
  isCompleting = false,
  settings = DEFAULT_VOCAB_SETTINGS,
  jar = [],
  onAddToJar,
  onRemoveFromJar,
  onOpenSettings,
}: ReadingPassageProps) {
  const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);
  const activeWordRef = useRef<HTMLSpanElement | null>(null);

  const tokens = useMemo(() => parsePassageToTokens(passage), [passage]);

  const jarWordsSet = useMemo(() => {
    return new Set(jar.map((item) => item.word.toLowerCase()));
  }, [jar]);

  const isWordHighlighted = (analysis: WordAnalysis): boolean => {
    if (!settings.highlightEnabled) return false;
    const { pos, isTechnical } = analysis;
    if (isTechnical && settings.includeUnknown) return true;
    return settings.highlightPOS.includes(pos);
  };

  const handleWordInteract = (index: number, analysis: WordAnalysis): void => {
    setActiveWordIndex(index);
    if (settings.autoAdd && onAddToJar && !jarWordsSet.has(analysis.cleanWord.toLowerCase())) {
      onAddToJar({
        word: analysis.cleanWord,
        pos: analysis.pos,
        definition: analysis.definition,
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setActiveWordIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (activeWordRef.current && !activeWordRef.current.contains(event.target as Node)) {
        setActiveWordIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <section className={styles.readingSection} aria-labelledby="reading-title">
      <div className={styles.sectionHeaderRow}>
        <div>
          <p className={styles.eyebrow}>Your focused session</p>
          <h2 id="reading-title" className={styles.readingLabel}>
            A small idea, fully explored.
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {onOpenSettings && (
            <button
              type="button"
              className={styles.readingBadge}
              onClick={onOpenSettings}
              style={{ cursor: 'pointer', border: '1px solid var(--moss)' }}
              title="Configure Vocabulary Highlighting & Jar"
            >
              ⚙️ Vocabulary Settings
            </button>
          )}
          <span className={styles.readingBadge}>Read · reflect · retain</span>
        </div>
      </div>

      <article className={styles.passageCard}>
        <span className={styles.passageMark} aria-hidden="true">
          “
        </span>
        <p className={styles.passageText}>
          {tokens.map((token, index) => {
            if (token.type === 'text') {
              return <span key={index}>{token.text}</span>;
            }

            const { analysis } = token;
            const highlighted = isWordHighlighted(analysis);
            if (!highlighted) {
              return <span key={index}>{token.text}</span>;
            }

            const cleanLower = analysis.cleanWord.toLowerCase();
            const inJar = jarWordsSet.has(cleanLower);
            const isActive = activeWordIndex === index;

            return (
              <span
                key={index}
                className={styles.vocabTooltipWrapper}
                ref={isActive ? activeWordRef : undefined}
              >
                <mark
                  tabIndex={0}
                  role="button"
                  data-vocab-word={analysis.cleanWord}
                  data-vocab-pos={analysis.pos}
                  aria-expanded={isActive}
                  aria-haspopup="dialog"
                  aria-label={`${analysis.cleanWord}, ${analysis.pos}: ${analysis.definition}`}
                  className={`${styles.vocabHighlight} ${posStyleClass(analysis.pos)}`}
                  onMouseEnter={() => handleWordInteract(index, analysis)}
                  onClick={() => handleWordInteract(index, analysis)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (isActive) setActiveWordIndex(null);
                      else handleWordInteract(index, analysis);
                    }
                  }}
                >
                  {token.text}
                </mark>

                {isActive && (
                  <span
                    className={styles.vocabTooltip}
                    role="dialog"
                    aria-label={`Definition of ${analysis.cleanWord}`}
                  >
                    <span className={styles.tooltipHeader}>
                      <span className={styles.tooltipWord}>{analysis.cleanWord}</span>
                      <span className={`${styles.tooltipPosBadge} ${posStyleClass(analysis.pos)}`}>
                        {analysis.pos}
                      </span>
                    </span>
                    <span className={styles.tooltipDef}>{analysis.definition}</span>
                    <span className={styles.tooltipActions}>
                      {inJar ? (
                        <button
                          type="button"
                          className={`${styles.button} ${styles.secondaryButton}`}
                          style={{ minHeight: '34px', fontSize: '0.8rem', padding: '6px 12px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onRemoveFromJar) onRemoveFromJar(analysis.cleanWord);
                          }}
                        >
                          ✓ In Jar (Remove)
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={`${styles.button} ${styles.primaryButton}`}
                          style={{ minHeight: '34px', fontSize: '0.8rem', padding: '6px 12px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onAddToJar) {
                              onAddToJar({
                                word: analysis.cleanWord,
                                pos: analysis.pos,
                                definition: analysis.definition,
                              });
                            }
                          }}
                        >
                          🏺 Add to Jar
                        </button>
                      )}
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          color: 'var(--muted)',
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWordIndex(null);
                        }}
                      >
                        Close
                      </button>
                    </span>
                  </span>
                )}
              </span>
            );
          })}
        </p>
      </article>

      <div className={styles.collaborationNudge}>
        <span className={styles.nudgeOrb} aria-hidden="true">
          ✦
        </span>
        <p>
          <strong>Studio Lens is nearby.</strong> Ask it to surface the structure and key ideas when
          you&apos;re ready.
        </p>
      </div>

      <div className={styles.buttonGroup}>
        <button
          type="button"
          className={`${styles.button} ${styles.visualizeButton}`}
          onClick={onVisualize}
        >
          <span aria-hidden="true">✦</span> Open Studio Lens
        </button>
        <button
          type="button"
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={onReadComplete}
          disabled={isCompleting}
          aria-busy={isCompleting}
        >
          {isCompleting ? (
            'Saving your progress…'
          ) : (
            <>
              I&apos;ve finished reading <span aria-hidden="true">→</span>
            </>
          )}
        </button>
      </div>
    </section>
  );
}
