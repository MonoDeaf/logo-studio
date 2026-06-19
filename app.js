import { State } from 'state';
import { Renderer } from 'renderer';
import { UI } from 'ui';
import { Exporter } from 'exporter';

// Entry Point
const state = new State();
const canvas = document.getElementById('gridCanvas');
const renderer = new Renderer(canvas, state);
const exporter = new Exporter(state, renderer);
new UI(state, renderer, exporter);

// Ensure layout is settled before initial sizing
setTimeout(() => {
  renderer.updateCanvasSize();
  renderer.start();
}, 50);

// Tombstones
// removed class LogoCreator {}
// removed LogoCreator.init()
// removed LogoCreator.updateCanvasSize()
// removed LogoCreator.initGrid()
// removed LogoCreator.render()
// removed LogoCreator.drawScene()
// removed LogoCreator.drawLogoToContext()
// removed LogoCreator.drawInsetShadow()
// removed LogoCreator.drawRoundedRectFallback()
// removed LogoCreator.pathFillet()
// removed LogoCreator.getCellFromEvent()
// removed LogoCreator.toggleCell()
// removed LogoCreator.paintCell()
// removed LogoCreator.setupEventListeners()
// removed LogoCreator.export()