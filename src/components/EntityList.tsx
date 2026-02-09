import React, { useState, useMemo } from 'react';
import { Entity } from '../types';

interface EntityListProps {
  entities: Entity[];
  selectedEntity: Entity | null;
  onSelect: (entity: Entity) => void;
  onDelete: (id: string) => void;
}

const EntityList: React.FC<EntityListProps> = ({ entities, selectedEntity, onSelect, onDelete }) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Get all unique tags from all entities
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    entities.forEach(entity => {
      if (entity.tags) {
        entity.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    return Array.from(tagsSet).sort();
  }, [entities]);

  // Filter entities based on selected tags
  const filteredEntities = useMemo(() => {
    if (selectedTags.length === 0) {
      return entities;
    }
    return entities.filter(entity => {
      if (!entity.tags || entity.tags.length === 0) {
        return false;
      }
      return selectedTags.every(tag => entity.tags!.includes(tag));
    });
  }, [entities, selectedTags]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
  };

  const groupedEntities = filteredEntities.reduce((acc, entity) => {
    if (!acc[entity.type]) {
      acc[entity.type] = [];
    }
    acc[entity.type].push(entity);
    return acc;
  }, {} as Record<string, Entity[]>);

  return (
    <div className="entity-list">
      <h2>Entities</h2>
      {allTags.length > 0 && (
        <div className="tag-filter-section">
          <h4>Filter by Tags:</h4>
          <div className="tag-filters">
            {allTags.map(tag => (
              <button
                key={tag}
                className={`tag-filter ${selectedTags.includes(tag) ? 'active' : ''}`}
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <button className="clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      )}
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
      {filteredEntities.length === 0 && selectedTags.length > 0 && (
        <p className="no-results">No entities match the selected tags.</p>
      )}
    </div>
  );
};

export default EntityList;
