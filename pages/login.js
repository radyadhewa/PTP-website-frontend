import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';

const normalizeEmail = (email) => email.trim().toLowerCase();
const hashPassword = (password) => btoa(password);

const loadUsers = () => {
  const raw = localStorage.getItem('readingUsers');
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
};

const saveUsers = (users) => {
  localStorage.setItem('readingUsers', JSON.stringify(users));
};

const getCurrentUserEmail = () => localStorage.getItem('readingCurrentUser');
const setCurrentUserEmail = (email) => localStorage.setItem('readingCurrentUser', email);

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = getCurrentUserEmail();
    if (currentUser) {
      router.replace('/');
    }
  }, [router]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const users = loadUsers();
    const existing = users.find((user) => user.email === normalizedEmail);

    if (mode === 'signup') {
      if (existing) {
        setError('An account with that email already exists.');
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      const newUser = {
        email: normalizedEmail,
        passwordHash: hashPassword(password),
      };

      saveUsers([...users, newUser]);
      setCurrentUserEmail(normalizedEmail);
      router.push('/');
      return;
    }

    if (!existing || existing.passwordHash !== hashPassword(password)) {
      setError('Incorrect email or password.');
      return;
    }

    setCurrentUserEmail(normalizedEmail);
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Daily Reader - Login</title>
        <meta name="description" content="Log in or sign up to save your reading streak." />
      </Head>

      <main>
        <div className={styles.container} style={{ maxWidth: '520px', margin: '80px auto' }}>
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
          </div>
        </div>
      </main>
    </>
  );
}
