import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import StreakCounter from '@/components/StreakCounter';
import ReadingPassage from '@/components/ReadingPassage';
import VisualizationModal from '@/components/VisualizationModal';

// Sample passages for daily reading
const SAMPLE_PASSAGES = [
  "Technology has revolutionized the way we communicate, transforming simple text messages into rich multimedia conversations. The evolution from traditional mail to instant messaging represents one of humanity's most significant leaps in connectivity. Today, billions of people stay connected across continents, sharing ideas and building relationships that would have been impossible mere decades ago.",
  
  "The ocean covers more than 70% of Earth's surface, yet we know less about it than we do about the surface of the moon. Marine life exhibits incredible diversity, with millions of species adapted to various depths and conditions. From bioluminescent creatures in the abyssal zone to magnificent coral ecosystems in shallow reefs, the ocean remains one of our planet's greatest frontiers.",
  
  "Reading is a fundamental skill that opens doors to knowledge and imagination. When we read, our brains engage in a complex process of decoding symbols and constructing meaning. This mental exercise strengthens neural connections, improves focus, and expands our understanding of the world around us.",
  
  "Climate change is one of the most pressing challenges of our time. Rising global temperatures affect weather patterns, sea levels, and ecosystems worldwide. Scientists agree that human activities, particularly the emission of greenhouse gases, are the primary cause of observed warming since the mid-20th century.",
  
  "Artificial intelligence has transformed industries and daily life in remarkable ways. Machine learning algorithms power recommendation systems, autonomous vehicles, and medical diagnostics. As AI continues to evolve, questions about ethics, privacy, and human-AI collaboration become increasingly important.",
];

export default function Home() {
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [todayRead, setTodayRead] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [passageIndex, setPassageIndex] = useState(0);
  const [totalBooksRead, setTotalBooksRead] = useState(0);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('readingData');
    if (savedData) {
      const data = JSON.parse(savedData);
      setCurrentStreak(data.currentStreak || 0);
      setBestStreak(data.bestStreak || 0);
      setTotalBooksRead(data.totalBooksRead || 0);
      
      // Check if already read today
      const lastReadDate = data.lastReadDate;
      const today = new Date().toDateString();
      if (lastReadDate === today) {
        setTodayRead(true);
      }
    }
  }, []);

  const handleReadComplete = () => {
    const today = new Date().toDateString();
    const lastReadDate = localStorage.getItem('lastReadDate');

    let newStreak = currentStreak;
    let newBest = bestStreak;

    // Only increment if they haven't read today
    if (lastReadDate !== today) {
      // Check if streak continues (read yesterday)
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastReadDate === yesterday) {
        newStreak = currentStreak + 1;
      } else if (!lastReadDate) {
        // First time reading
        newStreak = 1;
      } else {
        // Streak broken, start new
        newStreak = 1;
      }

      // Update best streak
      if (newStreak > bestStreak) {
        newBest = newStreak;
      }

      // Save data
      const data = {
        currentStreak: newStreak,
        bestStreak: newBest,
        totalBooksRead: totalBooksRead + 1,
        lastReadDate: today,
      };
      localStorage.setItem('readingData', JSON.stringify(data));
      localStorage.setItem('lastReadDate', today);

      setCurrentStreak(newStreak);
      setBestStreak(newBest);
      setTotalBooksRead(totalBooksRead + 1);
      setTodayRead(true);

      // Show success message
      alert('🎉 Great job! You\'ve maintained your streak! Keep reading daily!');
    } else {
      alert('You\'ve already read today! Come back tomorrow to continue your streak.');
    }
  };

  const handleLoadNewPassage = () => {
    setPassageIndex((prev) => (prev + 1) % SAMPLE_PASSAGES.length);
    setShowModal(false);
  };

  const handleResetStreak = () => {
    if (confirm('Are you sure you want to reset your streak? This cannot be undone.')) {
      localStorage.removeItem('readingData');
      localStorage.removeItem('lastReadDate');
      setCurrentStreak(0);
      setBestStreak(0);
      setTotalBooksRead(0);
      setTodayRead(false);
      alert('Streak reset. Start fresh today!');
    }
  };

  return (
    <>
      <Head>
        <title>Daily Reader - Build Your Reading Habit</title>
        <meta name="description" content="A platform to help you build a daily reading habit with streak tracking" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>📖</text></svg>" />
      </Head>

      <main>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>📖 Daily Reader</h1>
            <p className={styles.subtitle}>
              {todayRead
                ? '✓ You\'ve read today! Great job! Come back tomorrow.'
                : 'Read a small chunk each day and build an unstoppable streak'}
            </p>
          </div>

          <StreakCounter currentStreak={currentStreak} bestStreak={bestStreak} />

          {!todayRead ? (
            <>
              <ReadingPassage
                passage={SAMPLE_PASSAGES[passageIndex]}
                onVisualize={() => setShowModal(true)}
                onReadComplete={handleReadComplete}
              />
              <button
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={handleLoadNewPassage}
                style={{ width: '100%' }}
              >
                Load Another Passage
              </button>
            </>
          ) : (
            <div
              style={{
                background: '#f0f7ff',
                padding: '30px',
                borderRadius: '8px',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              <p style={{ fontSize: '1.2rem', color: '#333', marginBottom: '15px' }}>
                🎯 You're all set for today! Check back tomorrow to keep your streak alive.
              </p>
            </div>
          )}

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{currentStreak}</div>
              <div className={styles.statLabel}>Current Streak</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{bestStreak}</div>
              <div className={styles.statLabel}>Best Streak</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{totalBooksRead}</div>
              <div className={styles.statLabel}>Passages Read</div>
            </div>
          </div>

          <button
            className={`${styles.button} ${styles.secondaryButton}`}
            onClick={handleResetStreak}
            style={{ width: '100%', marginTop: '20px' }}
          >
            🔄 Reset Progress
          </button>
        </div>
      </main>

      <VisualizationModal
        isOpen={showModal}
        passage={SAMPLE_PASSAGES[passageIndex]}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
