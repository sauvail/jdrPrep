import React from 'react';

interface DrawingToolsProps {
  selectedColor: string;
  selectedThickness: number;
  isDrawing: boolean;
  showGrid: boolean;
  onColorChange: (color: string) => void;
  onThicknessChange: (thickness: number) => void;
  onToggleDrawing: () => void;
  onClearDrawings: () => void;
  onToggleGrid: () => void;
}

const DrawingTools: React.FC<DrawingToolsProps> = ({
  selectedColor,
  selectedThickness,
  isDrawing,
  showGrid,
  onColorChange,
  onThicknessChange,
  onToggleDrawing,
  onClearDrawings,
  onToggleGrid,
}) => {
  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFFFFF'];

  return (
    <div className="drawing-tools">
      <button
        className={`tool-btn ${isDrawing ? 'active' : ''}`}
        onClick={onToggleDrawing}
        title="Toggle drawing mode"
        aria-label={isDrawing ? "Turn off drawing mode" : "Turn on drawing mode"}
      >
        ✏️ {isDrawing ? 'Drawing Mode ON' : 'Drawing Mode OFF'}
      </button>

      <button
        className={`tool-btn ${showGrid ? 'active' : ''}`}
        onClick={onToggleGrid}
        title="Toggle grid"
        aria-label={showGrid ? "Hide grid" : "Show grid"}
      >
        📐 {showGrid ? 'Grid ON' : 'Grid OFF'}
      </button>

      {isDrawing && (
        <>
          <div className="color-picker">
            <label>Color:</label>
            <div className="color-swatches">
              {colors.map((color) => (
                <button
                  key={color}
                  className={`color-swatch ${selectedColor === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color, border: color === '#FFFFFF' ? '1px solid #ccc' : 'none' }}
                  onClick={() => onColorChange(color)}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="thickness-slider">
            <label>Thickness: {selectedThickness}px</label>
            <input
              type="range"
              min="2"
              max="10"
              step="2"
              value={selectedThickness}
              onChange={(e) => onThicknessChange(Number(e.target.value))}
            />
          </div>

          <button
            className="tool-btn clear-btn"
            onClick={onClearDrawings}
            title="Clear all drawings"
            aria-label="Clear all drawings from map"
          >
            🗑️ Clear Drawings
          </button>
        </>
      )}
    </div>
  );
};

export default DrawingTools;
