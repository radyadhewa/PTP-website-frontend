import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import StreakCounter from '@/components/StreakCounter';
import ReadingPassage from '@/components/ReadingPassage';
import VisualizationModal from '@/components/VisualizationModal';
import PreferenceForm from '@/components/PreferenceForm';
import { SAMPLE_PASSAGES } from '@/lib/passages';

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
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const response = await fetch('/api/me');

    if (!response.ok) {
      router.replace('/');
      return null;
    }

    const profile = await response.json();
    setCurrentStreak(profile.readingData?.currentStreak || 0);
    setBestStreak(profile.readingData?.bestStreak || 0);
    setTotalBooksRead(profile.readingData?.totalBooksRead || 0);
    setTodayRead(profile.readingData?.lastReadDate === new Date().toDateString());
    setUserPreferences(profile.preferences);
    setPreferencesSubmitted(Boolean(profile.preferences));
    setFilteredPassages(profile.passages?.length ? profile.passages : SAMPLE_PASSAGES);
    setLoading(false);
    return profile;
  }, [router]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handlePreferencesSubmit = (preferences) => {
    setUserPreferences(preferences);
    setPreferencesSubmitted(true);
    loadProfile();
  };

  const handleReadComplete = async () => {
    const today = new Date().toDateString();
    const currentLastReadDate = todayRead ? today : null;

    let newStreak = currentStreak;
    let newBest = bestStreak;

    if (currentLastReadDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      const profile = await fetch('/api/me').then((response) => response.json());
      const previousDate = profile.readingData?.lastReadDate;

      if (previousDate === yesterday) {
        newStreak = currentStreak + 1;
      } else if (!previousDate) {
        newStreak = 1;
      } else {
        newStreak = 1;
      }

      if (newStreak > bestStreak) {
        newBest = newStreak;
      }

      const data = {
        currentStreak: newStreak,
        bestStreak: newBest,
        totalBooksRead: totalBooksRead + 1,
        lastReadDate: today,
      };

      await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ readingData: data }),
      });

      setCurrentStreak(newStreak);
      setBestStreak(newBest);
      setTotalBooksRead(totalBooksRead + 1);
      setTodayRead(true);

      alert('🎉 Great job! You\'ve maintained your streak! Keep reading daily!');
    } else {
      alert('You\'ve already read today! Come back tomorrow to continue your streak.');
    }
  };

  const handleLoadNewPassage = () => {
    setPassageIndex((prev) => (prev + 1) % filteredPassages.length);
    setShowModal(false);
  };

  const handleResetStreak = async () => {
    if (confirm('Are you sure you want to reset your streak? This cannot be undone.')) {
      await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ resetProgress: true }),
      });
      setCurrentStreak(0);
      setBestStreak(0);
      setTotalBooksRead(0);
      setTodayRead(false);
      alert('Streak reset. Start fresh today!');
    }
  };

  const handleChangePreferences = async () => {
    await fetch('/api/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences: null }),
    });
    setUserPreferences(null);
    setPreferencesSubmitted(false);
    setFilteredPassages(SAMPLE_PASSAGES);
    setPassageIndex(0);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  const canWrite = todayRead;

  if (loading) {
    return null;
  }

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
                  <div className={`${styles.noticeCard} ${styles.noticePositive}`}>
                    <p style={{ fontSize: '1.2rem', color: '#333', marginBottom: '15px' }}>
                      🎯 You&apos;re all set for today! Check back tomorrow to keep your streak alive.
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
                <div className={`${styles.noticeCard} ${styles.noticeWarning}`}>
                  <p style={{ fontSize: '1.1rem', color: '#c41e3a', marginBottom: '15px' }}>
                    😔 Sorry, we don&apos;t have passages that match all your preferences right now.
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
