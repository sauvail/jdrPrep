import { Entity, EntityType, Map } from '../types';
import { generateId } from './idGenerator';

const STORAGE_KEY = 'jdrprep_entities';
const MAPS_STORAGE_KEY = 'jdrprep_maps';
const ACTIVE_MAP_KEY = 'jdrprep_active_map';

export const loadEntities = (): Entity[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveEntities = (entities: Entity[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entities));
};

// Multiple Maps Support
export const loadMaps = (): Map[] => {
  const stored = localStorage.getItem(MAPS_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Migration: check for old map data
  const oldMapData = localStorage.getItem('jdrprep_map_data');
  if (oldMapData) {
    const parsed = JSON.parse(oldMapData);
    const defaultMap = createMap('Default Map');
    defaultMap.data.drawings = parsed.drawings || [];
    return [defaultMap];
  }
  // Create default map
  return [createMap('Default Map')];
};

export const saveMaps = (maps: Map[]): void => {
  localStorage.setItem(MAPS_STORAGE_KEY, JSON.stringify(maps));
};

export const getActiveMapId = (): string | null => {
  return localStorage.getItem(ACTIVE_MAP_KEY);
};

export const setActiveMapId = (mapId: string): void => {
  localStorage.setItem(ACTIVE_MAP_KEY, mapId);
};

export const createMap = (name: string): Map => {
  return {
    id: generateId('map'),
    name,
    data: {
      drawings: [],
      entityPositions: {},
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

export const updateMap = (map: Map, updates: Partial<Map>): Map => {
  return {
    ...map,
    ...updates,
    updatedAt: Date.now(),
  };
};

export const createEntity = (type: EntityType, name: string, description: string): Entity => {
  return {
    id: generateId(type),
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
    id: generateId('conn'),
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
