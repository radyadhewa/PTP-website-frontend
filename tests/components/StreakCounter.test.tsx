import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import StreakCounter from '@/components/StreakCounter';

describe('StreakCounter', () => {
  it('renders current momentum and personal-best progress in its labelled region', () => {
    render(<StreakCounter currentStreak={12} bestStreak={28} />);

    const progress = screen.getByRole('region', { name: /reading streak progress/i });
    expect(progress).toHaveTextContent('12');
    expect(progress).toHaveTextContent('day reading streak');
    expect(progress).toHaveTextContent('Personal best');
    expect(progress).toHaveTextContent('28 days');
  });
});
