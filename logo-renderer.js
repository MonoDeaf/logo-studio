export class LogoRenderer {
  // Return neighbor scale if connected, else 0
  static checkMatch(x, y, dx, dy, grid, gridSize, cell, state) {
    for (let d = 1; d <= state.connectionDistance; d++) {
      const nx = x + dx * d;
      const ny = y + dy * d;
      if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
      const nCell = grid[ny][nx];
      // Only connect if shapes are standard joinable (rounded/square)
      const joinableShapes = ['rounded', 'square'];
      if (nCell.active && nCell.color === cell.color && joinableShapes.includes(nCell.shape)) return nCell.scale;
    }
    return 0;
  }

  static getConnStrength(s1, s2) {
    const minS = Math.min(s1, s2);
    return Math.max(0, Math.min(1, (minS - 0.5) * 2));
  }

  static draw(ctx, width, height, cellSize, gridSize, grid, scale, radius, isOutline, state) {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = grid[y][x];
        if (cell.scale > 0) {
          const individualScale = scale * cell.scale;
          const drawSize = cellSize * individualScale;
          const offset = (cellSize - drawSize) / 2;
          const posX = x * cellSize + offset;
          const posY = y * cellSize + offset;

          if (!isOutline) {
            ctx.fillStyle = cell.color;
            // Add a tiny 0.5px bleed to prevent sub-pixel gaps between adjacent blocks
            this.renderShape(ctx, cell.shape, posX - 0.25, posY - 0.25, drawSize + 0.5, radius, cell.scale, x, y, grid, gridSize, cell, state, false);
          } else {
            ctx.strokeStyle = state.outlineColor;
            this.renderShape(ctx, cell.shape, posX, posY, drawSize, radius, cell.scale, x, y, grid, gridSize, cell, state, true);
          }
        }
      }
    }

    if (state.showConnections) {
      this.drawConnections(ctx, width, height, cellSize, gridSize, grid, scale, radius, isOutline, state);
    }
  }

  static renderShape(ctx, shape, x, y, size, radius, cellScale, gridX, gridY, grid, gridSize, cell, state, isOutline) {
    ctx.beginPath();
    const r = radius * cellScale;

    switch (shape) {
      case 'circle':
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
        break;
      case 'square':
        ctx.rect(x, y, size, size);
        break;
      case 'rounded':
        this.drawSmartRounded(ctx, x, y, size, r, cellScale, gridX, gridY, grid, gridSize, cell, state);
        break;
      case 'diagonal-tl':
        ctx.moveTo(x, y); ctx.lineTo(x + size, y); ctx.lineTo(x, y + size); ctx.closePath();
        break;
      case 'diagonal-tr':
        ctx.moveTo(x, y); ctx.lineTo(x + size, y); ctx.lineTo(x + size, y + size); ctx.closePath();
        break;
      case 'diagonal-bl':
        ctx.moveTo(x, y); ctx.lineTo(x, y + size); ctx.lineTo(x + size, y + size); ctx.closePath();
        break;
      case 'diagonal-br':
        ctx.moveTo(x + size, y); ctx.lineTo(x + size, y + size); ctx.lineTo(x, y + size); ctx.closePath();
        break;
      case 'diamond':
        ctx.moveTo(x + size/2, y); ctx.lineTo(x + size, y + size/2); ctx.lineTo(x + size/2, y + size); ctx.lineTo(x, y + size/2); ctx.closePath();
        break;
      case 'corner-tl':
        ctx.moveTo(x, y); ctx.arc(x, y, size, 0, Math.PI * 0.5); ctx.closePath();
        break;
      case 'corner-tr':
        ctx.moveTo(x + size, y); ctx.arc(x + size, y, size, Math.PI * 0.5, Math.PI); ctx.closePath();
        break;
      case 'corner-bl':
        ctx.moveTo(x, y + size); ctx.arc(x, y + size, size, Math.PI * 1.5, Math.PI * 2); ctx.closePath();
        break;
      case 'corner-br':
        ctx.moveTo(x + size, y + size); ctx.arc(x + size, y + size, size, Math.PI, Math.PI * 1.5); ctx.closePath();
        break;
      case 'concave-tl':
        ctx.moveTo(x + size, y); ctx.lineTo(x + size, y + size); ctx.lineTo(x, y + size); 
        ctx.arc(x, y, size, Math.PI * 0.5, 0, true); ctx.closePath();
        break;
      case 'concave-tr':
        ctx.moveTo(x + size, y + size); ctx.lineTo(x, y + size); ctx.lineTo(x, y); 
        ctx.arc(x + size, y, size, Math.PI, Math.PI * 0.5, true); ctx.closePath();
        break;
      case 'concave-bl':
        ctx.moveTo(x, y); ctx.lineTo(x + size, y); ctx.lineTo(x + size, y + size); 
        ctx.arc(x, y + size, size, 0, Math.PI * 1.5, true); ctx.closePath();
        break;
      case 'concave-br':
        ctx.moveTo(x, y + size); ctx.lineTo(x, y); ctx.lineTo(x + size, y); 
        ctx.arc(x + size, y + size, size, Math.PI * 1.5, Math.PI, true); ctx.closePath();
        break;
      case 'triangle-up':
        ctx.moveTo(x + size/2, y); ctx.lineTo(x + size, y + size); ctx.lineTo(x, y + size); ctx.closePath();
        break;
      case 'triangle-down':
        ctx.moveTo(x, y); ctx.lineTo(x + size, y); ctx.lineTo(x + size/2, y + size); ctx.closePath();
        break;
      case 'triangle-left':
        ctx.moveTo(x + size, y); ctx.lineTo(x + size, y + size); ctx.lineTo(x, y + size/2); ctx.closePath();
        break;
      case 'triangle-right':
        ctx.moveTo(x, y); ctx.lineTo(x + size, y + size/2); ctx.lineTo(x, y + size); ctx.closePath();
        break;
      case 'plus':
        const thick = size * 0.35;
        const off = (size - thick) / 2;
        ctx.rect(x + off, y, thick, size);
        ctx.rect(x, y + off, size, thick);
        break;
      default:
        ctx.rect(x, y, size, size);
    }
    
    if (isOutline) {
      // For standard rounded we use a special outlined drawer to handle smart edge hiding
      if (shape === 'rounded' && state.connectionStyle === 'standard') {
        // Handled by drawSmartRounded inside its logic or we let standard outline proceed
        ctx.stroke();
      } else {
        ctx.stroke();
      }
    } else {
      ctx.fill();
    }
  }

  static drawSmartRounded(ctx, posX, posY, drawSize, r, cellScale, x, y, grid, gridSize, cell, state) {
    let tl = r, tr = r, br = r, bl = r;
    const isStandard = state.connectionStyle === 'standard';

    if (isStandard) {
      const sT = this.checkMatch(x, y, 0, -1, grid, gridSize, cell, state);
      const sR = this.checkMatch(x, y, 1, 0, grid, gridSize, cell, state);
      const sB = this.checkMatch(x, y, 0, 1, grid, gridSize, cell, state);
      const sL = this.checkMatch(x, y, -1, 0, grid, gridSize, cell, state);
      
      const sTL = this.checkMatch(x, y, -1, -1, grid, gridSize, cell, state);
      const sTR = this.checkMatch(x, y, 1, -1, grid, gridSize, cell, state);
      const sBR = this.checkMatch(x, y, 1, 1, grid, gridSize, cell, state);
      const sBL = this.checkMatch(x, y, -1, 1, grid, gridSize, cell, state);

      tl *= (1 - this.getConnStrength(cellScale, Math.max(sT, sL, sTL)));
      tr *= (1 - this.getConnStrength(cellScale, Math.max(sT, sR, sTR)));
      br *= (1 - this.getConnStrength(cellScale, Math.max(sB, sR, sBR)));
      bl *= (1 - this.getConnStrength(cellScale, Math.max(sB, sL, sBL)));
    }

    if (ctx.roundRect) {
      ctx.roundRect(posX, posY, drawSize, drawSize, [tl, tr, br, bl]);
    } else {
      this.drawRoundedRectFallback(ctx, posX, posY, drawSize, drawSize, tl, tr, br, bl);
    }
  }

  static drawConnections(ctx, width, height, cellSize, gridSize, grid, scale, radius, isOutline, state) {
    const isStandard = state.connectionStyle === 'standard';
    const isLine = state.connectionStyle === 'line';

    if (isStandard && radius > 0) {
      const getActiveScale = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) return 0;
        const c = grid[ny][nx];
        return (c.active && c.shape === 'rounded') ? c.scale : 0;
      };
      
      const getActiveColor = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) return null;
        return (grid[ny][nx].active && grid[ny][nx].shape === 'rounded') ? grid[ny][nx].color : null;
      };

      for (let jy = 0; jy <= gridSize; jy++) {
        for (let jx = 0; jx <= gridSize; jx++) {
          const sTL = getActiveScale(jx - 1, jy - 1);
          const sTR = getActiveScale(jx, jy - 1);
          const sBL = getActiveScale(jx - 1, jy);
          const sBR = getActiveScale(jx, jy);
          
          const cTL = getActiveColor(jx - 1, jy - 1);
          const cTR = getActiveColor(jx, jy - 1);
          const cBL = getActiveColor(jx - 1, jy);
          const cBR = getActiveColor(jx, jy);

          const jXPos = jx * cellSize;
          const jYPos = jy * cellSize;

          if (cTR && cBL && cTR === cBL) {
            const strength = this.getConnStrength(sTR, sBL);
            if (strength > 0) {
              const r = radius * strength;
              if (!isOutline) {
                ctx.fillStyle = cTR;
                if (cTL !== cTR) { this.pathFillet(ctx, jXPos, jYPos, r, 2, false); ctx.fill(); }
                if (cBR !== cTR) { this.pathFillet(ctx, jXPos, jYPos, r, 0, false); ctx.fill(); }
              } else {
                if (cTL !== cTR) { this.pathFillet(ctx, jXPos, jYPos, r, 2, true); ctx.stroke(); }
                if (cBR !== cTR) { this.pathFillet(ctx, jXPos, jYPos, r, 0, true); ctx.stroke(); }
              }
            }
          }
          if (cTL && cBR && cTL === cBR) {
            const strength = this.getConnStrength(sTL, sBR);
            if (strength > 0) {
              const r = radius * strength;
              if (!isOutline) {
                ctx.fillStyle = cTL;
                if (cTR !== cTL) { this.pathFillet(ctx, jXPos, jYPos, r, 3, false); ctx.fill(); }
                if (cBL !== cTL) { this.pathFillet(ctx, jXPos, jYPos, r, 1, false); ctx.fill(); }
              } else {
                if (cTR !== cTL) { this.pathFillet(ctx, jXPos, jYPos, r, 3, true); ctx.stroke(); }
                if (cBL !== cTL) { this.pathFillet(ctx, jXPos, jYPos, r, 1, true); ctx.stroke(); }
              }
            }
          }
        }
      }
    }

    if (state.connectionDistance >= 1) {
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const cell = grid[y][x];
          if (!cell.active || cell.scale <= 0) continue;
          if (cell.shape !== 'rounded' && cell.shape !== 'square') continue;
          
          if (isStandard && !isOutline) ctx.fillStyle = cell.color;
          if (isLine) {
            if (!isOutline) ctx.strokeStyle = cell.color;
            const thicknessScale = width / 400;
            const baseThickness = isOutline ? (state.connectionThickness + state.outlineWidth * 2) : state.connectionThickness;
            ctx.lineWidth = baseThickness * thicknessScale;
            ctx.lineCap = 'round';
          }

          // Horizontal
          for (let d = 1; d <= state.connectionDistance; d++) {
            if (x + d >= gridSize) break;
            const target = grid[y][x + d];
            if (target.active && target.color === cell.color && (target.shape === 'rounded' || target.shape === 'square')) {
              const strength = this.getConnStrength(cell.scale, target.scale);
              if (strength <= 0) break;

              if (isStandard) {
                const o = 0.75; // Increased overlap bleed to ensure no gaps at connections
                const effScale = scale * strength;
                const yCenter = (y + 0.5) * cellSize;
                const halfH = (effScale * cellSize) / 2;
                const yTop = yCenter - halfH;
                const yBottom = yCenter + halfH;
                
                if (isOutline) {
                   // Skip outline connections for simplicity in this pass
                } else {
                  ctx.fillRect((x + 0.5) * cellSize - o, yTop - o, d * cellSize + o * 2, (yBottom - yTop) + o * 2);
                }
              } else if (isLine) {
                ctx.globalAlpha = strength;
                ctx.beginPath();
                ctx.moveTo((x + 0.5) * cellSize, (y + 0.5) * cellSize);
                ctx.lineTo((x + d + 0.5) * cellSize, (y + 0.5) * cellSize);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
              }
              break;
            }
          }

          // Vertical
          for (let d = 1; d <= state.connectionDistance; d++) {
            if (y + d >= gridSize) break;
            const target = grid[y + d][x];
            if (target.active && target.color === cell.color && (target.shape === 'rounded' || target.shape === 'square')) {
              const strength = this.getConnStrength(cell.scale, target.scale);
              if (strength <= 0) break;

              if (isStandard) {
                const o = 0.75; // Increased overlap bleed to ensure no gaps at connections
                const effScale = scale * strength;
                const xCenter = (x + 0.5) * cellSize;
                const halfW = (effScale * cellSize) / 2;
                const xLeft = xCenter - halfW;
                const xRight = xCenter + halfW;
                
                if (isOutline) {
                   // Skip outline
                } else {
                  ctx.fillRect(xLeft - o, (y + 0.5) * cellSize - o, (xRight - xLeft) + o * 2, d * cellSize + o * 2);
                }
              } else if (isLine) {
                ctx.globalAlpha = strength;
                ctx.beginPath();
                ctx.moveTo((x + 0.5) * cellSize, (y + 0.5) * cellSize);
                ctx.lineTo((x + 0.5) * cellSize, (y + d + 0.5) * cellSize);
                ctx.stroke();
                ctx.globalAlpha = 1.0;
              }
              break;
            }
          }
        }
      }
    }
  }

  static drawRoundedRectFallback(ctx, x, y, w, h, tl, tr, br, bl) {
    ctx.moveTo(x + tl, y);
    ctx.lineTo(x + w - tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
    ctx.lineTo(x + w, y + h - br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
    ctx.lineTo(x + bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
    ctx.lineTo(x, y + tl);
    ctx.quadraticCurveTo(x, y, x + tl, y);
  }

  static pathFillet(ctx, x, y, r, corner, onlyArc) {
    ctx.beginPath();
    const b = 0.5; // Bleed factor for fillets
    if (corner === 0) {
       if (onlyArc) {
         ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
       } else {
         ctx.moveTo(x - b, y - b);
         ctx.lineTo(x - b, y + r + b);
         ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
         ctx.lineTo(x - b, y - b);
       }
    } else if (corner === 1) {
       if (onlyArc) {
         ctx.arc(x - r, y + r, r, 1.5 * Math.PI, 2 * Math.PI, false);
       } else {
         ctx.moveTo(x + b, y - b);
         ctx.lineTo(x - r - b, y - b);
         ctx.arc(x - r, y + r, r, 1.5 * Math.PI, 2 * Math.PI, false);
         ctx.lineTo(x + b, y - b);
       }
    } else if (corner === 2) {
       if (onlyArc) {
         ctx.arc(x - r, y - r, r, 0, 0.5 * Math.PI, false);
       } else {
         ctx.moveTo(x + b, y + b);
         ctx.lineTo(x + b, y - r - b);
         ctx.arc(x - r, y - r, r, 0, 0.5 * Math.PI, false);
         ctx.lineTo(x + b, y + b);
       }
    } else if (corner === 3) {
       if (onlyArc) {
         ctx.arc(x + r, y - r, r, 0.5 * Math.PI, Math.PI, false);
       } else {
         ctx.moveTo(x - b, y + b);
         ctx.lineTo(x + r + b, y + b);
         ctx.arc(x + r, y - r, r, 0.5 * Math.PI, Math.PI, false);
         ctx.lineTo(x - b, y + b);
       }
    }
    if (!onlyArc) ctx.closePath();
  }
}