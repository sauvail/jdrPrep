import React, { useState } from 'react';
import { EntityType } from '../types';
import MarkdownEditor from './MarkdownEditor';

interface EntityFormProps {
  onSubmit: (type: EntityType, name: string, description: string, tags: string[]) => void;
  onCancel: () => void;
}

const EntityForm: React.FC<EntityFormProps> = ({ onSubmit, onCancel }) => {
  const [type, setType] = useState<EntityType>('character');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(type, name, description, tags);
      setName('');
      setDescription('');
      setTags([]);
      setTagInput('');
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
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
        <MarkdownEditor
          value={description}
          onChange={setDescription}
          placeholder="Enter description (supports markdown)..."
          rows={4}
        />
      </div>
      <div className="form-group">
        <label htmlFor="tags">Tags:</label>
        <div className="tags-input-container">
          <input
            id="tags"
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleTagKeyPress}
            placeholder="Add tags (press Enter)..."
          />
          <button type="button" onClick={handleAddTag}>Add Tag</button>
        </div>
        {tags.length > 0 && (
          <div className="tags-list">
            {tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button type="button" onClick={() => handleRemoveTag(tag)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="form-actions">
        <button type="submit">Add Entity</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

export default EntityForm;
