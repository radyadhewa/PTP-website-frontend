import styles from '@/styles/Home.module.css';

export interface VisualizationModalProps {
  isOpen: boolean;
  passage: string;
  onClose: () => void;
}

export default function VisualizationModal({ isOpen, passage, onClose }: VisualizationModalProps) {
  if (!isOpen) return null;

  const words = passage.split(' ').filter((word) => word.length > 0);
  const sentences = passage.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0);
  const keyKeywords = ['important', 'key', 'main', 'crucial', 'significant', 'essential'];
  const keyPoints = sentences
    .filter((sentence) => keyKeywords.some((keyword) => sentence.toLowerCase().includes(keyword)))
    .slice(0, 5);
  const displayPoints = keyPoints.length > 0 ? keyPoints : sentences.slice(0, 3);
  const averageWords = sentences.length ? Math.round(words.length / sentences.length) : 0;

  return (
    <div
      className={`${styles.modal} ${isOpen ? styles.active : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lens-title"
    >
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>AI study companion</p>
            <h2 id="lens-title">Studio Lens</h2>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close Studio Lens"
          >
            ✕
          </button>
        </div>

        <div className={styles.lensIntro}>
          <span aria-hidden="true">✦</span>
          <p>
            I mapped the passage into a few useful handles. Keep what helps; your interpretation
            leads.
          </p>
        </div>

        <div className={styles.statStack}>
          <div className={styles.lensStat}>
            <strong>{words.length}</strong>
            <span>words</span>
          </div>
          <div className={styles.lensStat}>
            <strong>{sentences.length}</strong>
            <span>sentences</span>
          </div>
          <div className={styles.lensStat}>
            <strong>{averageWords}</strong>
            <span>words / sentence</span>
          </div>
        </div>

        <section className={styles.visualization}>
          <h3>Ideas to hold onto</h3>
          <ul className={styles.keyPoints}>
            {displayPoints.map((point, index) => (
              <li key={`${point}-${index}`}>
                <span className={styles.pointIndex}>0{index + 1}</span>
                <span>
                  {point.trim().substring(0, 120)}
                  {point.trim().length > 120 ? '…' : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.visualization}>
          <h3>Try this on the next pass</h3>
          <ul className={styles.keyPoints}>
            <li>
              <span className={styles.pointIndex}>A</span>
              <span>Say the main idea in your own words.</span>
            </li>
            <li>
              <span className={styles.pointIndex}>B</span>
              <span>Notice what causes what, and why it matters.</span>
            </li>
            <li>
              <span className={styles.pointIndex}>C</span>
              <span>Circle one unfamiliar word to investigate later.</span>
            </li>
          </ul>
        </section>

        <button
          type="button"
          className={`${styles.button} ${styles.primaryButton} ${styles.fullButton}`}
          onClick={onClose}
        >
          Back to the passage <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
