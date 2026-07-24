import { useState } from 'react';
import styles from '@/styles/Home.module.css';

const GENRES = [
  'Science & Technology',
  'Nature & Environment',
  'History & Culture',
  'Self-Improvement',
  'Fiction & Literature',
  'Health & Wellness',
];

const DIFFICULTY_LEVELS = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

export default function PreferenceForm({ onSubmit }) {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [passageLength, setPassageLength] = useState('medium');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleGenreChange = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedGenres.length === 0) {
      setError('Please select at least one genre.');
      return;
    }

    setError('');

    const preferences = {
      genres: selectedGenres,
      difficulty,
      passageLength,
      completedAt: new Date().toISOString(),
    };

    const response = await fetch('/api/me', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setError(payload.error || 'Unable to save your preferences right now.');
      return;
    }

    setSubmitted(true);
    onSubmit(preferences);
  };

  return (
    <div className={styles.preferenceFormContainer}>
      <div className={styles.preferenceForm}>
        <h2 className={styles.preferenceTitle}>
          🎯 Let&apos;s Personalize Your Reading Experience
        </h2>
        <p className={styles.preferenceSubtitle}>
          Tell us what you&apos;d like to read about so we can tailor your content
        </p>

        <form onSubmit={handleSubmit}>
          {/* Genre Selection */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              📚 What types of genres do you enjoy? (Select at least one)
            </label>
            <div className={styles.checkboxGroup}>
              {GENRES.map((genre) => (
                <label key={genre} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre)}
                    onChange={() => handleGenreChange(genre)}
                    className={styles.checkbox}
                  />
                  <span>{genre}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty Level */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              📖 What&apos;s your preferred reading difficulty level?
            </label>
            <div className={styles.radioGroup}>
              {DIFFICULTY_LEVELS.map((level) => (
                <label key={level} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="difficulty"
                    value={level}
                    checked={difficulty === level}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className={styles.radio}
                  />
                  <span>{level}</span>
                </label>
              ))}
            </div>
            <p className={styles.helpText}>
              {difficulty === 'Beginner' && 'Simple language, shorter sentences'}
              {difficulty === 'Intermediate' && 'Balanced vocabulary and sentence structure'}
              {difficulty === 'Advanced' && 'Complex vocabulary and intricate concepts'}
            </p>
          </div>

          {/* Passage Length */}
          <div className={styles.formSection}>
            <label className={styles.formLabel}>
              ⏱️ How much time do you have for reading?
            </label>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="length"
                  value="short"
                  checked={passageLength === 'short'}
                  onChange={(e) => setPassageLength(e.target.value)}
                  className={styles.radio}
                />
                <span>Quick read (2-3 minutes)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="length"
                  value="medium"
                  checked={passageLength === 'medium'}
                  onChange={(e) => setPassageLength(e.target.value)}
                  className={styles.radio}
                />
                <span>Medium read (3-5 minutes)</span>
              </label>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="length"
                  value="long"
                  checked={passageLength === 'long'}
                  onChange={(e) => setPassageLength(e.target.value)}
                  className={styles.radio}
                />
                <span>Deep dive (5+ minutes)</span>
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className={`${styles.button} ${styles.primaryButton}`}>
            ✨ Start Reading with My Preferences
          </button>

          {error && <p className={styles.errorText}>{error}</p>}
        </form>

        {submitted && (
          <div className={styles.successMessage}>
            ✅ Great! Your preferences have been saved. Let&apos;s get started!
          </div>
        )}
      </div>
    </div>
  );
}
