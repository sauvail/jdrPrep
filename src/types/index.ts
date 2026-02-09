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

export interface Spell {
  id: string;
  name: string;
  level: number;
  school?: string;
  castingTime?: string;
  range?: string;
  duration?: string;
  description?: string;
}

export interface Weapon {
  id: string;
  name: string;
  damage?: string;
  weaponType?: string;
  traits?: string[];
  description?: string;
}

export interface Armor {
  id: string;
  name: string;
  armorClass?: number;
  armorType?: string;
  traits?: string[];
  description?: string;
}

export interface Pet {
  id: string;
  name: string;
  species?: string;
  level?: number;
  description?: string;
}

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
  spells?: Spell[];
  weapons?: Weapon[];
  armors?: Armor[];
  pets?: Pet[];
}

export interface MapData {
  drawings: DrawingStroke[];
  showGrid?: boolean;
}
