import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

export type RGBA = readonly [number, number, number, number];

export const PALETTE = {
  transparent: [0, 0, 0, 0] as RGBA,
  outline: [58, 48, 72, 255] as RGBA,
  bodyHi: [255, 250, 244, 255] as RGBA,
  body: [245, 232, 218, 255] as RGBA,
  bodyMid: [232, 212, 194, 255] as RGBA,
  bodySh: [210, 186, 168, 255] as RGBA,
  bodyDeep: [188, 158, 140, 255] as RGBA,
  blush: [255, 176, 192, 255] as RGBA,
  eyeWhite: [255, 255, 255, 255] as RGBA,
  eyeDark: [42, 34, 56, 255] as RGBA,
  eyeShine: [255, 255, 255, 255] as RGBA,
  mouth: [120, 88, 96, 255] as RGBA,
  foot: [176, 148, 128, 255] as RGBA,
  sparkle: [255, 220, 120, 255] as RGBA,
  sparklePink: [255, 180, 200, 255] as RGBA,
  eggHi: [255, 248, 236, 255] as RGBA,
  egg: [240, 224, 200, 255] as RGBA,
  eggSh: [210, 186, 158, 255] as RGBA,
  eggSpot: [220, 198, 170, 255] as RGBA,
  crack: [90, 72, 60, 255] as RGBA,
  food: [255, 168, 88, 255] as RGBA,
  zzz: [168, 184, 220, 255] as RGBA,
} as const;

export class PixelCanvas {
  readonly width: number;
  readonly height: number;
  private readonly pixels: Uint8ClampedArray;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pixels = new Uint8ClampedArray(width * height * 4);
  }

  clone(): PixelCanvas {
    const copy = new PixelCanvas(this.width, this.height);
    copy.pixels.set(this.pixels);
    return copy;
  }

  clear(color: RGBA = PALETTE.transparent): void {
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        this.set(x, y, color);
      }
    }
  }

  get(x: number, y: number): RGBA {
    const i = (y * this.width + x) * 4;
    return [
      this.pixels[i],
      this.pixels[i + 1],
      this.pixels[i + 2],
      this.pixels[i + 3],
    ];
  }

  set(x: number, y: number, color: RGBA): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return;
    }
    const i = (y * this.width + x) * 4;
    if (color[3] >= 255) {
      this.pixels[i] = color[0];
      this.pixels[i + 1] = color[1];
      this.pixels[i + 2] = color[2];
      this.pixels[i + 3] = 255;
      return;
    }
    if (color[3] <= 0) {
      return;
    }
    const alpha = color[3] / 255;
    const bgAlpha = this.pixels[i + 3] / 255;
    const outAlpha = alpha + bgAlpha * (1 - alpha);
    if (outAlpha <= 0) {
      return;
    }
    const r = (color[0] * alpha + this.pixels[i] * bgAlpha * (1 - alpha)) / outAlpha;
    const g = (color[1] * alpha + this.pixels[i + 1] * bgAlpha * (1 - alpha)) / outAlpha;
    const b = (color[2] * alpha + this.pixels[i + 2] * bgAlpha * (1 - alpha)) / outAlpha;
    this.pixels[i] = Math.round(r);
    this.pixels[i + 1] = Math.round(g);
    this.pixels[i + 2] = Math.round(b);
    this.pixels[i + 3] = Math.round(outAlpha * 255);
  }

  fillRect(x0: number, y0: number, w: number, h: number, color: RGBA): void {
    for (let y = y0; y < y0 + h; y += 1) {
      for (let x = x0; x < x0 + w; x += 1) {
        this.set(x, y, color);
      }
    }
  }

  fillCircle(cx: number, cy: number, radius: number, color: RGBA): void {
    const r2 = radius * radius;
    for (let y = Math.floor(cy - radius); y <= Math.ceil(cy + radius); y += 1) {
      for (let x = Math.floor(cx - radius); x <= Math.ceil(cx + radius); x += 1) {
        const dx = x - cx;
        const dy = y - cy;
        if (dx * dx + dy * dy <= r2) {
          this.set(x, y, color);
        }
      }
    }
  }

  fillEllipse(cx: number, cy: number, rx: number, ry: number, color: RGBA): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y += 1) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x += 1) {
        const nx = (x - cx) / rx;
        const ny = (y - cy) / ry;
        if (nx * nx + ny * ny <= 1) {
          this.set(x, y, color);
        }
      }
    }
  }

  drawLine(x0: number, y0: number, x1: number, y1: number, color: RGBA): void {
    let x = x0;
    let y = y0;
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      this.set(x, y, color);
      if (x === x1 && y === y1) {
        break;
      }
      const e2 = err * 2;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }

  blit(source: PixelCanvas, dx: number, dy: number): void {
    for (let y = 0; y < source.height; y += 1) {
      for (let x = 0; x < source.width; x += 1) {
        const color = source.get(x, y);
        if (color[3] > 0) {
          this.set(dx + x, dy + y, color);
        }
      }
    }
  }

  toPngBuffer(): Buffer {
    const png = new PNG({ width: this.width, height: this.height });
    png.data.set(this.pixels);
    return PNG.sync.write(png);
  }

  writePng(filePath: string): void {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, this.toPngBuffer());
  }

  upscaleNearest(factor: number): PixelCanvas {
    const result = new PixelCanvas(this.width * factor, this.height * factor);
    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const color = this.get(x, y);
        for (let dy = 0; dy < factor; dy += 1) {
          for (let dx = 0; dx < factor; dx += 1) {
            result.set(x * factor + dx, y * factor + dy, color);
          }
        }
      }
    }
    return result;
  }
}

export function writeSpriteSheet(
  frames: PixelCanvas[],
  filePath: string,
  upscaleFactor = 1,
): void {
  const scaledFrames =
    upscaleFactor > 1
      ? frames.map((frame) => frame.upscaleNearest(upscaleFactor))
      : frames;
  const frameWidth = scaledFrames[0]?.width ?? 0;
  const frameHeight = scaledFrames[0]?.height ?? 0;
  const sheet = new PixelCanvas(frameWidth * scaledFrames.length, frameHeight);
  scaledFrames.forEach((frame, index) => {
    sheet.blit(frame, index * frameWidth, 0);
  });
  sheet.writePng(filePath);
}
