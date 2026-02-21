import { BackgroundRenderer } from 'background-renderer';
import { LogoRenderer } from 'logo-renderer';
import { FXProcessor } from 'fx-processor';

export class Renderer {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = state;
    this.lastTime = 0;
    this.isAnimating = false;
    this.fx = new FXProcessor();
  }

  // removed createNoiseCanvas() {}

  start() {
    if (this.isAnimating) return;
    this.isAnimating = true;
    this.lastTime = performance.now();
    this.loop();
  }

  loop(now = performance.now()) {
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    
    this.update(dt);
    this.render();
    
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    const speed = 12; // animation speed
    for (let y = 0; y < this.state.gridSize; y++) {
      for (let x = 0; x < this.state.gridSize; x++) {
        const cell = this.state.grid[y][x];
        const target = cell.active ? 1.0 : 0.0;
        // Simple lerp for smooth appearance/disappearance
        const diff = target - cell.scale;
        if (Math.abs(diff) > 0.001) {
          cell.scale += diff * speed * dt;
        } else {
          cell.scale = target;
        }
      }
    }
  }

  updateCanvasSize() {
    const container = document.querySelector('.canvas-container');
    const maxSize = Math.min(
      container.clientWidth - 20,
      container.clientHeight - 20
    );
    
    this.state.cellSize = Math.floor(maxSize / this.state.gridSize);
    const canvasSize = this.state.cellSize * this.state.gridSize;
    
    this.canvas.width = canvasSize;
    this.canvas.height = canvasSize;
  }

  render() {
    this.drawScene(this.ctx, this.canvas.width, this.canvas.height, this.state.cellSize, this.state.gridSize, this.state.grid, true);
  }

  drawScene(ctx, width, height, cellSize, gridSize, grid, drawGridLines) {
    const buffer = document.createElement('canvas');
    buffer.width = width;
    buffer.height = height;
    const bctx = buffer.getContext('2d');

    BackgroundRenderer.draw(ctx, width, height, this.state);

    if (drawGridLines && this.state.showGrid) {
      this.drawGridLines(ctx, width, height, cellSize, gridSize);
    }

    const scale = this.state.blockScale;
    const maxRadius = (cellSize * scale) / 2;
    const radius = maxRadius * (this.state.borderRadiusRatio * 2);

    if (this.state.outlineWidth > 0) {
      bctx.save();
      bctx.strokeStyle = this.state.outlineColor;
      bctx.lineWidth = this.state.outlineWidth * (width / 600);
      bctx.lineJoin = 'round'; bctx.lineCap = 'round';
      LogoRenderer.draw(bctx, width, height, cellSize, gridSize, grid, scale, radius, true, this.state);
      bctx.restore();
    }

    LogoRenderer.draw(bctx, width, height, cellSize, gridSize, grid, scale, radius, false, this.state);

    this.fx.applyShadows(ctx, width, this.state, buffer);
    this.fx.applyBloom(ctx, width, this.state, buffer);
    this.fx.applyGrain(ctx, width, height, this.state);
  }



  drawGridLines(ctx, width, height, cellSize, gridSize) {
    ctx.save();
    ctx.globalCompositeOperation = 'exclusion';
    
    const mid = gridSize / 2;
    const interval = gridSize % 4 === 0 ? 4 : (gridSize % 5 === 0 ? 5 : 4);

    for (let i = 1; i < gridSize; i++) {
      const pos = Math.floor(i * cellSize) + 0.5; // Offset by 0.5 for crisp 1px lines
      
      // Determine line style based on position
      if (i === mid || (gridSize % 2 !== 0 && (i === Math.floor(mid) || i === Math.ceil(mid)))) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
      } else if (i % interval === 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
      }

      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(width, pos);
      ctx.stroke();
    }
    ctx.restore();
  }

  // removed drawLogoToContext() {}
  // removed drawRoundedRectFallback() {}
  // removed pathFillet() {}
}