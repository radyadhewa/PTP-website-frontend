import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import PreferenceForm from '@/components/PreferenceForm';
import ReadingPassage from '@/components/ReadingPassage';
import StreakCounter from '@/components/StreakCounter';
import StudyNavigation from '@/components/StudyNavigation';
import type { VisualizationModalProps } from '@/components/VisualizationModal';
import {
  ApiError,
  errorMessage,
  getProfile,
  logout,
  markRead,
  reset,
  updatePreferences,
} from '@/services/apiClient';
import type { PublicProfile } from '@/types/domain';

const VisualizationModal = dynamic<VisualizationModalProps>(
  () => import('@/components/VisualizationModal'),
  {
    ssr: false,
    loading: () => (
      <p role="status" className={styles.helpText}>
        Opening Studio Lens…
      </p>
    ),
  },
);

type PendingAction = 'read' | 'reset' | 'preferences' | 'logout' | null;

export default function Home() {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [passageIndex, setPassageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const loadProfile = useCallback(
    async (signal?: AbortSignal): Promise<void> => {
      try {
        const loadedProfile = await getProfile(signal);
        setProfile(loadedProfile);
        setError('');
      } catch (profileError) {
        if (profileError instanceof ApiError && profileError.aborted) return;
        if (profileError instanceof ApiError && profileError.status === 401) {
          await router.replace('/');
          return;
        }
        setError(errorMessage(profileError, 'Unable to load your reading studio.'));
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadProfile(controller.signal);
    return () => controller.abort();
  }, [loadProfile]);

  const handlePreferencesSubmit = (updatedProfile: PublicProfile): void => {
    setProfile(updatedProfile);
    setPassageIndex(0);
    setError('');
  };

  const handleReadComplete = async (): Promise<void> => {
    if (!profile) return;

    const readToday = profile.readingData.lastReadDate === new Date().toDateString();
    if (readToday) {
      window.alert("You've already read today! Come back tomorrow to continue your streak.");
      return;
    }

    setPendingAction('read');
    setError('');
    try {
      const updatedProfile = await markRead();
      setProfile(updatedProfile);
      window.alert("🎉 Great job! You've maintained your streak! Keep reading daily!");
    } catch (mutationError) {
      setError(errorMessage(mutationError, 'Unable to save your reading progress.'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleLoadNewPassage = (): void => {
    if (!profile?.passages.length) return;
    setPassageIndex((previous) => (previous + 1) % profile.passages.length);
    setShowModal(false);
  };

  const handleResetStreak = async (): Promise<void> => {
    if (!window.confirm('Are you sure you want to reset your streak? This cannot be undone.'))
      return;

    setPendingAction('reset');
    setError('');
    try {
      const updatedProfile = await reset();
      setProfile(updatedProfile);
      window.alert('Streak reset. Start fresh today!');
    } catch (mutationError) {
      setError(errorMessage(mutationError, 'Unable to reset your progress.'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleChangePreferences = async (): Promise<void> => {
    setPendingAction('preferences');
    setError('');
    try {
      const updatedProfile = await updatePreferences(null);
      setProfile(updatedProfile);
      setPassageIndex(0);
      setShowModal(false);
    } catch (mutationError) {
      setError(errorMessage(mutationError, 'Unable to update your reading mix.'));
    } finally {
      setPendingAction(null);
    }
  };

  const handleLogout = async (): Promise<void> => {
    setPendingAction('logout');
    setError('');
    try {
      await logout();
      await router.push('/');
    } catch (logoutError) {
      setError(errorMessage(logoutError, 'Unable to sign out right now.'));
    } finally {
      setPendingAction(null);
    }
  };

  if (loading) {
    return (
      <main>
        <div className={styles.container} role="status" aria-live="polite">
          <p className={styles.eyebrow}>Daily Reader</p>
          <h1 className={styles.title}>Preparing your studio…</h1>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main>
        <div className={styles.container}>
          <p className={styles.errorText} role="alert">
            {error || 'Your reading studio could not be loaded.'}
          </p>
          <button
            type="button"
            className={`${styles.button} ${styles.primaryButton}`}
            onClick={() => void loadProfile()}
          >
            Try again
          </button>
        </div>
      </main>
    );
  }

  const todayRead = profile.readingData.lastReadDate === new Date().toDateString();
  const currentPassage =
    profile.passages.length > 0 ? profile.passages[passageIndex % profile.passages.length] : null;
  const isMutating = pendingAction !== null;

  return (
    <>
      <Head>
        <title>Daily Reader - Build Your Reading Habit</title>
        <meta
          name="description"
          content="A platform to help you build a daily reading habit with streak tracking"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75'>📖</text></svg>"
        />
      </Head>

      <main aria-busy={isMutating}>
        <div className={styles.container}>
          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}
          {pendingAction && (
            <p className={styles.helpText} role="status">
              Saving your changes…
            </p>
          )}

          {!profile.preferences ? (
            <PreferenceForm onSubmit={handlePreferencesSubmit} />
          ) : (
            <>
              <div className={styles.header}>
                <p className={styles.eyebrow}>Your daily reading atelier</p>
                <h1 className={styles.title}>
                  Make a little
                  <br />
                  room for ideas.
                </h1>
                <p className={styles.subtitle}>
                  {todayRead
                    ? 'Today’s reading is complete. Turn the idea over once more in a short writing practice.'
                    : 'A focused passage, a helpful lens, and a small ritual that compounds over time.'}
                </p>
                <div>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.secondaryButton}`}
                    onClick={() => void handleChangePreferences()}
                    disabled={isMutating}
                  >
                    {pendingAction === 'preferences' ? 'Retuning your mix…' : 'Tune my reading mix'}
                  </button>
                </div>
              </div>

              <StudyNavigation active="reading" writingUnlocked={todayRead} />

              <StreakCounter
                currentStreak={profile.readingData.currentStreak}
                bestStreak={profile.readingData.bestStreak}
              />

              {currentPassage ? (
                !todayRead ? (
                  <>
                    <ReadingPassage
                      passage={currentPassage.text}
                      onVisualize={() => setShowModal(true)}
                      onReadComplete={() => void handleReadComplete()}
                      isCompleting={pendingAction === 'read'}
                    />
                    <button
                      type="button"
                      className={`${styles.button} ${styles.secondaryButton}`}
                      onClick={handleLoadNewPassage}
                      disabled={isMutating}
                      style={{ width: '100%' }}
                    >
                      Load Another Passage
                    </button>
                  </>
                ) : (
                  <div className={`${styles.noticeCard} ${styles.noticePositive}`}>
                    <p style={{ fontSize: '1.2rem', color: '#333', marginBottom: '15px' }}>
                      🎯 You&apos;re all set for today! Check back tomorrow to keep your streak
                      alive.
                    </p>
                    <button
                      type="button"
                      className={`${styles.button} ${styles.primaryButton}`}
                      onClick={() => void router.push('/writing')}
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
                    type="button"
                    className={`${styles.button} ${styles.primaryButton}`}
                    onClick={() => void handleChangePreferences()}
                    disabled={isMutating}
                  >
                    🎯 Update Preferences
                  </button>
                </div>
              )}

              <div className={styles.stats}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{profile.readingData.currentStreak}</div>
                  <div className={styles.statLabel}>Current Streak</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{profile.readingData.bestStreak}</div>
                  <div className={styles.statLabel}>Best Streak</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>{profile.readingData.totalBooksRead}</div>
                  <div className={styles.statLabel}>Passages Read</div>
                </div>
              </div>

              <button
                type="button"
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={() => void handleResetStreak()}
                disabled={isMutating}
                style={{ width: '100%', marginTop: '20px' }}
              >
                {pendingAction === 'reset' ? 'Resetting progress…' : '🔄 Reset Progress'}
              </button>

              <button
                type="button"
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={() => void handleLogout()}
                disabled={isMutating}
                style={{ width: '100%', marginTop: '12px' }}
              >
                {pendingAction === 'logout' ? 'Signing out…' : 'Sign Out'}
              </button>
            </>
          )}
        </div>
      </main>

      {showModal && currentPassage && (
        <VisualizationModal
          isOpen
          passage={currentPassage.text}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
