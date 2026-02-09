import React, { useState, useRef, useEffect } from 'react';
import { Entity, DrawingStroke, Position } from '../types';
import { loadMapData, saveMapData } from '../utils/storage';
import { generateId } from '../utils/idGenerator';
import DrawingTools from './DrawingTools';

interface MapEditorProps {
  entities: Entity[];
  campaignId: string | null;
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
}

const MapEditor: React.FC<MapEditorProps> = ({ entities, campaignId, onUpdatePosition }) => {
  const [draggedEntity, setDraggedEntity] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Position[]>([]);
  const [drawings, setDrawings] = useState<DrawingStroke[]>([]);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedThickness, setSelectedThickness] = useState(4);
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (campaignId) {
      const mapData = loadMapData(campaignId);
      setDrawings(mapData.drawings);
    } else {
      setDrawings([]);
    }
  }, [campaignId]);

  useEffect(() => {
    if (campaignId) {
      saveMapData(campaignId, { drawings });
    }
  }, [drawings, campaignId]);

  const handleMouseDown = (e: React.MouseEvent, entityId: string) => {
    if (isDrawingMode) return;
    
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
    if (isDrawingMode && isDrawing && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentStroke([...currentStroke, { x, y }]);
    } else if (draggedEntity && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width - 80, e.clientX - rect.left - dragOffset.x));
      const y = Math.max(0, Math.min(rect.height - 60, e.clientY - rect.top - dragOffset.y));
      onUpdatePosition(draggedEntity, { x, y });
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
      setDrawings([...drawings, newStroke]);
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
    if (!entity.position || !targetEntity.position) return null;
    
    const x1 = entity.position.x + 40; // Center of entity
    const y1 = entity.position.y + 30;
    const x2 = targetEntity.position.x + 40;
    const y2 = targetEntity.position.y + 30;

    return `M ${x1} ${y1} L ${x2} ${y2}`;
  };

  const getStrokePath = (points: Position[]): string => {
    if (points.length === 0) return '';
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return path;
  };

  const entitiesOnMap = entities.filter(e => e.position);

  return (
    <div className="map-editor">
      <h2>Map View</h2>
      
      <DrawingTools
        selectedColor={selectedColor}
        selectedThickness={selectedThickness}
        isDrawing={isDrawingMode}
        onColorChange={setSelectedColor}
        onThicknessChange={setSelectedThickness}
        onToggleDrawing={() => setIsDrawingMode(!isDrawingMode)}
        onClearDrawings={() => setDrawings([])}
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

        {entitiesOnMap.map(entity => (
          <div
            key={entity.id}
            className={`map-entity ${entity.type}`}
            style={{
              left: `${entity.position!.x}px`,
              top: `${entity.position!.y}px`,
              cursor: isDrawingMode ? 'crosshair' : (draggedEntity === entity.id ? 'grabbing' : 'grab'),
              pointerEvents: isDrawingMode ? 'none' : 'auto',
            }}
            onMouseDown={(e) => handleMouseDown(e, entity.id)}
          >
            <div className="entity-icon">{entity.type[0].toUpperCase()}</div>
            <div className="entity-label">{entity.name}</div>
          </div>
        ))}
      </div>

      <div className="map-controls">
        <p>{isDrawingMode ? 'Click and drag to draw on the map' : 'Drag entities onto the map to position them. Connections will be shown automatically.'}</p>
        {entities.filter(e => !e.position).length > 0 && !isDrawingMode && (
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
