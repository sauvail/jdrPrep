import React, { useState, useEffect } from 'react';
import { Entity } from '../types';
import { exportEntityToPDF } from '../utils/pdfExport';
import { generateId } from '../utils/idGenerator';
import EncounterBuilder from './EncounterBuilder';
import MarkdownEditor from './MarkdownEditor';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import InventoryManager from './InventoryManager';
import CharacterBuilder from './CharacterBuilder';
import { replaceEntityTags } from '../utils/entityTagParser';

interface EntityDetailProps {
  entity: Entity;
  entities: Entity[];
  onUpdate: (id: string, updates: Partial<Entity>) => void;
}

const EntityDetail: React.FC<EntityDetailProps> = ({ entity, entities, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(entity.name);
  const [description, setDescription] = useState(entity.description);
  const [tags, setTags] = useState<string[]>(entity.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [connectionType, setConnectionType] = useState('');
  const [connectionDesc, setConnectionDesc] = useState('');

  // Sync local state when entity changes
  useEffect(() => {
    setName(entity.name);
    setDescription(entity.description);
    setTags(entity.tags || []);
    setIsEditing(false);
  }, [entity]);

  const handleUpdate = () => {
    onUpdate(entity.id, { name, description, tags });
    setIsEditing(false);
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

  const handleAddConnection = () => {
    if (selectedTarget && connectionType) {
      const newConnection = {
        id: generateId('conn'),
        targetId: selectedTarget,
        type: connectionType,
        description: connectionDesc,
      };
      onUpdate(entity.id, {
        connections: [...entity.connections, newConnection],
      });
      setSelectedTarget('');
      setConnectionType('');
      setConnectionDesc('');
      setShowConnectionForm(false);
    }
  };

  const handleRemoveConnection = (connectionId: string) => {
    onUpdate(entity.id, {
      connections: entity.connections.filter(c => c.id !== connectionId),
    });
  };

  const getEntityName = (id: string) => {
    const target = entities.find(e => e.id === id);
    return target ? target.name : 'Unknown';
  };

  const getMarkdownHTML = () => {
    if (!entity.description) return '';
    try {
      // First replace entity tags, then parse markdown
      const textWithEntityTags = replaceEntityTags(entity.description, entities);
      const rawHTML = marked.parse(textWithEntityTags) as string;
      return DOMPurify.sanitize(rawHTML);
    } catch (error) {
      return entity.description;
    }
  };

  return (
    <div className="entity-detail">
      {isEditing ? (
        <div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="entity-name-input"
          />
          <MarkdownEditor
            value={description}
            onChange={setDescription}
            rows={6}
            entities={entities}
          />
          <div className="form-group">
            <label>Tags:</label>
            <div className="tags-input-container">
              <input
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
          <div className="detail-actions">
            <button onClick={handleUpdate}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <h2>{entity.name}</h2>
          <p className="entity-type-badge">{entity.type}</p>
          {entity.tags && entity.tags.length > 0 && (
            <div className="entity-tags">
              {entity.tags.map(tag => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
          )}
          <div 
            className="entity-description markdown-content"
            dangerouslySetInnerHTML={{ __html: getMarkdownHTML() }}
          />
          <div className="detail-actions">
            <button onClick={() => setIsEditing(true)}>Edit</button>
            <button 
              onClick={() => exportEntityToPDF(entity)} 
              className="export-btn"
              aria-label="Export entity to PDF"
            >
              📄 Export to PDF
            </button>
          </div>
        </div>
      )}

      {entity.type === 'encounter' && (
        <EncounterBuilder
          encounterData={entity.encounterData || { creatures: [], partyLevel: 1, partySize: 4 }}
          onUpdate={(encounterData) => onUpdate(entity.id, { encounterData })}
        />
      )}

      {(entity.type === 'character' || entity.type === 'creature') && (
        <InventoryManager
          spells={entity.spells || []}
          weapons={entity.weapons || []}
          armors={entity.armors || []}
          pets={entity.pets || []}
          onUpdate={(updates) => onUpdate(entity.id, updates)}
        />
      )}

      {(entity.type === 'character' || entity.type === 'creature') && (
        <CharacterBuilder
          characterData={entity.characterData || { level: 1, spells: [], attacks: [], features: [] }}
          onUpdate={(characterData) => onUpdate(entity.id, { characterData })}
        />
      )}

      <div className="connections-section">
        <h3>Connections</h3>
        <ul className="connections-list">
          {entity.connections.map(conn => (
            <li key={conn.id}>
              <strong>{conn.type}:</strong> {getEntityName(conn.targetId)}
              {conn.description && <span> - {conn.description}</span>}
              <button
                className="remove-conn-btn"
                onClick={() => handleRemoveConnection(conn.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>

        {showConnectionForm ? (
          <div className="connection-form">
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
            >
              <option value="">Select target...</option>
              {entities
                .filter(e => e.id !== entity.id)
                .map(e => (
                  <option key={e.id} value={e.id}>
                    {e.name} ({e.type})
                  </option>
                ))}
            </select>
            <input
              type="text"
              placeholder="Connection type (e.g., 'ally', 'enemy', 'part of')"
              value={connectionType}
              onChange={(e) => setConnectionType(e.target.value)}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={connectionDesc}
              onChange={(e) => setConnectionDesc(e.target.value)}
            />
            <div className="form-actions">
              <button onClick={handleAddConnection}>Add Connection</button>
              <button onClick={() => setShowConnectionForm(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setShowConnectionForm(true)}>Add Connection</button>
        )}
      </div>
    </div>
  );
};

export default EntityDetail;
