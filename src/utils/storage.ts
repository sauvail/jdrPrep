import { Entity, EntityType, MapData, Campaign } from '../types';
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

// Campaign-scoped storage
const getCampaignEntitiesKey = (campaignId: string) => `jdrprep_entities_${campaignId}`;
const getCampaignMapKey = (campaignId: string) => `jdrprep_map_data_${campaignId}`;

export const loadEntities = (campaignId: string): Entity[] => {
  const stored = localStorage.getItem(getCampaignEntitiesKey(campaignId));
  return stored ? JSON.parse(stored) : [];
};

export const saveEntities = (campaignId: string, entities: Entity[]): void => {
  localStorage.setItem(getCampaignEntitiesKey(campaignId), JSON.stringify(entities));
};

export const loadMapData = (campaignId: string): MapData => {
  const stored = localStorage.getItem(getCampaignMapKey(campaignId));
  return stored ? JSON.parse(stored) : { drawings: [] };
};

export const saveMapData = (campaignId: string, mapData: MapData): void => {
  localStorage.setItem(getCampaignMapKey(campaignId), JSON.stringify(mapData));
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
  mapData: MapData;
  exportedAt: number;
  version: string;
}

export const exportData = (campaignId: string): ExportData => {
  return {
    entities: loadEntities(campaignId),
    mapData: loadMapData(campaignId),
    exportedAt: Date.now(),
    version: '1.0',
  };
};

export const importData = (campaignId: string, data: ExportData): { success: boolean; error?: string } => {
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
      saveEntities(campaignId, data.entities);
    }
    if (data.mapData) {
      saveMapData(campaignId, data.mapData);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
};
