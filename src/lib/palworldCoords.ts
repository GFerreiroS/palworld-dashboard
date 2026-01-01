export type MapCoords = { mx: number; my: number };
export type PixelCoords = { px: number; py: number };

const TRANSL_X = 123_888;
const TRANSL_Y = 158_000;
const SCALE = 459;

const MAP_PX = 8192;

const MAP_EXTENT = 1024;

export function worldToMap(x: number, y: number): MapCoords {
  const newX = x + TRANSL_X;
  const newY = y - TRANSL_Y;

  // axis flip is intentional
  const mx = Math.round(newY / SCALE);
  const my = Math.round(newX / SCALE);

  return { mx, my };
}

export function mapToPixels(mx: number, my: number): PixelCoords {
  const px = (mx / MAP_EXTENT + 1) * 0.5 * MAP_PX;
  const py = (-my / MAP_EXTENT + 1) * 0.5 * MAP_PX;
  return { px, py };
}
