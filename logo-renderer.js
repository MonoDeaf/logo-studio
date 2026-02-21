export class LogoRenderer {
  // Return neighbor scale if connected, else 0
  static checkMatch(x, y, dx, dy, grid, gridSize, cell, state) {
    for (let d = 1; d <= state.connectionDistance; d++) {
      const nx = x + dx * d;
      const ny = y + dy * d;
      if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) continue;
      const nCell = grid[ny][nx];
      if (nCell.active && nCell.color === cell.color) return nCell.scale;
    }
    return 0;
  }

  // Calculate connection strength based on scales (0.5 -> 1.0 ramp)
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

          let tl = radius * cell.scale, tr = radius * cell.scale, br = radius * cell.scale, bl = radius * cell.scale;

          const isStandard = state.connectionStyle === 'standard';
          
          let sT = 0, sR = 0, sB = 0, sL = 0;
          let connT = false, connR = false, connB = false, connL = false;

          if (isStandard) {
             sT = this.checkMatch(x, y, 0, -1, grid, gridSize, cell, state);
             sR = this.checkMatch(x, y, 1, 0, grid, gridSize, cell, state);
             sB = this.checkMatch(x, y, 0, 1, grid, gridSize, cell, state);
             sL = this.checkMatch(x, y, -1, 0, grid, gridSize, cell, state);
             
             const sTL = this.checkMatch(x, y, -1, -1, grid, gridSize, cell, state);
             const sTR = this.checkMatch(x, y, 1, -1, grid, gridSize, cell, state);
             const sBR = this.checkMatch(x, y, 1, 1, grid, gridSize, cell, state);
             const sBL = this.checkMatch(x, y, -1, 1, grid, gridSize, cell, state);

             // Morph corners based on connection strength
             tl *= (1 - this.getConnStrength(cell.scale, Math.max(sT, sL, sTL)));
             tr *= (1 - this.getConnStrength(cell.scale, Math.max(sT, sR, sTR)));
             br *= (1 - this.getConnStrength(cell.scale, Math.max(sB, sR, sBR)));
             bl *= (1 - this.getConnStrength(cell.scale, Math.max(sB, sL, sBL)));

             // For outline edge skipping
             connT = this.getConnStrength(cell.scale, sT) > 0.01;
             connR = this.getConnStrength(cell.scale, sR) > 0.01;
             connB = this.getConnStrength(cell.scale, sB) > 0.01;
             connL = this.getConnStrength(cell.scale, sL) > 0.01;
          }

          if (!isOutline) {
            ctx.fillStyle = cell.color;
            if (tl <= 0.1 && tr <= 0.1 && br <= 0.1 && bl <= 0.1) {
              ctx.fillRect(posX, posY, drawSize, drawSize);
            } else {
              ctx.beginPath();
              if (ctx.roundRect) {
                ctx.roundRect(posX, posY, drawSize, drawSize, [tl, tr, br, bl]);
              } else {
                this.drawRoundedRectFallback(ctx, posX, posY, drawSize, drawSize, tl, tr, br, bl);
              }
              ctx.fill();
            }
          } else {
            // Smart Outline Drawing - Skip shared edges
            ctx.beginPath();
            let penActive = false;

            // Top Edge
            if (!connT) {
              ctx.moveTo(posX + tl, posY);
              ctx.lineTo(posX + drawSize - tr, posY);
              penActive = true;
            } else { penActive = false; }

            // TR Corner
            if (tr > 0) {
              if (!penActive) ctx.moveTo(posX + drawSize - tr, posY);
              ctx.arc(posX + drawSize - tr, posY + tr, tr, 1.5 * Math.PI, 0);
              penActive = true;
            }

            // Right Edge
            if (!connR) {
              if (!penActive) ctx.moveTo(posX + drawSize, posY + tr);
              ctx.lineTo(posX + drawSize, posY + drawSize - br);
              penActive = true;
            } else { penActive = false; }

            // BR Corner
            if (br > 0) {
              if (!penActive) ctx.moveTo(posX + drawSize, posY + drawSize - br);
              ctx.arc(posX + drawSize - br, posY + drawSize - br, br, 0, 0.5 * Math.PI);
              penActive = true;
            }

            // Bottom Edge
            if (!connB) {
              if (!penActive) ctx.moveTo(posX + drawSize - br, posY + drawSize);
              ctx.lineTo(posX + bl, posY + drawSize);
              penActive = true;
            } else { penActive = false; }

            // BL Corner
            if (bl > 0) {
              if (!penActive) ctx.moveTo(posX + bl, posY + drawSize);
              ctx.arc(posX + bl, posY + drawSize - bl, bl, 0.5 * Math.PI, Math.PI);
              penActive = true;
            }

            // Left Edge
            if (!connL) {
              if (!penActive) ctx.moveTo(posX, posY + drawSize - bl);
              ctx.lineTo(posX, posY + tl);
              penActive = true;
            } else { penActive = false; }

            // TL Corner
            if (tl > 0) {
              if (!penActive) ctx.moveTo(posX, posY + tl);
              ctx.arc(posX + tl, posY + tl, tl, Math.PI, 1.5 * Math.PI);
            }
            ctx.stroke();
          }
        }
      }
    }

    if (state.showConnections) {
      this.drawConnections(ctx, width, height, cellSize, gridSize, grid, scale, radius, isOutline, state);
    }
  }

  static drawConnections(ctx, width, height, cellSize, gridSize, grid, scale, radius, isOutline, state) {
    const isStandard = state.connectionStyle === 'standard';
    const isLine = state.connectionStyle === 'line';

    if (isStandard && radius > 0) {
      const getActiveScale = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) return 0;
        const c = grid[ny][nx];
        return (c.active) ? c.scale : 0;
      };
      
      const getActiveColor = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= gridSize || ny >= gridSize) return null;
        return grid[ny][nx].active ? grid[ny][nx].color : null;
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
            if (target.active && target.color === cell.color) {
              const strength = this.getConnStrength(cell.scale, target.scale);
              if (strength <= 0) break;

              if (isStandard) {
                const o = 0.5;
                const effScale = scale * strength;
                const yCenter = (y + 0.5) * cellSize;
                const halfH = (effScale * cellSize) / 2;
                const yTop = yCenter - halfH;
                const yBottom = yCenter + halfH;
                
                if (isOutline) {
                  const blockHalfW = (scale * cell.scale * cellSize) / 2;
                  const targetHalfW = (scale * target.scale * cellSize) / 2;
                  const lineXStart = (x + 0.5) * cellSize + blockHalfW;
                  const lineXEnd = (x + d + 0.5) * cellSize - targetHalfW;
                  
                  if (lineXEnd > lineXStart) {
                    ctx.beginPath();
                    ctx.moveTo(lineXStart - o, yTop); ctx.lineTo(lineXEnd + o, yTop);
                    ctx.moveTo(lineXStart - o, yBottom); ctx.lineTo(lineXEnd + o, yBottom);
                    ctx.stroke();
                  }
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
            if (target.active && target.color === cell.color) {
              const strength = this.getConnStrength(cell.scale, target.scale);
              if (strength <= 0) break;

              if (isStandard) {
                const o = 0.5;
                const effScale = scale * strength;
                const xCenter = (x + 0.5) * cellSize;
                const halfW = (effScale * cellSize) / 2;
                const xLeft = xCenter - halfW;
                const xRight = xCenter + halfW;
                
                if (isOutline) {
                  const blockHalfH = (scale * cell.scale * cellSize) / 2;
                  const targetHalfH = (scale * target.scale * cellSize) / 2;
                  const lineYStart = (y + 0.5) * cellSize + blockHalfH;
                  const lineYEnd = (y + d + 0.5) * cellSize - targetHalfH;
                  
                  if (lineYEnd > lineYStart) {
                    ctx.beginPath();
                    ctx.moveTo(xLeft, lineYStart - o); ctx.lineTo(xLeft, lineYEnd + o);
                    ctx.moveTo(xRight, lineYStart - o); ctx.lineTo(xRight, lineYEnd + o);
                    ctx.stroke();
                  }
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
          
          if (isLine) {
            for (let d = 1; d <= state.connectionDistance; d++) {
              if (x + d >= gridSize || y + d >= gridSize) break;
              const target = grid[y + d][x + d];
              if (target.active && target.color === cell.color) {
                 const strength = this.getConnStrength(cell.scale, target.scale);
                 if (strength > 0) {
                    ctx.globalAlpha = strength;
                    ctx.beginPath();
                    ctx.moveTo((x + 0.5) * cellSize, (y + 0.5) * cellSize);
                    ctx.lineTo((x + d + 0.5) * cellSize, (y + d + 0.5) * cellSize);
                    ctx.stroke();
                    ctx.globalAlpha = 1.0;
                 }
                 break;
              }
            }
            for (let d = 1; d <= state.connectionDistance; d++) {
              if (x + d >= gridSize || y - d < 0) break;
              const target = grid[y - d][x + d];
              if (target.active && target.color === cell.color) {
                 const strength = this.getConnStrength(cell.scale, target.scale);
                 if (strength > 0) {
                    ctx.globalAlpha = strength;
                    ctx.beginPath();
                    ctx.moveTo((x + 0.5) * cellSize, (y + 0.5) * cellSize);
                    ctx.lineTo((x + d + 0.5) * cellSize, (y - d + 0.5) * cellSize);
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
    if (corner === 0) {
       if (onlyArc) {
         ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
       } else {
         ctx.moveTo(x, y);
         ctx.lineTo(x, y + r);
         ctx.arc(x + r, y + r, r, Math.PI, 1.5 * Math.PI, false);
         ctx.lineTo(x, y);
       }
    } else if (corner === 1) {
       if (onlyArc) {
         ctx.arc(x - r, y + r, r, 1.5 * Math.PI, 2 * Math.PI, false);
       } else {
         ctx.moveTo(x, y);
         ctx.lineTo(x - r, y);
         ctx.arc(x - r, y + r, r, 1.5 * Math.PI, 2 * Math.PI, false);
         ctx.lineTo(x, y);
       }
    } else if (corner === 2) {
       if (onlyArc) {
         ctx.arc(x - r, y - r, r, 0, 0.5 * Math.PI, false);
       } else {
         ctx.moveTo(x, y);
         ctx.lineTo(x, y - r);
         ctx.arc(x - r, y - r, r, 0, 0.5 * Math.PI, false);
         ctx.lineTo(x, y);
       }
    } else if (corner === 3) {
       if (onlyArc) {
         ctx.arc(x + r, y - r, r, 0.5 * Math.PI, Math.PI, false);
       } else {
         ctx.moveTo(x, y);
         ctx.lineTo(x + r, y);
         ctx.arc(x + r, y - r, r, 0.5 * Math.PI, Math.PI, false);
         ctx.lineTo(x, y);
       }
    }
    if (!onlyArc) ctx.closePath();
  }
}