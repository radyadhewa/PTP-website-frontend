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
    const parsed = JSON.parse(raw);
    // Ensure it's an array
    if (!Array.isArray(parsed)) {
      console.warn('readingUsers is not an array, resetting:', parsed);
      return [];
    }
    return parsed || [];
  } catch (error) {
    console.error('Error parsing readingUsers from localStorage:', error, 'Raw value:', raw);
    return [];
  }
};

const saveUsers = (users) => {
  try {
    localStorage.setItem('readingUsers', JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users to localStorage:', error);
    alert('Error saving data. Please check your browser storage.');
  }
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
  const [showClearData, setShowClearData] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUserEmail();
    if (currentUser) {
      router.replace('/');
    }
  }, [router]);

  const handleClearStorageData = () => {
    if (confirm('This will clear all stored account data. Are you sure?')) {
      try {
        localStorage.removeItem('readingUsers');
        localStorage.removeItem('readingCurrentUser');
        localStorage.removeItem('readingData');
        localStorage.removeItem('userPreferences');
        setShowClearData(false);
        setError('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        alert('All data has been cleared. You can now create a new account.');
      } catch (err) {
        console.error('Error clearing localStorage:', err);
        alert('Error clearing data.');
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = normalizeEmail(email);
    console.log('Attempting to ' + mode + ' with email:', normalizedEmail);
    
    if (!normalizedEmail || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const users = loadUsers();
    console.log('Current users in system:', users);
    
    const existing = users.find((user) => {
      const userEmail = normalizeEmail(user.email);
      return userEmail === normalizedEmail;
    });

    if (mode === 'signup') {
      if (existing) {
        console.warn('Account already exists for email:', normalizedEmail);
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
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [...users, newUser];
      saveUsers(updatedUsers);
      console.log('New account created:', normalizedEmail);
      
      setCurrentUserEmail(normalizedEmail);
      router.push('/');
      return;
    }

    if (!existing || existing.passwordHash !== hashPassword(password)) {
      console.warn('Login failed for email:', normalizedEmail);
      setError('Incorrect email or password.');
      return;
    }

    console.log('Login successful for email:', normalizedEmail);
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
              <div style={{
                marginTop: '16px',
                padding: '12px',
                background: '#ffe0e0',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
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
