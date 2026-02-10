import React, { useMemo } from 'react';
import { Entity } from '../types';

interface EntityListProps {
  entities: Entity[];
  selectedEntity: Entity | null;
  onSelect: (entity: Entity) => void;
  onDelete: (id: string) => void;
}

const EntityList: React.FC<EntityListProps> = ({ entities, selectedEntity, onSelect, onDelete }) => {
  const groupedEntities = useMemo(() => {
    return entities.reduce((acc, entity) => {
      if (!acc[entity.type]) {
        acc[entity.type] = [];
      }
      acc[entity.type].push(entity);
      return acc;
    }, {} as Record<string, Entity[]>);
  }, [entities]);

  return (
    <div className="entity-list">
      <h2>Entities</h2>
      {Object.entries(groupedEntities).map(([type, items]) => (
        <div key={type} className="entity-group">
          <h3>{type.charAt(0).toUpperCase() + type.slice(1)}s</h3>
          <ul>
            {items.map(entity => (
              <li
                key={entity.id}
                className={selectedEntity?.id === entity.id ? 'selected' : ''}
                onClick={() => onSelect(entity)}
              >
                <span className="entity-name">{entity.name}</span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(entity.id);
                  }}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default EntityList;
