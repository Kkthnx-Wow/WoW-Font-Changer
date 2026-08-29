/**
 * Icon pipeline: transparent background, tight crop, taskbar-optimized scale.
 * Run: npm run icons
 */
import fs from "node:fs";
import sharp from "sharp";

const SRC = "app-icon-square.png";
const UI_OUT = "public/logo.png";
const TAURI_OUT = "app-icon-bright.png";
const OUTPUT_SIZE = 1024;

/** In-app logo keeps slight breathing room. Taskbar ICO fills almost the entire canvas. */
const UI_FILL = 0.86;
const TASKBAR_FILL = 0.94;

function isBgPixel(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max === 0 ? 0 : (max - min) / max;
  if (max > 140 && sat < 0.15) return true;
  if (max < 40 && sat < 0.25) return true;
  return false;
}

async function floodTransparent(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = [];

  for (let x = 0; x < width; x++) {
    queue.push([x, 0], [x, height - 1]);
  }
  for (let y = 0; y < height; y++) {
    queue.push([0, y], [width - 1, y]);
  }

  while (queue.length) {
    const [x, y] = queue.pop();
    const idx = y * width + x;
    if (x < 0 || y < 0 || x >= width || y >= height || visited[idx]) continue;
    visited[idx] = 1;

    const i = idx * channels;
    if (!isBgPixel(data[i], data[i + 1], data[i + 2])) continue;

    data[i + 3] = 0;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return sharp(data, { raw: { width, height, channels } });
}

async function trimAndFit(transparentImage, fillRatio) {
  const trimmed = await transparentImage
    .clone()
    .trim({ threshold: 8 })
    .toBuffer({ resolveWithObject: true });

  const { width, height } = trimmed.info;
  const maxSide = Math.max(width, height);
  const targetSide = Math.round(OUTPUT_SIZE * fillRatio);

  const scaled = await sharp(trimmed.data, {
    raw: {
      width: trimmed.info.width,
      height: trimmed.info.height,
      channels: trimmed.info.channels,
    },
  })
    .resize(targetSide, targetSide, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: OUTPUT_SIZE,
      height: OUTPUT_SIZE,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  }).composite([{ input: scaled, gravity: "center" }]);
}

async function contentFillRatio(imagePath) {
  const { data, info } = await sharp(imagePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = info.width,
    minY = info.height,
    maxX = 0,
    maxY = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * 4;
      if (data[i + 3] > 20) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const area = (maxX - minX + 1) * (maxY - minY + 1);
  return ((area / (info.width * info.height)) * 100).toFixed(1);
}

async function run() {
  if (!fs.existsSync(SRC)) {
    console.error(`Missing ${SRC}`);
    process.exit(1);
  }

  const transparent = await floodTransparent(SRC);

  const uiIcon = await trimAndFit(transparent, UI_FILL);
  await uiIcon
    .clone()
    .modulate({ brightness: 1.18, saturation: 1.2 })
    .png({ compressionLevel: 9 })
    .toFile(UI_OUT);

  const taskbarIcon = await trimAndFit(transparent, TASKBAR_FILL);
  await taskbarIcon
    .clone()
    .modulate({ brightness: 1.28, saturation: 1.35 })
    .linear(1.05, 8)
    .png({ compressionLevel: 9 })
    .toFile(TAURI_OUT);

  const uiFill = await contentFillRatio(TAURI_OUT);
  console.log(`Wrote ${UI_OUT} (${UI_FILL * 100}% fill)`);
  console.log(`Wrote ${TAURI_OUT} (${TASKBAR_FILL * 100}% fill, content ~${uiFill}% of canvas)`);
}

run();
