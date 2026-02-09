import React, { useState } from 'react';
import { Spell, Weapon, Armor, Pet } from '../types';
import { generateId } from '../utils/idGenerator';

interface InventoryManagerProps {
  spells: Spell[];
  weapons: Weapon[];
  armors: Armor[];
  pets: Pet[];
  onUpdate: (updates: {
    spells?: Spell[];
    weapons?: Weapon[];
    armors?: Armor[];
    pets?: Pet[];
  }) => void;
}

type InventoryTab = 'spells' | 'weapons' | 'armors' | 'pets';

const InventoryManager: React.FC<InventoryManagerProps> = ({
  spells = [],
  weapons = [],
  armors = [],
  pets = [],
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('spells');
  const [showForm, setShowForm] = useState(false);

  // Spell form state
  const [spellName, setSpellName] = useState('');
  const [spellLevel, setSpellLevel] = useState(0);
  const [spellSchool, setSpellSchool] = useState('');
  const [spellCastingTime, setSpellCastingTime] = useState('');
  const [spellRange, setSpellRange] = useState('');
  const [spellDuration, setSpellDuration] = useState('');
  const [spellDescription, setSpellDescription] = useState('');

  // Weapon form state
  const [weaponName, setWeaponName] = useState('');
  const [weaponDamage, setWeaponDamage] = useState('');
  const [weaponType, setWeaponType] = useState('');
  const [weaponTraits, setWeaponTraits] = useState('');
  const [weaponDescription, setWeaponDescription] = useState('');

  // Armor form state
  const [armorName, setArmorName] = useState('');
  const [armorAC, setArmorAC] = useState(10);
  const [armorType, setArmorType] = useState('');
  const [armorTraits, setArmorTraits] = useState('');
  const [armorDescription, setArmorDescription] = useState('');

  // Pet form state
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState('');
  const [petLevel, setPetLevel] = useState(1);
  const [petDescription, setPetDescription] = useState('');

  const resetForm = () => {
    setSpellName('');
    setSpellLevel(0);
    setSpellSchool('');
    setSpellCastingTime('');
    setSpellRange('');
    setSpellDuration('');
    setSpellDescription('');
    setWeaponName('');
    setWeaponDamage('');
    setWeaponType('');
    setWeaponTraits('');
    setWeaponDescription('');
    setArmorName('');
    setArmorAC(10);
    setArmorType('');
    setArmorTraits('');
    setArmorDescription('');
    setPetName('');
    setPetSpecies('');
    setPetLevel(1);
    setPetDescription('');
    setShowForm(false);
  };

  const handleAddSpell = () => {
    if (!spellName.trim()) return;
    const newSpell: Spell = {
      id: generateId('spell'),
      name: spellName,
      level: spellLevel,
      school: spellSchool,
      castingTime: spellCastingTime,
      range: spellRange,
      duration: spellDuration,
      description: spellDescription,
    };
    onUpdate({ spells: [...spells, newSpell] });
    resetForm();
  };

  const handleAddWeapon = () => {
    if (!weaponName.trim()) return;
    const newWeapon: Weapon = {
      id: generateId('weapon'),
      name: weaponName,
      damage: weaponDamage,
      weaponType: weaponType,
      traits: weaponTraits ? weaponTraits.split(',').map(t => t.trim()) : [],
      description: weaponDescription,
    };
    onUpdate({ weapons: [...weapons, newWeapon] });
    resetForm();
  };

  const handleAddArmor = () => {
    if (!armorName.trim()) return;
    const newArmor: Armor = {
      id: generateId('armor'),
      name: armorName,
      armorClass: armorAC,
      armorType: armorType,
      traits: armorTraits ? armorTraits.split(',').map(t => t.trim()) : [],
      description: armorDescription,
    };
    onUpdate({ armors: [...armors, newArmor] });
    resetForm();
  };

  const handleAddPet = () => {
    if (!petName.trim()) return;
    const newPet: Pet = {
      id: generateId('pet'),
      name: petName,
      species: petSpecies,
      level: petLevel,
      description: petDescription,
    };
    onUpdate({ pets: [...pets, newPet] });
    resetForm();
  };

  const handleRemoveSpell = (id: string) => {
    onUpdate({ spells: spells.filter(s => s.id !== id) });
  };

  const handleRemoveWeapon = (id: string) => {
    onUpdate({ weapons: weapons.filter(w => w.id !== id) });
  };

  const handleRemoveArmor = (id: string) => {
    onUpdate({ armors: armors.filter(a => a.id !== id) });
  };

  const handleRemovePet = (id: string) => {
    onUpdate({ pets: pets.filter(p => p.id !== id) });
  };

  return (
    <div className="inventory-manager">
      <h3>Inventory & Abilities</h3>
      
      <div className="inventory-tabs">
        <button
          className={activeTab === 'spells' ? 'active' : ''}
          onClick={() => setActiveTab('spells')}
        >
          Spells ({spells.length})
        </button>
        <button
          className={activeTab === 'weapons' ? 'active' : ''}
          onClick={() => setActiveTab('weapons')}
        >
          Weapons ({weapons.length})
        </button>
        <button
          className={activeTab === 'armors' ? 'active' : ''}
          onClick={() => setActiveTab('armors')}
        >
          Armor ({armors.length})
        </button>
        <button
          className={activeTab === 'pets' ? 'active' : ''}
          onClick={() => setActiveTab('pets')}
        >
          Pets ({pets.length})
        </button>
      </div>

      <div className="inventory-content">
        {activeTab === 'spells' && (
          <div className="inventory-section">
            {spells.length === 0 ? (
              <p className="empty-inventory">No spells yet</p>
            ) : (
              <ul className="inventory-list">
                {spells.map(spell => (
                  <li key={spell.id} className="inventory-item">
                    <div className="item-header">
                      <strong>{spell.name}</strong>
                      <span className="item-level">Level {spell.level}</span>
                      <button
                        className="remove-item-btn"
                        onClick={() => handleRemoveSpell(spell.id)}
                      >
                        ×
                      </button>
                    </div>
                    {spell.school && <div className="item-detail">School: {spell.school}</div>}
                    {spell.castingTime && <div className="item-detail">Casting Time: {spell.castingTime}</div>}
                    {spell.range && <div className="item-detail">Range: {spell.range}</div>}
                    {spell.duration && <div className="item-detail">Duration: {spell.duration}</div>}
                    {spell.description && <div className="item-description">{spell.description}</div>}
                  </li>
                ))}
              </ul>
            )}

            {showForm ? (
              <div className="inventory-form">
                <h4>Add Spell</h4>
                <input
                  type="text"
                  placeholder="Spell name *"
                  value={spellName}
                  onChange={(e) => setSpellName(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Spell level"
                  value={spellLevel}
                  onChange={(e) => setSpellLevel(e.target.value === '' ? 0 : parseInt(e.target.value, 10))}
                />
                <input
                  type="text"
                  placeholder="School (e.g., Evocation)"
                  value={spellSchool}
                  onChange={(e) => setSpellSchool(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Casting time (e.g., 1 action)"
                  value={spellCastingTime}
                  onChange={(e) => setSpellCastingTime(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Range (e.g., 60 feet)"
                  value={spellRange}
                  onChange={(e) => setSpellRange(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Duration (e.g., Instantaneous)"
                  value={spellDuration}
                  onChange={(e) => setSpellDuration(e.target.value)}
                />
                <textarea
                  placeholder="Description"
                  value={spellDescription}
                  onChange={(e) => setSpellDescription(e.target.value)}
                  rows={3}
                />
                <div className="form-actions">
                  <button onClick={handleAddSpell}>Add Spell</button>
                  <button onClick={resetForm}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="add-item-btn" onClick={() => setShowForm(true)}>
                + Add Spell
              </button>
            )}
          </div>
        )}

        {activeTab === 'weapons' && (
          <div className="inventory-section">
            {weapons.length === 0 ? (
              <p className="empty-inventory">No weapons yet</p>
            ) : (
              <ul className="inventory-list">
                {weapons.map(weapon => (
                  <li key={weapon.id} className="inventory-item">
                    <div className="item-header">
                      <strong>{weapon.name}</strong>
                      <button
                        className="remove-item-btn"
                        onClick={() => handleRemoveWeapon(weapon.id)}
                      >
                        ×
                      </button>
                    </div>
                    {weapon.damage && <div className="item-detail">Damage: {weapon.damage}</div>}
                    {weapon.weaponType && <div className="item-detail">Type: {weapon.weaponType}</div>}
                    {weapon.traits && weapon.traits.length > 0 && (
                      <div className="item-detail">Traits: {weapon.traits.join(', ')}</div>
                    )}
                    {weapon.description && <div className="item-description">{weapon.description}</div>}
                  </li>
                ))}
              </ul>
            )}

            {showForm ? (
              <div className="inventory-form">
                <h4>Add Weapon</h4>
                <input
                  type="text"
                  placeholder="Weapon name *"
                  value={weaponName}
                  onChange={(e) => setWeaponName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Damage (e.g., 1d8)"
                  value={weaponDamage}
                  onChange={(e) => setWeaponDamage(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Type (e.g., Longsword, Martial)"
                  value={weaponType}
                  onChange={(e) => setWeaponType(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Traits (comma-separated)"
                  value={weaponTraits}
                  onChange={(e) => setWeaponTraits(e.target.value)}
                />
                <textarea
                  placeholder="Description"
                  value={weaponDescription}
                  onChange={(e) => setWeaponDescription(e.target.value)}
                  rows={3}
                />
                <div className="form-actions">
                  <button onClick={handleAddWeapon}>Add Weapon</button>
                  <button onClick={resetForm}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="add-item-btn" onClick={() => setShowForm(true)}>
                + Add Weapon
              </button>
            )}
          </div>
        )}

        {activeTab === 'armors' && (
          <div className="inventory-section">
            {armors.length === 0 ? (
              <p className="empty-inventory">No armor yet</p>
            ) : (
              <ul className="inventory-list">
                {armors.map(armor => (
                  <li key={armor.id} className="inventory-item">
                    <div className="item-header">
                      <strong>{armor.name}</strong>
                      <button
                        className="remove-item-btn"
                        onClick={() => handleRemoveArmor(armor.id)}
                      >
                        ×
                      </button>
                    </div>
                    {armor.armorClass !== undefined && <div className="item-detail">AC: {armor.armorClass}</div>}
                    {armor.armorType && <div className="item-detail">Type: {armor.armorType}</div>}
                    {armor.traits && armor.traits.length > 0 && (
                      <div className="item-detail">Traits: {armor.traits.join(', ')}</div>
                    )}
                    {armor.description && <div className="item-description">{armor.description}</div>}
                  </li>
                ))}
              </ul>
            )}

            {showForm ? (
              <div className="inventory-form">
                <h4>Add Armor</h4>
                <input
                  type="text"
                  placeholder="Armor name *"
                  value={armorName}
                  onChange={(e) => setArmorName(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Armor Class (AC)"
                  value={armorAC}
                  onChange={(e) => setArmorAC(e.target.value === '' ? 10 : parseInt(e.target.value, 10))}
                />
                <input
                  type="text"
                  placeholder="Type (e.g., Light, Medium, Heavy)"
                  value={armorType}
                  onChange={(e) => setArmorType(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Traits (comma-separated)"
                  value={armorTraits}
                  onChange={(e) => setArmorTraits(e.target.value)}
                />
                <textarea
                  placeholder="Description"
                  value={armorDescription}
                  onChange={(e) => setArmorDescription(e.target.value)}
                  rows={3}
                />
                <div className="form-actions">
                  <button onClick={handleAddArmor}>Add Armor</button>
                  <button onClick={resetForm}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="add-item-btn" onClick={() => setShowForm(true)}>
                + Add Armor
              </button>
            )}
          </div>
        )}

        {activeTab === 'pets' && (
          <div className="inventory-section">
            {pets.length === 0 ? (
              <p className="empty-inventory">No pets/companions yet</p>
            ) : (
              <ul className="inventory-list">
                {pets.map(pet => (
                  <li key={pet.id} className="inventory-item">
                    <div className="item-header">
                      <strong>{pet.name}</strong>
                      {pet.level !== undefined && <span className="item-level">Level {pet.level}</span>}
                      <button
                        className="remove-item-btn"
                        onClick={() => handleRemovePet(pet.id)}
                      >
                        ×
                      </button>
                    </div>
                    {pet.species && <div className="item-detail">Species: {pet.species}</div>}
                    {pet.description && <div className="item-description">{pet.description}</div>}
                  </li>
                ))}
              </ul>
            )}

            {showForm ? (
              <div className="inventory-form">
                <h4>Add Pet/Companion</h4>
                <input
                  type="text"
                  placeholder="Pet name *"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Species (e.g., Wolf, Dragon)"
                  value={petSpecies}
                  onChange={(e) => setPetSpecies(e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Level"
                  value={petLevel}
                  onChange={(e) => setPetLevel(e.target.value === '' ? 1 : parseInt(e.target.value, 10))}
                />
                <textarea
                  placeholder="Description"
                  value={petDescription}
                  onChange={(e) => setPetDescription(e.target.value)}
                  rows={3}
                />
                <div className="form-actions">
                  <button onClick={handleAddPet}>Add Pet</button>
                  <button onClick={resetForm}>Cancel</button>
                </div>
              </div>
            ) : (
              <button className="add-item-btn" onClick={() => setShowForm(true)}>
                + Add Pet/Companion
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManager;
