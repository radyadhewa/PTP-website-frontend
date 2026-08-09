import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import { ApiError, auth, errorMessage, getProfile } from '@/services/apiClient';
import type { AuthPayload, SignupPayload } from '@/types/api';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showClearData, setShowClearData] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    const checkSession = async (): Promise<void> => {
      try {
        await getProfile(controller.signal);
        await router.replace('/homepage');
      } catch (profileError) {
        if (profileError instanceof ApiError && profileError.aborted) return;
        if (!(profileError instanceof ApiError) || profileError.status !== 401) {
          setError(errorMessage(profileError, 'Unable to check your session right now.'));
        }
      } finally {
        if (!controller.signal.aborted) setIsCheckingSession(false);
      }
    };

    void checkSession();
    return () => controller.abort();
  }, [router]);

  const handleClearStorageData = (): void => {
    setShowClearData(false);
    setError(
      'This app now uses the server for account data. Create a new account or sign in with an existing one.',
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const payload: AuthPayload | SignupPayload =
      mode === 'login' ? { email, password } : { email, password, confirmPassword };

    setIsSubmitting(true);
    try {
      await auth(mode, payload);
      await router.push('/homepage');
    } catch (authError) {
      setError(errorMessage(authError, 'Unable to complete your request.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Daily Reader - Login</title>
        <meta name="description" content="Log in or sign up to save your reading streak." />
      </Head>

      <main className={styles.authPage}>
        <div className={`${styles.container} ${styles.authContainer}`}>
          <div className={styles.authHeader}>
            <p className={styles.eyebrow}>Daily Reader · your idea studio</p>
            <h1 className={styles.title}>
              {mode === 'login' ? (
                <>
                  Welcome
                  <br />
                  back.
                </>
              ) : (
                <>
                  Start small.
                  <br />
                  Stay curious.
                </>
              )}
            </h1>
            <p className={styles.subtitle}>
              {mode === 'login'
                ? 'Step back into your reading ritual and pick up the thread.'
                : 'Make a small home for the ideas you want to keep returning to.'}
            </p>
          </div>

          <div className={styles.authCard}>
            {isCheckingSession && (
              <p className={styles.helpText} role="status">
                Checking your session…
              </p>
            )}

            <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={styles.formInput}
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.formLabel}>
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={styles.formInput}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={isSubmitting}
                  required
                />
              </div>

              {mode === 'signup' && (
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.formLabel}>
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={styles.formInput}
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              )}

              {error && (
                <p className={styles.errorText} role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                className={`${styles.button} ${styles.primaryButton}`}
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? 'Opening your studio…'
                  : mode === 'login'
                    ? 'Enter the studio →'
                    : 'Create my studio →'}
              </button>
              {isSubmitting && (
                <p className={styles.helpText} role="status">
                  Signing you in…
                </p>
              )}
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                type="button"
                className={`${styles.button} ${styles.secondaryButton}`}
                disabled={isSubmitting}
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError('');
                }}
              >
                {mode === 'login'
                  ? 'New here? Create an account'
                  : 'Already have a studio? Sign in'}
              </button>
            </div>

            {!showClearData && (
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  className={`${styles.button} ${styles.secondaryButton}`}
                  onClick={() => setShowClearData(true)}
                  style={{ fontSize: '0.85rem', opacity: 0.7 }}
                >
                  Having issues? Clear storage
                </button>
              </div>
            )}

            {showClearData && (
              <div className={styles.warningPanel}>
                <p style={{ color: '#c41e3a', fontSize: '0.9rem', marginBottom: '12px' }}>
                  ⚠️ This will erase all your data and preferences
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.primaryButton}`}
                    onClick={handleClearStorageData}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Clear Everything
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.secondaryButton}`}
                    onClick={() => setShowClearData(false)}
                    style={{ fontSize: '0.85rem' }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
