import Link from 'next/link';
import styles from '@/styles/Home.module.css';

type StudyStep = 'reading' | 'writing';

interface StudyNavigationProps {
  active: StudyStep;
  writingUnlocked: boolean;
}

export default function StudyNavigation({ active, writingUnlocked }: StudyNavigationProps) {
  return (
    <nav className={styles.studyNav} aria-label="Learning journey">
      <div className={styles.journeyLabel}>
        <span className={styles.journeySpark} aria-hidden="true">
          ✦
        </span>
        Today&apos;s studio
      </div>
      <div className={styles.journeySteps}>
        <Link
          href="/homepage"
          className={`${styles.journeyStep} ${active === 'reading' ? styles.journeyStepActive : ''}`}
          aria-current={active === 'reading' ? 'page' : undefined}
        >
          <span className={styles.stepNumber}>01</span>
          <span>
            <strong>Read</strong>
            <small>{active === 'reading' ? 'In progress' : 'Warm up'}</small>
          </span>
        </Link>
        {writingUnlocked ? (
          <Link
            href="/writing"
            className={`${styles.journeyStep} ${active === 'writing' ? styles.journeyStepActive : ''}`}
            aria-current={active === 'writing' ? 'page' : undefined}
          >
            <span className={styles.stepNumber}>02</span>
            <span>
              <strong>Write</strong>
              <small>{active === 'writing' ? 'Your turn' : 'Ready'}</small>
            </span>
          </Link>
        ) : (
          <span
            className={`${styles.journeyStep} ${styles.journeyStepLocked}`}
            aria-label="Writing unlocks after today’s reading"
          >
            <span className={styles.stepNumber}>02</span>
            <span>
              <strong>Write</strong>
              <small>Unlock by reading</small>
            </span>
          </span>
        )}
      </div>
    </nav>
  );
}
