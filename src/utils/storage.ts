import { Entity, EntityType, MapData } from '../types';
import { generateId } from './idGenerator';

const STORAGE_KEY = 'jdrprep_entities';
const MAP_STORAGE_KEY = 'jdrprep_map_data';

export const loadEntities = (): Entity[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveEntities = (entities: Entity[]): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entities));
};

export const loadMapData = (): MapData => {
  const stored = localStorage.getItem(MAP_STORAGE_KEY);
  return stored ? JSON.parse(stored) : { drawings: [] };
};

export const saveMapData = (mapData: MapData): void => {
  localStorage.setItem(MAP_STORAGE_KEY, JSON.stringify(mapData));
};

export const createEntity = (type: EntityType, name: string, description: string, tags: string[] = []): Entity => {
  return {
    id: generateId(type),
    type,
    name,
    description,
    connections: [],
    tags,
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

// Export/Import functionality
export interface ExportData {
  entities: Entity[];
  mapData: MapData;
  exportedAt: number;
  version: string;
}

export const exportData = (): ExportData => {
  return {
    entities: loadEntities(),
    mapData: loadMapData(),
    exportedAt: Date.now(),
    version: '1.0',
  };
};

export const importData = (data: ExportData): { success: boolean; error?: string } => {
  try {
    // Validate data structure
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid data format: expected an object' };
    }

    // Check version compatibility
    if (data.version && data.version !== '1.0') {
      return { success: false, error: `Incompatible version: ${data.version}. Expected version 1.0` };
    }

    // Validate entities array
    if (data.entities && !Array.isArray(data.entities)) {
      return { success: false, error: 'Invalid entities format: expected an array' };
    }

    // Validate mapData
    if (data.mapData && (!data.mapData.drawings || !Array.isArray(data.mapData.drawings))) {
      return { success: false, error: 'Invalid map data format' };
    }

    // Import the data
    if (data.entities) {
      saveEntities(data.entities);
    }
    if (data.mapData) {
      saveMapData(data.mapData);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};
