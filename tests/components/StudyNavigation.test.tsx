import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StudyNavigation from '@/components/StudyNavigation';

describe('StudyNavigation', () => {
  it('marks reading as the current page and describes locked writing access', () => {
    render(<StudyNavigation active="reading" writingUnlocked={false} />);

    expect(screen.getByRole('link', { name: /read.*in progress/i })).toHaveAttribute(
      'href',
      '/homepage',
    );
    expect(screen.getByRole('link', { name: /read.*in progress/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.queryByRole('link', { name: /write/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/writing unlocks after today.s reading/i)).toHaveTextContent(
      'Unlock by reading',
    );
  });

  it('links to writing and marks it current once it is unlocked', () => {
    render(<StudyNavigation active="writing" writingUnlocked />);

    expect(screen.getByRole('link', { name: /read.*warm up/i })).toHaveAttribute(
      'href',
      '/homepage',
    );
    expect(screen.getByRole('link', { name: /write.*your turn/i })).toHaveAttribute(
      'href',
      '/writing',
    );
    expect(screen.getByRole('link', { name: /write.*your turn/i })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});
