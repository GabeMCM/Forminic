import { Application, Container, Graphics, Text } from 'pixi.js';
import { PIXI_TIMELINE_TOKENS } from './pixi-timeline.tokens';
import type { TimelineBlock, TimelineDocument, TimelineTrack } from './timeline.types';

export interface PixiTimelineController {
  mount: (container: HTMLElement) => Promise<void>;
  update: (document: TimelineDocument) => void;
  resize: (width: number, height: number) => void;
  destroy: () => void;
}

function xFromMs(ms: number, msPerPixel: number) {
  return ms / msPerPixel + PIXI_TIMELINE_TOKENS.TRACK_PADDING;
}

function widthFromMs(ms: number, msPerPixel: number) {
  return Math.max(PIXI_TIMELINE_TOKENS.MIN_BLOCK_WIDTH, ms / msPerPixel);
}

function drawGrid(layer: Graphics, width: number, height: number, document: TimelineDocument, msPerPixel: number) {
  layer.clear();
  layer.rect(0, 0, width, height).fill(PIXI_TIMELINE_TOKENS.BACKGROUND_COLOR);

  for (let ms = 0; ms <= document.durationMs; ms += PIXI_TIMELINE_TOKENS.DEFAULT_SNAP_MS) {
    const x = xFromMs(ms, msPerPixel);
    const isBeat = ms % 500 === 0;
    layer
      .moveTo(x, 0)
      .lineTo(x, height)
      .stroke({
        color: isBeat ? PIXI_TIMELINE_TOKENS.BEAT_COLOR : PIXI_TIMELINE_TOKENS.GRID_COLOR,
        alpha: isBeat ? PIXI_TIMELINE_TOKENS.BEAT_ALPHA : PIXI_TIMELINE_TOKENS.GRID_ALPHA,
        width: isBeat ? 1.5 : 1,
      });
  }
}

function drawBlock(layer: Graphics, block: TimelineBlock, trackIndex: number, msPerPixel: number) {
  const x = xFromMs(block.startMs, msPerPixel);
  const y = PIXI_TIMELINE_TOKENS.TRACK_PADDING + trackIndex * (PIXI_TIMELINE_TOKENS.TRACK_HEIGHT + PIXI_TIMELINE_TOKENS.TRACK_GAP);
  const width = widthFromMs(block.durationMs, msPerPixel);
  const height = PIXI_TIMELINE_TOKENS.TRACK_HEIGHT;
  layer
    .roundRect(x, y, width, height, 14)
    .fill({
      color: block.selected ? PIXI_TIMELINE_TOKENS.BLOCK_ACTIVE_COLOR : PIXI_TIMELINE_TOKENS.BLOCK_COLOR,
      alpha: PIXI_TIMELINE_TOKENS.BLOCK_ALPHA,
    });
}

function drawTrackLabels(labelLayer: Container, tracks: TimelineTrack[]) {
  labelLayer.removeChildren();
  tracks.forEach((track, index) => {
    const y = PIXI_TIMELINE_TOKENS.TRACK_PADDING + index * (PIXI_TIMELINE_TOKENS.TRACK_HEIGHT + PIXI_TIMELINE_TOKENS.TRACK_GAP) + 8;
    const label = new Text({
      text: track.label,
      style: {
        fill: '#f4f7df',
        fontFamily: 'serif',
        fontSize: 13,
        letterSpacing: 1.4,
      },
    });
    label.x = 10;
    label.y = y;
    labelLayer.addChild(label);
  });
}

export function createPixiTimeline(): PixiTimelineController {
  let app: Application | null = null;
  let gridLayer: Graphics | null = null;
  let blockLayer: Graphics | null = null;
  let playheadLayer: Graphics | null = null;
  let labelLayer: Container | null = null;
  let width: number = PIXI_TIMELINE_TOKENS.DEFAULT_WIDTH;
  let height: number = PIXI_TIMELINE_TOKENS.DEFAULT_HEIGHT;
  let currentDocument: TimelineDocument | null = null;
  let msPerPixel = PIXI_TIMELINE_TOKENS.DEFAULT_MS_PER_PIXEL;

  function render() {
    if (!currentDocument || !gridLayer || !blockLayer || !playheadLayer || !labelLayer) return;
    drawGrid(gridLayer, width, height, currentDocument, msPerPixel);
    blockLayer.clear();
    currentDocument.tracks.forEach((track, trackIndex) => {
      track.blocks.forEach((block) => drawBlock(blockLayer as Graphics, block, trackIndex, msPerPixel));
    });
    drawTrackLabels(labelLayer, currentDocument.tracks);
    playheadLayer.clear();
    const playheadX = xFromMs(currentDocument.playheadMs, msPerPixel);
    playheadLayer
      .moveTo(playheadX, 0)
      .lineTo(playheadX, height)
      .stroke({ color: PIXI_TIMELINE_TOKENS.PLAYHEAD_COLOR, width: 2.5 });
  }

  return {
    async mount(container) {
      app = new Application();
      await app.init({
        width,
        height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });
      gridLayer = new Graphics();
      blockLayer = new Graphics();
      playheadLayer = new Graphics();
      labelLayer = new Container();
      app.stage.addChild(gridLayer, blockLayer, labelLayer, playheadLayer);
      container.appendChild(app.canvas);
      render();
    },

    update(document) {
      currentDocument = document;
      render();
    },

    resize(nextWidth, nextHeight) {
      width = nextWidth;
      height = nextHeight;
      app?.renderer.resize(width, height);
      render();
    },

    destroy() {
      app?.destroy(true);
      app = null;
      gridLayer = null;
      blockLayer = null;
      playheadLayer = null;
      labelLayer = null;
    },
  };
}
