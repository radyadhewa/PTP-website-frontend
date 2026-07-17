import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';

const analyzeWriting = (draft) => {
  const words = draft.trim().split(/\s+/).filter(Boolean);
  const sentences = draft.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0);
  const weakPoints = [];
  const strengths = [];
  const suggestions = [];

  if (words.length < 50) {
    weakPoints.push('Your draft is still fairly short. Add one more detail or example to make it more complete.');
  } else {
    strengths.push('You wrote a solid amount of text, which shows good effort and engagement.');
  }

  if (sentences.length < 2) {
    weakPoints.push('Your ideas would be easier to follow if you split them into more than one sentence.');
  } else {
    strengths.push('Your response is organized into multiple sentences, which helps readability.');
  }

  if (!/[.!?]/.test(draft)) {
    weakPoints.push('Using punctuation can make your writing easier to follow.');
  } else {
    strengths.push('You used punctuation that helps guide the flow of your ideas.');
  }

  const wordCounts = words.reduce((acc, word) => {
    const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized) {
      acc[normalized] = (acc[normalized] || 0) + 1;
    }
    return acc;
  }, {});

  const repeatedWord = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .find(([, count]) => count > 2);

  if (repeatedWord) {
    weakPoints.push(`The word "${repeatedWord[0]}" appears several times. Try swapping in a synonym or a new phrase.`);
  } else {
    strengths.push('Your wording feels varied, which keeps the piece engaging.');
  }

  suggestions.push('Add one concrete example to support your main idea.');
  suggestions.push('Read your draft aloud and smooth out any awkward sentences.');
  suggestions.push('End with a clear takeaway or conclusion to strengthen your message.');

  return { weakPoints, strengths, suggestions };
};

export default function WritingPage() {
  const [writingDraft, setWritingDraft] = useState('');
  const [writingFeedback, setWritingFeedback] = useState(null);
  const [todayRead, setTodayRead] = useState(false);

  useEffect(() => {
    const lastReadDate = localStorage.getItem('lastReadDate');
    const today = new Date().toDateString();
    setTodayRead(lastReadDate === today);

    const savedWritingDraft = localStorage.getItem('writingDraft');
    if (savedWritingDraft) {
      setWritingDraft(savedWritingDraft);
    }
  }, []);

  const handleWritingSubmit = (event) => {
    event.preventDefault();
    const trimmedDraft = writingDraft.trim();

    if (!trimmedDraft) {
      setWritingFeedback({
        weakPoints: ['Start typing a few sentences first so we can give you meaningful feedback.'],
        strengths: ['You are taking the first step by trying to write.'],
        suggestions: ['Try describing your main idea in one sentence before adding more detail.'],
      });
      return;
    }

    const feedback = analyzeWriting(trimmedDraft);
    localStorage.setItem('writingDraft', trimmedDraft);
    setWritingFeedback(feedback);
  };

  const handleClearWriting = () => {
    setWritingDraft('');
    setWritingFeedback(null);
    localStorage.removeItem('writingDraft');
  };

  return (
    <>
      <Head>
        <title>Daily Reader - Writing</title>
        <meta name="description" content="Continue your learning with a focused writing practice after reading." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main>
        <div className={styles.container}>
          <div className={styles.header}>
            <h1 className={styles.title}>✍️ Writing Practice</h1>
            <p className={styles.subtitle}>
              {todayRead
                ? 'Great! You read today, so now you can practice writing about it.'
                : 'Read a passage first to unlock the writing page and keep your learning flow.'}
            </p>
          </div>

          <div className={styles.pageNav}>
            <Link href="/homepage" className={styles.pageNavLink}>
              Reading
            </Link>
            <Link href="/writing" className={`${styles.pageNavLink} ${styles.pageNavLinkActive}`}>
              Writing
            </Link>
          </div>

          {!todayRead ? (
            <div className={styles.writingCard} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.1rem', color: '#555', marginBottom: '20px' }}>
                You need to complete today&rsquo;s reading before using the writing page.
              </p>
              <Link href="/homepage" className={`${styles.button} ${styles.primaryButton}`}>
                Go back to Reading
              </Link>
            </div>
          ) : (
            <section className={styles.writingSection}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.readingLabel}>✍️ Write about what you read</h2>
                <p className={styles.sectionHint}>
                  Use this page for a focused writing exercise after finishing your passage.
                </p>
              </div>

              <form onSubmit={handleWritingSubmit} className={styles.writingCard}>
                <textarea
                  value={writingDraft}
                  onChange={(event) => setWritingDraft(event.target.value)}
                  className={styles.writingTextarea}
                  rows={12}
                  placeholder="Type your writing here..."
                />

                <div className={styles.buttonGroup}>
                  <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>
                    ✍️ Submit Writing
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.secondaryButton}`}
                    onClick={handleClearWriting}
                  >
                    Clear
                  </button>
                </div>
              </form>

              {writingFeedback && (
                <div className={styles.feedbackPanel}>
                  <h3 className={styles.feedbackTitle}>Feedback on your draft</h3>

                  <div className={styles.feedbackGrid}>
                    <div className={styles.feedbackCard}>
                      <h4 className={styles.feedbackHeading}>Weak points</h4>
                      <ul className={styles.feedbackList}>
                        {writingFeedback.weakPoints.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>

                    <div className={styles.feedbackCard}>
                      <h4 className={styles.feedbackHeading}>Strengths so far</h4>
                      <ul className={styles.feedbackList}>
                        {writingFeedback.strengths.map((point) => (
                          <li key={point}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className={styles.feedbackCard}>
                    <h4 className={styles.feedbackHeading}>Suggestions to improve</h4>
                    <ul className={styles.feedbackList}>
                      {writingFeedback.suggestions.map((point) => (
                        <li key={point}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
