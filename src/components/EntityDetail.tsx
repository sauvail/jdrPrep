import React, { useState } from 'react';
import { Entity } from '../types';

interface EntityDetailProps {
  entity: Entity;
  entities: Entity[];
  onUpdate: (id: string, updates: Partial<Entity>) => void;
}

const EntityDetail: React.FC<EntityDetailProps> = ({ entity, entities, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(entity.name);
  const [description, setDescription] = useState(entity.description);
  const [showConnectionForm, setShowConnectionForm] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [connectionType, setConnectionType] = useState('');
  const [connectionDesc, setConnectionDesc] = useState('');

  const handleUpdate = () => {
    onUpdate(entity.id, { name, description });
    setIsEditing(false);
  };

  const handleAddConnection = () => {
    if (selectedTarget && connectionType) {
      const newConnection = {
        id: `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={6}
            className="entity-description-input"
          />
          <div className="detail-actions">
            <button onClick={handleUpdate}>Save</button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div>
          <h2>{entity.name}</h2>
          <p className="entity-type-badge">{entity.type}</p>
          <p className="entity-description">{entity.description}</p>
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </div>
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
