export type MapCoords = { x: number; y: number };
export type PixelCoords = { px: number; py: number };

// These numbers matter (especially B/D offsets).
const TRANSLATION_X = 123930.0;
const TRANSLATION_Y = 157935.0;
const SCALE = 459.0;

const MAP_SIZE = 8192;

// Game map coordinate ranges (from the working project)
const GAME_MIN_X = -1951;
const GAME_MIN_Y = -1893;
const GAME_MAX_X = 1198;
const GAME_MAX_Y = 1243;

const MAP_WIDTH = GAME_MAX_X - GAME_MIN_X;
const MAP_HEIGHT = GAME_MAX_Y - GAME_MIN_Y;

// Affine transform game(map) coords -> Leaflet pixel coords
const TRANSFORM_A = MAP_SIZE / MAP_WIDTH; // X scale
const TRANSFORM_B = 5061.5; // X offset
const TRANSFORM_C = -MAP_SIZE / MAP_HEIGHT; // Y scale (negative: Leaflet Y inverted)
const TRANSFORM_D = 4960.2; // Y offset

/**
 * world/save coords -> game(map) coords
 * NOTE: Y is inverted here (matches the working project)
 */
export function worldToMap(worldX: number, worldY: number): MapCoords {
  const mapX = Math.round((worldY - TRANSLATION_Y) / SCALE);
  const mapY = Math.round((worldX + TRANSLATION_X) / SCALE) * -1;
  return { x: mapX, y: mapY };
}

/**
 * world/save coords -> pixel coords on 8192x8192 map image
 * This is what we render markers with.
 */
export function worldToPixels(worldX: number, worldY: number): PixelCoords {
  const m = worldToMap(worldX, worldY);

  const px = TRANSFORM_A * m.x + TRANSFORM_B;
  const py = TRANSFORM_C * m.y + TRANSFORM_D;

  return { px, py };
}

export const MAP_PX = MAP_SIZE;
