import React, { useState, useRef, useEffect } from 'react';
import { Entity, DrawingStroke, Position, Map, MapImage } from '../types';
import { updateMap } from '../utils/storage';
import { generateId } from '../utils/idGenerator';
import DrawingTools from './DrawingTools';
import EntityDetail from './EntityDetail';

interface MapEditorProps {
  entities: Entity[];
  campaignId: string | null;
  maps: Map[];
  activeMap: Map | null;
  onUpdateMap: (map: Map) => void;
  onCreateMap: (name: string) => void;
  onDeleteMap: (mapId: string) => void;
  onMapChange: (mapId: string) => void;
  onUpdateEntity: (id: string, updates: Partial<Entity>) => void;
}

const MapEditor: React.FC<MapEditorProps> = ({
  entities,
  campaignId: _campaignId,
  maps,
  activeMap,
  onUpdateMap,
  onCreateMap,
  onDeleteMap,
  onMapChange,
  onUpdateEntity,
}) => {
  const MAX_IMPORTED_IMAGE_SIZE = 300;
  const MIN_IMAGE_SIZE = 50;
  const GRID_SIZE = 69; // Size 15% bigger than character icon (60px × 1.15)

  const [draggedEntity, setDraggedEntity] = useState<string | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
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
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [resizingImage, setResizingImage] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; imageId: string } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drawings = activeMap?.data.drawings || [];
  const images = activeMap?.data.images || [];
  const entityPositions = activeMap?.data.entityPositions || {};
  const showGrid = activeMap?.data.showGrid || false;

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

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

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

  const handleEntityClick = (e: React.MouseEvent, entityId: string) => {
    // Only trigger click if we didn't drag
    if (!draggedEntity) {
      e.stopPropagation();
      setSelectedEntity(entityId);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDrawingMode && isDrawing && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setCurrentStroke([...currentStroke, { x, y }]);
    } else if (resizingImage && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - resizeStart.x;
      const deltaY = currentY - resizeStart.y;

      const newWidth = Math.max(MIN_IMAGE_SIZE, resizeStart.width + deltaX);
      const newHeight = Math.max(MIN_IMAGE_SIZE, resizeStart.height + deltaY);

      updateActiveMapData({
        images: images.map(img =>
          img.id === resizingImage
            ? { ...img, width: newWidth, height: newHeight }
            : img
        ),
      });
    } else if (draggedImage && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const draggedImg = images.find(img => img.id === draggedImage);
      const imgWidth = draggedImg?.width || 100;
      const imgHeight = draggedImg?.height || 100;
      const x = Math.max(0, Math.min(rect.width - imgWidth, e.clientX - rect.left - dragOffset.x));
      const y = Math.max(0, Math.min(rect.height - imgHeight, e.clientY - rect.top - dragOffset.y));

      updateActiveMapData({
        images: images.map(img =>
          img.id === draggedImage
            ? { ...img, position: { x, y } }
            : img
        ),
      });
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
      setDraggedImage(null);
      setResizingImage(null);
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

  const handleImageImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeMap) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        // Calculate dimensions maintaining aspect ratio, max size on longest side
        let width = img.width;
        let height = img.height;

        if (width > MAX_IMPORTED_IMAGE_SIZE || height > MAX_IMPORTED_IMAGE_SIZE) {
          if (width > height) {
            height = (MAX_IMPORTED_IMAGE_SIZE / width) * height;
            width = MAX_IMPORTED_IMAGE_SIZE;
          } else {
            width = (MAX_IMPORTED_IMAGE_SIZE / height) * width;
            height = MAX_IMPORTED_IMAGE_SIZE;
          }
        }

        const newImage: MapImage = {
          id: generateId('image'),
          dataUrl,
          position: { x: 50, y: 50 },
          width,
          height,
          zIndex: images.length > 0 ? Math.max(...images.map(img => img.zIndex)) + 1 : 0,
        };
        updateActiveMapData({
          images: [...images, newImage],
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageMouseDown = (e: React.MouseEvent, imageId: string) => {
    if (isDrawingMode) return;
    e.stopPropagation();

    const image = images.find(img => img.id === imageId);
    if (image && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const offsetX = e.clientX - rect.left - image.position.x;
      const offsetY = e.clientY - rect.top - image.position.y;
      setDragOffset({ x: offsetX, y: offsetY });
      setDraggedImage(imageId);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, imageId: string) => {
    if (isDrawingMode) return;
    e.stopPropagation();

    const image = images.find(img => img.id === imageId);
    if (image && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      setResizeStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        width: image.width,
        height: image.height,
      });
      setResizingImage(imageId);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    updateActiveMapData({
      images: images.filter(img => img.id !== imageId),
    });
  };

  const handleImageContextMenu = (e: React.MouseEvent, imageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, imageId });
  };

  const bringToFront = (imageId: string) => {
    const maxZIndex = Math.max(...images.map(img => img.zIndex));
    updateActiveMapData({
      images: images.map(img =>
        img.id === imageId ? { ...img, zIndex: maxZIndex + 1 } : img
      ),
    });
    setContextMenu(null);
  };

  const sendToBack = (imageId: string) => {
    const minZIndex = Math.min(...images.map(img => img.zIndex));
    updateActiveMapData({
      images: images.map(img =>
        img.id === imageId ? { ...img, zIndex: minZIndex - 1 } : img
      ),
    });
    setContextMenu(null);
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

  const renderGrid = () => {
    if (!showGrid || !mapRef.current) return null;

    const rect = mapRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const lines = [];

    // Vertical lines
    for (let x = 0; x <= width; x += GRID_SIZE) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke="#ddd"
          strokeWidth="1"
        />
      );
    }

    // Horizontal lines
    for (let y = 0; y <= height; y += GRID_SIZE) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke="#ddd"
          strokeWidth="1"
        />
      );
    }

    return <g className="grid-layer">{lines}</g>;
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

      <div className="map-content-wrapper">
        <div className="map-canvas-section">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageImport}
            style={{ display: 'none' }}
          />

          <DrawingTools
        selectedColor={selectedColor}
        selectedThickness={selectedThickness}
        isDrawing={isDrawingMode}
        showGrid={showGrid}
        onColorChange={setSelectedColor}
        onThicknessChange={setSelectedThickness}
        onToggleDrawing={() => setIsDrawingMode(!isDrawingMode)}
        onClearDrawings={() => updateActiveMapData({ drawings: [] })}
        onToggleGrid={() => updateActiveMapData({ showGrid: !showGrid })}
        onImportImage={() => fileInputRef.current?.click()}
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
          {/* Grid */}
          {renderGrid()}

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

        {/* Imported Images */}
        {images
          .slice()
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(image => (
          <div
            key={image.id}
            className="map-image"
            style={{
              left: `${image.position.x}px`,
              top: `${image.position.y}px`,
              width: `${image.width}px`,
              height: `${image.height}px`,
              zIndex: image.zIndex,
              cursor: isDrawingMode ? 'crosshair' : (draggedImage === image.id ? 'grabbing' : 'grab'),
              pointerEvents: isDrawingMode ? 'none' : 'auto',
            }}
            onMouseDown={(e) => handleImageMouseDown(e, image.id)}
            onContextMenu={(e) => handleImageContextMenu(e, image.id)}
          >
            <img
              src={image.dataUrl}
              alt="Map element"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              draggable={false}
            />
            {!isDrawingMode && (
              <>
                <button
                  className="delete-image-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteImage(image.id);
                  }}
                  title="Delete image"
                >
                  ×
                </button>
                <div
                  className="resize-handle"
                  onMouseDown={(e) => handleResizeMouseDown(e, image.id)}
                  title="Drag to resize"
                />
              </>
            )}
          </div>
        ))}

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
              onClick={(e) => handleEntityClick(e, entity.id)}
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

        {/* Entity Detail Panel */}
        {selectedEntity && (
          <div className="map-entity-detail">
            <div className="entity-detail-header">
              <h3>Entity Details</h3>
              <button
                className="close-detail-btn"
                onClick={() => setSelectedEntity(null)}
                aria-label="Close entity details"
              >
                ×
              </button>
            </div>
            <EntityDetail
              entity={entities.find(e => e.id === selectedEntity)!}
              entities={entities}
              onUpdate={onUpdateEntity}
            />
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => bringToFront(contextMenu.imageId)}>
            Bring to Front
          </button>
          <button onClick={() => sendToBack(contextMenu.imageId)}>
            Send to Back
          </button>
        </div>
      )}
    </div>
  );
};

export default MapEditor;
