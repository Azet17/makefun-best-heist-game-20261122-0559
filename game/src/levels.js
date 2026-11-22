// levels.js — the three rooms of "Vesper: The Meridian Job".
// Every level is one single-screen room: walls and pillars are cover, guards
// patrol waypoints, cameras sweep from the walls, one loot pedestal sits in
// the middle, and the getaway door only opens once the loot is taken.
// Coordinates are canvas pixels on a 1280 x 720 floor.

export const FLOOR = { w: 1280, h: 720, wall: 24 };

/** A level definition. Walls are {x,y,w,h} rectangles; pillars are {x,y,r} circles. */
export const LEVELS = [
  {
    id: 1,
    name: 'The Meridian Gallery',
    par: 90,
    spawn: { x: 92, y: 628 },
    exit: { x: 1172, y: 52, w: 64, h: 30, label: 'SERVICE DOOR' },
    loot: { x: 640, y: 330, name: 'Star of Meridian', value: 1000 },
    // One partition wall across the middle with three gaps: a narrow vent
    // gap (left, camera-free), the wide main gap (centre, patrolled) and a
    // service gap (right, watched by a camera). Three routes, three risks.
    walls: [
      { x: 24, y: 420, w: 140, h: 18 },
      { x: 204, y: 420, w: 316, h: 18 },
      { x: 720, y: 420, w: 260, h: 18 },
      { x: 1020, y: 420, w: 236, h: 18 },
      // Display cases — low cover the thief can duck behind.
      { x: 280, y: 180, w: 160, h: 54 },
      { x: 840, y: 180, w: 160, h: 54 },
      { x: 280, y: 500, w: 160, h: 54 },
      { x: 840, y: 500, w: 160, h: 54 },
    ],
    pillars: [
      { x: 400, y: 360, r: 22 },
      { x: 880, y: 360, r: 22 },
    ],
    guards: [
      {
        name: 'Rook',
        waypoints: [
          { x: 300, y: 240 },
          { x: 980, y: 240 },
        ],
        speed: 72,
        range: 230,
        halfAngle: 0.55,
      },
      {
        name: 'Bishop',
        waypoints: [
          { x: 980, y: 580 },
          { x: 300, y: 580 },
        ],
        speed: 66,
        range: 220,
        halfAngle: 0.55,
      },
    ],
    cameras: [
      { x: 640, y: 30, base: Math.PI / 2, sweep: 0.7, speed: 0.5, range: 210, halfAngle: 0.34 },
      { x: 1250, y: 360, base: Math.PI, sweep: 0.6, speed: 0.65, range: 200, halfAngle: 0.34 },
    ],
    tools: { noise: 3, emp: 2, smoke: 2 },
    hint: 'Three gaps in the partition: the vent (left, tight), the main gap (centre, patrolled), the service gap (right, on camera).',
  },
  {
    id: 2,
    name: 'The Vault Floor',
    par: 110,
    spawn: { x: 92, y: 92 },
    exit: { x: 1172, y: 648, w: 64, h: 30, label: 'VAULT STAIR' },
    loot: { x: 640, y: 360, name: 'The Duchess Tear', value: 1500 },
    walls: [
      // Cross-shaped partition: a vertical spine with a vent gap at the top
      // and a service gap at the bottom, plus a horizontal arm.
      { x: 620, y: 24, w: 18, h: 150 },
      { x: 620, y: 214, w: 18, h: 180 },
      { x: 620, y: 434, w: 18, h: 120 },
      { x: 24, y: 340, w: 300, h: 18 },
      { x: 364, y: 340, w: 216, h: 18 },
      { x: 700, y: 340, w: 220, h: 18 },
      { x: 960, y: 340, w: 296, h: 18 },
      { x: 180, y: 130, w: 150, h: 50 },
      { x: 950, y: 130, w: 150, h: 50 },
      { x: 180, y: 540, w: 150, h: 50 },
      { x: 950, y: 540, w: 150, h: 50 },
    ],
    pillars: [
      { x: 420, y: 200, r: 22 },
      { x: 860, y: 200, r: 22 },
      { x: 420, y: 520, r: 22 },
      { x: 860, y: 520, r: 22 },
    ],
    guards: [
      {
        name: 'Rook',
        waypoints: [
          { x: 200, y: 260 },
          { x: 560, y: 260 },
          { x: 560, y: 620 },
          { x: 200, y: 620 },
        ],
        speed: 80,
        range: 235,
        halfAngle: 0.55,
      },
      {
        name: 'Bishop',
        waypoints: [
          { x: 1080, y: 260 },
          { x: 720, y: 260 },
          { x: 720, y: 620 },
          { x: 1080, y: 620 },
        ],
        speed: 78,
        range: 235,
        halfAngle: 0.55,
      },
      {
        name: 'Knight',
        waypoints: [
          { x: 640, y: 120 },
          { x: 640, y: 600 },
        ],
        speed: 88,
        range: 225,
        halfAngle: 0.6,
      },
    ],
    cameras: [
      { x: 320, y: 30, base: Math.PI / 2, sweep: 0.8, speed: 0.6, range: 215, halfAngle: 0.34 },
      { x: 960, y: 30, base: Math.PI / 2, sweep: 0.8, speed: 0.55, range: 215, halfAngle: 0.34 },
      { x: 1250, y: 360, base: Math.PI, sweep: 0.7, speed: 0.7, range: 205, halfAngle: 0.34 },
    ],
    tools: { noise: 3, emp: 2, smoke: 2 },
    hint: 'The spine splits the floor. The vent gap at the top is tight and dark; the centre is a crossfire of cones.',
  },
  {
    id: 3,
    name: 'The Crown Chamber',
    par: 130,
    spawn: { x: 640, y: 640 },
    exit: { x: 1172, y: 52, w: 64, h: 30, label: 'ROOF LADDER' },
    loot: { x: 640, y: 330, name: 'The Meridian Crown', value: 2500 },
    walls: [
      { x: 24, y: 240, w: 380, h: 18 },
      { x: 444, y: 240, w: 200, h: 18 },
      { x: 684, y: 240, w: 200, h: 18 },
      { x: 924, y: 240, w: 332, h: 18 },
      { x: 24, y: 480, w: 300, h: 18 },
      { x: 364, y: 480, w: 220, h: 18 },
      { x: 624, y: 480, w: 220, h: 18 },
      { x: 884, y: 480, w: 372, h: 18 },
      { x: 300, y: 300, w: 130, h: 46 },
      { x: 850, y: 300, w: 130, h: 46 },
      { x: 300, y: 540, w: 130, h: 46 },
      { x: 850, y: 540, w: 130, h: 46 },
    ],
    pillars: [
      { x: 640, y: 120, r: 24 },
      { x: 640, y: 600, r: 24 },
      { x: 180, y: 360, r: 22 },
      { x: 1100, y: 360, r: 22 },
    ],
    guards: [
      {
        name: 'Rook',
        waypoints: [
          { x: 180, y: 130 },
          { x: 1100, y: 130 },
        ],
        speed: 92,
        range: 245,
        halfAngle: 0.55,
      },
      {
        name: 'Bishop',
        waypoints: [
          { x: 1100, y: 600 },
          { x: 180, y: 600 },
        ],
        speed: 90,
        range: 245,
        halfAngle: 0.55,
      },
      {
        name: 'Knight',
        waypoints: [
          { x: 180, y: 360 },
          { x: 560, y: 360 },
          { x: 180, y: 360 },
        ],
        speed: 96,
        range: 230,
        halfAngle: 0.6,
      },
      {
        name: 'Pawn',
        waypoints: [
          { x: 1100, y: 360 },
          { x: 720, y: 360 },
          { x: 1100, y: 360 },
        ],
        speed: 96,
        range: 230,
        halfAngle: 0.6,
      },
    ],
    cameras: [
      { x: 320, y: 30, base: Math.PI / 2, sweep: 0.9, speed: 0.7, range: 220, halfAngle: 0.34 },
      { x: 960, y: 30, base: Math.PI / 2, sweep: 0.9, speed: 0.65, range: 220, halfAngle: 0.34 },
      { x: 30, y: 360, base: 0, sweep: 0.7, speed: 0.7, range: 210, halfAngle: 0.34 },
      { x: 1250, y: 360, base: Math.PI, sweep: 0.7, speed: 0.75, range: 210, halfAngle: 0.34 },
    ],
    tools: { noise: 4, emp: 3, smoke: 2 },
    hint: 'Four guards, four cameras, no dead ground. Read the cones, spend your tools, and do not linger by the Crown.',
  },
];

/** The room's outer border as four wall rectangles. */
export function borderWalls() {
  const t = FLOOR.wall;
  return [
    { x: 0, y: 0, w: FLOOR.w, h: t },
    { x: 0, y: FLOOR.h - t, w: FLOOR.w, h: t },
    { x: 0, y: 0, w: t, h: FLOOR.h },
    { x: FLOOR.w - t, y: 0, w: t, h: FLOOR.h },
  ];
}
