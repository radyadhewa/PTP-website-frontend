import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import StreakCounter from '@/components/StreakCounter';
import ReadingPassage from '@/components/ReadingPassage';
import VisualizationModal from '@/components/VisualizationModal';
import PreferenceForm from '@/components/PreferenceForm';

// Sample passages with metadata for daily reading
const SAMPLE_PASSAGES = [
  {
    text: "Technology has revolutionized the way we communicate, transforming simple text messages into rich multimedia conversations. The evolution from traditional mail to instant messaging represents one of humanity's most significant leaps in connectivity. Today, billions of people stay connected across continents, sharing ideas and building relationships that would have been impossible mere decades ago.",
    genre: 'Science & Technology',
    difficulty: 'Intermediate',
    length: 'medium',
  },
  
  {
    text: "The ocean covers more than 70% of Earth's surface, yet we know less about it than we do about the surface of the moon. Marine life exhibits incredible diversity, with millions of species adapted to various depths and conditions. From bioluminescent creatures in the abyssal zone to magnificent coral ecosystems in shallow reefs, the ocean remains one of our planet's greatest frontiers.",
    genre: 'Nature & Environment',
    difficulty: 'Intermediate',
    length: 'medium',
  },
  
  {
    text: "Reading is a fundamental skill that opens doors to knowledge and imagination. When we read, our brains engage in a complex process of decoding symbols and constructing meaning. This mental exercise strengthens neural connections, improves focus, and expands our understanding of the world around us.",
    genre: 'Self-Improvement',
    difficulty: 'Beginner',
    length: 'short',
  },
  
  {
    text: "Climate change is one of the most pressing challenges of our time. Rising global temperatures affect weather patterns, sea levels, and ecosystems worldwide. Scientists agree that human activities, particularly the emission of greenhouse gases, are the primary cause of observed warming since the mid-20th century.",
    genre: 'Nature & Environment',
    difficulty: 'Advanced',
    length: 'medium',
  },
  
  {
    text: "Artificial intelligence has transformed industries and daily life in remarkable ways. Machine learning algorithms power recommendation systems, autonomous vehicles, and medical diagnostics. As AI continues to evolve, questions about ethics, privacy, and human-AI collaboration become increasingly important.",
    genre: 'Science & Technology',
    difficulty: 'Advanced',
    length: 'long',
  },

  {
    text: "The ancient philosophers of Greece laid the foundation for Western thought. Figures like Socrates, Plato, and Aristotle revolutionized how we understand knowledge, truth, and human existence. Their contributions continue to shape education, science, and philosophy more than two thousand years later.",
    genre: 'History & Culture',
    difficulty: 'Intermediate',
    length: 'medium',
  },

  {
    text: "Exercise is one of the most effective ways to improve both physical and mental health. Regular physical activity strengthens the heart, improves circulation, and boosts the production of endorphins—the body's natural mood elevators. Just 30 minutes of moderate exercise daily can significantly enhance your overall wellbeing.",
    genre: 'Health & Wellness',
    difficulty: 'Beginner',
    length: 'short',
  },

  {
    text: "The psychology of habit formation reveals that our behaviors are often shaped by subtle environmental cues and reward systems. Understanding the habit loop—cue, routine, and reward—empowers us to build positive habits and break negative ones. This knowledge has revolutionized personal development and behavior change strategies.",
    genre: 'Self-Improvement',
    difficulty: 'Intermediate',
    length: 'medium',
  },
];

export default function Home() {
  const router = useRouter();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [todayRead, setTodayRead] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [passageIndex, setPassageIndex] = useState(0);
  const [totalBooksRead, setTotalBooksRead] = useState(0);
  const [userPreferences, setUserPreferences] = useState(null);
  const [filteredPassages, setFilteredPassages] = useState(SAMPLE_PASSAGES);
  const [preferencesSubmitted, setPreferencesSubmitted] = useState(false);

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

    // Load user preferences
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      const prefs = JSON.parse(savedPreferences);
      setUserPreferences(prefs);
      setPreferencesSubmitted(true);
      filterPassagesByPreferences(prefs);
    }
  }, []);

  const filterPassagesByPreferences = (preferences) => {
    const filtered = SAMPLE_PASSAGES.filter((passage) => {
      const genreMatch = preferences.genres.includes(passage.genre);
      const difficultyMatch = passage.difficulty === preferences.difficulty;
      const lengthMatch = passage.length === preferences.passageLength;
      
      return genreMatch && difficultyMatch && lengthMatch;
    });

    // If no perfect matches, at least filter by genre and difficulty
    if (filtered.length === 0) {
      const partialFiltered = SAMPLE_PASSAGES.filter((passage) => {
        const genreMatch = preferences.genres.includes(passage.genre);
        const difficultyMatch = passage.difficulty === preferences.difficulty;
        return genreMatch && difficultyMatch;
      });
      setFilteredPassages(partialFiltered.length > 0 ? partialFiltered : SAMPLE_PASSAGES);
    } else {
      setFilteredPassages(filtered);
    }
  };

  const handlePreferencesSubmit = (preferences) => {
    setUserPreferences(preferences);
    setPreferencesSubmitted(true);
    filterPassagesByPreferences(preferences);
  };

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
    setPassageIndex((prev) => (prev + 1) % filteredPassages.length);
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

  const handleChangePreferences = () => {
    localStorage.removeItem('userPreferences');
    setUserPreferences(null);
    setPreferencesSubmitted(false);
    setFilteredPassages(SAMPLE_PASSAGES);
    setPassageIndex(0);
  };

  const handleLogout = () => {
    localStorage.removeItem('readingCurrentUser');
    router.push('/');
  };

  const canWrite = todayRead;

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
          {!preferencesSubmitted ? (
            <PreferenceForm onSubmit={handlePreferencesSubmit} />
          ) : (
            <>
              <div className={styles.header}>
                <h1 className={styles.title}>📖 Daily Reader</h1>
                <p className={styles.subtitle}>
                  {todayRead
                    ? '✓ You\'ve read today! Great job! Come back tomorrow.'
                    : 'Read a small chunk each day and build an unstoppable streak'}
                </p>
                <button
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={handleChangePreferences}
                  style={{ marginTop: '15px', fontSize: '0.9rem' }}
                >
                  🎯 Change My Preferences
                </button>
              </div>

              <div className={styles.pageNav}>
                <Link href="/homepage" className={`${styles.pageNavLink} ${styles.pageNavLinkActive}`}>
                  Reading
                </Link>
                {canWrite ? (
                  <Link href="/writing" className={styles.pageNavLink}>
                    Writing
                  </Link>
                ) : (
                  <span className={`${styles.pageNavLink} ${styles.pageNavLinkDisabled}`}>
                    Writing
                  </span>
                )}
              </div>

              <StreakCounter currentStreak={currentStreak} bestStreak={bestStreak} />

              {filteredPassages.length > 0 ? (
                !todayRead ? (
                  <>
                    <ReadingPassage
                      passage={filteredPassages[passageIndex % filteredPassages.length].text}
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
                    <button
                      className={`${styles.button} ${styles.primaryButton}`}
                      onClick={() => router.push('/writing')}
                      style={{ width: '100%', maxWidth: '360px', margin: '0 auto' }}
                    >
                      ✍️ Continue to Writing
                    </button>
                  </div>
                )
              ) : (
                <div
                  style={{
                    background: '#ffe0e0',
                    padding: '30px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <p style={{ fontSize: '1.1rem', color: '#c41e3a', marginBottom: '15px' }}>
                    😔 Sorry, we don't have passages that match all your preferences right now.
                  </p>
                  <p style={{ color: '#666', marginBottom: '15px' }}>
                    Try adjusting your difficulty level or passage length to see more options.
                  </p>
                  <button
                    className={`${styles.button} ${styles.primaryButton}`}
                    onClick={handleChangePreferences}
                  >
                    🎯 Update Preferences
                  </button>
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

              <button
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={handleLogout}
                style={{ width: '100%', marginTop: '12px' }}
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </main>

      <VisualizationModal
        isOpen={showModal}
        passage={filteredPassages.length > 0 ? filteredPassages[passageIndex % filteredPassages.length].text : ''}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
