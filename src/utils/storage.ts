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

<<<<<<< HEAD
export const loadMapData = (): MapData => {
  const stored = localStorage.getItem(MAP_STORAGE_KEY);
  return stored ? JSON.parse(stored) : { drawings: [], images: [] };
=======
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
    defaultMap.data.showGrid = parsed.showGrid || false;
    return [defaultMap];
  }
  // Create default map
  return [createMap('Default Map')];
>>>>>>> b670daf34730cdb1093020bb79d3f1c09bfad523
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
      showGrid: false,
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

// Export/Import functionality
export interface ExportData {
  entities: Entity[];
  maps: Map[];
  exportedAt: number;
  version: string;
}

export const exportData = (): ExportData => {
  return {
    entities: loadEntities(),
    maps: loadMaps(),
    exportedAt: Date.now(),
    version: '2.0',
  };
};

export const importData = (data: ExportData): { success: boolean; error?: string } => {
  try {
    // Validate data structure
    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Invalid data format: expected an object' };
    }

    // Check version compatibility - support both v1.0 (old format) and v2.0 (new format with maps)
    const version = data.version || '1.0';
    
    // Validate entities array
    if (data.entities && !Array.isArray(data.entities)) {
      return { success: false, error: 'Invalid entities format: expected an array' };
    }

    // Import the data
    if (data.entities) {
      saveEntities(data.entities);
    }

    // Handle different versions
    if (version === '2.0' && data.maps) {
      // New format with multiple maps
      if (!Array.isArray(data.maps)) {
        return { success: false, error: 'Invalid maps format: expected an array' };
      }
      saveMaps(data.maps);
    } else if ((data as any).mapData) {
      // Old format with single mapData - migrate to new format
      const oldMapData = (data as any).mapData;
      const defaultMap = createMap('Imported Map');
      defaultMap.data.drawings = oldMapData.drawings || [];
      defaultMap.data.showGrid = oldMapData.showGrid || false;
      saveMaps([defaultMap]);
    } else {
      // No map data - create a default empty map
      saveMaps([createMap('Default Map')]);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};
