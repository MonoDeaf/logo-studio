export const PRESETS = {
  blocks: [
    "#ffffff", "#808080", "#000000", "#ef4444", "#ff4a00", "#ccfa00", "#3b82f6", "#ccccfa"
  ],
  backgrounds: [
    "#000000", "#111111", "#1a1a1a", "#333333", "#ffffff", "#111827"
  ],
  gradients: [
    { start: "#030303", end: "#ff4a00", angle: 135, startOffset: 0, endOffset: 100 },
    { start: "#d6dcdc", end: "#ccccfa", angle: 45, startOffset: 0, endOffset: 100 },
    { start: "#000", end: "#2563eb", angle: 90, startOffset: 10, endOffset: 90 },
    { start: "#030030", end: "#ccfa00", angle: 270, startOffset: 0, endOffset: 100 },
    { start: "#ec4899", end: "#f97316", angle: 120, startOffset: 20, endOffset: 80 },
    { start: "#334155", end: "#0f172a", angle: 160, startOffset: 0, endOffset: 100 }
  ],
  styles: [
    {
      name: "Caster",
      state: {
        gridSize: 12,
        currentColor: "#D6DCDC",
        blockScale: 1,
        borderRadiusRatio: 0.15,
        outlineWidth: 0,
        outlineColor: "#000000",
        bloom: 0,
        grain: 20,
        grainSize: 1,
        showConnections: true,
        connectionStyle: 'standard',
        connectionThickness: 0,
        connectionDistance: 1,
        shadowColor: "#000000",
        shadowBlur: 0,
        bgType: 'solid',
        bgColor: '#050505'
      }
    },
    {
      name: "Ghost",
      state: {
        gridSize: 12,
        currentColor: "#F1F1F1",
        blockScale: 1.0,
        borderRadiusRatio: 0.5,
        outlineWidth: 0,
        bloom: 0,
        grain: 35,
        grainSize: 2,
        showConnections: true,
        connectionStyle: 'standard',
        connectionDistance: 1,
        shadowColor: "#000000",
        shadowBlur: 4,
        bgType: 'gradient',
        bgGradStart: "#FFFFFF",
        bgGradEnd: "#BABABA",
        gradientType: 'linear',
        gradientAngle: 75
      }
    },
    {
      name: "Blueprint",
      state: {
        gridSize: 24,
        currentColor: "#ffffff",
        blockScale: 0.6,
        borderRadiusRatio: 0,
        outlineWidth: 1,
        outlineColor: "#3b82f6",
        bloom: 0,
        grain: 10,
        showConnections: false,
        shadowBlur: 0,
        bgType: 'solid',
        bgColor: '#1e3a8a'
      }
    },
    {
      name: "Soft",
      state: {
        gridSize: 12,
        currentColor: "#000000",
        blockScale: 1,
        borderRadiusRatio: 0.18,
        outlineWidth: 2,
        outlineColor: "#FF4A00",
        bloom: 0,
        grain: 0,
        showConnections: true,
        connectionStyle: 'standard',
        shadowColor: "#000000",
        shadowBlur: 0,
        bgType: 'solid',
        bgColor: '#000000'
      }
    },
    {
      name: "Mono",
      state: {
        gridSize: 14,
        currentColor: "#000000",
        blockScale: 1.0,
        borderRadiusRatio: 0.1,
        outlineWidth: 0,
        bloom: 0,
        grain: 80,
        grainSize: 4,
        showConnections: true,
        connectionStyle: 'standard',
        shadowBlur: 0,
        bgType: 'solid',
        bgColor: '#ffffff'
      }
    }
  ]
};