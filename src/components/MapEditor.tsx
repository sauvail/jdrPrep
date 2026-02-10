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
  const DEFAULT_GRID_WIDTH = 20;
  const DEFAULT_GRID_HEIGHT = 15;
  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.25;

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
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const drawings = activeMap?.data.drawings || [];
  const images = activeMap?.data.images || [];
  const entityPositions = activeMap?.data.entityPositions || {};
  const showGrid = activeMap?.data.showGrid || false;
  const gridWidth = activeMap?.data.gridWidth || DEFAULT_GRID_WIDTH;
  const gridHeight = activeMap?.data.gridHeight || DEFAULT_GRID_HEIGHT;

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

  // Helper function to convert screen coordinates to canvas coordinates
  const screenToCanvas = (screenX: number, screenY: number): Position => {
    if (!mapRef.current) return { x: 0, y: 0 };
    const rect = mapRef.current.getBoundingClientRect();
    const x = (screenX - rect.left - pan.x) / zoom;
    const y = (screenY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(MAX_ZOOM, prev + ZOOM_STEP));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(MIN_ZOOM, prev - ZOOM_STEP));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
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
    if (isDrawingMode || !activeMap || isPanning) return;

    const position = entityPositions[entityId];
    if (position && mapRef.current) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const offsetX = canvasPos.x - position.x;
      const offsetY = canvasPos.y - position.y;
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
    if (isPanning && mapRef.current) {
      const deltaX = e.clientX - panStart.x;
      const deltaY = e.clientY - panStart.y;
      setPan({ x: pan.x + deltaX, y: pan.y + deltaY });
      setPanStart({ x: e.clientX, y: e.clientY });
    } else if (isDrawingMode && isDrawing && mapRef.current) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setCurrentStroke([...currentStroke, canvasPos]);
    } else if (resizingImage && mapRef.current) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const deltaX = canvasPos.x - resizeStart.x;
      const deltaY = canvasPos.y - resizeStart.y;

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
      const draggedImg = images.find(img => img.id === draggedImage);
      const imgWidth = draggedImg?.width || 100;
      const imgHeight = draggedImg?.height || 100;
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const maxWidth = gridWidth * GRID_SIZE;
      const maxHeight = gridHeight * GRID_SIZE;
      const x = Math.max(0, Math.min(maxWidth - imgWidth, canvasPos.x - dragOffset.x));
      const y = Math.max(0, Math.min(maxHeight - imgHeight, canvasPos.y - dragOffset.y));

      updateActiveMapData({
        images: images.map(img =>
          img.id === draggedImage
            ? { ...img, position: { x, y } }
            : img
        ),
      });
    } else if (draggedEntity && mapRef.current && activeMap) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const maxWidth = gridWidth * GRID_SIZE;
      const maxHeight = gridHeight * GRID_SIZE;
      const x = Math.max(0, Math.min(maxWidth - 80, canvasPos.x - dragOffset.x));
      const y = Math.max(0, Math.min(maxHeight - 60, canvasPos.y - dragOffset.y));

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
      setIsPanning(false);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Middle mouse button for panning
    if (e.button === 1) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }

    if (isDrawingMode && e.target === mapRef.current) {
      setIsDrawing(true);
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setCurrentStroke([canvasPos]);
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
    if (isDrawingMode || isPanning) return;
    e.stopPropagation();

    const image = images.find(img => img.id === imageId);
    if (image && mapRef.current) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      const offsetX = canvasPos.x - image.position.x;
      const offsetY = canvasPos.y - image.position.y;
      setDragOffset({ x: offsetX, y: offsetY });
      setDraggedImage(imageId);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, imageId: string) => {
    if (isDrawingMode || isPanning) return;
    e.stopPropagation();

    const image = images.find(img => img.id === imageId);
    if (image && mapRef.current) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setResizeStart({
        x: canvasPos.x,
        y: canvasPos.y,
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

    const width = gridWidth * GRID_SIZE;
    const height = gridHeight * GRID_SIZE;

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
          stroke="var(--border-color)"
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
          stroke="var(--border-color)"
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

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM} title="Zoom In">+</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button onClick={handleZoomOut} disabled={zoom <= MIN_ZOOM} title="Zoom Out">-</button>
        <button onClick={handleResetZoom} title="Reset Zoom">Reset</button>
      </div>

      {/* Grid Size Configuration */}
      <div className="grid-size-controls">
        <label>
          Grid Width (cells):
          <input
            type="number"
            min="5"
            max="100"
            value={gridWidth}
            onChange={(e) => updateActiveMapData({ gridWidth: parseInt(e.target.value) || DEFAULT_GRID_WIDTH })}
          />
        </label>
        <label>
          Grid Height (cells):
          <input
            type="number"
            min="5"
            max="100"
            value={gridHeight}
            onChange={(e) => updateActiveMapData({ gridHeight: parseInt(e.target.value) || DEFAULT_GRID_HEIGHT })}
          />
        </label>
      </div>

      <div
        ref={mapRef}
        className="map-canvas"
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isPanning ? 'grabbing' : isDrawingMode ? 'crosshair' : 'default' }}
      >
        <div
          className="map-canvas-content"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
            width: `${gridWidth * GRID_SIZE}px`,
            height: `${gridHeight * GRID_SIZE}px`,
            position: 'relative',
          }}
        >
        <svg className="connection-layer" width={gridWidth * GRID_SIZE} height={gridHeight * GRID_SIZE}>
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

          const entityLetter = entity.type[0].toUpperCase();

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
              {entity.type === 'location' ? (
                <div className="entity-icon">{entity.name}</div>
              ) : entity.type === 'organization' ? (
                <div className="entity-icon" data-letter={entityLetter}></div>
              ) : (
                <div className="entity-icon">{entityLetter}</div>
              )}
              {entity.type !== 'location' && <div className="entity-label">{entity.name}</div>}
            </div>
          );
        })}
        </div>
      </div>

      <div className="map-controls">
        <p>{isPanning ? 'Use middle mouse button to pan the map' : isDrawingMode ? 'Click and drag to draw on the map' : 'Drag entities onto the map to position them. Connections will be shown automatically. Use middle mouse button to pan.'}</p>
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
