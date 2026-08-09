import { useState, type ChangeEvent, type FormEvent } from 'react';
import styles from '@/styles/Home.module.css';
import { errorMessage, updatePreferences } from '@/services/apiClient';
import {
  DIFFICULTIES,
  GENRES,
  PASSAGE_LENGTHS,
  type Difficulty,
  type Genre,
  type PassageLength,
  type Preferences,
  type PublicProfile,
} from '@/types/domain';

interface PreferenceFormProps {
  onSubmit: (profile: PublicProfile) => void;
}

export default function PreferenceForm({ onSubmit }: PreferenceFormProps) {
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>([]);
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [passageLength, setPassageLength] = useState<PassageLength>('medium');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGenreChange = (genre: Genre): void => {
    setSelectedGenres((previous) =>
      previous.includes(genre)
        ? previous.filter((selectedGenre) => selectedGenre !== genre)
        : [...previous, genre],
    );
  };

  const handleDifficultyChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value as Difficulty;
    if (DIFFICULTIES.includes(value)) {
      setDifficulty(value);
    }
  };

  const handleLengthChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value as PassageLength;
    if (PASSAGE_LENGTHS.includes(value)) {
      setPassageLength(value);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (selectedGenres.length === 0) {
      setError('Please select at least one genre.');
      return;
    }

    const preferences: Preferences = {
      genres: selectedGenres,
      difficulty,
      passageLength,
      completedAt: new Date().toISOString(),
    };

    setError('');
    setIsSubmitting(true);

    try {
      const profile = await updatePreferences(preferences);
      onSubmit(profile);
    } catch (submissionError) {
      setError(errorMessage(submissionError, 'Unable to save your preferences right now.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.preferenceFormContainer}>
      <div className={styles.preferenceForm}>
        <p className={styles.eyebrow} style={{ textAlign: 'center' }}>
          Set up your reading atelier
        </p>
        <h2 className={styles.preferenceTitle}>Build a reading ritual that feels like yours.</h2>
        <p className={styles.preferenceSubtitle}>
          Pick the ideas and pace that pull you in. You can retune this mix whenever your curiosity
          changes.
        </p>

        <form onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <fieldset
            className={styles.formSection}
            disabled={isSubmitting}
            style={{ border: 0, padding: 0, margin: 0 }}
          >
            <legend className={styles.formLabel}>
              What ideas do you want more of? Pick at least one.
            </legend>
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
          </fieldset>

          <fieldset
            className={styles.formSection}
            disabled={isSubmitting}
            style={{ border: 0, padding: 0, margin: 0 }}
          >
            <legend className={styles.formLabel}>How much stretch feels good right now?</legend>
            <div className={styles.radioGroup}>
              {DIFFICULTIES.map((level) => (
                <label key={level} className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="difficulty"
                    value={level}
                    checked={difficulty === level}
                    onChange={handleDifficultyChange}
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
          </fieldset>

          <fieldset
            className={styles.formSection}
            disabled={isSubmitting}
            style={{ border: 0, padding: 0, margin: 0 }}
          >
            <legend className={styles.formLabel}>What kind of reading window do you have?</legend>
            <div className={styles.radioGroup}>
              <label className={styles.radioLabel}>
                <input
                  type="radio"
                  name="length"
                  value="short"
                  checked={passageLength === 'short'}
                  onChange={handleLengthChange}
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
                  onChange={handleLengthChange}
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
                  onChange={handleLengthChange}
                  className={styles.radio}
                />
                <span>Deep dive (5+ minutes)</span>
              </label>
            </div>
          </fieldset>

          <button
            type="submit"
            className={`${styles.button} ${styles.primaryButton}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving your reading mix…' : 'Create my reading mix →'}
          </button>

          {error && (
            <p className={styles.errorText} role="alert">
              {error}
            </p>
          )}
          {isSubmitting && (
            <p className={styles.helpText} role="status">
              Saving preferences…
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
