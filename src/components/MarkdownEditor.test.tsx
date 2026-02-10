import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MarkdownEditor from './MarkdownEditor';
import { Entity } from '../types';

describe('MarkdownEditor', () => {
  const mockEntities: Entity[] = [
    {
      id: 'jean',
      name: 'Jean the Brave',
      type: 'character',
      description: 'A brave warrior',
      connections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'gobelins',
      name: 'Goblin Tribe',
      type: 'organization',
      description: 'A tribe of goblins',
      connections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'dragon-lair',
      name: 'Dragon Lair',
      type: 'location',
      description: 'A dangerous cave',
      connections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  describe('Basic functionality', () => {
    it('renders textarea and preview', () => {
      const onChange = vi.fn();
      render(<MarkdownEditor value="" onChange={onChange} entities={mockEntities} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByText('Preview will appear here...')).toBeInTheDocument();
    });

    it('calls onChange when typing', async () => {
      const onChange = vi.fn();
      const user = userEvent.setup();
      render(<MarkdownEditor value="" onChange={onChange} entities={mockEntities} />);

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello');

      expect(onChange).toHaveBeenCalled();
    });

    it('renders markdown preview', () => {
      const onChange = vi.fn();
      const { container } = render(
        <MarkdownEditor
          value="# Hello\n\nThis is **bold**"
          onChange={onChange}
          entities={mockEntities}
        />
      );

      const preview = container.querySelector('.markdown-preview');
      expect(preview?.textContent).toContain('Hello');
      expect(preview?.textContent).toContain('bold');
    });
  });

  describe('Autocomplete functionality', () => {
    it('shows autocomplete dropdown when typing @(', async () => {
      const onChange = vi.fn();

      const { container } = render(
        <MarkdownEditor value="" onChange={onChange} entities={mockEntities} />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate typing @(
      fireEvent.change(textarea, { target: { value: '@(', selectionStart: 2 } });

      await waitFor(() => {
        const autocomplete = container.querySelector('.entity-autocomplete');
        expect(autocomplete).toBeInTheDocument();
      });
    });

    it('filters entities based on query', async () => {
      const onChange = vi.fn();

      render(
        <MarkdownEditor value="" onChange={onChange} entities={mockEntities} />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate typing @(jean
      fireEvent.change(textarea, { target: { value: '@(jean', selectionStart: 6 } });

      await waitFor(() => {
        expect(screen.getByText('Jean the Brave')).toBeInTheDocument();
        expect(screen.queryByText('Goblin Tribe')).not.toBeInTheDocument();
      });
    });

    it('shows all entities when no query is typed', async () => {
      const onChange = vi.fn();

      render(
        <MarkdownEditor value="" onChange={onChange} entities={mockEntities} />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate typing @(
      fireEvent.change(textarea, { target: { value: '@(', selectionStart: 2 } });

      await waitFor(() => {
        expect(screen.getByText('Jean the Brave')).toBeInTheDocument();
        expect(screen.getByText('Goblin Tribe')).toBeInTheDocument();
        expect(screen.getByText('Dragon Lair')).toBeInTheDocument();
      });
    });

    it('inserts entity tag when clicking on autocomplete item', async () => {
      const onChange = vi.fn();

      render(
        <MarkdownEditor value="" onChange={onChange} entities={mockEntities} />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate typing @(
      fireEvent.change(textarea, { target: { value: '@(', selectionStart: 2 } });

      await waitFor(() => {
        expect(screen.getByText('Jean the Brave')).toBeInTheDocument();
      });

      const jeanItem = screen.getByText('Jean the Brave');
      fireEvent.click(jeanItem);

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('@(jean)[]');
      });
    });

    it('hides autocomplete when pressing Escape', async () => {
      const onChange = vi.fn();

      const { container } = render(
        <MarkdownEditor value="" onChange={onChange} entities={mockEntities} />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate typing @(
      fireEvent.change(textarea, { target: { value: '@(', selectionStart: 2 } });

      await waitFor(() => {
        const autocomplete = container.querySelector('.entity-autocomplete');
        expect(autocomplete).toBeInTheDocument();
      });

      fireEvent.keyDown(textarea, { key: 'Escape' });

      await waitFor(() => {
        const autocomplete = container.querySelector('.entity-autocomplete');
        expect(autocomplete).not.toBeInTheDocument();
      });
    });

    it('hides autocomplete when typing closes parenthesis', async () => {
      const onChange = vi.fn();

      const { container } = render(
        <MarkdownEditor value="" onChange={onChange} entities={mockEntities} />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate typing @(jean
      fireEvent.change(textarea, { target: { value: '@(jean', selectionStart: 6 } });

      await waitFor(() => {
        const autocomplete = container.querySelector('.entity-autocomplete');
        expect(autocomplete).toBeInTheDocument();
      });

      // Type closing parenthesis
      fireEvent.change(textarea, { target: { value: '@(jean)', selectionStart: 7 } });

      await waitFor(() => {
        const autocomplete = container.querySelector('.entity-autocomplete');
        expect(autocomplete).not.toBeInTheDocument();
      });
    });

    it('filters by entity name as well as id', async () => {
      const onChange = vi.fn();

      render(
        <MarkdownEditor value="" onChange={onChange} entities={mockEntities} />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate typing @(brave
      fireEvent.change(textarea, { target: { value: '@(brave', selectionStart: 7 } });

      await waitFor(() => {
        expect(screen.getByText('Jean the Brave')).toBeInTheDocument();
        expect(screen.queryByText('Goblin Tribe')).not.toBeInTheDocument();
      });
    });
  });

  describe('Keyboard navigation', () => {
    it('navigates through items with arrow keys', async () => {
      const onChange = vi.fn();

      const { container } = render(
        <MarkdownEditor value="" onChange={onChange} entities={mockEntities} />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate typing @(
      fireEvent.change(textarea, { target: { value: '@(', selectionStart: 2 } });

      await waitFor(() => {
        const autocomplete = container.querySelector('.entity-autocomplete');
        expect(autocomplete).toBeInTheDocument();
      });

      // First item should be selected by default
      let selectedItem = container.querySelector('.autocomplete-item-selected');
      expect(selectedItem?.textContent).toContain('Jean the Brave');

      // Navigate down
      fireEvent.keyDown(textarea, { key: 'ArrowDown' });

      await waitFor(() => {
        selectedItem = container.querySelector('.autocomplete-item-selected');
        expect(selectedItem?.textContent).toContain('Goblin Tribe');
      });

      // Navigate up
      fireEvent.keyDown(textarea, { key: 'ArrowUp' });

      await waitFor(() => {
        selectedItem = container.querySelector('.autocomplete-item-selected');
        expect(selectedItem?.textContent).toContain('Jean the Brave');
      });
    });

    it('inserts selected item when pressing Enter', async () => {
      const onChange = vi.fn();

      const { container } = render(
        <MarkdownEditor value="" onChange={onChange} entities={mockEntities} />
      );

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;

      // Simulate typing @(
      fireEvent.change(textarea, { target: { value: '@(', selectionStart: 2 } });

      await waitFor(() => {
        const autocomplete = container.querySelector('.entity-autocomplete');
        expect(autocomplete).toBeInTheDocument();
      });

      // Navigate to second item
      fireEvent.keyDown(textarea, { key: 'ArrowDown' });

      await waitFor(() => {
        const selectedItem = container.querySelector('.autocomplete-item-selected');
        expect(selectedItem?.textContent).toContain('Goblin Tribe');
      });

      // Press Enter
      fireEvent.keyDown(textarea, { key: 'Enter' });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith('@(gobelins)[]');
      });
    });
  });
});
