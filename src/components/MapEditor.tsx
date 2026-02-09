import React, { useState, useRef, useEffect } from 'react';
import { Entity, DrawingStroke, Position, Map } from '../types';
import { updateMap } from '../utils/storage';
import { generateId } from '../utils/idGenerator';
import DrawingTools from './DrawingTools';

interface MapEditorProps {
  entities: Entity[];
  maps: Map[];
  activeMap: Map | null;
  onUpdateMap: (map: Map) => void;
  onCreateMap: (name: string) => void;
  onDeleteMap: (mapId: string) => void;
  onMapChange: (mapId: string) => void;
}

const MapEditor: React.FC<MapEditorProps> = ({
  entities,
  maps,
  activeMap,
  onUpdateMap,
  onCreateMap,
  onDeleteMap,
  onMapChange,
}) => {
  const [draggedEntity, setDraggedEntity] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Position[]>([]);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedThickness, setSelectedThickness] = useState(4);
  const [showNewMapForm, setShowNewMapForm] = useState(false);
  const [newMapName, setNewMapName] = useState('');
  const [editingMapName, setEditingMapName] = useState(false);
  const [editedMapName, setEditedMapName] = useState('');
  const mapRef = useRef<HTMLDivElement>(null);

  const drawings = activeMap?.data.drawings || [];
  const entityPositions = activeMap?.data.entityPositions || {};

  const updateActiveMapData = (updates: Partial<Map['data']>) => {
    if (!activeMap) return;
    const updatedMap = updateMap(activeMap, {
      data: {
        ...activeMap.data,
        ...updates,
      },
    });
    onUpdateMap(updatedMap);
  };

  const handleMouseDown = (e: React.MouseEvent, entityId: string) => {
    if (isDrawingMode || !activeMap) return;
    
    const position = entityPositions[entityId];
    if (position && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - position.x;
      const offsetY = e.clientY - rect.top - position.y;
      setDragOffset({ x: offsetX, y: offsetY });
      setDraggedEntity(entityId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawingMode && isDrawing && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentStroke([...currentStroke, { x, y }]);
    } else if (draggedEntity && mapRef.current && activeMap) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - 80, e.clientX - rect.left - dragOffset.x));
      const y = Math.max(0, Math.min(rect.height - 60, e.clientY - rect.top - dragOffset.y));
      
      updateActiveMapData({
        entityPositions: {
          ...entityPositions,
          [draggedEntity]: { x, y },
        },
      });
    }
  };

  const handleMouseUp = () => {
    if (isDrawingMode && isDrawing && currentStroke.length > 0) {
      const newStroke: DrawingStroke = {
        id: generateId('stroke'),
        points: currentStroke,
        color: selectedColor,
        thickness: selectedThickness,
      };
      updateActiveMapData({
        drawings: [...drawings, newStroke],
      });
      setCurrentStroke([]);
      setIsDrawing(false);
    } else {
      setDraggedEntity(null);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isDrawingMode && e.target === mapRef.current) {
      setIsDrawing(true);
      const rect = mapRef.current!.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentStroke([{ x, y }]);
    }
  };

  const getConnectionPath = (entity: Entity, targetEntity: Entity) => {
    const pos1 = entityPositions[entity.id];
    const pos2 = entityPositions[targetEntity.id];
    
    if (!pos1 || !pos2) return null;
    
    const x1 = pos1.x + 40; // Center of entity
    const y1 = pos1.y + 30;
    const x2 = pos2.x + 40;
    const y2 = pos2.y + 30;

    return `M ${x1} ${y1} L ${x2} ${y2}`;
  };

  const getStrokePath = (points: Position[]): string => {
    if (points.length === 0) return '';
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return path;
  };

  const entitiesOnMap = entities.filter(e => entityPositions[e.id]);

  const handleAddEntityToMap = (entityId: string) => {
    if (!activeMap) return;
    updateActiveMapData({
      entityPositions: {
        ...entityPositions,
        [entityId]: { x: 50, y: 50 },
      },
    });
  };

  const handleCreateMap = () => {
    if (newMapName.trim()) {
      onCreateMap(newMapName.trim());
      setNewMapName('');
      setShowNewMapForm(false);
    }
  };

  const handleRenameMap = () => {
    if (activeMap && editedMapName.trim()) {
      const updatedMap = updateMap(activeMap, { name: editedMapName.trim() });
      onUpdateMap(updatedMap);
      setEditingMapName(false);
    }
  };

  const handleDeleteCurrentMap = () => {
    if (activeMap && maps.length > 1) {
      if (window.confirm(`Are you sure you want to delete the map "${activeMap.name}"?`)) {
        onDeleteMap(activeMap.id);
      }
    }
  };

  useEffect(() => {
    if (activeMap && editingMapName) {
      setEditedMapName(activeMap.name);
    }
  }, [editingMapName, activeMap]);

  if (!activeMap) {
    return (
      <div className="map-editor">
        <h2>Map View</h2>
        <div className="empty-state">
          <p>No maps available. Create your first map to get started.</p>
          <button onClick={() => onCreateMap('My First Map')}>Create Map</button>
        </div>
      </div>
    );
  }

  return (
    <div className="map-editor">
      <div className="map-header">
        <div className="map-title-section">
          {editingMapName ? (
            <div className="map-rename-form">
              <input
                type="text"
                value={editedMapName}
                onChange={(e) => setEditedMapName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleRenameMap()}
                autoFocus
              />
              <button onClick={handleRenameMap}>Save</button>
              <button onClick={() => setEditingMapName(false)}>Cancel</button>
            </div>
          ) : (
            <>
              <h2>{activeMap.name}</h2>
              <button className="rename-map-btn" onClick={() => setEditingMapName(true)}>
                ✏️ Rename
              </button>
            </>
          )}
        </div>
        
        <div className="map-selector">
          <label>Select Map:</label>
          <select value={activeMap.id} onChange={(e) => onMapChange(e.target.value)}>
            {maps.map(map => (
              <option key={map.id} value={map.id}>{map.name}</option>
            ))}
          </select>
          
          {showNewMapForm ? (
            <div className="new-map-form">
              <input
                type="text"
                value={newMapName}
                onChange={(e) => setNewMapName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateMap()}
                placeholder="Map name"
                autoFocus
              />
              <button onClick={handleCreateMap}>Create</button>
              <button onClick={() => setShowNewMapForm(false)}>Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowNewMapForm(true)}>+ New Map</button>
          )}
          
          {maps.length > 1 && (
            <button className="delete-map-btn" onClick={handleDeleteCurrentMap}>
              🗑️ Delete Map
            </button>
          )}
        </div>
      </div>
      
      <DrawingTools
        selectedColor={selectedColor}
        selectedThickness={selectedThickness}
        isDrawing={isDrawingMode}
        onColorChange={setSelectedColor}
        onThicknessChange={setSelectedThickness}
        onToggleDrawing={() => setIsDrawingMode(!isDrawingMode)}
        onClearDrawings={() => updateActiveMapData({ drawings: [] })}
      />

      <div
        ref={mapRef}
        className="map-canvas"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDrawingMode ? 'crosshair' : 'default' }}
      >
        <svg className="connection-layer">
          {/* Drawings */}
          {drawings.map((stroke) => (
            <path
              key={stroke.id}
              d={getStrokePath(stroke.points)}
              stroke={stroke.color}
              strokeWidth={stroke.thickness}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
          
          {/* Current stroke being drawn */}
          {currentStroke.length > 0 && (
            <path
              d={getStrokePath(currentStroke)}
              stroke={selectedColor}
              strokeWidth={selectedThickness}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Entity connections */}
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

        {entitiesOnMap.map(entity => {
          const position = entityPositions[entity.id];
          if (!position) return null;
          
          return (
            <div
              key={entity.id}
              className={`map-entity ${entity.type}`}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                cursor: isDrawingMode ? 'crosshair' : (draggedEntity === entity.id ? 'grabbing' : 'grab'),
                pointerEvents: isDrawingMode ? 'none' : 'auto',
              }}
              onMouseDown={(e) => handleMouseDown(e, entity.id)}
            >
              <div className="entity-icon">{entity.type[0].toUpperCase()}</div>
              <div className="entity-label">{entity.name}</div>
            </div>
          );
        })}
      </div>

      <div className="map-controls">
        <p>{isDrawingMode ? 'Click and drag to draw on the map' : 'Drag entities onto the map to position them. Connections will be shown automatically.'}</p>
        {entities.filter(e => !entityPositions[e.id]).length > 0 && !isDrawingMode && (
          <div className="unmapped-entities">
            <h4>Entities not on map:</h4>
            <ul>
              {entities.filter(e => !entityPositions[e.id]).map(e => (
                <li
                  key={e.id}
                  onClick={() => handleAddEntityToMap(e.id)}
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
