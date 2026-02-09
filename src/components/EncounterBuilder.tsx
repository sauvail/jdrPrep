import React, { useState } from 'react';
import { EncounterCreature, EncounterData, CreatureRole } from '../types';
import { generateId } from '../utils/idGenerator';

interface EncounterBuilderProps {
  encounterData: EncounterData;
  onUpdate: (data: EncounterData) => void;
}

const EncounterBuilder: React.FC<EncounterBuilderProps> = ({ encounterData, onUpdate }) => {
  const [showAddCreature, setShowAddCreature] = useState(false);
  const [newCreature, setNewCreature] = useState({
    name: '',
    role: 'fighter' as CreatureRole,
    level: encounterData.partyLevel || 1,
    quantity: 1,
  });

  const roles: CreatureRole[] = ['caster', 'fighter', 'tank', 'ranged', 'support', 'skirmisher'];

  const calculateDifficulty = (data: EncounterData): EncounterData => {
    const partyLevel = data.partyLevel;
    const partySize = data.partySize;
    
    // PF2 XP budget calculation
    const xpBudgets = {
      trivial: 10 * partySize,
      low: 15 * partySize,
      moderate: 20 * partySize,
      severe: 30 * partySize,
      extreme: 40 * partySize,
    };

    // Calculate total XP based on creature levels relative to party level
    let totalXP = 0;
    data.creatures.forEach((creature) => {
      const levelDiff = creature.level - partyLevel;
      let creatureXP = 10; // base XP for creature at party level
      
      // PF2 XP values based on creature level relative to party
      if (levelDiff === -4) creatureXP = 2;
      else if (levelDiff === -3) creatureXP = 3;
      else if (levelDiff === -2) creatureXP = 4;
      else if (levelDiff === -1) creatureXP = 6;
      else if (levelDiff === 0) creatureXP = 10;
      else if (levelDiff === 1) creatureXP = 15;
      else if (levelDiff === 2) creatureXP = 20;
      else if (levelDiff === 3) creatureXP = 30;
      else if (levelDiff === 4) creatureXP = 40;
      else if (levelDiff >= 5) creatureXP = 80; // High level threats

      totalXP += creatureXP * creature.quantity;
    });

    let difficulty: 'trivial' | 'low' | 'moderate' | 'severe' | 'extreme' = 'trivial';
    if (totalXP >= xpBudgets.extreme) difficulty = 'extreme';
    else if (totalXP >= xpBudgets.severe) difficulty = 'severe';
    else if (totalXP >= xpBudgets.moderate) difficulty = 'moderate';
    else if (totalXP >= xpBudgets.low) difficulty = 'low';

    return { ...data, totalXP, difficulty };
  };

  const generateStatblock = (creature: EncounterCreature): string => {
    const level = creature.level;
    const role = creature.role;
    
    // Base stats by level
    const acBase = 14 + level;
    const hpBase = 20 + (level * 8);
    const attackBase = 6 + level;
    const dcBase = 15 + level;
    const damageBase = `${Math.floor(level / 2) + 1}d6+${Math.floor(level / 2) + 2}`;
    
    // Adjust based on role
    let ac = acBase;
    let hp = hpBase;
    let attack = attackBase;
    let dc = dcBase;
    let damage = damageBase;
    let special = '';

    switch (role) {
      case 'tank':
        ac += 2;
        hp += 10;
        attack -= 1;
        special = 'High AC and HP, can protect allies';
        break;
      case 'fighter':
        attack += 2;
        special = 'Balanced combat abilities, higher attack bonus';
        break;
      case 'caster':
        ac -= 2;
        hp -= 5;
        dc += 2;
        special = 'Spellcasting abilities, spell DC +2';
        break;
      case 'ranged':
        ac -= 1;
        attack += 1;
        special = 'Ranged attacks, mobility';
        break;
      case 'support':
        hp -= 5;
        dc += 1;
        special = 'Healing and buff abilities';
        break;
      case 'skirmisher':
        ac += 1;
        attack += 1;
        hp -= 5;
        special = 'High mobility, hit and run tactics';
        break;
    }

    return `Level ${level} ${role.charAt(0).toUpperCase() + role.slice(1)}
AC ${ac}, HP ${hp}
Attack +${attack} (${damage})
Save DC ${dc}
${special}`;
  };

  const handleAddCreature = () => {
    if (newCreature.name.trim()) {
      const creature: EncounterCreature = {
        id: generateId('creature'),
        ...newCreature,
        statblock: generateStatblock(newCreature as EncounterCreature),
      };

      const updatedData = calculateDifficulty({
        ...encounterData,
        creatures: [...encounterData.creatures, creature],
      });

      onUpdate(updatedData);
      setNewCreature({
        name: '',
        role: 'fighter',
        level: encounterData.partyLevel || 1,
        quantity: 1,
      });
      setShowAddCreature(false);
    }
  };

  const handleRemoveCreature = (id: string) => {
    const updatedData = calculateDifficulty({
      ...encounterData,
      creatures: encounterData.creatures.filter((c) => c.id !== id),
    });
    onUpdate(updatedData);
  };

  const handlePartyChange = (field: 'partyLevel' | 'partySize', value: number) => {
    const updatedData = calculateDifficulty({
      ...encounterData,
      [field]: value,
    });
    onUpdate(updatedData);
  };

  return (
    <div className="encounter-builder">
      <h3>Encounter Setup</h3>
      
      <div className="party-config">
        <div className="config-field">
          <label>Party Level:</label>
          <input
            type="number"
            min="1"
            max="20"
            value={encounterData.partyLevel}
            onChange={(e) => handlePartyChange('partyLevel', Number(e.target.value))}
          />
        </div>
        <div className="config-field">
          <label>Party Size:</label>
          <input
            type="number"
            min="1"
            max="10"
            value={encounterData.partySize}
            onChange={(e) => handlePartyChange('partySize', Number(e.target.value))}
          />
        </div>
      </div>

      {encounterData.difficulty && (
        <div className={`difficulty-indicator ${encounterData.difficulty}`}>
          <strong>Difficulty:</strong> {encounterData.difficulty.toUpperCase()}
          {encounterData.totalXP && <span> (XP: {encounterData.totalXP})</span>}
        </div>
      )}

      <div className="creatures-section">
        <h4>Creatures</h4>
        
        {encounterData.creatures.length === 0 ? (
          <p className="no-creatures">No creatures added yet</p>
        ) : (
          <ul className="creatures-list">
            {encounterData.creatures.map((creature) => (
              <li key={creature.id} className="creature-item">
                <div className="creature-header">
                  <strong>
                    {creature.quantity}x {creature.name}
                  </strong>
                  <span className="creature-meta">
                    Level {creature.level} {creature.role}
                  </span>
                  <button
                    className="remove-creature-btn"
                    onClick={() => handleRemoveCreature(creature.id)}
                  >
                    ×
                  </button>
                </div>
                {creature.statblock && (
                  <pre className="statblock">{creature.statblock}</pre>
                )}
              </li>
            ))}
          </ul>
        )}

        {showAddCreature ? (
          <div className="add-creature-form">
            <input
              type="text"
              placeholder="Creature name"
              value={newCreature.name}
              onChange={(e) => setNewCreature({ ...newCreature, name: e.target.value })}
            />
            <select
              value={newCreature.role}
              onChange={(e) => setNewCreature({ ...newCreature, role: e.target.value as CreatureRole })}
            >
              {roles.map((role) => (
                <option key={role} value={role}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Level"
              min="1"
              max="20"
              value={newCreature.level}
              onChange={(e) => setNewCreature({ ...newCreature, level: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Quantity"
              min="1"
              max="20"
              value={newCreature.quantity}
              onChange={(e) => setNewCreature({ ...newCreature, quantity: Number(e.target.value) })}
            />
            <div className="form-actions">
              <button onClick={handleAddCreature}>Add</button>
              <button onClick={() => setShowAddCreature(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="add-creature-btn" onClick={() => setShowAddCreature(true)}>
            + Add Creature
          </button>
        )}
      </div>
    </div>
  );
};

export default EncounterBuilder;
