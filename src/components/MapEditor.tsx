import React, { useState, useRef } from 'react';
import { Entity } from '../types';

interface MapEditorProps {
  entities: Entity[];
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
}

const MapEditor: React.FC<MapEditorProps> = ({ entities, onUpdatePosition }) => {
  const [draggedEntity, setDraggedEntity] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, entityId: string) => {
    const entity = entities.find(e => e.id === entityId);
    if (entity && entity.position && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - entity.position.x;
      const offsetY = e.clientY - rect.top - entity.position.y;
      setDragOffset({ x: offsetX, y: offsetY });
      setDraggedEntity(entityId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedEntity && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - 80, e.clientX - rect.left - dragOffset.x));
      const y = Math.max(0, Math.min(rect.height - 60, e.clientY - rect.top - dragOffset.y));
      onUpdatePosition(draggedEntity, { x, y });
    }
  };

  const handleMouseUp = () => {
    setDraggedEntity(null);
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (e.target === mapRef.current) {
      // Could add functionality to place new entities on the map
    }
  };

  const getConnectionPath = (entity: Entity, targetEntity: Entity) => {
    if (!entity.position || !targetEntity.position) return null;
    
    const x1 = entity.position.x + 40; // Center of entity
    const y1 = entity.position.y + 30;
    const x2 = targetEntity.position.x + 40;
    const y2 = targetEntity.position.y + 30;

    return `M ${x1} ${y1} L ${x2} ${y2}`;
  };

  const entitiesOnMap = entities.filter(e => e.position);

  return (
    <div className="map-editor">
      <h2>Map View</h2>
      <div
        ref={mapRef}
        className="map-canvas"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleMapClick}
      >
        <svg className="connection-layer">
          {entitiesOnMap.map(entity =>
            entity.connections.map(conn => {
              const target = entities.find(e => e.id === conn.targetId);
              if (!target) return null;
              const path = getConnectionPath(entity, target);
              if (!path) return null;
              return (
                <g key={`${entity.id}-${conn.id}`}>
                  <path
                    d={path}
                    stroke="#666"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="5,5"
                  />
                </g>
              );
            })
          )}
        </svg>

        {entitiesOnMap.map(entity => (
          <div
            key={entity.id}
            className={`map-entity ${entity.type}`}
            style={{
              left: `${entity.position!.x}px`,
              top: `${entity.position!.y}px`,
              cursor: draggedEntity === entity.id ? 'grabbing' : 'grab',
            }}
            onMouseDown={(e) => handleMouseDown(e, entity.id)}
          >
            <div className="entity-icon">{entity.type[0].toUpperCase()}</div>
            <div className="entity-label">{entity.name}</div>
          </div>
        ))}
      </div>

      <div className="map-controls">
        <p>Drag entities onto the map to position them. Connections will be shown automatically.</p>
        {entities.filter(e => !e.position).length > 0 && (
          <div className="unmapped-entities">
            <h4>Entities not on map:</h4>
            <ul>
              {entities.filter(e => !e.position).map(e => (
                <li
                  key={e.id}
                  onClick={() => onUpdatePosition(e.id, { x: 50, y: 50 })}
                  style={{ cursor: 'pointer' }}
                >
                  {e.name} ({e.type}) - Click to add to map
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapEditor;
