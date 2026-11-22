// vision.js — seeing and being seen.
// A vision cone is an eye position, a facing angle, a range and a half-angle.
// A target is visible when it is inside the cone AND the line of sight is not
// broken by a wall or a pillar. Everything here is pure geometry: no state.

/** Smallest absolute angle between two headings, in [0, PI]. */
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** Whether point (px,py) lies inside the cone (eye, facing, range, halfAngle). */
export function inCone(eye, facing, range, halfAngle, px, py) {
  const dx = px - eye.x;
  const dy = py - eye.y;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  return angleDiff(Math.atan2(dy, dx), facing) <= halfAngle;
}

/** Whether segment (ax,ay)-(bx,by) hits the rectangle. */
export function segmentHitsRect(ax, ay, bx, by, r) {
  // Inside the rect at either end counts as a hit.
  const inside = (x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
  if (inside(ax, ay) || inside(bx, by)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  return edges.some(([x1, y1, x2, y2]) => segmentsCross(ax, ay, bx, by, x1, y1, x2, y2));
}

/** Whether two segments cross (including touching). */
export function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  const s1 = Math.sign(d1);
  const s2 = Math.sign(d2);
  const s3 = Math.sign(d3);
  const s4 = Math.sign(d4);
  if (s1 === 0 || s2 === 0 || s3 === 0 || s4 === 0) {
    // Collinear or touching: treat as a hit only when the touch is on both segments.
    return s1 * s2 <= 0 && s3 * s4 <= 0 && onBoth(ax, ay, bx, by, cx, cy, dx, dy);
  }
  return s1 !== s2 && s3 !== s4;
}

function onBoth(ax, ay, bx, by, cx, cy, dx, dy) {
  const between = (px, py, qx, qy, rx, ry) =>
    Math.min(qx, rx) - 0.001 <= px && px <= Math.max(qx, rx) + 0.001 &&
    Math.min(qy, ry) - 0.001 <= py && py <= Math.max(qy, ry) + 0.001;
  return (
    between(cx, cy, ax, ay, bx, by) || between(dx, dy, ax, ay, bx, by) ||
    between(ax, ay, cx, cy, dx, dy) || between(bx, by, cx, cy, dx, dy)
  );
}

/** Whether segment (ax,ay)-(bx,by) hits the circle (cx,cy,r). */
export function segmentHitsCircle(ax, ay, bx, by, cx, cy, r) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return Math.hypot(ax - cx, ay - cy) <= r;
  let t = ((cx - ax) * dx + (cy - ay) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = ax + t * dx;
  const py = ay + t * dy;
  return Math.hypot(px - cx, py - cy) <= r;
}

/**
 * Line of sight between two points: true when no wall and no pillar blocks
 * the segment. The loot pedestal itself never blocks sight.
 */
export function hasLineOfSight(ax, ay, bx, by, walls, pillars) {
  for (const w of walls) {
    if (segmentHitsRect(ax, ay, bx, by, w)) return false;
  }
  for (const p of pillars) {
    if (segmentHitsCircle(ax, ay, bx, by, p.x, p.y, p.r)) return false;
  }
  return true;
}

/**
 * Whether a watcher (eye, facing, range, halfAngle) can see a target point.
 * Combines the cone test with line of sight.
 */
export function canSee(eye, facing, range, halfAngle, tx, ty, walls, pillars) {
  if (!inCone(eye, facing, range, halfAngle, tx, ty)) return false;
  return hasLineOfSight(eye.x, eye.y, tx, ty, walls, pillars);
}
