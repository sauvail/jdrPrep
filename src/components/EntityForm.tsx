import React, { useState } from 'react';
import { EntityType } from '../types';

interface EntityFormProps {
  onSubmit: (type: EntityType, name: string, description: string) => void;
  onCancel: () => void;
}

const EntityForm: React.FC<EntityFormProps> = ({ onSubmit, onCancel }) => {
  const [type, setType] = useState<EntityType>('character');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(type, name, description);
      setName('');
      setDescription('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="entity-form">
      <h3>Add New Entity</h3>
      <div className="form-group">
        <label htmlFor="type">Type:</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as EntityType)}
        >
          <option value="character">Character</option>
          <option value="location">Location</option>
          <option value="organization">Organization</option>
          <option value="creature">Creature</option>
          <option value="quest">Quest</option>
          <option value="encounter">Encounter</option>
          <option value="general">General</option>
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="name">Name:</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter name..."
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="description">Description:</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description..."
          rows={4}
        />
      </div>
      <div className="form-actions">
        <button type="submit">Add Entity</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default EntityForm;
