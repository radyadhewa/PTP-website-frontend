import styles from '@/styles/Home.module.css';

interface ReadingPassageProps {
  passage: string;
  onVisualize: () => void;
  onReadComplete: () => void;
  isCompleting?: boolean;
}

export default function ReadingPassage({
  passage,
  onVisualize,
  onReadComplete,
  isCompleting = false,
}: ReadingPassageProps) {
  return (
    <section className={styles.readingSection} aria-labelledby="reading-title">
      <div className={styles.sectionHeaderRow}>
        <div>
          <p className={styles.eyebrow}>Your focused session</p>
          <h2 id="reading-title" className={styles.readingLabel}>
            A small idea, fully explored.
          </h2>
        </div>
        <span className={styles.readingBadge}>Read · reflect · retain</span>
      </div>
      <article className={styles.passageCard}>
        <span className={styles.passageMark} aria-hidden="true">
          “
        </span>
        <p>{passage}</p>
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
