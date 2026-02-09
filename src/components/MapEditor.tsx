import React, { useState, useRef, useEffect } from 'react';
import { Entity, DrawingStroke, Position, MapImage } from '../types';
import { loadMapData, saveMapData } from '../utils/storage';
import { generateId } from '../utils/idGenerator';
import DrawingTools from './DrawingTools';

interface MapEditorProps {
  entities: Entity[];
  onUpdatePosition: (id: string, position: { x: number; y: number }) => void;
}

const MapEditor: React.FC<MapEditorProps> = ({ entities, onUpdatePosition }) => {
  const MAX_IMPORTED_IMAGE_SIZE = 300;
  const MIN_IMAGE_SIZE = 50;
  
  const [draggedEntity, setDraggedEntity] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Position[]>([]);
  const [drawings, setDrawings] = useState<DrawingStroke[]>([]);
  const [images, setImages] = useState<MapImage[]>([]);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedThickness, setSelectedThickness] = useState(4);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [resizingImage, setResizingImage] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const mapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const mapData = loadMapData();
    setDrawings(mapData.drawings);
    setImages(mapData.images);
  }, []);

  useEffect(() => {
    saveMapData({ drawings, images });
  }, [drawings, images]);

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
    } else if (resizingImage && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const deltaX = currentX - resizeStart.x;
      const deltaY = currentY - resizeStart.y;
      
      const newWidth = Math.max(MIN_IMAGE_SIZE, resizeStart.width + deltaX);
      const newHeight = Math.max(MIN_IMAGE_SIZE, resizeStart.height + deltaY);
      
      setImages(images.map(img => 
        img.id === resizingImage
          ? { ...img, width: newWidth, height: newHeight }
          : img
      ));
    } else if (draggedImage && mapRef.current) {
      const rect = mapRef.current.getBoundingClientRect();
      const draggedImg = images.find(img => img.id === draggedImage);
      const imgWidth = draggedImg?.width || 100;
      const imgHeight = draggedImg?.height || 100;
      const x = Math.max(0, Math.min(rect.width - imgWidth, e.clientX - rect.left - dragOffset.x));
      const y = Math.max(0, Math.min(rect.height - imgHeight, e.clientY - rect.top - dragOffset.y));
      
      setImages(images.map(img => 
        img.id === draggedImage
          ? { ...img, position: { x, y } }
          : img
      ));
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
    if (!file) return;

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
        };
        setImages([...images, newImage]);
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
    setImages(images.filter(img => img.id !== imageId));
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
        onColorChange={setSelectedColor}
        onThicknessChange={setSelectedThickness}
        onToggleDrawing={() => setIsDrawingMode(!isDrawingMode)}
        onClearDrawings={() => setDrawings([])}
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
        {images.map(image => (
          <div
            key={image.id}
            className="map-image"
            style={{
              left: `${image.position.x}px`,
              top: `${image.position.y}px`,
              width: `${image.width}px`,
              height: `${image.height}px`,
              cursor: isDrawingMode ? 'crosshair' : (draggedImage === image.id ? 'grabbing' : 'grab'),
              pointerEvents: isDrawingMode ? 'none' : 'auto',
            }}
            onMouseDown={(e) => handleImageMouseDown(e, image.id)}
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
