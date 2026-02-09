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

export interface MapImage {
  id: string;
  dataUrl: string;
  position: Position;
  width: number;
  height: number;
  zIndex: number;
}

export type CreatureRole = 'caster' | 'fighter' | 'tank' | 'ranged' | 'support' | 'skirmisher';

// Inventory items (from master)
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

// Character Building Types (from feature branch)
export type CharacterClass = 'fighter' | 'wizard' | 'cleric' | 'rogue' | 'ranger' | 'barbarian' | 'bard' | 'druid' | 'monk' | 'paladin' | 'sorcerer';
export type CharacterRace = 'human' | 'elf' | 'dwarf' | 'halfling' | 'gnome' | 'goblin' | 'orc' | 'half-elf' | 'half-orc';

export interface AbilityScores {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

// Character builder spell (different from inventory Spell)
export interface CharacterSpell {
  id: string;
  name: string;
  level: number;
  description: string;
  damage?: string;
  saveDC?: number;
}

export interface Attack {
  id: string;
  name: string;
  attackBonus: number;
  damage: string;
  damageType?: string;
}

export interface CharacterData {
  class?: CharacterClass;
  race?: CharacterRace;
  level: number;
  abilityScores?: AbilityScores;
  spells: CharacterSpell[];
  attacks: Attack[];
  features: string[];
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
  characterData?: CharacterData;
  tags?: string[];
  spells?: Spell[];
  weapons?: Weapon[];
  armors?: Armor[];
  pets?: Pet[];
}

export interface MapData {
  drawings: DrawingStroke[];
  images: MapImage[];
  entityPositions: Record<string, Position>; // entityId -> position mapping
  showGrid?: boolean;
}

export interface Map {
  id: string;
  name: string;
  data: MapData;
  createdAt: number;
  updatedAt: number;
}
