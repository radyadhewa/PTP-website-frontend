import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import VocabJarModal from '@/components/VocabJarModal';
import type { VocabularyItem } from '@/types/domain';

const mockJar: VocabularyItem[] = [
  {
    id: '1',
    word: 'photosynthesis',
    pos: 'technical',
    definition: 'Chemical process in plants',
    dateAdded: new Date().toISOString(),
    learned: false,
    note: 'Important bio term',
  },
  {
    id: '2',
    word: 'ambient',
    pos: 'adjective',
    definition: 'Relating to surroundings',
    dateAdded: new Date().toISOString(),
    learned: true,
  },
];

describe('VocabJarModal', () => {
  it('renders vocabulary items and allows filtering', () => {
    render(
      <VocabJarModal
        jar={mockJar}
        onClose={vi.fn()}
        onRemoveWord={vi.fn()}
        onToggleLearned={vi.fn()}
        onUpdateNote={vi.fn()}
      />
    );

    expect(screen.getByText('photosynthesis')).toBeInTheDocument();
    expect(screen.getByText('ambient')).toBeInTheDocument();

    const learningFilter = screen.getByText('Learning');
    fireEvent.click(learningFilter);

    expect(screen.getByText('photosynthesis')).toBeInTheDocument();
    expect(screen.queryByText('ambient')).not.toBeInTheDocument();
  });

  it('triggers insert to draft when button clicked', () => {
    const handleInsert = vi.fn();
    render(
      <VocabJarModal
        jar={mockJar}
        onClose={vi.fn()}
        onRemoveWord={vi.fn()}
        onToggleLearned={vi.fn()}
        onUpdateNote={vi.fn()}
        onInsertToDraft={handleInsert}
      />
    );

    const useButtons = screen.getAllByText('✍️ Use in Writing');
    fireEvent.click(useButtons[0]);
    expect(handleInsert).toHaveBeenCalledWith('photosynthesis');
  });
});
