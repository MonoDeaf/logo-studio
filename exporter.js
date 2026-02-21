export class Exporter {
  constructor(state, renderer) {
    this.state = state;
    this.renderer = renderer;
  }

  export() {
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
}