import { useState, useEffect } from 'react';
import { Entity } from '../types';
import { loadEntities, saveEntities } from '../utils/storage';

export const useEntities = () => {
  const [entities, setEntities] = useState<Entity[]>([]);

  useEffect(() => {
    setEntities(loadEntities());
  }, []);

  const addEntity = (entity: Entity) => {
    const updated = [...entities, entity];
    setEntities(updated);
    saveEntities(updated);
  };

  const updateEntity = (id: string, updates: Partial<Entity>) => {
    const updated = entities.map(e => 
      e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
    );
    setEntities(updated);
    saveEntities(updated);
  };

  const deleteEntity = (id: string) => {
    const updated = entities.filter(e => e.id !== id);
    setEntities(updated);
    saveEntities(updated);
  };

  const reloadEntities = () => {
    setEntities(loadEntities());
  };

  return {
    entities,
    addEntity,
    updateEntity,
    deleteEntity,
    reloadEntities,
  };
};
