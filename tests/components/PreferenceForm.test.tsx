import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PreferenceForm from '@/components/PreferenceForm';
import type { PublicProfile } from '@/types/domain';

const { errorMessageMock, updatePreferencesMock } = vi.hoisted(() => ({
  errorMessageMock: vi.fn(),
  updatePreferencesMock: vi.fn(),
}));

vi.mock('@/services/apiClient', () => ({
  errorMessage: errorMessageMock,
  updatePreferences: updatePreferencesMock,
}));

const profile: PublicProfile = {
  email: 'reader@example.com',
  preferences: null,
  readingData: { currentStreak: 0, bestStreak: 0, totalBooksRead: 0, lastReadDate: null },
  writingDraft: { introduction: '', body: '', conclusion: '' },
  passages: [],
};

describe('PreferenceForm', () => {
  beforeEach(() => {
    updatePreferencesMock.mockReset();
    errorMessageMock.mockReset();
  });

  it('requires at least one genre before submitting', async () => {
    const user = userEvent.setup();
    render(<PreferenceForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /create my reading mix/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('Please select at least one genre.');
    expect(updatePreferencesMock).not.toHaveBeenCalled();
  });

  it('submits selected preferences and prevents duplicate interactions while saving', async () => {
    const user = userEvent.setup();
    let resolveUpdate: (value: PublicProfile) => void = () => undefined;
    updatePreferencesMock.mockImplementation(
      () =>
        new Promise<PublicProfile>((resolve) => {
          resolveUpdate = resolve;
        }),
    );
    const onSubmit = vi.fn();
    render(<PreferenceForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole('checkbox', { name: 'Science & Technology' }));
    await user.click(screen.getByRole('radio', { name: 'Advanced' }));
    await user.click(screen.getByRole('radio', { name: /deep dive/i }));
    await user.click(screen.getByRole('button', { name: /create my reading mix/i }));

    expect(screen.getByRole('status')).toHaveTextContent('Saving preferences…');
    expect(screen.getByRole('button', { name: /saving your reading mix/i })).toBeDisabled();
    expect(updatePreferencesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        genres: ['Science & Technology'],
        difficulty: 'Advanced',
        passageLength: 'long',
        completedAt: expect.any(String),
      }),
    );

    resolveUpdate(profile);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(profile));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the mapped service error when saving fails', async () => {
    const user = userEvent.setup();
    const failure = new Error('Request failed');
    updatePreferencesMock.mockRejectedValue(failure);
    errorMessageMock.mockReturnValue('Your preferences could not be saved.');
    render(<PreferenceForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('checkbox', { name: 'Nature & Environment' }));
    await user.click(screen.getByRole('button', { name: /create my reading mix/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your preferences could not be saved.',
    );
    expect(errorMessageMock).toHaveBeenCalledWith(
      failure,
      'Unable to save your preferences right now.',
    );
  });
});
