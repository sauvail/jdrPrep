import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MapEditor from './MapEditor';
import { Entity, Map } from '../types';

describe('MapEditor Map Name Coherence', () => {
  const mockEntities: Entity[] = [];

  const createMockMap = (id: string, name: string): Map => ({
    id,
    name,
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
  });

  const mockMapA = createMockMap('map-a', 'Map A');
  const mockMapB = createMockMap('map-b', 'Map B');

  it('should show correct map name in edit textbox when clicking rename', () => {
    const mockUpdateMap = vi.fn();
    const props = {
      entities: mockEntities,
      campaignId: 'campaign1',
      maps: [mockMapA],
      activeMap: mockMapA,
      onUpdateMap: mockUpdateMap,
      onCreateMap: vi.fn(),
      onDeleteMap: vi.fn(),
      onMapChange: vi.fn(),
      onUpdateEntity: vi.fn(),
    };

    const { container } = render(<MapEditor {...props} />);

    // Verify the map name is displayed in the title section
    const titleSection = container.querySelector('.map-title-section');
    expect(titleSection?.querySelector('h2')?.textContent).toBe('Map A');

    // Click the Rename button
    const renameButton = screen.getByRole('button', { name: /Rename/i });
    fireEvent.click(renameButton);

    // Check that the input field shows the correct map name
    const renameForm = container.querySelector('.map-rename-form');
    const input = renameForm?.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input?.value).toBe('Map A');
  });

  it('should maintain coherent map name when switching maps after editing', async () => {
    const mockUpdateMap = vi.fn();
    const mockMapChange = vi.fn();

    const props = {
      entities: mockEntities,
      campaignId: 'campaign1',
      maps: [mockMapA, mockMapB],
      activeMap: mockMapA,
      onUpdateMap: mockUpdateMap,
      onCreateMap: vi.fn(),
      onDeleteMap: vi.fn(),
      onMapChange: mockMapChange,
      onUpdateEntity: vi.fn(),
    };

    const { rerender, container } = render(<MapEditor {...props} />);

    // Step 1: Rename Map A to "New Map A"
    const renameButton = screen.getByRole('button', { name: /Rename/i });
    fireEvent.click(renameButton);

    const renameForm = container.querySelector('.map-rename-form');
    const input = renameForm?.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'New Map A' } });

    // Save the rename
    const saveButton = screen.getByRole('button', { name: /Save/i });
    fireEvent.click(saveButton);

    // Verify onUpdateMap was called with the new name
    expect(mockUpdateMap).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'map-a',
        name: 'New Map A',
      })
    );

    // Step 2: Simulate switching to Map B
    const updatedMapA = { ...mockMapA, name: 'New Map A' };
    rerender(
      <MapEditor
        {...props}
        maps={[updatedMapA, mockMapB]}
        activeMap={mockMapB}
      />
    );

    // Wait for the component to update
    await waitFor(() => {
      const titleSection = document.querySelector('.map-title-section');
      expect(titleSection?.querySelector('h2')?.textContent).toBe('Map B');
    });

    // Step 3: Click Rename on Map B
    const renameButtonB = screen.getByRole('button', { name: /Rename/i });
    fireEvent.click(renameButtonB);

    // The critical test: the input should show "Map B", NOT "New Map A"
    const renameFormB = document.querySelector('.map-rename-form');
    const inputB = renameFormB?.querySelector('input[type="text"]') as HTMLInputElement;
    expect(inputB?.value).toBe('Map B');
  });

  it('should reset edit state when canceling rename', () => {
    const props = {
      entities: mockEntities,
      campaignId: 'campaign1',
      maps: [mockMapA],
      activeMap: mockMapA,
      onUpdateMap: vi.fn(),
      onCreateMap: vi.fn(),
      onDeleteMap: vi.fn(),
      onMapChange: vi.fn(),
      onUpdateEntity: vi.fn(),
    };

    const { container } = render(<MapEditor {...props} />);

    // Click Rename
    const renameButton = screen.getByRole('button', { name: /Rename/i });
    fireEvent.click(renameButton);

    // Change the value
    const renameForm = container.querySelector('.map-rename-form');
    const input = renameForm?.querySelector('input[type="text"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Modified Name' } });
    expect(input?.value).toBe('Modified Name');

    // Click Cancel
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    // The edit form should be hidden
    expect(container.querySelector('.map-rename-form')).not.toBeInTheDocument();

    // Click Rename again
    const renameButton2 = screen.getByRole('button', { name: /Rename/i });
    fireEvent.click(renameButton2);

    // The input should show the original name, not the modified one
    const renameForm2 = container.querySelector('.map-rename-form');
    const input2 = renameForm2?.querySelector('input[type="text"]') as HTMLInputElement;
    expect(input2?.value).toBe('Map A');
  });
});
