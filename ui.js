import { PRESETS } from 'presets';

export class UI {
  constructor(state, renderer, exporter) {
    this.state = state;
    this.renderer = renderer;
    this.exporter = exporter;
    this.initMobileNav();
    this.initSwatches();
    this.initStylePresets();
    this.initShapeSelector();
    this.initViewToggle();
    this.setupEventListeners();
    this.syncUI();
  }

  initViewToggle() {
    const btns = document.querySelectorAll('.view-btn');
    const canvasView = document.getElementById('canvasView');
    const mockupsView = document.getElementById('mockupsView');
    const viewport = document.querySelector('.canvas-viewport');
    const appLayout = document.querySelector('.app-layout');

    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const view = btn.dataset.view;
        if (view === 'mockups') {
          appLayout.classList.add('mockups-active');
          canvasView.style.display = 'none';
          mockupsView.style.display = 'block';
          document.getElementById('canvasLeftPanel').style.display = 'none';
          document.getElementById('mockupsLeftPanel').style.display = 'block';
          this.renderMockups();
          // Reset scroll to top when switching to mockups
          viewport.scrollTop = 0;
        } else {
          appLayout.classList.remove('mockups-active');
          canvasView.style.display = 'flex';
          mockupsView.style.display = 'none';
          document.getElementById('canvasLeftPanel').style.display = 'block';
          document.getElementById('mockupsLeftPanel').style.display = 'none';
          
          // Smoothly update canvas size during CSS grid transition
          const start = Date.now();
          const animateCanvas = () => {
            this.renderer.updateCanvasSize();
            if (Date.now() - start < 450) {
              requestAnimationFrame(animateCanvas);
            }
          };
          animateCanvas();
        }
      });
    });
  }

  renderMockups() {
    const grid = document.getElementById('mockupsGrid');
    grid.innerHTML = '';
    
    const mockupStyles = [
      { name: 'Hero Scene', type: 'hero' },
      { name: 'Stylized Custom', type: 'stylized-custom', bg: this.state.stylizedMockupBg },
      { name: 'Basic Dark', bg: '#000000', logoColor: '#ffffff' },
      { name: 'Basic Light', bg: '#ffffff', logoColor: '#000000' },
      { name: 'Acid High', bg: '#ccff00', logoColor: '#000000' },
      { name: 'App Icons', type: 'app-icons', bg: '#e5e5ea' },
      { name: 'Precision Grid', type: 'precision', bg: '#050505', logoColor: '#888888' },
      { name: 'Deep Midnight', type: 'gradient-v', colors: ['#020202', '#0a1a2f', '#1a3a5f'], logoColor: '#f0f4f8' },
      { name: 'Amber Horizon', type: 'gradient-v', colors: ['#020202', '#1a0d05', '#4a2510'], logoColor: '#ffe8d6' },
      { name: 'Safe Area', type: 'safe-area', bg: '#cc0000', logoColor: '#ffffff' },
      { name: 'Dark Tech', type: 'technical', bg: '#000000', logoColor: '#ffffff' },
      { name: 'Brand Identity', type: 'brand-split', bg: '#e0e0e0', logoColor: '#000000' },
      { name: 'Tri-Tone Identity', type: 'brand-split-3' },
      { name: 'Duo-Tone Identity', type: 'brand-split-2' },
      { name: 'Product Mark', type: 'trademark', bg: '#bfff00', logoColor: '#1a3300' },
      { name: 'Neon Wire', type: 'neon-wire', bg: '#000000', logoColor: '#d6dcdc', outlineWidth: 2 },
      { name: 'Brand Pattern', type: 'diagonal-grid', bg: '#cccccc', logoColor: '#333333' },
      { name: 'Subtle Pattern', type: 'diagonal-grid', bg: '#111111', logoColor: '#333333' }
    ];

    const originalBgType = this.state.bgType;
    const originalColor = this.state.currentColor;
    const originalOutlineWidth = this.state.outlineWidth;
    const originalOutlineColor = this.state.outlineColor;

    mockupStyles.forEach(style => {
      const wrapper = document.createElement('div');
      wrapper.className = 'mockup-wrapper';

      const label = document.createElement('div');
      label.className = 'mockup-label';
      label.textContent = style.name;

      const item = document.createElement('div');
      item.className = 'mockup-item';
      
      const canvas = document.createElement('canvas');
      canvas.width = 1920; 
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      
      this.state.bgType = 'transparent';
      if (style.logoColor) this.state.updateAllBlocksColor(style.logoColor);

      if (style.type !== 'hero') {
        ctx.fillStyle = style.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      const renderLogoToBuffer = (size, colorOverride, outlineWidth = 0, outlineColor = '#ffffff') => {
        const prevOutlineWidth = this.state.outlineWidth;
        const prevOutlineColor = this.state.outlineColor;
        
        if (colorOverride) this.state.updateAllBlocksColor(colorOverride);
        this.state.outlineWidth = outlineWidth;
        this.state.outlineColor = outlineColor;

        const logoBuffer = document.createElement('canvas');
        logoBuffer.width = size;
        logoBuffer.height = size;
        const lctx = logoBuffer.getContext('2d');
        this.renderer.drawScene(lctx, size, size, size / this.state.gridSize, this.state.gridSize, this.state.grid, false, false);
        
        this.state.outlineWidth = prevOutlineWidth;
        this.state.outlineColor = prevOutlineColor;
        return logoBuffer;
      };

      if (style.type === 'stylized-custom') {
        const logoSize = this.state.stylizedMockupSize;
        const logoBuffer = renderLogoToBuffer(logoSize, this.state.stylizedMockupLogo);
        ctx.globalCompositeOperation = this.state.mockupBlendMode;
        ctx.drawImage(logoBuffer, (canvas.width - logoSize) / 2, (canvas.height - logoSize) / 2);
        ctx.globalCompositeOperation = 'source-over';
      } else if (style.type === 'hero') {
        const logoSize = this.state.stylizedMockupSize;
        const logoBuffer = renderLogoToBuffer(logoSize, this.state.stylizedMockupLogo);

        const drawWithImage = (img) => {
          const scale = Math.max(canvas.width / img.width, canvas.height / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
          ctx.globalCompositeOperation = this.state.mockupBlendMode;
          ctx.drawImage(logoBuffer, (canvas.width - logoSize) / 2, (canvas.height - logoSize) / 2);
          ctx.globalCompositeOperation = 'source-over';
        };

        if (this.state.heroBgImage) {
          drawWithImage(this.state.heroBgImage);
        } else {
          const defaultHero = new Image();
          defaultHero.onload = () => {
            this.state.heroBgImage = defaultHero;
            drawWithImage(defaultHero);
          };
          defaultHero.src = 'Abstract Gradient Art.png';
          // Fill temporary dark background while loading
          ctx.fillStyle = '#050505';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Add Swap Button
        const swapBtn = document.createElement('button');
        swapBtn.className = 'mockup-action-btn mockup-swap-btn';
        swapBtn.innerHTML = '<iconify-icon icon="pixelarticons:image-plus"></iconify-icon>';
        swapBtn.title = 'Replace Hero Background';
        
        const heroInput = document.createElement('input');
        heroInput.type = 'file';
        heroInput.accept = 'image/*';
        heroInput.style.display = 'none';
        heroInput.onchange = (e) => {
          const file = e.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
              const img = new Image();
              img.onload = () => {
                this.state.heroBgImage = img;
                this.renderMockups();
              };
              img.src = re.target.result;
            };
            reader.readAsDataURL(file);
          }
        };

        swapBtn.onclick = (e) => {
          e.stopPropagation();
          heroInput.click();
        };

        item.appendChild(swapBtn);

      } else if (style.type === 'app-icons') {
        const iconSize = 480;
        const radius = 120;
        const spacing = 120;
        const totalWidth = (iconSize * 2) + spacing;
        const startX = (canvas.width - totalWidth) / 2;
        const startY = (canvas.height - iconSize) / 2;

        const drawIconBase = (x, y, color) => {
          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.15)';
          ctx.shadowBlur = 40;
          ctx.shadowOffsetY = 20;
          ctx.fillStyle = color;
          ctx.beginPath();
          if (ctx.roundRect) ctx.roundRect(x, y, iconSize, iconSize, radius);
          else ctx.fillRect(x, y, iconSize, iconSize);
          ctx.fill();
          ctx.restore();
        };

        // Left Square: White background, Black logo
        drawIconBase(startX, startY, '#ffffff');
        const blackLogo = renderLogoToBuffer(280, '#000000');
        ctx.drawImage(blackLogo, startX + (iconSize - 280) / 2, startY + (iconSize - 280) / 2);

        // Right Square: Black background, White logo
        drawIconBase(startX + iconSize + spacing, startY, '#000000');
        const whiteLogo = renderLogoToBuffer(280, '#ffffff');
        ctx.drawImage(whiteLogo, startX + iconSize + spacing + (iconSize - 280) / 2, startY + (iconSize - 280) / 2);

      } else if (style.type === 'precision') {
        const logoSize = 420;
        // Added outline for this specific mockup
        const logoBuffer = renderLogoToBuffer(logoSize, style.logoColor, 1, '#ffffff');
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        // Calculate logo bounds relative to canvas
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        let hasContent = false;
        const grid = this.state.grid;
        const gs = this.state.gridSize;
        for (let y = 0; y < gs; y++) {
          for (let x = 0; x < gs; x++) {
            if (grid[y][x].active) {
              minX = Math.min(minX, x);
              maxX = Math.max(maxX, x + 1);
              minY = Math.min(minY, y);
              maxY = Math.max(maxY, y + 1);
              hasContent = true;
            }
          }
        }

        if (hasContent) {
          const cellSize = logoSize / gs;
          const logoX = cx - logoSize / 2;
          const logoY = cy - logoSize / 2;

          const left = logoX + minX * cellSize;
          const right = logoX + maxX * cellSize;
          const top = logoY + minY * cellSize;
          const bottom = logoY + maxY * cellSize;

          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.setLineDash([5, 5]);
          ctx.lineWidth = 1;

          // Technical guides
          const guides = [left, right, top, bottom];
          guides.forEach((pos, i) => {
            ctx.beginPath();
            if (i < 2) { // Vertical
              ctx.moveTo(pos, 0); ctx.lineTo(pos, canvas.height);
            } else { // Horizontal
              ctx.moveTo(0, pos); ctx.lineTo(canvas.width, pos);
            }
            ctx.stroke();
          });
          ctx.setLineDash([]); // Reset

          // Secondary guides for rows/cols if active
          ctx.strokeStyle = 'rgba(255,255,255,0.1)';
          for (let i = minX + 1; i < maxX; i++) {
            const px = logoX + i * cellSize;
            ctx.beginPath(); ctx.moveTo(px, top - 40); ctx.lineTo(px, bottom + 40); ctx.stroke();
          }
          for (let i = minY + 1; i < maxY; i++) {
            const py = logoY + i * cellSize;
            ctx.beginPath(); ctx.moveTo(left - 40, py); ctx.lineTo(right + 40, py); ctx.stroke();
          }

          // Anchor points (small squares)
          ctx.fillStyle = '#ffffff';
          const points = [
            [left, top], [right, top], [left, bottom], [right, bottom],
            [(left+right)/2, top], [(left+right)/2, bottom],
            [left, (top+bottom)/2], [right, (top+bottom)/2]
          ];
          points.forEach(([x, y]) => {
            ctx.fillRect(x - 4, y - 4, 8, 8);
          });

          // Labels
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.font = '16px monospace';
          ctx.fillText(`X-${Math.round(left)}px`, left - 100, bottom + 40);
          ctx.fillText(`Y-${Math.round(top)}px`, left - 100, top - 20);
          ctx.fillText(`Z-16px`, left - 100, top - 50);
          ctx.fillText('GRID', 60, 60);
          ctx.fillText('50°', right + 40, top - 20);
          

        }

        ctx.drawImage(logoBuffer, cx - logoSize / 2, cy - logoSize / 2);

      } else if (style.type === 'technical') {
        const logoSize = 300;
        const logoBuffer = renderLogoToBuffer(logoSize, style.logoColor);
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;

        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(cx, cy, 350, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 250, 0, Math.PI * 2); ctx.stroke();
        
        // Connectors
        for (let i = 0; i < 3; i++) {
          const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * 150, cy + Math.sin(angle) * 150);
          ctx.lineTo(cx + Math.cos(angle) * 400, cy + Math.sin(angle) * 400);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(cx + Math.cos(angle) * 400, cy + Math.sin(angle) * 400, 4, 0, Math.PI*2);
          ctx.fill();
        }

        ctx.drawImage(logoBuffer, cx - logoSize / 2, cy - logoSize / 2);
        ctx.fillStyle = 'white'; ctx.textAlign = 'center';
        ctx.fillText('TECHNOLOGY', cx, cy - 380);
        ctx.fillText('ETHICAL', cx - 350, cy + 180);
        ctx.fillText('HUMAN', cx + 350, cy + 180);

      } else if (style.type === 'brand-split') {
        const logoSize = 280;
        const quadW = canvas.width / 2;
        const quadH = canvas.height / 2;
        
        const quads = [
          { bg: '#e0e0e0', logo: '#000000', x: 0, y: 0 },
          { bg: '#111111', logo: '#ffffff', x: quadW, y: 0 },
          { bg: '#ff4a00', logo: '#ffffff', x: 0, y: quadH },
          { bg: '#ccfa00', logo: '#000000', x: quadW, y: quadH }
        ];

        quads.forEach(q => {
          ctx.fillStyle = q.bg;
          ctx.fillRect(q.x, q.y, quadW, quadH);
          const buffer = renderLogoToBuffer(logoSize, q.logo);
          ctx.drawImage(buffer, q.x + (quadW - logoSize) / 2, q.y + (quadH - logoSize) / 2);
        });

      } else if (style.type === 'brand-split-3') {
        const logoSize = 240;
        const sectionW = canvas.width / 3;
        
        const sections = [
          { bg: '#0a0a0a', logo: '#ffffff', x: 0 },
          { bg: '#3b82f6', logo: '#ffffff', x: sectionW },
          { bg: '#f1f1f1', logo: '#000000', x: sectionW * 2 }
        ];

        sections.forEach(s => {
          ctx.fillStyle = s.bg;
          ctx.fillRect(s.x, 0, sectionW, canvas.height);
          const buffer = renderLogoToBuffer(logoSize, s.logo);
          ctx.drawImage(buffer, s.x + (sectionW - logoSize) / 2, (canvas.height - logoSize) / 2);
        });

      } else if (style.type === 'brand-split-2') {
        const logoSize = 320;
        const sectionW = canvas.width / 2;
        
        const sections = [
          { bg: '#ffffff', logo: '#000000', x: 0 },
          { bg: '#ff4a00', logo: '#ffffff', x: sectionW }
        ];

        sections.forEach(s => {
          ctx.fillStyle = s.bg;
          ctx.fillRect(s.x, 0, sectionW, canvas.height);
          const buffer = renderLogoToBuffer(logoSize, s.logo);
          ctx.drawImage(buffer, s.x + (sectionW - logoSize) / 2, (canvas.height - logoSize) / 2);
        });

      } else if (style.type === 'trademark') {
        const logoSize = 360;
        const logoBuffer = renderLogoToBuffer(logoSize, style.logoColor);
        const lx = (canvas.width - logoSize) / 2;
        const ly = (canvas.height - logoSize) / 2;
        ctx.drawImage(logoBuffer, lx, ly);

      } else if (style.type === 'neon-wire') {
        const logoSize = 400;
        const strokeColor = style.logoColor || '#ccccfa';
        const t = style.outlineWidth || 2;
        
        // 1. Create a mask of the filled logo
        const maskBuffer = renderLogoToBuffer(logoSize, '#ffffff', 0);
        
        // 2. Create a tinted version of that mask for the stroke
        const strokeBuffer = document.createElement('canvas');
        strokeBuffer.width = logoSize;
        strokeBuffer.height = logoSize;
        const sctx = strokeBuffer.getContext('2d');
        sctx.fillStyle = strokeColor;
        sctx.fillRect(0, 0, logoSize, logoSize);
        sctx.globalCompositeOperation = 'destination-in';
        sctx.drawImage(maskBuffer, 0, 0);

        const cx = (canvas.width - logoSize) / 2;
        const cy = (canvas.height - logoSize) / 2;

        ctx.save();
        // 3. Draw the stroke by stamping the tinted mask in a circle
        for (let dx = -t; dx <= t; dx++) {
          for (let dy = -t; dy <= t; dy++) {
            if (dx * dx + dy * dy <= t * t) {
              ctx.drawImage(strokeBuffer, cx + dx, cy + dy);
            }
          }
        }

        // 4. Cut out the middle to leave only the outer stroke
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(maskBuffer, cx, cy);
        ctx.restore();

      } else if (style.type === 'diagonal-grid') {
        const patternSize = 160;
        const logoBuffer = renderLogoToBuffer(patternSize, style.logoColor);
        const totalSize = patternSize + 80;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(Math.PI / 4);
        ctx.translate(-canvas.width, -canvas.height);
        for(let y = 0; y < canvas.height * 3; y += totalSize) {
          for(let x = 0; x < canvas.width * 3; x += totalSize) {
            ctx.save(); ctx.translate(x, y); ctx.globalAlpha = ( (x/totalSize + y/totalSize) % 2 === 0 ) ? 0.8 : 0.3;
            ctx.drawImage(logoBuffer, 0, 0); ctx.restore();
          }
        }
        ctx.restore();

      } else if (style.type === 'gradient-v') {
        const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        style.colors.forEach((c, i) => grad.addColorStop(i / (style.colors.length - 1), c));
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        this.drawCenteredLogo(ctx, canvas, () => renderLogoToBuffer(360, style.logoColor), 360);
      } else if (style.type === 'safe-area') {
        ctx.fillStyle = style.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1;
        const m = 200;
        ctx.beginPath(); ctx.moveTo(m, 0); ctx.lineTo(m, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(canvas.width-m, 0); ctx.lineTo(canvas.width-m, canvas.height); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, m); ctx.lineTo(canvas.width, m); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, canvas.height-m); ctx.lineTo(canvas.width, canvas.height-m); ctx.stroke();
        this.drawCenteredLogo(ctx, canvas, () => renderLogoToBuffer(320, style.logoColor), 320);
      } else {
        const logoSize = 380;
        const logoBuffer = renderLogoToBuffer(logoSize, style.logoColor);
        ctx.drawImage(logoBuffer, (canvas.width - logoSize) / 2, (canvas.height - logoSize) / 2);
      }

      this.state.bgType = originalBgType;
      this.state.updateAllBlocksColor(originalColor);
      this.state.outlineWidth = originalOutlineWidth;
      this.state.outlineColor = originalOutlineColor;

      const downloadBtn = document.createElement('button');
      downloadBtn.className = 'mockup-action-btn mockup-download-btn';
      downloadBtn.innerHTML = '<iconify-icon icon="pixelarticons:download"></iconify-icon>';
      downloadBtn.title = 'Download Mockup';
      downloadBtn.onclick = (e) => {
        e.stopPropagation();
        const link = document.createElement('a');
        link.download = `mockup-${style.name.toLowerCase().replace(/\s+/g, '-')}.png`;
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();
      };

      item.appendChild(canvas);
      item.appendChild(downloadBtn);
      
      wrapper.appendChild(label);
      wrapper.appendChild(item);
      grid.appendChild(wrapper);
    });
  }

  initMobileNav() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const sidebars = {
      'left-sidebar': document.querySelector('.left-sidebar'),
      'right-sidebar': document.querySelector('.right-sidebar')
    };

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.target;
        
        // Update active button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Toggle sidebars
        Object.entries(sidebars).forEach(([id, el]) => {
          if (id === target) {
            el.classList.add('active');
          } else {
            el.classList.remove('active');
          }
        });

        // Close sidebar if "Canvas" is clicked
        if (target === 'canvas') {
          Object.values(sidebars).forEach(el => el.classList.remove('active'));
        }
        
        // Trigger resize to fix canvas size if layout shifted
        setTimeout(() => {
            this.renderer.updateCanvasSize();
            this.renderer.render();
        }, 300);
      });
    });
  }

  initShapeSelector() {
    const buttons = document.querySelectorAll('.shape-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.currentShape = btn.dataset.shape;
      });
    });
  }

  initStylePresets() {
    const container = document.getElementById('stylePresets');
    PRESETS.styles.forEach(preset => {
      const btn = document.createElement('button');
      btn.className = 'style-preset-btn';
      btn.title = preset.name;
      
      const config = preset.state;
      
      if (config.bgType === 'solid' || !config.bgType) {
        btn.style.backgroundColor = config.bgColor || '#000000';
      } else if (config.bgType === 'gradient') {
        const start = config.bgGradStart || '#ffffff';
        const end = config.bgGradEnd || '#000000';
        const angle = config.gradientAngle ?? 135;
        btn.style.background = `linear-gradient(${angle}deg, ${start}, ${end})`;
      } else if (config.bgType === 'transparent') {
        btn.style.background = 'repeating-conic-gradient(#444 0% 25%, #222 0% 50%) 50% / 8px 8px';
      }

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
    Object.keys(config).forEach(key => {
      if (key === 'gridSize') {
        this.state.setGridSize(config[key]);
      } else {
        this.state[key] = config[key];
      }
    });
    this.syncUI();
    this.renderer.updateCanvasSize();
    this.renderer.render();
  }

  syncUI() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.value = val;
      if (el.type === 'range') {
        this.updateSliderDisplay(el);
      }
    };

    setVal('gridSize', this.state.gridSize);
    setVal('colorPicker', this.state.currentColor);
    setVal('roundness', this.state.borderRadiusRatio * 100);
    setVal('blockSize', this.state.blockScale * 100);
    setVal('outlineWidth', this.state.outlineWidth);
    setVal('outlineColor', this.state.outlineColor);
    setVal('bloom', this.state.bloom);
    setVal('grain', this.state.grain);
    setVal('grain', this.state.grain);
    setVal('toggleGrid', this.state.showGrid);
    document.getElementById('toggleGrid').checked = this.state.showGrid;
    setVal('toggleConnections', this.state.showConnections);
    document.getElementById('toggleConnections').checked = this.state.showConnections;
    setVal('connectionStyle', this.state.connectionStyle);
    setVal('bgType', this.state.bgType);
    setVal('bgColor', this.state.bgColor);
    setVal('bgGradStart', this.state.bgGradStart);
    setVal('bgGradEnd', this.state.bgGradEnd);
    setVal('gradientType', this.state.gradientType);
    setVal('gradientAngle', this.state.gradientAngle);
    setVal('shadowColor', this.state.shadowColor);
    setVal('shadowBlur', this.state.shadowBlur);
    setVal('stylizedBgColor', this.state.stylizedMockupBg);
    setVal('stylizedLogoColor', this.state.stylizedMockupLogo);
    setVal('stylizedLogoSize', this.state.stylizedMockupSize);
    setVal('mockupBlendMode', this.state.mockupBlendMode);

    document.getElementById('solidBgControls').style.display = this.state.bgType === 'solid' ? 'block' : 'none';
    document.getElementById('gradientBgControls').style.display = this.state.bgType === 'gradient' ? 'block' : 'none';
    document.getElementById('lineOnlyControls').style.display = this.state.connectionStyle === 'line' ? 'block' : 'none';
  }

  updateSliderDisplay(slider) {
    const parent = slider.closest('.prop-row');
    if (!parent) return;
    
    const min = parseFloat(slider.min) || 0;
    const max = parseFloat(slider.max) || 100;
    const val = parseFloat(slider.value);
    const percent = ((val - min) / (max - min)) * 100;
    
    slider.style.setProperty('--range-progress', `${percent}%`);
    
    let displayVal = val;
    // Add units for specific sliders
    if (['roundness', 'blockSize', 'bloom', 'grain', 'shadowBlur'].includes(slider.id)) {
      displayVal = `${Math.round(percent)}%`;
    } else if (slider.id === 'stylizedLogoSize') {
      displayVal = `${val}px`;
    }
    
    parent.setAttribute('data-value', displayVal);
  }

  initSwatches() {
    const blockGroup = document.getElementById('blockColorGroup');
    const colorPicker = document.getElementById('colorPicker');
    PRESETS.blocks.slice(0, 4).forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.background = color;
      swatch.addEventListener('click', () => {
        this.state.updateAllBlocksColor(color);
        colorPicker.value = color;
        this.renderer.render();
      });
      blockGroup.appendChild(swatch);
    });

    const solidBgGroup = document.getElementById('solidBgGroup');
    const bgColorPicker = document.getElementById('bgColor');
    PRESETS.backgrounds.slice(0, 4).forEach(color => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.background = color;
      swatch.addEventListener('click', () => {
        this.state.bgColor = color;
        bgColorPicker.value = color;
        this.renderer.render();
      });
      solidBgGroup.appendChild(swatch);
    });

    const gradientGroup = document.getElementById('gradientSwatches');
    PRESETS.gradients.slice(0, 4).forEach(p => {
      const swatch = document.createElement('div');
      swatch.className = 'swatch';
      swatch.style.backgroundImage = `linear-gradient(${p.angle}deg, ${p.start}, ${p.end})`;
      swatch.addEventListener('click', () => {
        this.state.bgGradStart = p.start;
        this.state.bgGradEnd = p.end;
        this.state.gradientAngle = p.angle;
        this.syncUI();
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
    const x = Math.floor((clientX - rect.left) / (rect.width / this.state.gridSize));
    const y = Math.floor((clientY - rect.top) / (rect.height / this.state.gridSize));
    if (x >= 0 && x < this.state.gridSize && y >= 0 && y < this.state.gridSize) {
      return { x, y };
    }
    return null;
  }

  setupEventListeners() {
    document.getElementById('drawTool').addEventListener('click', () => {
      this.state.tool = 'draw';
      document.getElementById('drawTool').classList.add('active');
      document.getElementById('eraseTool').classList.remove('active');
    });

    document.getElementById('eraseTool').addEventListener('click', () => {
      this.state.tool = 'erase';
      document.getElementById('eraseTool').classList.add('active');
      document.getElementById('drawTool').classList.remove('active');
    });

    document.getElementById('gridSize').addEventListener('change', (e) => {
      this.state.setGridSize(parseInt(e.target.value));
      this.renderer.updateCanvasSize();
      this.renderer.render();
    });

    document.getElementById('colorPicker').addEventListener('input', (e) => {
      this.state.updateAllBlocksColor(e.target.value);
      this.renderer.render();
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
      this.state.initGrid();
      this.renderer.render();
    });

    document.getElementById('exportPngBtn').addEventListener('click', () => this.exporter.exportImage());
    document.getElementById('exportSvgBtn').addEventListener('click', () => this.exporter.exportSVG());

    document.getElementById('roundness').addEventListener('input', (e) => {
      this.state.borderRadiusRatio = parseInt(e.target.value) / 100;
      this.updateSliderDisplay(e.target);
      this.renderer.render();
    });

    document.getElementById('blockSize').addEventListener('input', (e) => {
      this.state.blockScale = parseInt(e.target.value) / 100;
      this.updateSliderDisplay(e.target);
      this.renderer.render();
    });

    document.getElementById('outlineWidth').addEventListener('input', (e) => {
      this.state.outlineWidth = parseInt(e.target.value);
      this.updateSliderDisplay(e.target);
      this.renderer.render();
    });

    document.getElementById('outlineColor').addEventListener('input', (e) => {
      this.state.outlineColor = e.target.value;
      this.renderer.render();
    });

    document.getElementById('bloom').addEventListener('input', (e) => {
      this.state.bloom = parseInt(e.target.value);
      this.updateSliderDisplay(e.target);
      this.renderer.render();
    });

    document.getElementById('grain').addEventListener('input', (e) => {
      this.state.grain = parseInt(e.target.value);
      this.updateSliderDisplay(e.target);
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

    document.getElementById('connectionStyle').addEventListener('change', (e) => {
      this.state.connectionStyle = e.target.value;
      document.getElementById('lineOnlyControls').style.display = e.target.value === 'line' ? 'block' : 'none';
      this.renderer.render();
    });

    document.getElementById('bgType').addEventListener('change', (e) => {
      this.state.bgType = e.target.value;
      this.syncUI();
      this.renderer.render();
    });

    document.getElementById('bgColor').addEventListener('input', (e) => {
      this.state.bgColor = e.target.value;
      this.renderer.render();
    });

    document.getElementById('bgGradStart').addEventListener('input', (e) => {
      this.state.bgGradStart = e.target.value;
      this.renderer.render();
    });

    document.getElementById('bgGradEnd').addEventListener('input', (e) => {
      this.state.bgGradEnd = e.target.value;
      this.renderer.render();
    });

    document.getElementById('gradientAngle').addEventListener('input', (e) => {
      this.state.gradientAngle = parseInt(e.target.value);
      this.updateSliderDisplay(e.target);
      this.renderer.render();
    });

    document.getElementById('shadowColor').addEventListener('input', (e) => {
      this.state.shadowColor = e.target.value;
      this.renderer.render();
    });

    document.getElementById('shadowBlur').addEventListener('input', (e) => {
      this.state.shadowBlur = parseInt(e.target.value);
      this.updateSliderDisplay(e.target);
      this.renderer.render();
    });


    let renderTimeout;
    const debouncedRenderMockups = () => {
      clearTimeout(renderTimeout);
      renderTimeout = setTimeout(() => this.renderMockups(), 100);
    };

    document.getElementById('stylizedBgColor').addEventListener('input', (e) => {
      this.state.stylizedMockupBg = e.target.value;
      debouncedRenderMockups();
    });

    document.getElementById('stylizedLogoColor').addEventListener('input', (e) => {
      this.state.stylizedMockupLogo = e.target.value;
      debouncedRenderMockups();
    });

    document.getElementById('stylizedLogoSize').addEventListener('input', (e) => {
      this.state.stylizedMockupSize = parseInt(e.target.value);
      this.updateSliderDisplay(e.target);
      debouncedRenderMockups();
    });

    document.getElementById('mockupBlendMode').addEventListener('change', (e) => {
      this.state.mockupBlendMode = e.target.value;
      debouncedRenderMockups();
    });

    document.getElementById('heroBgUploadBtn').addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (re) => {
            const img = new Image();
            img.onload = () => {
              this.state.heroBgImage = img;
              this.renderMockups();
            };
            img.src = re.target.result;
          };
          reader.readAsDataURL(file);
        }
      };
      input.click();
    });

    document.getElementById('mobileUploadBtn').addEventListener('click', () => document.getElementById('imageUpload').click());
    document.getElementById('imageUpload').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => this.processImageToGrid(img);
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    const canvas = this.renderer.canvas;
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
    const stopDrawing = () => this.state.isDrawing = false;
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    window.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('touchstart', startDrawing, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    window.addEventListener('touchend', stopDrawing);
    window.addEventListener('resize', () => {
      this.renderer.updateCanvasSize();
      this.renderer.render();
    });
  }

  drawCenteredLogo(ctx, canvas, renderLogoToBuffer, size) {
    const logoBuffer = renderLogoToBuffer(size);
    const x = (canvas.width - size) / 2;
    const y = (canvas.height - size) / 2;
    ctx.drawImage(logoBuffer, x, y);
  }

  processImageToGrid(img) {
    const tempCanvas = document.createElement('canvas');
    const size = this.state.gridSize;
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tctx = tempCanvas.getContext('2d');
    const scale = Math.max(size / img.width, size / img.height);
    tctx.drawImage(img, (size - img.width * scale) / 2, (size - img.height * scale) / 2, img.width * scale, img.height * scale);
    const imageData = tctx.getImageData(0, 0, size, size).data;
    this.state.initGrid();
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const idx = (i * size + j) * 4;
        const r = imageData[idx], g = imageData[idx + 1], b = imageData[idx + 2], a = imageData[idx + 3];
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
        if (a > 128 && luminance > 120) {
          this.state.grid[i][j].active = true;
          this.state.grid[i][j].color = this.state.currentColor;
          this.state.grid[i][j].shape = this.state.currentShape;
        }
      }
    }
    this.renderer.render();
  }
}