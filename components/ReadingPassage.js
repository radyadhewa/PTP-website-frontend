import styles from '@/styles/Home.module.css';

export default function ReadingPassage({ passage, onVisualize, onReadComplete }) {
  return (
    <div className={styles.readingSection}>
      <h2 className={styles.readingLabel}>Today's Reading</h2>
      <div className={styles.passageCard}>
        <p>{passage}</p>
      </div>
      <div className={styles.buttonGroup}>
        <button
          className={`${styles.button} ${styles.visualizeButton}`}
          onClick={onVisualize}
        >
          📊 Help Visualize
        </button>
        <button
          className={`${styles.button} ${styles.primaryButton}`}
          onClick={onReadComplete}
        >
          ✓ Mark as Read
        </button>
      </div>
    </div>
  );
}
