export type EntityType = 'location' | 'organization' | 'creature' | 'character' | 'quest' | 'general';

export interface Connection {
  id: string;
  targetId: string;
  type: string;
  description?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  description: string;
  connections: Connection[];
  position?: Position;
  createdAt: number;
  updatedAt: number;
}
