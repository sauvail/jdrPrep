import { Entity, EntityType } from '../types';

const STORAGE_KEY = 'jdrprep_entities';

export const loadEntities = (): Entity[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveEntities = (entities: Entity[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entities));
};

export const createEntity = (type: EntityType, name: string, description: string): Entity => {
  return {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    type,
    name,
    description,
    connections: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export const addConnection = (entity: Entity, targetId: string, type: string, description?: string): Entity => {
  const connection = {
    id: `conn_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    targetId,
    type,
    description,
  };
  
  return {
    ...entity,
    connections: [...entity.connections, connection],
    updatedAt: Date.now(),
  };
};

export const removeConnection = (entity: Entity, connectionId: string): Entity => {
  return {
    ...entity,
    connections: entity.connections.filter(c => c.id !== connectionId),
    updatedAt: Date.now(),
  };
};

export const updateEntityPosition = (entity: Entity, position: { x: number; y: number }): Entity => {
  return {
    ...entity,
    position,
    updatedAt: Date.now(),
  };
};
