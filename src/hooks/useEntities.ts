import { useState, useEffect } from 'react';
import { Entity } from '../types';
import { loadEntities, saveEntities } from '../utils/storage';

export const useEntities = (campaignId: string | null) => {
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    if (campaignId) {
      setEntities(loadEntities(campaignId));
    } else {
      setEntities([]);
    }
  }, [campaignId]);

  const addEntity = (entity: Entity) => {
    if (!campaignId) return;
    const updated = [...entities, entity];
    setEntities(updated);
    saveEntities(campaignId, updated);
  };

  const updateEntity = (id: string, updates: Partial<Entity>) => {
    if (!campaignId) return;
    const updated = entities.map(e => 
      e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
    );
    setEntities(updated);
    saveEntities(campaignId, updated);
  };

  const deleteEntity = (id: string) => {
    if (!campaignId) return;
    const updated = entities.filter(e => e.id !== id);
    setEntities(updated);
    saveEntities(campaignId, updated);
  };

  const reloadEntities = () => {
    if (campaignId) {
      setEntities(loadEntities(campaignId));
    }
  };

  return {
    entities,
    addEntity,
    updateEntity,
    deleteEntity,
    reloadEntities,
  };
};
