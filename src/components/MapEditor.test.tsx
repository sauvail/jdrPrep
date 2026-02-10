import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MapEditor from './MapEditor';
import { Entity, Map } from '../types';

describe('MapEditor Entity Filter', () => {
  const mockEntities: Entity[] = [
    {
      id: 'entity1',
      name: 'Goblin Cave',
      type: 'location',
      description: 'A dark cave',
      connections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'entity2',
      name: 'Goblin King',
      type: 'character',
      description: 'A powerful goblin',
      connections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'entity3',
      name: 'Dragon Mountain',
      type: 'location',
      description: 'A mountain with a dragon',
      connections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    {
      id: 'entity4',
      name: 'Magic Sword Quest',
      type: 'quest',
      description: 'Find the magic sword',
      connections: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];

  const mockMap: Map = {
    id: 'map1',
    name: 'Test Map',
    data: {
      drawings: [],
      images: [],
      entityPositions: {},
      showGrid: false,
      gridWidth: 20,
      gridHeight: 15,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const defaultProps = {
    entities: mockEntities,
    campaignId: 'campaign1',
    maps: [mockMap],
    activeMap: mockMap,
    onUpdateMap: vi.fn(),
    onCreateMap: vi.fn(),
    onDeleteMap: vi.fn(),
    onMapChange: vi.fn(),
    onUpdateEntity: vi.fn(),
  };

  describe('Entity Filter Input', () => {
    it('renders entity filter input', () => {
      render(<MapEditor {...defaultProps} />);

      const filterInput = screen.getByPlaceholderText('Search entities by name or type...');
      expect(filterInput).toBeInTheDocument();
    });

    it('shows all entities when filter is empty', () => {
      render(<MapEditor {...defaultProps} />);

      expect(screen.getByText(/Goblin Cave/)).toBeInTheDocument();
      expect(screen.getByText(/Goblin King/)).toBeInTheDocument();
      expect(screen.getByText(/Dragon Mountain/)).toBeInTheDocument();
      expect(screen.getByText(/Magic Sword Quest/)).toBeInTheDocument();
    });

    it('filters entities by name', () => {
      render(<MapEditor {...defaultProps} />);

      const filterInput = screen.getByPlaceholderText('Search entities by name or type...');
      fireEvent.change(filterInput, { target: { value: 'Goblin' } });

      expect(screen.getByText(/Goblin Cave/)).toBeInTheDocument();
      expect(screen.getByText(/Goblin King/)).toBeInTheDocument();
      expect(screen.queryByText(/Dragon Mountain/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Magic Sword Quest/)).not.toBeInTheDocument();
    });

    it('filters entities by type', () => {
      render(<MapEditor {...defaultProps} />);

      const filterInput = screen.getByPlaceholderText('Search entities by name or type...');
      fireEvent.change(filterInput, { target: { value: 'location' } });

      expect(screen.getByText(/Goblin Cave/)).toBeInTheDocument();
      expect(screen.queryByText(/Goblin King/)).not.toBeInTheDocument();
      expect(screen.getByText(/Dragon Mountain/)).toBeInTheDocument();
      expect(screen.queryByText(/Magic Sword Quest/)).not.toBeInTheDocument();
    });

    it('shows no entities message when filter matches nothing', () => {
      render(<MapEditor {...defaultProps} />);

      const filterInput = screen.getByPlaceholderText('Search entities by name or type...');
      fireEvent.change(filterInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No entities match your search.')).toBeInTheDocument();
      expect(screen.queryByText(/Goblin Cave/)).not.toBeInTheDocument();
    });

    it('is case insensitive', () => {
      render(<MapEditor {...defaultProps} />);

      const filterInput = screen.getByPlaceholderText('Search entities by name or type...');
      fireEvent.change(filterInput, { target: { value: 'GOBLIN' } });

      expect(screen.getByText(/Goblin Cave/)).toBeInTheDocument();
      expect(screen.getByText(/Goblin King/)).toBeInTheDocument();
    });

    it('shows clear button when filter has text', () => {
      render(<MapEditor {...defaultProps} />);

      const filterInput = screen.getByPlaceholderText('Search entities by name or type...');

      // Clear button should not be visible initially
      expect(screen.queryByTitle('Clear filter')).not.toBeInTheDocument();

      // Type in the filter
      fireEvent.change(filterInput, { target: { value: 'Goblin' } });

      // Clear button should now be visible
      expect(screen.getByTitle('Clear filter')).toBeInTheDocument();
    });

    it('clears filter when clear button is clicked', () => {
      render(<MapEditor {...defaultProps} />);

      const filterInput = screen.getByPlaceholderText('Search entities by name or type...') as HTMLInputElement;

      // Type in the filter
      fireEvent.change(filterInput, { target: { value: 'Goblin' } });
      expect(filterInput.value).toBe('Goblin');

      // Click clear button
      const clearButton = screen.getByTitle('Clear filter');
      fireEvent.click(clearButton);

      // Filter should be cleared
      expect(filterInput.value).toBe('');

      // All entities should be visible again
      expect(screen.getByText(/Dragon Mountain/)).toBeInTheDocument();
      expect(screen.getByText(/Magic Sword Quest/)).toBeInTheDocument();
    });
  });

  describe('Entity List Display', () => {
    it('shows all entities in the list, not just unmapped ones', () => {
      const mapWithEntities: Map = {
        ...mockMap,
        data: {
          ...mockMap.data,
          entityPositions: {
            'entity1': { x: 50, y: 50 },
            'entity2': { x: 100, y: 100 },
          },
        },
      };

      const { container } = render(<MapEditor {...defaultProps} activeMap={mapWithEntities} />);

      // All entities should be visible in the entity list, including those already on the map
      const entityList = container.querySelector('.entity-list');
      expect(entityList).toBeInTheDocument();

      // Check that the entity list contains all entities
      expect(entityList?.textContent).toContain('Goblin Cave');
      expect(entityList?.textContent).toContain('Goblin King');
      expect(entityList?.textContent).toContain('Dragon Mountain');
      expect(entityList?.textContent).toContain('Magic Sword Quest');
    });

    it('allows clicking on entities to add them to map', () => {
      const onUpdateMap = vi.fn();
      const { container } = render(<MapEditor {...defaultProps} onUpdateMap={onUpdateMap} />);

      // Find entity in the list (not on the canvas)
      const entityList = container.querySelector('.entity-list');
      const entityItems = entityList?.querySelectorAll('li');
      const goblinCaveItem = Array.from(entityItems || []).find(
        item => item.textContent?.includes('Goblin Cave')
      );

      if (goblinCaveItem) {
        fireEvent.click(goblinCaveItem);
        expect(onUpdateMap).toHaveBeenCalled();
      }
    });

    it('hides entity list when in drawing mode', () => {
      render(<MapEditor {...defaultProps} />);

      // Entity list should be visible initially
      expect(screen.getByText('Add Entities to Map')).toBeInTheDocument();

      // Toggle drawing mode
      const drawButton = screen.getByLabelText('Turn on drawing mode');
      fireEvent.click(drawButton);

      // Entity list should be hidden
      expect(screen.queryByText('Add Entities to Map')).not.toBeInTheDocument();
    });
  });

  describe('Fullscreen Functionality', () => {
    beforeEach(() => {
      // Mock requestFullscreen and exitFullscreen
      HTMLElement.prototype.requestFullscreen = vi.fn().mockResolvedValue(undefined);
      document.exitFullscreen = vi.fn().mockResolvedValue(undefined);

      // Mock fullscreenElement
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: null,
      });
    });

    it('renders fullscreen button', () => {
      render(<MapEditor {...defaultProps} />);

      const fullscreenButton = screen.getByTitle('Enter Fullscreen');
      expect(fullscreenButton).toBeInTheDocument();
    });

    it('calls requestFullscreen when entering fullscreen', async () => {
      const { container } = render(<MapEditor {...defaultProps} />);

      const fullscreenButton = screen.getByTitle('Enter Fullscreen');
      fireEvent.click(fullscreenButton);

      expect(HTMLElement.prototype.requestFullscreen).toHaveBeenCalled();
    });

    it('changes button text when fullscreen state changes', async () => {
      const { rerender } = render(<MapEditor {...defaultProps} />);

      // Initially should show "Enter Fullscreen"
      expect(screen.getByTitle('Enter Fullscreen')).toBeInTheDocument();

      // Simulate entering fullscreen
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.createElement('div'),
      });

      // Trigger fullscreen change event
      const event = new Event('fullscreenchange');
      document.dispatchEvent(event);

      // Re-render to see the updated state
      rerender(<MapEditor {...defaultProps} />);

      // Should now show "Exit Fullscreen"
      expect(screen.getByTitle('Exit Fullscreen')).toBeInTheDocument();
    });

    it('shows fullscreen icon when not in fullscreen', () => {
      render(<MapEditor {...defaultProps} />);

      const fullscreenButton = screen.getByTitle('Enter Fullscreen');
      expect(fullscreenButton.textContent).toBe('⛶');
    });
  });
});
