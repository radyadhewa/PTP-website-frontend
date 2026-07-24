import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showClearData, setShowClearData] = useState(false);

  useEffect(() => {
    fetch('/api/me').then((response) => {
      if (response.ok) {
        router.replace('/homepage');
      }
    });
  }, [router]);

  const handleClearStorageData = () => {
    setShowClearData(false);
    setError('This app now uses the server for account data. Create a new account or sign in with an existing one.');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const payload = mode === 'login'
      ? { email, password }
      : { email, password, confirmPassword };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(result.error || 'Unable to complete your request.');
      return;
    }

    router.push('/homepage');
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
            <h1 className={styles.title}>{mode === 'login' ? 'Sign In' : 'Create Account'}</h1>
            <p className={styles.subtitle}>
              {mode === 'login'
                ? 'Use your account to keep your reading streak across sessions.'
                : 'Create a new account to save your progress and return anytime.'}
            </p>
          </div>

          <div className={styles.authCard}>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.formLabel}>Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.formLabel}>Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={styles.formInput}
                  required
                />
              </div>

              {mode === 'signup' && (
                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword" className={styles.formLabel}>Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className={styles.formInput}
                    required
                  />
                </div>
              )}

              {error && <p className={styles.errorText}>{error}</p>}

              <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                type="button"
                className={`${styles.button} ${styles.secondaryButton}`}
                onClick={() => {
                  setMode(mode === 'login' ? 'signup' : 'login');
                  setError('');
                }}
              >
                {mode === 'login' ? 'Create a new account' : 'Already have an account? Sign in'}
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
