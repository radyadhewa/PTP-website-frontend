import { describe, expect, it } from 'vitest';
import { ApiError } from '@/lib/api';
import {
  parseAdminLoginPayload,
  parseAuthPayload,
  parseCuratedBookInput,
  parseProfilePatch,
  parseSignupPayload,
} from '@/lib/validation';

function expectApiError(callback: () => unknown, message: string): void {
  expect(callback).toThrowError(ApiError);
  expect(callback).toThrow(message);
}

describe('admin payload validation', () => {
  it('parses valid admin login payload', () => {
    expect(parseAdminLoginPayload({ username: ' admin ', password: 'adminpassword' })).toEqual({
      username: 'admin',
      password: 'adminpassword',
    });
  });

  it('rejects invalid admin login shapes', () => {
    expectApiError(
      () => parseAdminLoginPayload({ username: '', password: 'password' }),
      'Admin username is required.',
    );
    expectApiError(
      () => parseAdminLoginPayload({ username: 'admin', password: '' }),
      'Admin password is required.',
    );
  });

  it('parses valid curated book input', () => {
    const validBook = {
      title: ' Test Title ',
      author: ' Test Author ',
      text: ' Sample book passage text. ',
      genre: 'Science & Technology',
      difficulty: 'Intermediate',
      length: 'medium',
      summary: ' Summary note ',
    };
    expect(parseCuratedBookInput(validBook)).toEqual({
      title: 'Test Title',
      author: 'Test Author',
      text: 'Sample book passage text.',
      genre: 'Science & Technology',
      difficulty: 'Intermediate',
      length: 'medium',
      summary: 'Summary note',
    });
  });

  it('rejects invalid curated book inputs', () => {
    expectApiError(
      () => parseCuratedBookInput({ title: '', author: 'A', text: 'T', genre: 'Science & Technology', difficulty: 'Beginner', length: 'short' }),
      'Book title is required.',
    );
    expectApiError(
      () => parseCuratedBookInput({ title: 'T', author: 'A', text: 'T', genre: 'Invalid Genre', difficulty: 'Beginner', length: 'short' }),
      'Invalid book genre.',
    );
  });
});

describe('authentication payload validation', () => {
  it('normalizes valid login emails while preserving the password', () => {
    expect(parseAuthPayload({ email: ' User@Example.COM ', password: 'password' })).toEqual({
      email: 'user@example.com',
      password: 'password',
    });
  });

  it('rejects invalid login shapes and credentials', () => {
    expectApiError(
      () => parseAuthPayload(['user@example.com']),
      'Request body must be a JSON object.',
    );
    expectApiError(
      () => parseAuthPayload({ email: 'user@example.com', password: 'password', role: 'admin' }),
      'Invalid login payload.',
    );
    expectApiError(
      () => parseAuthPayload({ email: 'not-an-email', password: 'password' }),
      'A valid email address is required.',
    );
  });

  it('enforces signup password constraints and confirmation', () => {
    expect(
      parseSignupPayload({
        email: 'new@example.com',
        password: 'password1',
        confirmPassword: 'password1',
      }),
    ).toMatchObject({ email: 'new@example.com' });

    expectApiError(
      () =>
        parseSignupPayload({
          email: 'new@example.com',
          password: 'short',
          confirmPassword: 'short',
        }),
      'Password must be between 8 and 128 characters.',
    );
    expectApiError(
      () =>
        parseSignupPayload({
          email: 'new@example.com',
          password: 'password1',
          confirmPassword: 'password2',
        }),
      'Passwords do not match.',
    );
  });
});

describe('profile patch validation', () => {
  it('accepts valid preferences and creates a defensive genres copy', () => {
    const genres = ['Science & Technology'] as const;
    const patch = parseProfilePatch({
      action: 'updatePreferences',
      preferences: {
        genres: [...genres],
        difficulty: 'Intermediate',
        passageLength: 'medium',
        completedAt: '2026-01-01T00:00:00.000Z',
      },
    });

    expect(patch).toEqual({
      action: 'updatePreferences',
      preferences: {
        genres: ['Science & Technology'],
        difficulty: 'Intermediate',
        passageLength: 'medium',
        completedAt: '2026-01-01T00:00:00.000Z',
      },
    });
    if (patch.action === 'updatePreferences' && patch.preferences) {
      expect(patch.preferences.genres).not.toBe(genres);
    }
  });

  it('rejects duplicate or unknown preference genres and invalid timestamps', () => {
    const base = {
      action: 'updatePreferences',
      preferences: {
        genres: ['Science & Technology'],
        difficulty: 'Intermediate',
        passageLength: 'medium',
        completedAt: '2026-01-01T00:00:00.000Z',
      },
    };

    expectApiError(
      () =>
        parseProfilePatch({
          ...base,
          preferences: {
            ...base.preferences,
            genres: ['Science & Technology', 'Science & Technology'],
          },
        }),
      'Invalid preference genres.',
    );
    expectApiError(
      () =>
        parseProfilePatch({
          ...base,
          preferences: { ...base.preferences, genres: ['Unknown genre'] },
        }),
      'Invalid preference genres.',
    );
    expectApiError(
      () =>
        parseProfilePatch({
          ...base,
          preferences: { ...base.preferences, completedAt: 'not-a-date' },
        }),
      'Invalid preferences.',
    );
  });

  it('validates writing sections and action-specific payload shapes', () => {
    expect(parseProfilePatch({ action: 'markRead' })).toEqual({ action: 'markRead' });
    expectApiError(
      () => parseProfilePatch({ action: 'markRead', unexpected: true }),
      'Invalid markRead payload.',
    );
    expectApiError(
      () =>
        parseProfilePatch({
          action: 'updateWriting',
          writingDraft: { introduction: '', body: 42, conclusion: '' },
        }),
      'Invalid writing draft.',
    );
    expectApiError(() => parseProfilePatch({ action: 'deleteAccount' }), 'Unknown profile action.');
  });
});
