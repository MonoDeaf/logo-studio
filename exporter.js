import { LogoRenderer } from './logo-renderer.js';

export class Exporter {
  constructor(state, renderer) {
    this.state = state;
    this.renderer = renderer;
  }

  exportImage() {
    const targetDimension = 4000;
    const exportScale = Math.max(32, Math.floor(targetDimension / this.state.gridSize));
    
    const exportCanvas = document.createElement('canvas');
    const size = this.state.gridSize * exportScale;
    exportCanvas.width = size;
    exportCanvas.height = size;
    const exportCtx = exportCanvas.getContext('2d');
    
    this.renderer.drawScene(
      exportCtx, 
      size, 
      size, 
      exportScale, 
      this.state.gridSize, 
      this.state.grid, 
      false
    );
    
    exportCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logo-export.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  exportSVG() {
    const size = 1024;
    const ctx = new SVGContext(size, size);
    
    // Background (Simplified)
    if (this.state.bgType === 'solid') {
      ctx.fillStyle = this.state.bgColor;
      ctx.fillRect(0, 0, size, size);
    } else if (this.state.bgType === 'gradient') {
      ctx.fillStyle = this.state.bgGradStart;
      ctx.fillRect(0, 0, size, size);
    }
    
    // Draw Logo
    const scale = this.state.blockScale;
    const cellSize = size / this.state.gridSize;
    const maxRadius = (cellSize * scale) / 2;
    const radius = maxRadius * (this.state.borderRadiusRatio * 2);
    const grid = this.state.grid;
    const gridSize = this.state.gridSize;

    if (this.state.outlineWidth > 0) {
      ctx.save();
      ctx.strokeStyle = this.state.outlineColor;
      ctx.lineWidth = this.state.outlineWidth * (size / 600);
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      LogoRenderer.draw(ctx, size, size, cellSize, gridSize, grid, scale, radius, true, this.state);
      ctx.restore();
    }

    LogoRenderer.draw(ctx, size, size, cellSize, gridSize, grid, scale, radius, false, this.state);

    const svgContent = ctx.getSVGString();
    
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logo-export.svg`;
    a.click();
    URL.revokeObjectURL(url);
  }
}

class SVGContext {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.elements = [];
    this.currentPath = "";
    this.state = {
      fillStyle: '#000000',
      strokeStyle: '#000000',
      lineWidth: 1,
      lineCap: 'butt',
      lineJoin: 'miter',
      globalAlpha: 1
    };
    this.stateStack = [];
  }

  save() {
    this.stateStack.push({ ...this.state });
  }

  restore() {
    if (this.stateStack.length) {
      this.state = this.stateStack.pop();
    }
  }

  set fillStyle(v) { this.state.fillStyle = v; }
  get fillStyle() { return this.state.fillStyle; }

  set strokeStyle(v) { this.state.strokeStyle = v; }
  get strokeStyle() { return this.state.strokeStyle; }

  set lineWidth(v) { this.state.lineWidth = v; }
  get lineWidth() { return this.state.lineWidth; }

  set lineCap(v) { this.state.lineCap = v; }
  get lineCap() { return this.state.lineCap; }

  set lineJoin(v) { this.state.lineJoin = v; }
  get lineJoin() { return this.state.lineJoin; }
  
  set globalAlpha(v) { this.state.globalAlpha = v; }
  get globalAlpha() { return this.state.globalAlpha; }

  beginPath() {
    this.currentPath = "";
  }

  moveTo(x, y) {
    this.currentPath += `M ${this.fmt(x)} ${this.fmt(y)} `;
  }

  lineTo(x, y) {
    this.currentPath += `L ${this.fmt(x)} ${this.fmt(y)} `;
  }

  quadraticCurveTo(cpx, cpy, x, y) {
    this.currentPath += `Q ${this.fmt(cpx)} ${this.fmt(cpy)} ${this.fmt(x)} ${this.fmt(y)} `;
  }

  arc(x, y, r, startAngle, endAngle, counterclockwise = false) {
    const startX = x + r * Math.cos(startAngle);
    const startY = y + r * Math.sin(startAngle);
    const endX = x + r * Math.cos(endAngle);
    const endY = y + r * Math.sin(endAngle);

    if (!this.currentPath) {
        this.moveTo(startX, startY);
    } else {
        this.currentPath += `L ${this.fmt(startX)} ${this.fmt(startY)} `;
    }

    let diff = endAngle - startAngle;
    if (!counterclockwise) {
        while (diff < 0) diff += Math.PI * 2;
        while (diff >= Math.PI * 2) diff -= Math.PI * 2;
    } else {
        while (diff > 0) diff -= Math.PI * 2;
        while (diff <= -Math.PI * 2) diff += Math.PI * 2;
    }
    
    const largeArcFlag = Math.abs(diff) > Math.PI ? 1 : 0;
    const sweepFlag = counterclockwise ? 0 : 1;
    
    this.currentPath += `A ${this.fmt(r)} ${this.fmt(r)} 0 ${largeArcFlag} ${sweepFlag} ${this.fmt(endX)} ${this.fmt(endY)} `;
  }

  closePath() {
    this.currentPath += "Z ";
  }

  fillRect(x, y, w, h) {
    this.elements.push(`<rect x="${this.fmt(x)}" y="${this.fmt(y)}" width="${this.fmt(w)}" height="${this.fmt(h)}" fill="${this.state.fillStyle}" opacity="${this.state.globalAlpha}" />`);
  }

  fill() {
    if (this.currentPath) {
      this.elements.push(`<path d="${this.currentPath.trim()}" fill="${this.state.fillStyle}" stroke="none" opacity="${this.state.globalAlpha}" />`);
    }
  }

  stroke() {
    if (this.currentPath) {
      this.elements.push(`<path d="${this.currentPath.trim()}" fill="none" stroke="${this.state.strokeStyle}" stroke-width="${this.state.lineWidth}" stroke-linecap="${this.state.lineCap}" stroke-linejoin="${this.state.lineJoin}" opacity="${this.state.globalAlpha}" />`);
    }
  }

  fmt(n) {
    return Number(n).toFixed(2);
  }

  getSVGString() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.width} ${this.height}">
${this.elements.join('\n')}
</svg>`;
  }
}