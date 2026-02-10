import { Entity, EntityType, Map, Campaign } from '../types';
import { generateId } from './idGenerator';

const CAMPAIGNS_KEY = 'jdrprep_campaigns';
const ACTIVE_CAMPAIGN_KEY = 'jdrprep_active_campaign';

// Campaign management
export const loadCampaigns = (): Campaign[] => {
  const stored = localStorage.getItem(CAMPAIGNS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveCampaigns = (campaigns: Campaign[]): void => {
  localStorage.setItem(CAMPAIGNS_KEY, JSON.stringify(campaigns));
};

export const getActiveCampaignId = (): string | null => {
  return localStorage.getItem(ACTIVE_CAMPAIGN_KEY);
};

export const setActiveCampaignId = (campaignId: string): void => {
  localStorage.setItem(ACTIVE_CAMPAIGN_KEY, campaignId);
};

export const createCampaign = (name: string, description: string): Campaign => {
  return {
    id: generateId('campaign'),
    name,
    description,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
};

// Campaign-scoped storage keys
const getCampaignEntitiesKey = (campaignId: string) => `jdrprep_entities_${campaignId}`;
const getCampaignMapsKey = (campaignId: string) => `jdrprep_maps_${campaignId}`;
const getCampaignActiveMapKey = (campaignId: string) => `jdrprep_active_map_${campaignId}`;

// Campaign-scoped entity storage
export const loadEntities = (campaignId: string): Entity[] => {
  const stored = localStorage.getItem(getCampaignEntitiesKey(campaignId));
  return stored ? JSON.parse(stored) : [];
};

export const saveEntities = (campaignId: string, entities: Entity[]): void => {
  localStorage.setItem(getCampaignEntitiesKey(campaignId), JSON.stringify(entities));
};

// Campaign-scoped maps storage (multiple maps per campaign)
export const loadMaps = (campaignId: string): Map[] => {
  const stored = localStorage.getItem(getCampaignMapsKey(campaignId));
  if (stored) {
    return JSON.parse(stored);
  }
  // Migration: check for old map data for this campaign
  const oldMapData = localStorage.getItem(`jdrprep_map_data_${campaignId}`);
  if (oldMapData) {
    const parsed = JSON.parse(oldMapData);
    const defaultMap = createMap('Default Map');
    defaultMap.data.drawings = parsed.drawings || [];
    defaultMap.data.images = parsed.images || [];
    defaultMap.data.showGrid = parsed.showGrid || false;
    defaultMap.data.entityPositions = parsed.entityPositions || {};
    return [defaultMap];
  }
  // Create default map
  return [createMap('Default Map')];
};

export const saveMaps = (campaignId: string, maps: Map[]): void => {
  localStorage.setItem(getCampaignMapsKey(campaignId), JSON.stringify(maps));
};

export const getActiveMapId = (campaignId: string): string | null => {
  return localStorage.getItem(getCampaignActiveMapKey(campaignId));
};

export const setActiveMapId = (campaignId: string, mapId: string): void => {
  localStorage.setItem(getCampaignActiveMapKey(campaignId), mapId);
};

export const createMap = (name: string): Map => {
  return {
    id: generateId('map'),
    name,
    data: {
      drawings: [],
      images: [],
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

// Export/Import functionality (campaign-scoped with multiple maps)
export interface ExportData {
  entities: Entity[];
  maps: Map[];
  exportedAt: number;
  version: string;
}

export const exportData = (campaignId: string): ExportData => {
  return {
    entities: loadEntities(campaignId),
    maps: loadMaps(campaignId),
    exportedAt: Date.now(),
    version: '2.0',
  };
};

export const importData = (campaignId: string, data: ExportData): { success: boolean; error?: string } => {
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
      saveEntities(campaignId, data.entities);
    }

    // Handle different versions
    if (version === '2.0' && data.maps) {
      // New format with multiple maps
      if (!Array.isArray(data.maps)) {
        return { success: false, error: 'Invalid maps format: expected an array' };
      }
      saveMaps(campaignId, data.maps);
    } else if ((data as any).mapData) {
      // Old format with single mapData - migrate to new format
      const oldMapData = (data as any).mapData;
      const defaultMap = createMap('Imported Map');
      defaultMap.data.drawings = oldMapData.drawings || [];
      defaultMap.data.showGrid = oldMapData.showGrid || false;
      defaultMap.data.images = oldMapData.images || [];
      defaultMap.data.entityPositions = oldMapData.entityPositions || {};
      saveMaps(campaignId, [defaultMap]);
    } else {
      // No map data - create a default empty map
      saveMaps(campaignId, [createMap('Default Map')]);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};
