import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import VisualizationModal from '@/components/VisualizationModal';

describe('VisualizationModal', () => {
  it('does not render a dialog while closed', () => {
    render(<VisualizationModal isOpen={false} passage="Hidden passage." onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calculates passage statistics, prioritizes keyword sentences, and closes from either action', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <VisualizationModal
        isOpen
        passage="This is an important first idea. A main insight follows. Another sentence ends here."
        onClose={onClose}
      />,
    );

    const dialog = screen.getByRole('dialog', { name: /studio lens/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveTextContent('14');
    expect(dialog).toHaveTextContent('3');
    expect(dialog).toHaveTextContent('5');
    expect(screen.getByText('This is an important first idea')).toBeInTheDocument();
    expect(screen.getByText('A main insight follows')).toBeInTheDocument();
    expect(screen.queryByText('Another sentence ends here')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close studio lens/i }));
    await user.click(screen.getByRole('button', { name: /back to the passage/i }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('uses the first three sentences when no keywords are present and handles empty text', () => {
    const { rerender } = render(
      <VisualizationModal
        isOpen
        passage="First thought. Second thought! Third thought? Fourth thought."
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText('First thought')).toBeInTheDocument();
    expect(screen.getByText('Second thought')).toBeInTheDocument();
    expect(screen.getByText('Third thought')).toBeInTheDocument();
    expect(screen.queryByText('Fourth thought')).not.toBeInTheDocument();

    rerender(<VisualizationModal isOpen passage="" onClose={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveTextContent('0words');
    expect(screen.getByRole('dialog')).toHaveTextContent('0sentences');
    expect(screen.getByRole('dialog')).toHaveTextContent('0words / sentence');
  });
});
