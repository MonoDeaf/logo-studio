import { PRESETS } from 'presets';

export class UI {
  constructor(state, renderer, exporter) {
    this.state = state;
    this.renderer = renderer;
    this.exporter = exporter;
    this.initSwatches();
    this.initStylePresets();
    this.setupEventListeners();
  }

  initStylePresets() {
    const container = document.getElementById('stylePresets');
    PRESETS.styles.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'style-preset-btn';
      btn.title = preset.name;
      
      const config = preset.state;
      
      // Background logic
      if (config.bgType === 'solid' || !config.bgType) {
        btn.style.backgroundColor = config.bgColor || '#000000';
      } else if (config.bgType === 'gradient') {
        const start = config.bgGradStart || '#ffffff';
        const end = config.bgGradEnd || '#000000';
        if (config.gradientType === 'radial') {
          btn.style.background = `radial-gradient(circle, ${start}, ${end})`;
        } else {
          const angle = config.gradientAngle ?? 135;
          btn.style.background = `linear-gradient(${angle}deg, ${start}, ${end})`;
        }
      } else if (config.bgType === 'transparent') {
        btn.style.background = 'repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 50% / 8px 8px';
      }

      // Block color indicator
      const indicator = document.createElement('div');
      indicator.className = 'preset-block-indicator';
      indicator.style.backgroundColor = config.currentColor || '#ffffff';
      btn.appendChild(indicator);

      btn.addEventListener('click', () => {
        this.applyStylePreset(preset.state);
      });
      container.appendChild(btn);
    });
  }

  applyStylePreset(config) {
    // Update State
    Object.keys(config).forEach(key => {
      if (key === 'gridSize') {
        this.state.setGridSize(config[key]);
      } else {
        this.state[key] = config[key];
      }
    });

    // Synchronize UI elements
    this.syncUI();
    this.renderer.updateCanvasSize();
    this.renderer.render();
  }

  syncUI() {
    // Essential UI sync for all controls
    document.getElementById('gridSize').value = this.state.gridSize;
    document.getElementById('colorPicker').value = this.state.currentColor;
    document.getElementById('roundness').value = this.state.borderRadiusRatio * 100;
    document.getElementById('blockSize').value = this.state.blockScale * 100;
    document.getElementById('outlineWidth').value = this.state.outlineWidth;
    document.getElementById('outlineColor').value = this.state.outlineColor;
    document.getElementById('bloom').value = this.state.bloom;
    document.getElementById('grain').value = this.state.grain;
    document.getElementById('grainSize').value = this.state.grainSize;
    document.getElementById('grainSize').disabled = (this.state.grain === 0);
    document.getElementById('toggleGrid').checked = this.state.showGrid;
    document.getElementById('toggleConnections').checked = this.state.showConnections;
    document.getElementById('connectionDistance').value = this.state.connectionDistance;
    document.getElementById('connectionThickness').value = this.state.connectionThickness;
    document.getElementById('connectionStyle').value = this.state.connectionStyle;
    document.getElementById('lineOnlyControls').style.display = this.state.connectionStyle === 'line' ? 'flex' : 'none';
    document.getElementById('bgType').value = this.state.bgType;
    document.getElementById('bgColor').value = this.state.bgColor;
    document.getElementById('bgGradStart').value = this.state.bgGradStart;
    document.getElementById('bgGradEnd').value = this.state.bgGradEnd;
    document.getElementById('gradientType').value = this.state.gradientType;
    document.getElementById('gradientAngle').value = this.state.gradientAngle;
    document.getElementById('gradientStopStart').value = this.state.gradientStopStart;
    document.getElementById('gradientStopEnd').value = this.state.gradientStopEnd;
    document.getElementById('shadowColor').value = this.state.shadowColor;
    document.getElementById('shadowBlur').value = this.state.shadowBlur;

    // Display updates
    document.getElementById('solidBgControls').style.display = this.state.bgType === 'solid' ? 'flex' : 'none';
    document.getElementById('gradientBgControls').style.display = this.state.bgType === 'gradient' ? 'flex' : 'none';
    document.getElementById('gradientAngleControl').style.display = this.state.gradientType === 'linear' ? 'flex' : 'none';
  }

  initSwatches() {
    // Block Colors
    const blockGroup = document.getElementById('blockColorGroup');
    const colorPicker = document.getElementById('colorPicker');
    
    PRESETS.blocks.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch block-swatch';
      swatch.style.background = color;
      swatch.addEventListener('click', () => {
        this.state.updateAllBlocksColor(color);
        colorPicker.value = color;
        this.renderer.render();
      });
      blockGroup.insertBefore(swatch, colorPicker);
    });

    // Solid Backgrounds
    const solidBgGroup = document.getElementById('solidBgGroup');
    const bgColorPicker = document.getElementById('bgColor');
    
    PRESETS.backgrounds.forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch bg-swatch';
      swatch.style.background = color;
      swatch.addEventListener('click', () => {
        this.state.bgColor = color;
        bgColorPicker.value = color;
        this.renderer.render();
      });
      solidBgGroup.insertBefore(swatch, bgColorPicker);
    });

    // Gradient Backgrounds
    const gradientGroup = document.getElementById('gradientSwatches');
    
    PRESETS.gradients.forEach(p => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch grad-swatch';
      swatch.style.backgroundImage = `linear-gradient(${p.angle}deg, ${p.start}, ${p.end})`;
      swatch.addEventListener('click', () => {
        this.state.bgGradStart = p.start;
        this.state.bgGradEnd = p.end;
        this.state.gradientAngle = p.angle;
        this.state.gradientStopStart = p.startOffset;
        this.state.gradientStopEnd = p.endOffset;
        
        document.getElementById('bgGradStart').value = p.start;
        document.getElementById('bgGradEnd').value = p.end;
        document.getElementById('gradientAngle').value = p.angle;
        document.getElementById('gradientStopStart').value = p.startOffset;
        document.getElementById('gradientStopEnd').value = p.endOffset;
        
        this.renderer.render();
      });
      gradientGroup.appendChild(swatch);
    });
  }

  getCellFromEvent(e) {
    const rect = this.renderer.canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = Math.floor((clientX - rect.left) / this.state.cellSize);
    const y = Math.floor((clientY - rect.top) / this.state.cellSize);
    
    if (x >= 0 && x < this.state.gridSize && y >= 0 && y < this.state.gridSize) {
      return { x, y };
    }
    return null;
  }

  setupEventListeners() {
    const drawToolBtn = document.getElementById('drawTool');
    const eraseToolBtn = document.getElementById('eraseTool');

    drawToolBtn.addEventListener('click', () => {
      this.state.tool = 'draw';
      drawToolBtn.classList.add('active');
      eraseToolBtn.classList.remove('active');
    });

    eraseToolBtn.addEventListener('click', () => {
      this.state.tool = 'erase';
      eraseToolBtn.classList.add('active');
      drawToolBtn.classList.remove('active');
    });

    document.getElementById('gridSize').addEventListener('change', (e) => {
      this.state.setGridSize(parseInt(e.target.value));
      this.renderer.updateCanvasSize();
      this.renderer.render();
    });
    
    const updateMainColor = (color) => {
      this.state.updateAllBlocksColor(color);
      document.getElementById('colorPicker').value = color;
      this.renderer.render();
    };

    document.getElementById('colorPicker').addEventListener('input', (e) => {
      updateMainColor(e.target.value);
    });

    const updateBgColor = (color) => {
      this.state.bgColor = color;
      document.getElementById('bgColor').value = color;
      this.renderer.render();
    };
    
    document.getElementById('clearBtn').addEventListener('click', () => {
      this.state.initGrid();
      this.renderer.render();
    });
    
    document.getElementById('exportPngBtn').addEventListener('click', () => {
      this.exporter.exportImage();
      document.querySelector('.export-dropdown').removeAttribute('open');
    });

    document.getElementById('exportSvgBtn').addEventListener('click', () => {
      this.exporter.exportSVG();
      document.querySelector('.export-dropdown').removeAttribute('open');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = document.querySelector('.export-dropdown');
      if (dropdown && dropdown.hasAttribute('open') && !dropdown.contains(e.target)) {
        dropdown.removeAttribute('open');
      }
    });

    document.getElementById('roundness').addEventListener('input', (e) => {
      this.state.borderRadiusRatio = parseInt(e.target.value) / 100;
      this.renderer.render();
    });

    document.getElementById('blockSize').addEventListener('input', (e) => {
      this.state.blockScale = parseInt(e.target.value) / 100;
      this.renderer.render();
    });

    document.getElementById('outlineWidth').addEventListener('input', (e) => {
      this.state.outlineWidth = parseInt(e.target.value);
      this.renderer.render();
    });

    document.getElementById('outlineColor').addEventListener('input', (e) => {
      this.state.outlineColor = e.target.value;
      this.renderer.render();
    });

    document.getElementById('bloom').addEventListener('input', (e) => {
      this.state.bloom = parseInt(e.target.value);
      this.renderer.render();
    });

    const grainSlider = document.getElementById('grain');
    const grainSizeSlider = document.getElementById('grainSize');

    grainSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      this.state.grain = val;
      grainSizeSlider.disabled = (val === 0);
      this.renderer.render();
    });

    grainSizeSlider.addEventListener('input', (e) => {
      this.state.grainSize = parseFloat(e.target.value);
      this.renderer.render();
    });

    document.getElementById('toggleGrid').addEventListener('change', (e) => {
      this.state.showGrid = e.target.checked;
      this.renderer.render();
    });

    document.getElementById('toggleConnections').addEventListener('change', (e) => {
      this.state.showConnections = e.target.checked;
      this.renderer.render();
    });

    document.getElementById('connectionDistance').addEventListener('input', (e) => {
      this.state.connectionDistance = parseInt(e.target.value);
      this.renderer.render();
    });

    const lineOnlyControls = document.getElementById('lineOnlyControls');
    document.getElementById('connectionStyle').addEventListener('change', (e) => {
      this.state.connectionStyle = e.target.value;
      lineOnlyControls.style.display = e.target.value === 'line' ? 'flex' : 'none';
      this.renderer.render();
    });

    document.getElementById('connectionThickness').addEventListener('input', (e) => {
      this.state.connectionThickness = parseInt(e.target.value);
      this.renderer.render();
    });

    const bgTypeSelect = document.getElementById('bgType');
    const solidBgControls = document.getElementById('solidBgControls');
    const gradientBgControls = document.getElementById('gradientBgControls');

    bgTypeSelect.addEventListener('change', (e) => {
      this.state.bgType = e.target.value;
      solidBgControls.style.display = this.state.bgType === 'solid' ? 'flex' : 'none';
      gradientBgControls.style.display = this.state.bgType === 'gradient' ? 'flex' : 'none';
      this.renderer.render();
    });

    document.getElementById('bgColor').addEventListener('input', (e) => {
      updateBgColor(e.target.value);
    });

    document.getElementById('bgGradStart').addEventListener('input', (e) => {
      this.state.bgGradStart = e.target.value;
      this.renderer.render();
    });

    document.getElementById('bgGradEnd').addEventListener('input', (e) => {
      this.state.bgGradEnd = e.target.value;
      this.renderer.render();
    });



    document.getElementById('gradientType').addEventListener('change', (e) => {
      this.state.gradientType = e.target.value;
      const angleControl = document.getElementById('gradientAngleControl');
      angleControl.style.display = e.target.value === 'linear' ? 'flex' : 'none';
      this.renderer.render();
    });

    document.getElementById('gradientAngle').addEventListener('input', (e) => {
      this.state.gradientAngle = parseInt(e.target.value);
      this.renderer.render();
    });

    document.getElementById('gradientStopStart').addEventListener('input', (e) => {
      this.state.gradientStopStart = parseInt(e.target.value);
      this.renderer.render();
    });

    document.getElementById('gradientStopEnd').addEventListener('input', (e) => {
      this.state.gradientStopEnd = parseInt(e.target.value);
      this.renderer.render();
    });

    document.getElementById('shadowColor').addEventListener('input', (e) => {
      this.state.shadowColor = e.target.value;
      this.renderer.render();
    });

    document.getElementById('shadowBlur').addEventListener('input', (e) => {
      this.state.shadowBlur = parseInt(e.target.value);
      this.renderer.render();
    });

    const uploadBtn = document.getElementById('uploadBtn');
    const imageUpload = document.getElementById('imageUpload');

    uploadBtn.addEventListener('click', () => {
      imageUpload.click();
    });

    imageUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          this.processImageToGrid(img);
          imageUpload.value = ''; // Reset for next time
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    const startDrawing = (e) => {
      e.preventDefault();
      this.state.isDrawing = true;
      const cell = this.getCellFromEvent(e);
      if (cell) {
        this.state.toggleCell(cell.x, cell.y);
        this.renderer.render();
      }
    };
    
    const draw = (e) => {
      e.preventDefault();
      if (!this.state.isDrawing) return;
      const cell = this.getCellFromEvent(e);
      if (cell) {
        this.state.paintCell(cell.x, cell.y);
        this.renderer.render();
      }
    };
    
    const stopDrawing = () => {
      this.state.isDrawing = false;
    };
    
    const canvas = this.renderer.canvas;
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseleave', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
    
    window.addEventListener('resize', () => {
      this.renderer.updateCanvasSize();
      this.renderer.render();
    });

    const toolbarContent = document.querySelector('.toolbar-content');
    const updateScrollFade = () => {
      const { scrollTop, scrollHeight, clientHeight } = toolbarContent;
      if (scrollHeight > clientHeight && scrollTop + clientHeight < scrollHeight - 10) {
        toolbarContent.classList.add('has-fade');
      } else {
        toolbarContent.classList.remove('has-fade');
      }
    };
    toolbarContent.addEventListener('scroll', updateScrollFade);
    setTimeout(updateScrollFade, 100);
  }

  processImageToGrid(img) {
    const tempCanvas = document.createElement('canvas');
    const size = this.state.gridSize;
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tctx = tempCanvas.getContext('2d');

    // Draw image centered and covering the small grid canvas
    const scale = Math.max(size / img.width, size / img.height);
    const x = (size - img.width * scale) / 2;
    const y = (size - img.height * scale) / 2;
    tctx.drawImage(img, x, y, img.width * scale, img.height * scale);

    const imageData = tctx.getImageData(0, 0, size, size).data;
    
    // Clear current grid first
    this.state.initGrid();

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4;
        const r = imageData[idx];
        const g = imageData[idx + 1];
        const b = imageData[idx + 2];
        const a = imageData[idx + 3];

        // Standard luminance calculation
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        
        // If it's fairly opaque and bright
        // We assume brighter pixels = active blocks.
        if (a > 128 && luminance > 120) {
          this.state.grid[i][j].active = true;
          this.state.grid[i][j].color = this.state.currentColor;
        }
      }
    }
    this.renderer.render();
  }
}