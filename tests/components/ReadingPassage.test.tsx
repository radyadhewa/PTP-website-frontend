import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReadingPassage from '@/components/ReadingPassage';

describe('ReadingPassage', () => {
  it('presents the passage and invokes both reading actions', async () => {
    const user = userEvent.setup();
    const onVisualize = vi.fn();
    const onReadComplete = vi.fn();
    render(
      <ReadingPassage
        passage="A focused reading habit builds understanding."
        onVisualize={onVisualize}
        onReadComplete={onReadComplete}
      />,
    );

    expect(screen.getByRole('region', { name: /a small idea, fully explored/i })).toHaveTextContent(
      'A focused reading habit builds understanding.',
    );

    await user.click(screen.getByRole('button', { name: /open studio lens/i }));
    await user.click(screen.getByRole('button', { name: /i.ve finished reading/i }));

    expect(onVisualize).toHaveBeenCalledOnce();
    expect(onReadComplete).toHaveBeenCalledOnce();
  });

  it('communicates that completion is in progress and prevents another completion', () => {
    render(
      <ReadingPassage
        passage="A passage."
        onVisualize={vi.fn()}
        onReadComplete={vi.fn()}
        isCompleting
      />,
    );

    const completeButton = screen.getByRole('button', { name: /saving your progress/i });
    expect(completeButton).toBeDisabled();
    expect(completeButton).toHaveAttribute('aria-busy', 'true');
  });
});
