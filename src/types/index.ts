export type EntityType = 'location' | 'organization' | 'creature' | 'character' | 'quest' | 'general' | 'encounter';

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

export interface DrawingStroke {
  id: string;
  points: Position[];
  color: string;
  thickness: number;
}

export type CreatureRole = 'caster' | 'fighter' | 'tank' | 'ranged' | 'support' | 'skirmisher';

export interface EncounterCreature {
  id: string;
  name: string;
  role: CreatureRole;
  level: number;
  quantity: number;
  statblock?: string;
}

export interface EncounterData {
  creatures: EncounterCreature[];
  partyLevel: number;
  partySize: number;
  difficulty?: 'trivial' | 'low' | 'moderate' | 'severe' | 'extreme';
  totalXP?: number;
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
  encounterData?: EncounterData;
  tags?: string[];
}

export interface MapData {
  drawings: DrawingStroke[];
}
