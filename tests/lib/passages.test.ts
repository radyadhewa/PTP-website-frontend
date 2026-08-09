import { describe, expect, it } from 'vitest';
import { filterPassagesByPreferences, SAMPLE_PASSAGES } from '@/lib/passages';
import type { Preferences } from '@/types/domain';

const preferences: Preferences = {
  genres: ['Science & Technology'],
  difficulty: 'Advanced',
  passageLength: 'long',
  completedAt: '2026-01-01T00:00:00.000Z',
};

describe('filterPassagesByPreferences', () => {
  it('returns all sample passages when preferences are absent', () => {
    expect(filterPassagesByPreferences(null)).toEqual(SAMPLE_PASSAGES);
  });

  it('returns passages matching all selected preferences', () => {
    const passages = filterPassagesByPreferences(preferences);

    expect(passages).toHaveLength(1);
    expect(passages[0]).toMatchObject({
      genre: 'Science & Technology',
      difficulty: 'Advanced',
      length: 'long',
    });
  });

  it('falls back to matching genre and difficulty when no passage has the requested length', () => {
    const passages = filterPassagesByPreferences({ ...preferences, passageLength: 'short' });

    expect(passages).toHaveLength(1);
    expect(passages[0]).toMatchObject({
      genre: 'Science & Technology',
      difficulty: 'Advanced',
      length: 'long',
    });
  });

  it('falls back to the complete sample set when no partial match exists', () => {
    const passages = filterPassagesByPreferences({
      ...preferences,
      genres: ['Fiction & Literature'],
    });

    expect(passages).toEqual(SAMPLE_PASSAGES);
  });
});
