import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEntities } from './useEntities';
import { createEntity } from '../utils/storage';

describe('useEntities Hook', () => {
  const campaignId = 'test_campaign_123';

  beforeEach(() => {
    localStorage.clear();
  });

  it('should initialize with empty entities when no campaignId', () => {
    const { result } = renderHook(() => useEntities(null));

    expect(result.current.entities).toEqual([]);
  });

  it('should load entities for a campaign', () => {
    const entities = [
      createEntity('character', 'Test Character', 'Description'),
      createEntity('location', 'Test Location', 'Description'),
    ];
    localStorage.setItem(
      `jdrprep_entities_${campaignId}`,
      JSON.stringify(entities)
    );

    const { result } = renderHook(() => useEntities(campaignId));

    expect(result.current.entities).toHaveLength(2);
    expect(result.current.entities[0].name).toBe('Test Character');
    expect(result.current.entities[1].name).toBe('Test Location');
  });

  it('should add a new entity', () => {
    const { result } = renderHook(() => useEntities(campaignId));

    const newEntity = createEntity('quest', 'New Quest', 'A quest description');

    act(() => {
      result.current.addEntity(newEntity);
    });

    expect(result.current.entities).toHaveLength(1);
    expect(result.current.entities[0].name).toBe('New Quest');

    // Check localStorage was updated
    const stored = JSON.parse(
      localStorage.getItem(`jdrprep_entities_${campaignId}`) || '[]'
    );
    expect(stored).toHaveLength(1);
    expect(stored[0].name).toBe('New Quest');
  });

  it('should not add entity when no campaignId', () => {
    const { result } = renderHook(() => useEntities(null));

    const newEntity = createEntity('quest', 'New Quest', 'Description');

    act(() => {
      result.current.addEntity(newEntity);
    });

    expect(result.current.entities).toHaveLength(0);
  });

  it('should update an existing entity', () => {
    const entity = createEntity('character', 'Original Name', 'Original Description');
    const { result } = renderHook(() => useEntities(campaignId));

    act(() => {
      result.current.addEntity(entity);
    });

    act(() => {
      result.current.updateEntity(entity.id, {
        name: 'Updated Name',
        description: 'Updated Description',
      });
    });

    expect(result.current.entities).toHaveLength(1);
    expect(result.current.entities[0].name).toBe('Updated Name');
    expect(result.current.entities[0].description).toBe('Updated Description');

    // Check localStorage was updated
    const stored = JSON.parse(
      localStorage.getItem(`jdrprep_entities_${campaignId}`) || '[]'
    );
    expect(stored[0].name).toBe('Updated Name');
  });

  it('should not update entity when no campaignId', () => {
    const { result } = renderHook(() => useEntities(null));

    act(() => {
      result.current.updateEntity('some_id', { name: 'Updated' });
    });

    expect(result.current.entities).toHaveLength(0);
  });

  it('should update entity updatedAt timestamp', () => {
    const entity = createEntity('character', 'Test', 'Description');
    const { result } = renderHook(() => useEntities(campaignId));

    act(() => {
      result.current.addEntity(entity);
    });

    const originalUpdatedAt = result.current.entities[0].updatedAt;

    act(() => {
      result.current.updateEntity(entity.id, { name: 'Updated' });
    });

    expect(result.current.entities[0].updatedAt).toBeGreaterThanOrEqual(
      originalUpdatedAt
    );
  });

  it('should delete an entity', () => {
    const entity1 = createEntity('character', 'Character 1', 'Description');
    const entity2 = createEntity('location', 'Location 1', 'Description');

    const { result } = renderHook(() => useEntities(campaignId));

    act(() => {
      result.current.addEntity(entity1);
    });

    act(() => {
      result.current.addEntity(entity2);
    });

    expect(result.current.entities).toHaveLength(2);

    act(() => {
      result.current.deleteEntity(entity1.id);
    });

    expect(result.current.entities).toHaveLength(1);
    expect(result.current.entities[0].name).toBe('Location 1');

    // Check localStorage was updated
    const stored = JSON.parse(
      localStorage.getItem(`jdrprep_entities_${campaignId}`) || '[]'
    );
    expect(stored).toHaveLength(1);
  });

  it('should not delete entity when no campaignId', () => {
    const { result } = renderHook(() => useEntities(null));

    act(() => {
      result.current.deleteEntity('some_id');
    });

    expect(result.current.entities).toHaveLength(0);
  });

  it('should reload entities from storage', () => {
    const { result } = renderHook(() => useEntities(campaignId));

    // Add entity through hook
    const entity1 = createEntity('character', 'Character 1', 'Description');
    act(() => {
      result.current.addEntity(entity1);
    });

    expect(result.current.entities).toHaveLength(1);

    // Manually add entity to localStorage
    const entity2 = createEntity('location', 'Location 1', 'Description');
    const stored = JSON.parse(
      localStorage.getItem(`jdrprep_entities_${campaignId}`) || '[]'
    );
    stored.push(entity2);
    localStorage.setItem(
      `jdrprep_entities_${campaignId}`,
      JSON.stringify(stored)
    );

    // Reload
    act(() => {
      result.current.reloadEntities();
    });

    expect(result.current.entities).toHaveLength(2);
  });

  it('should reload as empty when no campaignId', () => {
    const { result } = renderHook(() => useEntities(null));

    act(() => {
      result.current.reloadEntities();
    });

    expect(result.current.entities).toHaveLength(0);
  });

  it('should update entities when campaignId changes', () => {
    const campaign1Id = 'campaign_1';
    const campaign2Id = 'campaign_2';

    // Set up entities for two campaigns
    const entities1 = [createEntity('character', 'Char in Campaign 1', 'Desc')];
    const entities2 = [createEntity('location', 'Loc in Campaign 2', 'Desc')];

    localStorage.setItem(
      `jdrprep_entities_${campaign1Id}`,
      JSON.stringify(entities1)
    );
    localStorage.setItem(
      `jdrprep_entities_${campaign2Id}`,
      JSON.stringify(entities2)
    );

    const { result, rerender } = renderHook(
      ({ campaignId }) => useEntities(campaignId),
      { initialProps: { campaignId: campaign1Id } }
    );

    expect(result.current.entities).toHaveLength(1);
    expect(result.current.entities[0].name).toBe('Char in Campaign 1');

    // Switch to campaign 2
    rerender({ campaignId: campaign2Id });

    expect(result.current.entities).toHaveLength(1);
    expect(result.current.entities[0].name).toBe('Loc in Campaign 2');
  });

  it('should clear entities when switching to null campaignId', () => {
    const { result, rerender } = renderHook(
      ({ campaignId }) => useEntities(campaignId),
      { initialProps: { campaignId } }
    );

    const entity = createEntity('character', 'Test', 'Description');
    act(() => {
      result.current.addEntity(entity);
    });

    expect(result.current.entities).toHaveLength(1);

    // Switch to null campaign
    rerender({ campaignId: null });

    expect(result.current.entities).toHaveLength(0);
  });
});
