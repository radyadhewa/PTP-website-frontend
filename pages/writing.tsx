import { useEffect, useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import styles from '@/styles/Home.module.css';
import StudyNavigation from '@/components/StudyNavigation';
import { ApiError, errorMessage, getProfile, updateWriting } from '@/services/apiClient';
import type { WritingDraft, WritingFeedback } from '@/types/domain';

const EMPTY_DRAFT: WritingDraft = {
  introduction: '',
  body: '',
  conclusion: '',
};

function analyzeWriting(draft: string): WritingFeedback {
  const words = draft.trim().split(/\s+/).filter(Boolean);
  const sentences = draft.split(/[.!?]+/).filter((sentence) => sentence.trim().length > 0);
  const weakPoints: string[] = [];
  const strengths: string[] = [];
  const suggestions: string[] = [];

  if (words.length < 50) {
    weakPoints.push(
      'Your draft is still fairly short. Add one more detail or example to make it more complete.',
    );
  } else {
    strengths.push('You wrote a solid amount of text, which shows good effort and engagement.');
  }

  if (sentences.length < 2) {
    weakPoints.push(
      'Your ideas would be easier to follow if you split them into more than one sentence.',
    );
  } else {
    strengths.push('Your response is organized into multiple sentences, which helps readability.');
  }

  if (!/[.!?]/.test(draft)) {
    weakPoints.push('Using punctuation can make your writing easier to follow.');
  } else {
    strengths.push('You used punctuation that helps guide the flow of your ideas.');
  }

  const wordCounts = words.reduce<Record<string, number>>((counts, word) => {
    const normalized = word.toLowerCase().replace(/[^a-z]/g, '');
    if (normalized) counts[normalized] = (counts[normalized] ?? 0) + 1;
    return counts;
  }, {});

  const repeatedWord = Object.entries(wordCounts)
    .sort((first, second) => second[1] - first[1])
    .find(([, count]) => count > 2);

  if (repeatedWord) {
    weakPoints.push(
      `The word "${repeatedWord[0]}" appears several times. Try swapping in a synonym or a new phrase.`,
    );
  } else {
    strengths.push('Your wording feels varied, which keeps the piece engaging.');
  }

  suggestions.push('Add one concrete example to support your main idea.');
  suggestions.push('Read your draft aloud and smooth out any awkward sentences.');
  suggestions.push('End with a clear takeaway or conclusion to strengthen your message.');

  return { weakPoints, strengths, suggestions };
}

export default function WritingPage() {
  const [writingDraft, setWritingDraft] = useState<WritingDraft>(EMPTY_DRAFT);
  const [writingFeedback, setWritingFeedback] = useState<WritingFeedback | null>(null);
  const [todayRead, setTodayRead] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    const loadWriting = async (): Promise<void> => {
      try {
        const profile = await getProfile(controller.signal);
        setTodayRead(profile.readingData.lastReadDate === new Date().toDateString());
        setWritingDraft(profile.writingDraft);
      } catch (profileError) {
        if (profileError instanceof ApiError && profileError.aborted) return;
        setError(errorMessage(profileError, 'Unable to load your writing practice.'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadWriting();
    return () => controller.abort();
  }, []);

  const combinedDraft = useMemo(
    () =>
      [writingDraft.introduction, writingDraft.body, writingDraft.conclusion]
        .map((text) => text.trim())
        .filter(Boolean)
        .join('\n\n'),
    [writingDraft],
  );

  const handleFieldChange = (section: keyof WritingDraft, value: string): void => {
    setWritingDraft((previous) => ({ ...previous, [section]: value }));
  };

  const handleWritingSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError('');

    if (!combinedDraft) {
      setWritingFeedback({
        weakPoints: ['Start typing a few sentences first so we can give you meaningful feedback.'],
        strengths: ['You are taking the first step by trying to write.'],
        suggestions: ['Try describing your main idea in one sentence before adding more detail.'],
      });
      return;
    }

    const feedback = analyzeWriting(combinedDraft);
    setIsSaving(true);
    try {
      const updatedProfile = await updateWriting(writingDraft);
      setWritingDraft(updatedProfile.writingDraft);
      setWritingFeedback(feedback);
    } catch (mutationError) {
      setError(errorMessage(mutationError, 'Unable to save your writing right now.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearWriting = async (): Promise<void> => {
    setError('');
    setIsSaving(true);
    try {
      const updatedProfile = await updateWriting(EMPTY_DRAFT);
      setWritingDraft(updatedProfile.writingDraft);
      setWritingFeedback(null);
    } catch (mutationError) {
      setError(errorMessage(mutationError, 'Unable to clear your writing right now.'));
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <main>
        <div className={styles.container} role="status" aria-live="polite">
          <p className={styles.eyebrow}>Daily Reader</p>
          <h1 className={styles.title}>Preparing your writing desk…</h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Head>
        <title>Daily Reader - Writing</title>
        <meta
          name="description"
          content="Continue your learning with a focused writing practice after reading."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main aria-busy={isSaving}>
        <div className={styles.container}>
          <div className={styles.header}>
            <p className={styles.eyebrow}>Step two · Make it yours</p>
            <h1 className={styles.title}>
              Write it
              <br />
              into focus.
            </h1>
            <p className={styles.subtitle}>
              {todayRead
                ? 'Use the idea you just met as raw material. Studio Lens will reflect on the shape of your draft after you submit.'
                : 'Reading opens this next stage, so your writing begins with an idea already in motion.'}
            </p>
          </div>

          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}
          {isSaving && (
            <p className={styles.helpText} role="status">
              Saving your writing…
            </p>
          )}

          <StudyNavigation active="writing" writingUnlocked={todayRead} />

          {!todayRead ? (
            <div className={`${styles.writingCard} ${styles.centeredCard}`}>
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
                <p className={styles.eyebrow}>Your draft, your voice</p>
                <h2 className={styles.readingLabel}>Give the idea a second life.</h2>
                <p className={styles.sectionHint}>
                  Shape a beginning, build a middle, and leave one clear takeaway. The feedback is a
                  prompt for your next revision—not a grade.
                </p>
              </div>

              <form onSubmit={handleWritingSubmit} className={styles.writingCard}>
                <div className={styles.sectionField}>
                  <label htmlFor="intro" className={styles.fieldLabel}>
                    Introduction
                  </label>
                  <p className={styles.fieldHint}>
                    Set up the context and main idea. Describe what your writing will focus on and
                    why it matters.
                  </p>
                  <textarea
                    id="intro"
                    value={writingDraft.introduction}
                    onChange={(event) => handleFieldChange('introduction', event.target.value)}
                    className={styles.fieldTextarea}
                    rows={5}
                    placeholder="Introduce the topic and main idea..."
                    disabled={isSaving}
                  />
                </div>

                <div className={styles.sectionField}>
                  <label htmlFor="body" className={styles.fieldLabel}>
                    Middle / Body
                  </label>
                  <p className={styles.fieldHint}>
                    Develop your main points with examples, details, or reasoning.
                  </p>
                  <textarea
                    id="body"
                    value={writingDraft.body}
                    onChange={(event) => handleFieldChange('body', event.target.value)}
                    className={styles.fieldTextarea}
                    rows={8}
                    placeholder="Expand on your ideas here..."
                    disabled={isSaving}
                  />
                </div>

                <div className={styles.sectionField}>
                  <label htmlFor="conclusion" className={styles.fieldLabel}>
                    Conclusion
                  </label>
                  <p className={styles.fieldHint}>
                    Summarize the key takeaway and leave the reader with a final thought.
                  </p>
                  <textarea
                    id="conclusion"
                    value={writingDraft.conclusion}
                    onChange={(event) => handleFieldChange('conclusion', event.target.value)}
                    className={styles.fieldTextarea}
                    rows={5}
                    placeholder="Wrap up with a strong conclusion..."
                    disabled={isSaving}
                  />
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="submit"
                    className={`${styles.button} ${styles.primaryButton}`}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving…' : '✍️ Submit Writing'}
                  </button>
                  <button
                    type="button"
                    className={`${styles.button} ${styles.secondaryButton}`}
                    onClick={() => void handleClearWriting()}
                    disabled={isSaving}
                  >
                    Clear
                  </button>
                </div>

                {combinedDraft && (
                  <div className={styles.combinedPreview}>
                    <h4 className={styles.feedbackHeading}>Combined Draft Preview</h4>
                    <div>{combinedDraft}</div>
                  </div>
                )}
              </form>

              {writingFeedback && (
                <div className={styles.feedbackPanel} aria-live="polite">
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
