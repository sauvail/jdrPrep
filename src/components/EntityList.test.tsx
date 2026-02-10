import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  it('should display all entities', () => {
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

  it('should show all entity types', () => {
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
