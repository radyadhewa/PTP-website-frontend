import styles from '@/styles/Home.module.css';

export default function StreakCounter({ currentStreak, bestStreak }) {
  return (
    <div className={styles.streakSection}>
      <div>
        <div className={styles.streakCount}>
          {currentStreak}
          <span className={styles.flame}>🔥</span>
        </div>
        <div className={styles.streakLabel}>Current Streak</div>
      </div>
      <div style={{ marginTop: '20px', opacity: 0.9 }}>
        Best Streak: <strong>{bestStreak}</strong> days
      </div>
    </div>
  );
}
