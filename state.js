export class State {
  constructor() {
    this.gridSize = 12;
    this.cellSize = 10;
    this.currentColor = '#ffffff';
    this.grid = [];
    this.isDrawing = false;
    this.tool = 'draw'; // 'draw' or 'erase'
    
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
    this.connectionStyle = 'standard'; // 'standard' or 'line'

    this.shadowColor = '#000000';
    this.shadowBlur = 0;

    this.bgType = 'solid';
    this.bgColor = '#000000';
    this.bgGradStart = '#ffffff';
    this.bgGradEnd = '#e0e0e0';
    this.gradientType = 'linear';
    this.gradientAngle = 135;
    this.gradientStopStart = 0;
    this.gradientStopEnd = 100;

    this.initGrid();
  }

  initGrid() {
    this.grid = Array(this.gridSize).fill(null).map(() => 
      Array(this.gridSize).fill(null).map(() => ({
        color: this.currentColor,
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
      if (cell.active) {
        cell.active = false;
      } else {
        cell.active = true;
        cell.color = this.currentColor;
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