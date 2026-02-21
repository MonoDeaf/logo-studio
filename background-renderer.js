export class BackgroundRenderer {
  static draw(ctx, width, height, state) {
    if (state.bgType === 'transparent') {
      ctx.clearRect(0, 0, width, height);
      return;
    }
    if (state.bgType === 'solid') {
      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, width, height);
    } else {
      let grad;
      if (state.gradientType === 'radial') {
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.max(width, height) / 2;
        grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      } else {
        const angleRad = (state.gradientAngle * Math.PI) / 180;
        const x1 = width / 2 - Math.cos(angleRad) * width / 2;
        const y1 = height / 2 - Math.sin(angleRad) * height / 2;
        const x2 = width / 2 + Math.cos(angleRad) * width / 2;
        const y2 = height / 2 + Math.sin(angleRad) * height / 2;
        grad = ctx.createLinearGradient(x1, y1, x2, y2);
      }
      grad.addColorStop(state.gradientStopStart / 100, state.bgGradStart);
      grad.addColorStop(state.gradientStopEnd / 100, state.bgGradEnd);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
  }
}