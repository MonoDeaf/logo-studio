export class State {
  constructor() {
    this.gridSize = 7;
    this.cellSize = 10;
    this.currentColor = '#ffffff';
    this.currentShape = 'rounded'; // Current brush shape
    this.grid = [];
    this.isDrawing = false;
    this.tool = 'draw'; 
    
    // Rendering parameters
    this.blockScale = 1.0;
    this.borderRadiusRatio = 0.2;
    this.outlineWidth = 0;
    this.outlineColor = '#000000';
    this.bloom = 0;
    this.grain = 0;
    this.grainSize = 1;
    this.showGrid = true;
    this.showConnections = true;
    this.connectionDistance = 1;
    this.connectionThickness = 2;
    this.connectionStyle = 'standard';

    this.shadowColor = '#000000';
    this.shadowBlur = 0;

    this.bgType = 'transparent';
    this.bgColor = '#000000';
    this.bgGradStart = '#ffffff';
    this.bgGradEnd = '#000000';
    this.gradientType = 'linear';
    this.gradientAngle = 135;
    this.gradientStopStart = 0;
    this.gradientStopEnd = 100;

    this.heroBgImage = null; // Cache for hero mockup background

    this.stylizedMockupBg = '#ccff00';
    this.stylizedMockupLogo = '#ffffff';
    this.stylizedMockupSize = 380;
    this.mockupBlendMode = 'source-over';

    this.initGrid();
  }

  initGrid() {
    this.grid = Array(this.gridSize).fill(null).map(() => 
      Array(this.gridSize).fill(null).map(() => ({
        color: this.currentColor,
        shape: this.currentShape,
        active: false,
        scale: 0
      }))
    );
  }

  setGridSize(size) {
    this.gridSize = size;
    this.initGrid();
  }

  toggleCell(x, y) {
    const cell = this.grid[y][x];
    if (this.tool === 'erase') {
      cell.active = false;
    } else {
      if (cell.active && cell.shape === this.currentShape && cell.color === this.currentColor) {
        cell.active = false;
      } else {
        cell.active = true;
        cell.color = this.currentColor;
        cell.shape = this.currentShape;
      }
    }
  }

  paintCell(x, y) {
    const cell = this.grid[y][x];
    if (this.tool === 'erase') {
      cell.active = false;
    } else {
      cell.active = true;
      cell.color = this.currentColor;
      cell.shape = this.currentShape;
    }
  }

  updateAllBlocksColor(color) {
    this.currentColor = color;
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const cell = this.grid[y][x];
        if (cell.active) {
          cell.color = this.currentColor;
        }
      }
    }
  }
}