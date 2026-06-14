import styles from '@/styles/Home.module.css';

export default function VisualizationModal({ isOpen, passage, onClose }) {
  if (!isOpen) return null;

  // Simple text analysis for visualization
  const words = passage.split(' ').filter(w => w.length > 0);
  const sentences = passage.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Extract key points (sentences with important keywords)
  const keyKeywords = ['important', 'key', 'main', 'crucial', 'significant', 'essential'];
  const keyPoints = sentences
    .filter(sentence =>
      keyKeywords.some(keyword =>
        sentence.toLowerCase().includes(keyword)
      )
    )
    .slice(0, 5);

  // If no key points found, just show first 3 sentences
  const displayPoints = keyPoints.length > 0 
    ? keyPoints 
    : sentences.slice(0, 3);

  return (
    <div className={`${styles.modal} ${isOpen ? styles.active : ''}`}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <span>📊 Passage Analysis</span>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.visualization}>
          <h3>📈 Quick Statistics</h3>
          <p>Total words: <strong>{words.length}</strong></p>
          <p>Total sentences: <strong>{sentences.length}</strong></p>
          <p>Average words per sentence: <strong>{Math.round(words.length / sentences.length)}</strong></p>
        </div>

        <div className={styles.visualization}>
          <h3>🎯 Key Points</h3>
          <ul className={styles.keyPoints}>
            {displayPoints.map((point, index) => (
              <li key={index}>
                {point.trim().substring(0, 100)}
                {point.trim().length > 100 ? '...' : ''}
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.visualization}>
          <h3>💡 Understanding Tips</h3>
          <ul className={styles.keyPoints}>
            <li>Focus on the main idea of each sentence</li>
            <li>Identify the subject and what's happening</li>
            <li>Look for cause and effect relationships</li>
            <li>Note any unfamiliar words for lookup</li>
          </ul>
        </div>

        <button
          className={`${styles.button} ${styles.primaryButton}`}
          style={{ width: '100%', marginTop: '20px' }}
          onClick={onClose}
        >
          Got it! Let me read again
        </button>
      </div>
    </div>
  );
}
