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

// Character Building Types
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

export interface Spell {
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
  spells: Spell[];
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
}

export interface MapData {
  drawings: DrawingStroke[];
}
