import fs from 'fs';
import path from 'path';
import {
  PALETTE,
  PixelCanvas,
  writeSpriteSheet,
  type RGBA,
} from './lib/pixelCanvas';

const FRAME = 64;
const UPSCALE = 4;
const OUTPUT_FRAME = FRAME * UPSCALE;

function frameCanvas(): PixelCanvas {
  return new PixelCanvas(FRAME, FRAME);
}

function fluffyBody(
  canvas: PixelCanvas,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
): void {
  canvas.fillEllipse(cx, cy, rx + 2, ry + 2, PALETTE.outline);
  canvas.fillEllipse(cx, cy - 1, rx, ry, PALETTE.bodySh);
  canvas.fillEllipse(cx, cy - 2, rx - 1, ry - 1, PALETTE.bodyMid);
  canvas.fillEllipse(cx, cy - 2, rx - 2, ry - 2, PALETTE.body);
  canvas.fillEllipse(cx - 3, cy - 4, 4, 3, PALETTE.bodyHi);
  canvas.fillEllipse(cx + 4, cy + 1, 2, 2, PALETTE.bodySh);
  for (const [fx, fy] of [
    [-rx, 0],
    [rx, 1],
    [0, ry],
    [-rx + 2, -ry + 1],
    [rx - 2, -ry + 2],
  ]) {
    canvas.fillCircle(cx + fx, cy + fy, 1, PALETTE.bodyHi);
    canvas.set(cx + fx, cy + fy, PALETTE.outline);
  }
}

function drawFeet(canvas: PixelCanvas, cx: number, cy: number, spread = 0): void {
  canvas.fillEllipse(cx - 5 - spread, cy + 12, 3, 2, PALETTE.foot);
  canvas.fillEllipse(cx + 5 + spread, cy + 12, 3, 2, PALETTE.foot);
}

function drawArms(canvas: PixelCanvas, cx: number, cy: number, lift = 0): void {
  canvas.fillEllipse(cx - 11, cy + 2 - lift, 2, 3, PALETTE.bodyMid);
  canvas.fillEllipse(cx + 11, cy + 2 - lift, 2, 3, PALETTE.bodyMid);
}

function drawEyes(
  canvas: PixelCanvas,
  cx: number,
  cy: number,
  blink = false,
  happy = false,
): void {
  const eyeY = cy - 1;
  if (blink) {
    canvas.drawLine(cx - 7, eyeY, cx - 3, eyeY, PALETTE.outline);
    canvas.drawLine(cx + 3, eyeY, cx + 7, eyeY, PALETTE.outline);
    return;
  }
  canvas.fillEllipse(cx - 5, eyeY, 4, happy ? 4 : 5, PALETTE.eyeWhite);
  canvas.fillEllipse(cx + 5, eyeY, 4, happy ? 4 : 5, PALETTE.eyeWhite);
  canvas.fillCircle(cx - 5, eyeY + 1, 2, PALETTE.eyeDark);
  canvas.fillCircle(cx + 5, eyeY + 1, 2, PALETTE.eyeDark);
  canvas.set(cx - 6, eyeY - 1, PALETTE.eyeShine);
  canvas.set(cx + 4, eyeY - 1, PALETTE.eyeShine);
  if (happy) {
    canvas.drawLine(cx - 7, eyeY - 4, cx - 3, eyeY - 3, PALETTE.outline);
    canvas.drawLine(cx + 3, eyeY - 3, cx + 7, eyeY - 4, PALETTE.outline);
  }
}

function drawMouth(
  canvas: PixelCanvas,
  cx: number,
  cy: number,
  mode: 'smile' | 'open' | 'dot' = 'smile',
): void {
  if (mode === 'dot') {
    canvas.set(cx, cy + 5, PALETTE.mouth);
    return;
  }
  if (mode === 'open') {
    canvas.fillEllipse(cx, cy + 5, 2, 2, PALETTE.mouth);
    return;
  }
  for (let x = -3; x <= 3; x += 1) {
    const y = cy + 5 + Math.round((x * x) / 9);
    canvas.set(cx + x, y, PALETTE.mouth);
  }
}

function drawBlush(canvas: PixelCanvas, cx: number, cy: number): void {
  canvas.set(cx - 9, cy + 3, PALETTE.blush);
  canvas.set(cx - 8, cy + 3, PALETTE.blush);
  canvas.set(cx + 8, cy + 3, PALETTE.blush);
  canvas.set(cx + 9, cy + 3, PALETTE.blush);
}

function drawSomMong(options: {
  bob?: number;
  blink?: boolean;
  happy?: boolean;
  mouth?: 'smile' | 'open' | 'dot';
  armLift?: number;
  footSpread?: number;
  sparkles?: boolean;
  food?: boolean;
  sleep?: boolean;
}): PixelCanvas {
  const canvas = frameCanvas();
  const cx = 32;
  const cy = 29 + (options.bob ?? 0);

  fluffyBody(canvas, cx, cy, 13, 12);
  drawFeet(canvas, cx, cy, options.footSpread ?? 0);
  drawArms(canvas, cx, cy, options.armLift ?? 0);
  drawEyes(canvas, cx, cy, options.blink ?? false, options.happy ?? false);
  drawBlush(canvas, cx, cy);
  drawMouth(canvas, cx, cy, options.mouth ?? 'smile');

  if (options.sparkles) {
    for (const [sx, sy, color] of [
      [12, 10, PALETTE.sparkle],
      [48, 12, PALETTE.sparklePink],
      [10, 28, PALETTE.sparklePink],
      [52, 26, PALETTE.sparkle],
      [32, 6, PALETTE.sparkle],
    ] as Array<[number, number, RGBA]>) {
      canvas.set(sx, sy, color);
      canvas.set(sx + 1, sy, color);
      canvas.set(sx, sy + 1, color);
    }
  }

  if (options.food) {
    canvas.fillCircle(cx + 9, cy + 3, 2, PALETTE.food);
  }

  if (options.sleep) {
    canvas.set(46, 12, PALETTE.zzz);
    canvas.set(47, 11, PALETTE.zzz);
    canvas.set(48, 10, PALETTE.zzz);
    drawEyes(canvas, cx, cy, true, false);
  }

  return canvas;
}

function drawEgg(crackLevel: number, wobble = 0): PixelCanvas {
  const canvas = frameCanvas();
  const cx = 32 + wobble;
  const cy = 31;
  canvas.fillEllipse(cx, cy + 1, 12, 15, PALETTE.outline);
  canvas.fillEllipse(cx, cy, 11, 14, PALETTE.eggSh);
  canvas.fillEllipse(cx, cy - 1, 10, 13, PALETTE.egg);
  canvas.fillEllipse(cx - 3, cy - 5, 4, 5, PALETTE.eggHi);
  canvas.fillCircle(cx + 4, cy + 2, 1, PALETTE.eggSpot);
  canvas.fillCircle(cx - 5, cy + 4, 1, PALETTE.eggSpot);

  if (crackLevel >= 1) {
    canvas.drawLine(cx - 2, cy - 4, cx, cy + 1, PALETTE.crack);
    canvas.drawLine(cx, cy + 1, cx + 3, cy + 5, PALETTE.crack);
  }
  if (crackLevel >= 2) {
    canvas.drawLine(cx - 5, cy, cx - 1, cy + 3, PALETTE.crack);
    canvas.drawLine(cx + 4, cy - 2, cx + 1, cy + 4, PALETTE.crack);
  }
  if (crackLevel >= 3) {
    canvas.fillEllipse(cx - 7, cy + 3, 3, 4, PALETTE.eggSh);
    canvas.fillEllipse(cx + 7, cy + 2, 3, 4, PALETTE.eggSh);
  }

  return canvas;
}

function drawHatchFrame(step: number): PixelCanvas {
  if (step < 6) {
    return drawEgg(step < 3 ? 0 : step - 2, step % 2 === 0 ? 1 : -1);
  }
  if (step < 10) {
    const canvas = frameCanvas();
    const egg = drawEgg(3, 0);
    const baby = drawSomMong({
      bob: step - 8,
      mouth: 'open',
      sparkles: step >= 9,
    });
    const offsetY = 18 - (step - 6) * 4;
    canvas.blit(egg, 0, offsetY);
    canvas.blit(baby, 0, offsetY + 12);
    return canvas;
  }
  return drawSomMong({ happy: true, sparkles: true, armLift: 1, mouth: 'open' });
}

function generatePetSpritesForDir(
  petDir: string,
  assetKey: string,
  displayName: string,
  drawOptions: Parameters<typeof drawSomMong>[0] = {},
): void {
  const idleFrames = [0, -1, -1, 0, 0, 0, 0, 0].map((bob, index) =>
    drawSomMong({ bob, blink: index === 4, ...drawOptions }),
  );
  writeSpriteSheet(idleFrames, path.join(petDir, 'idle.png'), UPSCALE);

  const happyFrames = [-1, -3, -4, -2, -1, 0].map((bob, index) =>
    drawSomMong({
      bob,
      happy: true,
      sparkles: index >= 2,
      armLift: 2,
      mouth: 'open',
      footSpread: 1,
      ...drawOptions,
    }),
  );
  writeSpriteSheet(happyFrames, path.join(petDir, 'happy.png'), UPSCALE);

  const talkFrames = [0, 0, 0, 0, 0, 0].map((_, index) =>
    drawSomMong({
      bob: index % 2 === 0 ? 0 : -1,
      mouth: index % 2 === 0 ? 'open' : 'smile',
      armLift: index % 3 === 0 ? 1 : 0,
      ...drawOptions,
    }),
  );
  writeSpriteSheet(talkFrames, path.join(petDir, 'talk.png'), UPSCALE);

  const eatFrames = [0, -1, 0, -1, 0, -1].map((bob, index) =>
    drawSomMong({
      bob,
      mouth: index % 2 === 0 ? 'open' : 'dot',
      food: index % 2 === 0,
      ...drawOptions,
    }),
  );
  writeSpriteSheet(eatFrames, path.join(petDir, 'eat.png'), UPSCALE);

  const sleepFrames = [0, -1, 0, -1].map((bob) =>
    drawSomMong({ bob, sleep: true, mouth: 'dot', ...drawOptions }),
  );
  writeSpriteSheet(sleepFrames, path.join(petDir, 'sleep.png'), UPSCALE);

  const evolveFrames = [0, 0, 0, 0, 0, 0].map((_, index) =>
    drawSomMong({
      bob: -Math.abs(2 - index),
      happy: true,
      sparkles: true,
      armLift: 1,
      ...drawOptions,
    }),
  );
  writeSpriteSheet(evolveFrames, path.join(petDir, 'evolve.png'), UPSCALE);

  const eggIdleFrames = [0, -1, 0, 1, 0, -1, 0, 1].map((wobble) => drawEgg(0, wobble));
  writeSpriteSheet(eggIdleFrames, path.join(petDir, 'egg_idle.png'), UPSCALE);

  const hatchFrames = Array.from({ length: 12 }, (_, index) => drawHatchFrame(index));
  writeSpriteSheet(hatchFrames, path.join(petDir, 'egg_hatch.png'), UPSCALE);

  const manifest = buildManifest(assetKey, displayName, {
    idle: idleFrames.length,
    happy: happyFrames.length,
    talk: talkFrames.length,
    eat: eatFrames.length,
    sleep: sleepFrames.length,
    evolve: evolveFrames.length,
    egg_idle: eggIdleFrames.length,
    egg_hatch: hatchFrames.length,
  });

  fs.writeFileSync(path.join(petDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

function buildManifest(
  assetKey: string,
  displayName: string,
  counts: Record<string, number>,
): object {
  const states: Record<string, object> = {};
  for (const [state, count] of Object.entries(counts)) {
    states[state] = {
      image: `${state}.png`,
      frameWidth: OUTPUT_FRAME,
      frameHeight: OUTPUT_FRAME,
      frameCount: count,
      fps: state === 'sleep' ? 6 : state === 'happy' ? 12 : 10,
      loop: !['happy', 'evolve', 'egg_hatch'].includes(state),
    };
  }
  return {
    assetKey,
    displayName,
    baseSize: { width: OUTPUT_FRAME, height: OUTPUT_FRAME },
    displayScale: 1,
    states,
  };
}

function generatePetSprites(): void {
  const petDir = path.join(process.cwd(), 'src/assets/pets/som_mong');
  generatePetSpritesForDir(petDir, 'som_mong', '솜몽');
}

const GROWTH_PETS: Array<{ key: string; name: string; accent: RGBA }> = [
  { key: 'lens_som', name: '렌즈솜', accent: [120, 160, 220, 255] as RGBA },
  { key: 'maker_som', name: '메이커솜', accent: [220, 140, 100, 255] as RGBA },
  { key: 'note_som', name: '노트솜', accent: [120, 180, 130, 255] as RGBA },
  { key: 'spark_som', name: '불씨솜', accent: [240, 180, 80, 255] as RGBA },
  { key: 'breath_som', name: '숨솜', accent: [100, 190, 170, 255] as RGBA },
  { key: 'ring_som', name: '링솜', accent: [170, 140, 210, 255] as RGBA },
  { key: 'cube_som', name: '큐브솜', accent: [150, 150, 170, 255] as RGBA },
];

function generateGrowthSprites(): void {
  for (const pet of GROWTH_PETS) {
    const dir = path.join(process.cwd(), 'src/assets/pets/growth', pet.key);
    fs.mkdirSync(dir, { recursive: true });
    generatePetSpritesForDir(dir, pet.key, pet.name, { sparkles: true });
  }
}

function generateEffects(): void {
  const effectsDir = path.join(process.cwd(), 'src/assets/effects');
  fs.mkdirSync(effectsDir, { recursive: true });

  const sparkleFrames = Array.from({ length: 4 }, (_, i) => {
    const canvas = frameCanvas();
    const cx = 32;
    const cy = 32;
    for (const [sx, sy] of [
      [cx - 8 + i, cy - 10],
      [cx + 10 - i, cy - 6],
      [cx - 4, cy + 8],
      [cx + 8, cy + 6],
    ]) {
      canvas.fillCircle(sx, sy, 2, PALETTE.sparkle);
      canvas.set(sx, sy - 1, PALETTE.sparklePink);
    }
    return canvas;
  });
  writeSpriteSheet(sparkleFrames, path.join(effectsDir, 'sparkle.png'), UPSCALE);

  const absorbFrames = Array.from({ length: 6 }, (_, i) => {
    const canvas = frameCanvas();
    canvas.fillCircle(32, 32, 6 + i * 2, [180, 200, 255, 200 - i * 30] as RGBA);
    return canvas;
  });
  writeSpriteSheet(absorbFrames, path.join(effectsDir, 'gyeol_absorb.png'), UPSCALE);

  const evolveLightFrames = Array.from({ length: 8 }, (_, i) => {
    const canvas = frameCanvas();
    canvas.fillCircle(32, 32, 4 + i * 2, [255, 240, 180, 120] as RGBA);
    for (let a = 0; a < 8; a += 1) {
      const angle = (a / 8) * Math.PI * 2 + i * 0.2;
      const x = 32 + Math.round(Math.cos(angle) * (10 + i));
      const y = 32 + Math.round(Math.sin(angle) * (10 + i));
      canvas.set(x, y, PALETTE.sparkle);
    }
    return canvas;
  });
  writeSpriteSheet(evolveLightFrames, path.join(effectsDir, 'evolve_light.png'), UPSCALE);
}

function drawRoom(period: 'morning' | 'afternoon' | 'night'): PixelCanvas {
  const base = drawRoomBase(period);
  return base.upscaleNearest(UPSCALE);
}

function drawRoomBase(period: 'morning' | 'afternoon' | 'night'): PixelCanvas {
  const w = 180;
  const h = 210;
  const canvas = new PixelCanvas(w, h);

  const palettes = {
    morning: {
      wall: [248, 244, 238, 255] as RGBA,
      wallHi: [255, 252, 246, 255] as RGBA,
      floor: [232, 222, 208, 255] as RGBA,
      floorLine: [210, 198, 182, 255] as RGBA,
      window: [186, 220, 248, 255] as RGBA,
      windowGlow: [255, 244, 200, 255] as RGBA,
      rug: [240, 234, 224, 255] as RGBA,
      lamp: [0, 0, 0, 0] as RGBA,
      moon: [0, 0, 0, 0] as RGBA,
      sky: [220, 236, 255, 255] as RGBA,
    },
    afternoon: {
      wall: [245, 240, 234, 255] as RGBA,
      wallHi: [252, 248, 242, 255] as RGBA,
      floor: [228, 216, 200, 255] as RGBA,
      floorLine: [204, 190, 172, 255] as RGBA,
      window: [142, 198, 248, 255] as RGBA,
      windowGlow: [255, 248, 210, 255] as RGBA,
      rug: [236, 228, 216, 255] as RGBA,
      lamp: [0, 0, 0, 0] as RGBA,
      moon: [0, 0, 0, 0] as RGBA,
      sky: [168, 210, 255, 255] as RGBA,
    },
    night: {
      wall: [42, 44, 68, 255] as RGBA,
      wallHi: [58, 60, 88, 255] as RGBA,
      floor: [30, 32, 52, 255] as RGBA,
      floorLine: [48, 50, 72, 255] as RGBA,
      window: [24, 28, 58, 255] as RGBA,
      windowGlow: [255, 232, 160, 80] as RGBA,
      rug: [52, 54, 78, 255] as RGBA,
      lamp: [255, 210, 120, 255] as RGBA,
      moon: [255, 248, 220, 255] as RGBA,
      sky: [16, 18, 42, 255] as RGBA,
    },
  }[period];

  const wallH = Math.floor(h * 0.58);
  canvas.fillRect(0, 0, w, wallH, palettes.wall);
  canvas.fillRect(0, wallH, w, h - wallH, palettes.floor);
  for (let x = 0; x < w; x += 8) {
    canvas.drawLine(x, wallH, x + 4, h, palettes.floorLine);
  }

  const wx = 65;
  const wy = 36;
  canvas.fillRect(wx, wy, 50, 40, palettes.wallHi);
  canvas.fillRect(wx + 2, wy + 2, 46, 36, palettes.window);
  canvas.fillRect(wx + 4, wy + 4, 42, 32, palettes.sky);

  if (period === 'night') {
    canvas.fillCircle(wx + 34, wy + 12, 5, palettes.moon);
    canvas.set(wx + 12, wy + 8, [255, 255, 255, 200]);
    canvas.set(wx + 24, wy + 6, [255, 255, 255, 200]);
    canvas.fillCircle(24, 60, 20, palettes.windowGlow);
    canvas.fillRect(14, 50, 4, 24, [90, 72, 56, 255]);
    canvas.fillCircle(16, 48, 5, palettes.lamp);
  } else {
    canvas.fillRect(wx + 6, wy + 20, 15, 14, palettes.windowGlow);
    canvas.fillCircle(30, 50, 25, [255, 248, 220, 40]);
  }

  canvas.fillEllipse(w / 2, h * 0.78, 45, 14, palettes.rug);
  canvas.fillRect(8, wallH - 2, w - 16, 2, palettes.floorLine);
  return canvas;
}

function generateRoomSprites(): void {
  const roomDir = path.join(process.cwd(), 'src/assets/rooms/default_room');
  for (const period of ['morning', 'afternoon', 'night'] as const) {
    drawRoom(period).writePng(path.join(roomDir, `background_${period}.png`));
  }

  const manifest = {
    assetKey: 'default_room',
    displayName: '기본 방',
    layers: ['background'],
    periods: ['morning', 'afternoon', 'night'],
  };
  fs.writeFileSync(path.join(roomDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

function main(): void {
  console.log('Generating pet sprites...');
  generatePetSprites();
  console.log('Generating growth sprites...');
  generateGrowthSprites();
  console.log('Generating effects...');
  generateEffects();
  console.log('Generating room backgrounds...');
  generateRoomSprites();
  console.log('Done.');
}

main();
