import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EntityList from './EntityList';
import { Entity } from '../types';
import { createEntity } from '../utils/storage';

describe('EntityList', () => {
  const mockOnSelect = vi.fn();
  const mockOnDelete = vi.fn();

  const createTestEntity = (type: Entity['type'], name: string, tags?: string[]): Entity => {
    const entity = createEntity(type, name, 'Test description', tags || []);
    return entity;
  };

  it('should display entities without tags when no tag filter is active', () => {
    const entities: Entity[] = [
      createTestEntity('character', 'Hero'),
      createTestEntity('location', 'Village'),
      createTestEntity('quest', 'Main Quest'),
    ];

    render(
      <EntityList
        entities={entities}
        selectedEntity={null}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('Village')).toBeInTheDocument();
    expect(screen.getByText('Main Quest')).toBeInTheDocument();
  });

  it('should display entities without tags even when tag filter is active', async () => {
    const user = userEvent.setup();

    const entities: Entity[] = [
      createTestEntity('character', 'Tagged Hero', ['hero', 'main']),
      createTestEntity('location', 'Tagged Village', ['village']),
      createTestEntity('quest', 'Untagged Quest'), // No tags
      createTestEntity('organization', 'Untagged Org'), // No tags
      createTestEntity('creature', 'Tagged Monster', ['enemy']),
    ];

    render(
      <EntityList
        entities={entities}
        selectedEntity={null}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    );

    // All entities should be visible initially
    expect(screen.getByText('Tagged Hero')).toBeInTheDocument();
    expect(screen.getByText('Tagged Village')).toBeInTheDocument();
    expect(screen.getByText('Untagged Quest')).toBeInTheDocument();
    expect(screen.getByText('Untagged Org')).toBeInTheDocument();
    expect(screen.getByText('Tagged Monster')).toBeInTheDocument();

    // Click on a tag filter
    const heroTagButton = screen.getByText('hero');
    await user.click(heroTagButton);

    // Tagged entities matching the filter should be visible
    expect(screen.getByText('Tagged Hero')).toBeInTheDocument();

    // Untagged entities should STILL be visible (this is the fix)
    expect(screen.getByText('Untagged Quest')).toBeInTheDocument();
    expect(screen.getByText('Untagged Org')).toBeInTheDocument();

    // Tagged entities NOT matching the filter should be hidden
    expect(screen.queryByText('Tagged Village')).not.toBeInTheDocument();
    expect(screen.queryByText('Tagged Monster')).not.toBeInTheDocument();
  });

  it('should show all entity types (not just character and location)', async () => {
    const entities: Entity[] = [
      createTestEntity('character', 'Test Character'),
      createTestEntity('location', 'Test Location'),
      createTestEntity('organization', 'Test Organization'),
      createTestEntity('creature', 'Test Creature'),
      createTestEntity('quest', 'Test Quest'),
      createTestEntity('encounter', 'Test Encounter'),
      createTestEntity('general', 'Test General'),
    ];

    render(
      <EntityList
        entities={entities}
        selectedEntity={null}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    );

    // All entity types should be visible
    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText('Test Location')).toBeInTheDocument();
    expect(screen.getByText('Test Organization')).toBeInTheDocument();
    expect(screen.getByText('Test Creature')).toBeInTheDocument();
    expect(screen.getByText('Test Quest')).toBeInTheDocument();
    expect(screen.getByText('Test Encounter')).toBeInTheDocument();
    expect(screen.getByText('Test General')).toBeInTheDocument();
  });

  it('should group entities by type', () => {
    const entities: Entity[] = [
      createTestEntity('character', 'Hero 1'),
      createTestEntity('character', 'Hero 2'),
      createTestEntity('location', 'City 1'),
      createTestEntity('quest', 'Quest 1'),
    ];

    render(
      <EntityList
        entities={entities}
        selectedEntity={null}
        onSelect={mockOnSelect}
        onDelete={mockOnDelete}
      />
    );

    // Check that group headings exist
    expect(screen.getByText('Characters')).toBeInTheDocument();
    expect(screen.getByText('Locations')).toBeInTheDocument();
    expect(screen.getByText('Quests')).toBeInTheDocument();
  });
});
