import styles from '@/styles/Home.module.css';

interface StreakCounterProps {
  currentStreak: number;
  bestStreak: number;
}

export default function StreakCounter({ currentStreak, bestStreak }: StreakCounterProps) {
  return (
    <section className={styles.streakSection} aria-label="Reading streak progress">
      <div className={styles.streakGlow} aria-hidden="true" />
      <div className={styles.streakPrimary}>
        <p className={styles.eyebrow}>Momentum, made visible</p>
        <div className={styles.streakCount}>
          {currentStreak}
          <span className={styles.flame} aria-hidden="true">
            🔥
          </span>
        </div>
        <div className={styles.streakLabel}>day reading streak</div>
      </div>
      <div className={styles.streakMeta}>
        <span className={styles.metaLabel}>Personal best</span>
        <strong>{bestStreak} days</strong>
        <span className={styles.metaNote}>Every page is a vote for tomorrow-you.</span>
      </div>
    </section>
  );
}
