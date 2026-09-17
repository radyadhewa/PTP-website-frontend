import { useCallback, useEffect, useState, type FormEvent } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/Home.module.css';
import {
  addCuratedBook,
  adminLogin,
  adminLogout,
  deleteCuratedBook,
  getAdminBooks,
  getAdminSession,
  errorMessage,
} from '@/services/apiClient';
import { DIFFICULTIES, GENRES, PASSAGE_LENGTHS, type CuratedBook, type Difficulty, type Genre, type PassageLength } from '@/types/domain';

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const [curatedBooks, setCuratedBooks] = useState<CuratedBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // New book form fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [genre, setGenre] = useState<Genre>(GENRES[0]);
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES[0]);
  const [length, setLength] = useState<PassageLength>(PASSAGE_LENGTHS[0]);
  const [text, setText] = useState('');
  const [summary, setSummary] = useState('');

  const checkAdminSession = useCallback(async (signal?: AbortSignal) => {
    try {
      const session = await getAdminSession(signal);
      setIsAdmin(session.authenticated);
      setAdminUsername(session.username);
      if (session.authenticated) {
        const books = await getAdminBooks(signal);
        setCuratedBooks(books);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void checkAdminSession(controller.signal);
    return () => controller.abort();
  }, [checkAdminSession]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const res = await adminLogin({ username: usernameInput, password: passwordInput });
      setIsAdmin(true);
      setAdminUsername(res.username);
      const books = await getAdminBooks();
      setCuratedBooks(books);
      setPasswordInput('');
    } catch (loginError) {
      setError(errorMessage(loginError, 'Invalid admin credentials.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setError('');
    setSubmitting(true);
    try {
      await adminLogout();
      setIsAdmin(false);
      setAdminUsername('');
    } catch (logoutErr) {
      setError(errorMessage(logoutErr, 'Failed to log out.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddBook = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const newBook = await addCuratedBook({
        title,
        author,
        genre,
        difficulty,
        length,
        text,
        summary: summary.trim() ? summary.trim() : undefined,
      });

      setCuratedBooks((prev) => [newBook, ...prev]);
      setSuccessMsg(`Successfully added "${newBook.title}" by ${newBook.author}!`);
      // Reset form
      setTitle('');
      setAuthor('');
      setText('');
      setSummary('');
    } catch (addErr) {
      setError(errorMessage(addErr, 'Failed to add curated book.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async (id: string, bookTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${bookTitle}"?`)) return;
    setError('');
    setSuccessMsg('');

    try {
      await deleteCuratedBook(id);
      setCuratedBooks((prev) => prev.filter((b) => b.id !== id));
      setSuccessMsg(`Deleted "${bookTitle}".`);
    } catch (delErr) {
      setError(errorMessage(delErr, 'Failed to delete book.'));
    }
  };

  if (loading) {
    return (
      <main>
        <div className={styles.container} role="status" aria-live="polite">
          <p className={styles.eyebrow}>Daily Reader Admin</p>
          <h1 className={styles.title}>Loading Admin Studio…</h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Daily Reader - Admin Portal</title>
        <meta name="description" content="Admin portal to curate books and passages." />
      </Head>

      <main aria-busy={submitting}>
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>Curator Portal · Daily Reader</p>
            <h1 className={styles.title}>
              Admin
              <br />
              Dashboard.
            </h1>
            <p className={styles.subtitle}>
              Manage specialized curated books and passages for reader recommendations.
            </p>
            <div style={{ marginTop: '12px' }}>
              <Link href="/homepage" className={`${styles.button} ${styles.secondaryButton}`}>
                ← Return to Reader Studio
              </Link>
            </div>
          </div>

          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}

          {successMsg && (
            <div className={`${styles.noticeCard} ${styles.noticePositive}`} style={{ marginBottom: '20px' }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{successMsg}</p>
            </div>
          )}

          {!isAdmin ? (
            <div className={styles.authCard} style={{ margin: '0 auto', maxWidth: '420px' }}>
              <h2 className={styles.readingLabel} style={{ marginBottom: '16px' }}>
                Admin Authentication
              </h2>
              <form onSubmit={handleLogin}>
                <div className={styles.formGroup}>
                  <label htmlFor="adminUsername" className={styles.formLabel}>
                    Username
                  </label>
                  <input
                    id="adminUsername"
                    type="text"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    className={styles.formInput}
                    required
                    disabled={submitting}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="adminPassword" className={styles.formLabel}>
                    Password
                  </label>
                  <input
                    id="adminPassword"
                    type="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className={styles.formInput}
                    required
                    disabled={submitting}
                  />
                </div>

                <button
                  type="submit"
                  className={`${styles.button} ${styles.primaryButton}`}
                  disabled={submitting}
                  style={{ width: '100%' }}
                >
                  {submitting ? 'Authenticating…' : 'Sign in as Admin →'}
                </button>
              </form>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  padding: '12px 20px',
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: '12px',
                }}
              >
                <div>
                  <strong>Logged in as:</strong> {adminUsername}
                </div>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className={`${styles.button} ${styles.secondaryButton}`}
                  style={{ fontSize: '0.85rem' }}
                  disabled={submitting}
                >
                  Log Out
                </button>
              </div>

              {/* Form to add curated book */}
              <section className={styles.writingCard} style={{ marginBottom: '40px' }}>
                <h2 className={styles.readingLabel} style={{ marginBottom: '8px' }}>
                  📚 Add Curated Book / Passage
                </h2>
                <p className={styles.sectionHint} style={{ marginBottom: '20px' }}>
                  Add a new specialized book excerpt or curated passage to be displayed in daily readers&apos; feeds.
                </p>

                <form onSubmit={handleAddBook}>
                  <div className={styles.formGroup}>
                    <label htmlFor="bookTitle" className={styles.formLabel}>
                      Book / Passage Title
                    </label>
                    <input
                      id="bookTitle"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={styles.formInput}
                      placeholder="e.g., Deep Work Excerpt"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="bookAuthor" className={styles.formLabel}>
                      Author
                    </label>
                    <input
                      id="bookAuthor"
                      type="text"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      className={styles.formInput}
                      placeholder="e.g., Cal Newport"
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                    <div className={styles.formGroup}>
                      <label htmlFor="bookGenre" className={styles.formLabel}>
                        Genre
                      </label>
                      <select
                        id="bookGenre"
                        value={genre}
                        onChange={(e) => setGenre(e.target.value as Genre)}
                        className={styles.formInput}
                        disabled={submitting}
                      >
                        {GENRES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="bookDifficulty" className={styles.formLabel}>
                        Difficulty
                      </label>
                      <select
                        id="bookDifficulty"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                        className={styles.formInput}
                        disabled={submitting}
                      >
                        {DIFFICULTIES.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="bookLength" className={styles.formLabel}>
                        Length
                      </label>
                      <select
                        id="bookLength"
                        value={length}
                        onChange={(e) => setLength(e.target.value as PassageLength)}
                        className={styles.formInput}
                        disabled={submitting}
                      >
                        {PASSAGE_LENGTHS.map((l) => (
                          <option key={l} value={l}>
                            {l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="bookText" className={styles.formLabel}>
                      Passage Text
                    </label>
                    <textarea
                      id="bookText"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className={styles.fieldTextarea}
                      rows={6}
                      placeholder="Enter the passage content..."
                      required
                      disabled={submitting}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="bookSummary" className={styles.formLabel}>
                      Specialized Summary / Key Notes (Optional)
                    </label>
                    <textarea
                      id="bookSummary"
                      value={summary}
                      onChange={(e) => setSummary(e.target.value)}
                      className={styles.fieldTextarea}
                      rows={3}
                      placeholder="Provide optional key takeaways or curation context..."
                      disabled={submitting}
                    />
                  </div>

                  <button
                    type="submit"
                    className={`${styles.button} ${styles.primaryButton}`}
                    disabled={submitting}
                  >
                    {submitting ? 'Adding Book…' : '✨ Add Curated Book'}
                  </button>
                </form>
              </section>

              {/* List of Curated Books */}
              <section>
                <h2 className={styles.readingLabel} style={{ marginBottom: '16px' }}>
                  📖 Curated Books Library ({curatedBooks.length})
                </h2>

                {curatedBooks.length === 0 ? (
                  <p className={styles.helpText}>No curated books added yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {curatedBooks.map((book) => (
                      <div
                        key={book.id}
                        className={styles.writingCard}
                        style={{ borderLeft: '4px solid #7c3aed' }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem' }}>{book.title}</h3>
                            <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '0.9rem' }}>
                              by <strong>{book.author}</strong> · {book.genre} ·{' '}
                              <span style={{ textTransform: 'capitalize' }}>{book.difficulty}</span> ·{' '}
                              <span style={{ textTransform: 'capitalize' }}>{book.length}</span>
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => void handleDeleteBook(book.id, book.title)}
                            className={`${styles.button} ${styles.secondaryButton}`}
                            style={{ fontSize: '0.8rem', color: '#c41e3a', borderColor: '#c41e3a' }}
                          >
                            Delete
                          </button>
                        </div>

                        <p style={{ fontSize: '0.95rem', lineHeight: '1.5', marginBottom: '12px' }}>
                          &ldquo;{book.text}&rdquo;
                        </p>

                        {book.summary && (
                          <div
                            style={{
                              background: '#f8fafc',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              fontSize: '0.88rem',
                              color: '#475569',
                            }}
                          >
                            <strong>Key Takeaways:</strong> {book.summary}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </>
  );
}
