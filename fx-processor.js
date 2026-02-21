export class FXProcessor {
  constructor() {
    this.noiseCanvas = this.createNoiseCanvas();
  }

  createNoiseCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const imgData = ctx.createImageData(128, 128);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const val = Math.random() * 255;
      imgData.data[i] = val;
      imgData.data[i + 1] = val;
      imgData.data[i + 2] = val;
      imgData.data[i + 3] = 255;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas;
  }

  applyShadows(ctx, width, state, drawBuffer) {
    if (state.shadowBlur > 0) {
      ctx.save();
      ctx.shadowColor = state.shadowColor;
      const blurScale = width / 600; 
      ctx.shadowBlur = state.shadowBlur * blurScale;
      ctx.shadowOffsetX = (state.shadowBlur / 4) * blurScale;
      ctx.shadowOffsetY = (state.shadowBlur / 4) * blurScale;
      ctx.drawImage(drawBuffer, 0, 0);
      ctx.restore();
    } else {
      ctx.drawImage(drawBuffer, 0, 0);
    }
  }

  applyBloom(ctx, width, state, drawBuffer) {
    if (state.bloom > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      const bloomSize = (state.bloom / 100) * (width / 20);
      ctx.filter = `blur(${bloomSize}px) brightness(1.5)`;
      ctx.drawImage(drawBuffer, 0, 0);
      ctx.restore();
    }
  }

  applyGrain(ctx, width, height, state) {
    if (state.grain > 0) {
      ctx.save();
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = state.grain / 300;
      const gSize = state.grainSize || 1;
      ctx.scale(gSize, gSize);
      const pattern = ctx.createPattern(this.noiseCanvas, 'repeat');
      ctx.fillStyle = pattern;
      const jitterX = (Math.random() - 0.5) * 128;
      const jitterY = (Math.random() - 0.5) * 128;
      ctx.translate(jitterX, jitterY);
      ctx.fillRect(-jitterX, -jitterY, width / gSize, height / gSize);
      ctx.restore();
    }
  }
}