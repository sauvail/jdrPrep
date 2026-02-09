import React, { useState, useEffect } from 'react';
import { CharacterData, CharacterClass, CharacterRace, AbilityScores, CharacterSpell, Attack } from '../types';
import { generateId } from '../utils/idGenerator';

interface CharacterBuilderProps {
  characterData: CharacterData;
  onUpdate: (data: CharacterData) => void;
}

const CharacterBuilder: React.FC<CharacterBuilderProps> = ({ characterData, onUpdate }) => {
  const [localData, setLocalData] = useState<CharacterData>(characterData);
  const [showSpellForm, setShowSpellForm] = useState(false);
  const [showAttackForm, setShowAttackForm] = useState(false);
  const [newSpell, setNewSpell] = useState({ name: '', level: 1, description: '' });
  const [newAttack, setNewAttack] = useState({ name: '', damage: '1d8' });

  const classes: CharacterClass[] = ['fighter', 'wizard', 'cleric', 'rogue', 'ranger', 'barbarian', 'bard', 'druid', 'monk', 'paladin', 'sorcerer'];
  const races: CharacterRace[] = ['human', 'elf', 'dwarf', 'halfling', 'gnome', 'goblin', 'orc', 'half-elf', 'half-orc'];

  // Update parent when local data changes
  useEffect(() => {
    const updatedData = calculateDerivedStats(localData);
    onUpdate(updatedData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localData]);

  const calculateAbilityModifier = (score: number): number => {
    return Math.floor((score - 10) / 2);
  };

  const getProficiencyBonus = (level: number): number => {
    return Math.floor((level - 1) / 4) + 2;
  };

  const getClassFeatures = (charClass: CharacterClass | undefined, level: number): string[] => {
    if (!charClass) return [];
    
    const features: string[] = [];
    const classFeatureMap: Record<CharacterClass, Record<number, string[]>> = {
      fighter: {
        1: ['Fighting Style', 'Second Wind'],
        2: ['Action Surge (1 use)'],
        3: ['Martial Archetype'],
        5: ['Extra Attack'],
      },
      wizard: {
        1: ['Spellcasting', 'Arcane Recovery'],
        2: ['Arcane Tradition'],
        3: ['Cantrip Formulas'],
        4: ['Ability Score Improvement'],
      },
      cleric: {
        1: ['Spellcasting', 'Divine Domain'],
        2: ['Channel Divinity (1/rest)', 'Divine Domain feature'],
        5: ['Destroy Undead (CR 1/2)'],
      },
      rogue: {
        1: ['Expertise', 'Sneak Attack (1d6)', "Thieves' Cant"],
        2: ['Cunning Action'],
        3: ['Roguish Archetype', 'Sneak Attack (2d6)'],
      },
      ranger: {
        1: ['Favored Enemy', 'Natural Explorer'],
        2: ['Fighting Style', 'Spellcasting'],
        3: ['Ranger Archetype', 'Primeval Awareness'],
      },
      barbarian: {
        1: ['Rage', 'Unarmored Defense'],
        2: ['Reckless Attack', 'Danger Sense'],
        3: ['Primal Path'],
      },
      bard: {
        1: ['Spellcasting', 'Bardic Inspiration (d6)'],
        2: ['Jack of All Trades', 'Song of Rest (d6)'],
        3: ['Bard College', 'Expertise'],
      },
      druid: {
        1: ['Druidic', 'Spellcasting'],
        2: ['Wild Shape', 'Druid Circle'],
        4: ['Wild Shape Improvement'],
      },
      monk: {
        1: ['Unarmored Defense', 'Martial Arts (1d4)'],
        2: ['Ki', 'Unarmored Movement'],
        3: ['Monastic Tradition', 'Deflect Missiles'],
      },
      paladin: {
        1: ['Divine Sense', 'Lay on Hands'],
        2: ['Fighting Style', 'Spellcasting', 'Divine Smite'],
        3: ['Divine Health', 'Sacred Oath'],
      },
      sorcerer: {
        1: ['Spellcasting', 'Sorcerous Origin'],
        2: ['Font of Magic'],
        3: ['Metamagic'],
      },
    };

    for (let i = 1; i <= level; i++) {
      if (classFeatureMap[charClass][i]) {
        features.push(...classFeatureMap[charClass][i]);
      }
    }
    
    return features;
  };

  const getRaceFeatures = (race: CharacterRace | undefined): string[] => {
    if (!race) return [];
    
    const raceFeatures: Record<CharacterRace, string[]> = {
      human: ['Versatile (+1 to all ability scores)', 'Extra Language'],
      elf: ['Darkvision (60 ft)', 'Keen Senses', 'Fey Ancestry', 'Trance'],
      dwarf: ['Darkvision (60 ft)', 'Dwarven Resilience', 'Stonecunning'],
      halfling: ['Lucky', 'Brave', 'Halfling Nimbleness'],
      gnome: ['Darkvision (60 ft)', 'Gnome Cunning'],
      goblin: ['Darkvision (60 ft)', 'Fury of the Small', 'Nimble Escape'],
      orc: ['Darkvision (60 ft)', 'Aggressive', 'Powerful Build'],
      'half-elf': ['Darkvision (60 ft)', 'Fey Ancestry', 'Skill Versatility'],
      'half-orc': ['Darkvision (60 ft)', 'Relentless Endurance', 'Savage Attacks'],
    };
    
    return raceFeatures[race] || [];
  };

  const calculateDerivedStats = (data: CharacterData): CharacterData => {
    if (!data.abilityScores) return data;

    const level = data.level;
    const profBonus = getProficiencyBonus(level);
    
    // Recalculate features
    const classFeatures = getClassFeatures(data.class, level);
    const raceFeatures = getRaceFeatures(data.race);
    const features = [...classFeatures, ...raceFeatures];

    // Update spells with calculated save DC
    const updatedSpells = data.spells.map(spell => {
      const spellcastingMod = getSpellcastingModifier(data.class, data.abilityScores);
      const saveDC = 8 + profBonus + spellcastingMod;
      return { ...spell, saveDC };
    });

    // Update attacks with calculated attack bonus
    const updatedAttacks = data.attacks.map(attack => {
      const attackMod = getAttackModifier(data.class, data.abilityScores);
      const attackBonus = profBonus + attackMod;
      return { ...attack, attackBonus };
    });

    return {
      ...data,
      features,
      spells: updatedSpells,
      attacks: updatedAttacks,
    };
  };

  const getSpellcastingModifier = (charClass: CharacterClass | undefined, scores: AbilityScores | undefined): number => {
    if (!charClass || !scores) return 0;
    
    const spellcastingAbility: Record<CharacterClass, keyof AbilityScores> = {
      wizard: 'intelligence',
      cleric: 'wisdom',
      druid: 'wisdom',
      bard: 'charisma',
      sorcerer: 'charisma',
      paladin: 'charisma',
      ranger: 'wisdom',
      fighter: 'intelligence',
      rogue: 'intelligence',
      barbarian: 'constitution',
      monk: 'wisdom',
    };
    
    const ability = spellcastingAbility[charClass];
    return calculateAbilityModifier(scores[ability]);
  };

  const getAttackModifier = (charClass: CharacterClass | undefined, scores: AbilityScores | undefined): number => {
    if (!charClass || !scores) return 0;
    
    // Prefer strength for melee classes, dexterity for others
    const meleeClasses: CharacterClass[] = ['fighter', 'barbarian', 'paladin', 'monk'];
    
    if (meleeClasses.includes(charClass)) {
      return Math.max(
        calculateAbilityModifier(scores.strength),
        calculateAbilityModifier(scores.dexterity)
      );
    }
    
    return calculateAbilityModifier(scores.dexterity);
  };

  const handleClassChange = (charClass: CharacterClass) => {
    setLocalData({ ...localData, class: charClass });
  };

  const handleRaceChange = (race: CharacterRace) => {
    setLocalData({ ...localData, race });
  };

  const handleLevelChange = (level: number) => {
    setLocalData({ ...localData, level });
  };

  const handleAbilityScoreChange = (ability: keyof AbilityScores, value: number) => {
    setLocalData({
      ...localData,
      abilityScores: {
        ...localData.abilityScores!,
        [ability]: value,
      },
    });
  };

  const handleAddSpell = () => {
    if (newSpell.name.trim()) {
      const spell: CharacterSpell = {
        id: generateId('spell'),
        ...newSpell,
        saveDC: 0, // Will be calculated
      };
      
      setLocalData({
        ...localData,
        spells: [...localData.spells, spell],
      });
      
      setNewSpell({ name: '', level: 1, description: '' });
      setShowSpellForm(false);
    }
  };

  const handleRemoveSpell = (id: string) => {
    setLocalData({
      ...localData,
      spells: localData.spells.filter(s => s.id !== id),
    });
  };

  const handleAddAttack = () => {
    if (newAttack.name.trim()) {
      const attack: Attack = {
        id: generateId('attack'),
        ...newAttack,
        attackBonus: 0, // Will be calculated
      };
      
      setLocalData({
        ...localData,
        attacks: [...localData.attacks, attack],
      });
      
      setNewAttack({ name: '', damage: '1d8' });
      setShowAttackForm(false);
    }
  };

  const handleRemoveAttack = (id: string) => {
    setLocalData({
      ...localData,
      attacks: localData.attacks.filter(a => a.id !== id),
    });
  };

  const initializeAbilityScores = () => {
    setLocalData({
      ...localData,
      abilityScores: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10,
      },
    });
  };

  const calculateHP = (): number => {
    if (!localData.abilityScores || !localData.class) return 0;
    
    const conMod = calculateAbilityModifier(localData.abilityScores.constitution);
    const hitDice: Record<CharacterClass, number> = {
      wizard: 6,
      sorcerer: 6,
      bard: 8,
      cleric: 8,
      druid: 8,
      monk: 8,
      rogue: 8,
      ranger: 10,
      fighter: 10,
      paladin: 10,
      barbarian: 12,
    };
    
    const hd = hitDice[localData.class];
    return hd + conMod + (localData.level - 1) * (Math.floor(hd / 2) + 1 + conMod);
  };

  const calculateAC = (): number => {
    if (!localData.abilityScores) return 10;
    
    const dexMod = calculateAbilityModifier(localData.abilityScores.dexterity);
    // Base AC (assumes no armor for simplicity)
    return 10 + dexMod;
  };

  return (
    <div className="character-builder">
      <h3>Character Builder</h3>
      
      <div className="character-basics">
        <div className="form-row">
          <div className="form-field">
            <label>Class:</label>
            <select
              value={localData.class || ''}
              onChange={(e) => handleClassChange(e.target.value as CharacterClass)}
            >
              <option value="">Select Class...</option>
              {classes.map(c => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-field">
            <label>Race:</label>
            <select
              value={localData.race || ''}
              onChange={(e) => handleRaceChange(e.target.value as CharacterRace)}
            >
              <option value="">Select Race...</option>
              {races.map(r => (
                <option key={r} value={r}>
                  {r.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-')}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-field">
            <label>Level:</label>
            <input
              type="number"
              min="1"
              max="20"
              value={localData.level}
              onChange={(e) => handleLevelChange(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {localData.abilityScores ? (
        <div className="ability-scores">
          <h4>Ability Scores</h4>
          <div className="scores-grid">
            {Object.entries(localData.abilityScores).map(([ability, value]) => (
              <div key={ability} className="ability-score">
                <label>{ability.charAt(0).toUpperCase() + ability.slice(1, 4)}:</label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={value}
                  onChange={(e) => handleAbilityScoreChange(ability as keyof AbilityScores, Number(e.target.value))}
                />
                <span className="modifier">
                  {calculateAbilityModifier(value) >= 0 ? '+' : ''}
                  {calculateAbilityModifier(value)}
                </span>
              </div>
            ))}
          </div>
          
          <div className="derived-stats">
            <div className="stat-item">
              <strong>AC:</strong> {calculateAC()}
            </div>
            <div className="stat-item">
              <strong>HP:</strong> {calculateHP()}
            </div>
            <div className="stat-item">
              <strong>Proficiency Bonus:</strong> +{getProficiencyBonus(localData.level)}
            </div>
          </div>
        </div>
      ) : (
        <button onClick={initializeAbilityScores} className="init-scores-btn">
          Set Ability Scores
        </button>
      )}

      {localData.features.length > 0 && (
        <div className="features-section">
          <h4>Features</h4>
          <ul className="features-list">
            {localData.features.map((feature, idx) => (
              <li key={idx}>{feature}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="spells-section">
        <h4>Spells</h4>
        {localData.spells.length === 0 ? (
          <p className="no-items">No spells added</p>
        ) : (
          <ul className="spells-list">
            {localData.spells.map(spell => (
              <li key={spell.id} className="spell-item">
                <div className="spell-header">
                  <strong>{spell.name}</strong>
                  <span className="spell-level">Level {spell.level}</span>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveSpell(spell.id)}
                  >
                    ×
                  </button>
                </div>
                <p className="spell-description">{spell.description}</p>
                {spell.saveDC && (
                  <p className="spell-stats">
                    <strong>Save DC:</strong> {spell.saveDC}
                    {spell.damage && <span> | <strong>Damage:</strong> {spell.damage}</span>}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
        
        {showSpellForm ? (
          <div className="add-spell-form">
            <input
              type="text"
              placeholder="Spell name"
              value={newSpell.name}
              onChange={(e) => setNewSpell({ ...newSpell, name: e.target.value })}
            />
            <input
              type="number"
              placeholder="Level"
              min="0"
              max="9"
              value={newSpell.level}
              onChange={(e) => setNewSpell({ ...newSpell, level: Number(e.target.value) })}
            />
            <input
              type="text"
              placeholder="Description"
              value={newSpell.description}
              onChange={(e) => setNewSpell({ ...newSpell, description: e.target.value })}
            />
            <div className="form-actions">
              <button onClick={handleAddSpell}>Add Spell</button>
              <button onClick={() => setShowSpellForm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="add-btn" onClick={() => setShowSpellForm(true)}>
            + Add Spell
          </button>
        )}
      </div>

      <div className="attacks-section">
        <h4>Attacks</h4>
        {localData.attacks.length === 0 ? (
          <p className="no-items">No attacks added</p>
        ) : (
          <ul className="attacks-list">
            {localData.attacks.map(attack => (
              <li key={attack.id} className="attack-item">
                <div className="attack-header">
                  <strong>{attack.name}</strong>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemoveAttack(attack.id)}
                  >
                    ×
                  </button>
                </div>
                <p className="attack-stats">
                  <strong>Attack Bonus:</strong> +{attack.attackBonus} |{' '}
                  <strong>Damage:</strong> {attack.damage}
                  {attack.damageType && <span> ({attack.damageType})</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
        
        {showAttackForm ? (
          <div className="add-attack-form">
            <input
              type="text"
              placeholder="Attack name (e.g., Longsword)"
              value={newAttack.name}
              onChange={(e) => setNewAttack({ ...newAttack, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Damage (e.g., 1d8+3)"
              value={newAttack.damage}
              onChange={(e) => setNewAttack({ ...newAttack, damage: e.target.value })}
            />
            <div className="form-actions">
              <button onClick={handleAddAttack}>Add Attack</button>
              <button onClick={() => setShowAttackForm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="add-btn" onClick={() => setShowAttackForm(true)}>
            + Add Attack
          </button>
        )}
      </div>
    </div>
  );
};

export default CharacterBuilder;
