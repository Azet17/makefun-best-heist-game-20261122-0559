// render.js — everything the player sees, drawn on one canvas.
// Style: a night museum — deep blue marble floor, a crimson carpet runner,
// gold-trimmed cases, and cones of light that read at a glance: amber for a
// guard's patrol cone, red for an alerted guard or a camera, teal for the
// thief's safe cover, gold for the loot. The HUD is drawn on the canvas so
// every screenshot carries it.

import { FLOOR } from './levels.js';

const TAU = Math.PI * 2;

/** Draw a vision cone as a soft wedge with a bright rim. */
function drawCone(ctx, eye, facing, range, halfAngle, rgb, alpha) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(eye.x, eye.y);
  ctx.arc(eye.x, eye.y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  const grad = ctx.createRadialGradient(eye.x, eye.y, 8, eye.x, eye.y, range);
  grad.addColorStop(0, `rgba(${rgb},${alpha})`);
  grad.addColorStop(1, `rgba(${rgb},0.02)`);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = `rgba(${rgb},0.35)`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

/** The marble floor: checker tiles, a crimson runner, faint gold inlay. */
function drawFloor(ctx) {
  const { w, h, wall } = FLOOR;
  ctx.fillStyle = '#101826';
  ctx.fillRect(0, 0, w, h);
  const tile = 64;
  for (let y = wall; y < h - wall; y += tile) {
    for (let x = wall; x < w - wall; x += tile) {
      const even = ((x - wall) / tile + (y - wall) / tile) % 2 === 0;
      ctx.fillStyle = even ? '#151f31' : '#121a2b';
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Speckles, deterministic so the floor never shimmers between frames.
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 220; i++) {
    const x = wall + ((i * 137) % (w - wall * 2));
    const y = wall + ((i * 251) % (h - wall * 2));
    ctx.fillRect(x, y, 2, 2);
  }
  // Crimson carpet runner down the centre of the room.
  ctx.fillStyle = '#5e1a24';
  ctx.fillRect(w / 2 - 46, wall, 92, h - wall * 2);
  ctx.fillStyle = '#7a2230';
  ctx.fillRect(w / 2 - 46, wall, 92, 6);
  ctx.fillRect(w / 2 - 46, h - wall - 6, 92, 6);
  ctx.strokeStyle = 'rgba(212,175,55,0.5)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2 - 38, wall);
  ctx.lineTo(w / 2 - 38, h - wall);
  ctx.moveTo(w / 2 + 38, wall);
  ctx.lineTo(w / 2 + 38, h - wall);
  ctx.stroke();
}

/** Walls, pillars and display cases — the cover the thief reads at a glance. */
function drawCover(ctx, level) {
  // Outer border: dark slate with a gold inner edge.
  ctx.fillStyle = '#232c3d';
  ctx.fillRect(0, 0, FLOOR.w, FLOOR.wall);
  ctx.fillRect(0, FLOOR.h - FLOOR.wall, FLOOR.w, FLOOR.wall);
  ctx.fillRect(0, 0, FLOOR.wall, FLOOR.h);
  ctx.fillRect(FLOOR.w - FLOOR.wall, 0, FLOOR.wall, FLOOR.h);
  ctx.strokeStyle = 'rgba(212,175,55,0.55)';
  ctx.lineWidth = 2;
  ctx.strokeRect(FLOOR.wall - 1, FLOOR.wall - 1, FLOOR.w - 2 * FLOOR.wall + 2, FLOOR.h - 2 * FLOOR.wall + 2);

  for (const r of level.walls) {
    ctx.fillStyle = '#2b3648';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#3a4761';
    ctx.fillRect(r.x, r.y, r.w, 4);
    ctx.strokeStyle = 'rgba(212,175,55,0.35)';
    ctx.lineWidth = 1;
    ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
  }
  for (const p of level.pillars) {
    ctx.fillStyle = '#2b3648';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#3a4761';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r - 6, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(212,175,55,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, TAU);
    ctx.stroke();
  }
}

/** The loot pedestal: a gold-trimmed case with the glowing piece inside. */
function drawLoot(ctx, loot, time) {
  const { x, y } = loot;
  // Halo so the target is obvious from anywhere in the room.
  const pulse = 0.5 + 0.2 * Math.sin(time * 3);
  const halo = ctx.createRadialGradient(x, y, 6, x, y, 90);
  halo.addColorStop(0, `rgba(255,214,90,${loot.taken ? 0.05 : pulse * 0.4})`);
  halo.addColorStop(1, 'rgba(255,214,90,0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, 90, 0, TAU);
  ctx.fill();
  // Pedestal and glass case.
  ctx.fillStyle = '#1c2436';
  ctx.fillRect(x - 42, y - 28, 84, 56);
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 42, y - 28, 84, 56);
  ctx.fillStyle = 'rgba(160,200,255,0.10)';
  ctx.fillRect(x - 38, y - 24, 76, 48);
  if (!loot.taken) {
    // The piece: a faceted diamond, drawn from triangles.
    ctx.save();
    ctx.translate(x, y);
    const s = 15 + Math.sin(time * 3) * 1.5;
    ctx.fillStyle = '#ffe27a';
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.8, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#fff6c9';
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.8, 0);
    ctx.lineTo(-s * 0.8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    // Sparkles.
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for (let i = 0; i < 3; i++) {
      const a = time * 2 + (i * TAU) / 3;
      const sx = x + Math.cos(a) * 26;
      const sy = y + Math.sin(a) * 20;
      ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
    }
  } else {
    ctx.fillStyle = '#5a6b8a';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMPTY', x, y + 4);
  }
  // Grab progress ring while the thief holds E.
  if (loot.grabProgress > 0 && !loot.taken) {
    ctx.strokeStyle = '#ffd65a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 56, -Math.PI / 2, -Math.PI / 2 + loot.grabProgress * TAU);
    ctx.stroke();
  }
  // Label.
  ctx.fillStyle = '#ffd65a';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(loot.taken ? '✓ TAKEN' : `◆ ${loot.name.toUpperCase()}`, x, y - 40);
}

/** The getaway door: shut and red until the loot is taken, then green. */
function drawExit(ctx, exit) {
  const { x, y, w, h } = exit;
  ctx.fillStyle = exit.open ? '#12351f' : '#2a1214';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = exit.open ? '#3ddc84' : '#ff5d5d';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = exit.open ? '#3ddc84' : '#ff8a8a';
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(exit.open ? 'GETAWAY ✓' : 'LOCKED', x + w / 2, y + h / 2 + 4);
  if (exit.open) {
    ctx.fillStyle = 'rgba(61,220,132,0.25)';
    ctx.fillRect(x - 6, y - 6, w + 12, h + 12);
  }
}

/** A guard: navy uniform, cap, torch cone; suspicion shows over its head. */
function drawGuard(ctx, g) {
  const rgb = g.mode === 'chase' ? '255,64,64' : g.mode === 'investigate' ? '255,176,64' : '255,214,90';
  const alpha = g.mode === 'patrol' ? 0.16 : 0.26;
  drawCone(ctx, g, g.facing, g.range, g.halfAngle, rgb, alpha);
  // Body.
  ctx.save();
  ctx.translate(g.x, g.y);
  ctx.rotate(g.facing);
  ctx.fillStyle = '#1d2f52';
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#2c4470';
  ctx.fillRect(6, -5, 12, 10); // shoulders
  ctx.fillStyle = '#ffd65a';
  ctx.beginPath();
  ctx.arc(14, 0, 4, 0, TAU); // torch
  ctx.fill();
  ctx.restore();
  // Cap brim + name.
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(g.x, g.y - 4, 5, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#cdd8ea';
  ctx.font = '10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.name, g.x, g.y - 20);
  // Suspicion: a "?" that fills to "!" as the guard gets certain.
  if (g.suspicion > 0.08) {
    const mark = g.suspicion >= 1 ? '!' : '?';
    const size = 12 + g.suspicion * 10;
    ctx.fillStyle = g.suspicion >= 1 ? '#ff4d4d' : '#ffb340';
    ctx.font = `bold ${Math.round(size)}px system-ui, sans-serif`;
    ctx.fillText(mark, g.x, g.y - 34);
  }
  // "SEES YOU" tag while the thief is in the cone.
  if (g.seesThief) {
    ctx.fillStyle = '#ff4d4d';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.fillText('SPOTTED', g.x, g.y + 30);
  }
}

/** A wall camera: a small housing, a lens, and a red sweep cone. */
function drawCamera(ctx, c, time) {
  if (!c.offline) {
    drawCone(ctx, c, c.facing, c.range, c.halfAngle, '255,70,70', 0.18);
  }
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(c.facing);
  ctx.fillStyle = c.offline ? '#3a3f4a' : '#20242e';
  ctx.fillRect(-4, -8, 20, 16);
  ctx.fillStyle = c.offline ? '#555' : '#ff3b30';
  ctx.beginPath();
  ctx.arc(16, 0, 4, 0, TAU);
  ctx.fill();
  ctx.restore();
  // Blinking recording light.
  if (!c.offline && Math.sin(time * 5) > 0) {
    ctx.fillStyle = '#ff3b30';
    ctx.beginPath();
    ctx.arc(c.x, c.y - 12, 2.5, 0, TAU);
    ctx.fill();
  }
  if (c.offline) {
    ctx.fillStyle = '#9aa5b8';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('OFFLINE', c.x, c.y - 16);
  }
}

/** The thief: a hooded figure in charcoal with a teal scarf. */
function drawThief(ctx, thief, time) {
  const bob = Math.sin(time * 8) * (thief.moving ? 1.5 : 0);
  // A soft teal glow under the thief so they read at a glance, even shrunk.
  const glow = ctx.createRadialGradient(thief.x, thief.y, 4, thief.x, thief.y, 34);
  glow.addColorStop(0, 'rgba(45,212,191,0.22)');
  glow.addColorStop(1, 'rgba(45,212,191,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(thief.x, thief.y, 34, 0, TAU);
  ctx.fill();
  ctx.save();
  ctx.translate(thief.x, thief.y + bob);
  if (thief.smokeTimer > 0) ctx.globalAlpha = 0.45;
  // Cloak.
  ctx.fillStyle = '#14161f';
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.lineTo(11, 10);
  ctx.lineTo(-11, 10);
  ctx.closePath();
  ctx.fill();
  // Hood + face shadow.
  ctx.fillStyle = '#1f2230';
  ctx.beginPath();
  ctx.arc(0, -8, 8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#0a0b10';
  ctx.beginPath();
  ctx.arc(0, -7, 5, 0, TAU);
  ctx.fill();
  // Teal scarf — the one bright mark on the thief.
  ctx.strokeStyle = '#2dd4bf';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-6, -2);
  ctx.quadraticCurveTo(0, 2, 6, -2);
  ctx.stroke();
  ctx.restore();
  // Smoke cloud while cloaked.
  if (thief.smokeTimer > 0) {
    ctx.fillStyle = 'rgba(180,190,210,0.25)';
    ctx.beginPath();
    ctx.arc(thief.x, thief.y, 26 + Math.sin(time * 6) * 3, 0, TAU);
    ctx.fill();
  }
  // Direction tick so movement reads.
  ctx.strokeStyle = 'rgba(45,212,191,0.8)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(thief.x, thief.y);
  ctx.lineTo(thief.x + Math.cos(thief.facing) * 18, thief.y + Math.sin(thief.facing) * 18);
  ctx.stroke();
}

/** Expanding rings where a noise-maker landed. */
function drawPings(ctx, pings) {
  for (const p of pings) {
    const t = 1 - p.ttl / 1.6;
    ctx.strokeStyle = `rgba(255,214,90,${0.9 * (1 - t)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 12 + t * 60, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = '#ffd65a';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PING', p.x, p.y - 18);
  }
}

// ---------------------------------------------------------------- HUD

/** The top bar: level + timer, the alarm meter, loot status, tools. */
function drawHud(ctx, s, anyoneSees) {
  const w = 1280;
  ctx.fillStyle = 'rgba(8,12,20,0.92)';
  ctx.fillRect(0, 0, w, 58);
  ctx.strokeStyle = 'rgba(212,175,55,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 58.5);
  ctx.lineTo(w, 58.5);
  ctx.stroke();

  // Left: level name + timer + score.
  ctx.textAlign = 'left';
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`${s.level.id}. ${s.level.name}`, 16, 24);
  ctx.fillStyle = '#9aa5b8';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(`⏱ ${formatTime(s.elapsed)}   SCORE ${s.score}`, 16, 44);

  // Centre: the alarm meter — the biggest thing on the bar.
  const mx = 430;
  const mw = 420;
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`ALARM  ${s.alarm.label()}`, mx, 20);
  ctx.fillStyle = '#222c40';
  ctx.fillRect(mx, 26, mw, 18);
  ctx.fillStyle = s.alarm.color();
  ctx.fillRect(mx, 26, (mw * s.alarm.value) / 100, 18);
  ctx.strokeStyle = '#3a4761';
  ctx.lineWidth = 1;
  ctx.strokeRect(mx + 0.5, 26.5, mw - 1, 17);
  // Stage ticks at 30 and 65.
  ctx.fillStyle = '#9aa5b8';
  ctx.fillRect(mx + mw * 0.3 - 1, 26, 2, 18);
  ctx.fillRect(mx + mw * 0.65 - 1, 26, 2, 18);
  ctx.fillStyle = '#9aa5b8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(`${Math.round(s.alarm.value)}%`, mx + mw + 8, 40);
  if (anyoneSees && s.alarm.lastSource === 'camera') {
    ctx.fillStyle = '#ff8a8a';
    ctx.fillText('— a camera has you!', mx, 56);
  } else if (anyoneSees && s.alarm.lastSource === 'guard') {
    ctx.fillStyle = '#ff8a8a';
    ctx.fillText('— a guard has you!', mx, 56);
  }

  // Right: loot + tools.
  const rx = 900;
  ctx.fillStyle = s.loot.taken ? '#3ddc84' : '#ffd65a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(s.loot.taken ? `◆ ${s.loot.name} — IN HAND` : `◆ ${s.loot.name}`, rx, 24);
  ctx.fillStyle = '#cdd8ea';
  ctx.font = '12px system-ui, sans-serif';
  const toolLine = [
    `1 Noise ×${s.tools.counts.noise}`,
    `2 EMP ×${s.tools.counts.emp}`,
    `3 Smoke ×${s.tools.counts.smoke}`,
  ].join('    ');
  ctx.fillText(toolLine, rx, 44);
  ctx.fillStyle = s.tools.selected === 'noise' ? '#ffd65a' : '#5a6b8a';
  ctx.fillText(`[${s.tools.selected.toUpperCase()} selected]`, rx + 250, 24);
}

/** The bottom hint bar: controls and the current objective. */
function drawHints(ctx, s) {
  const w = 1280;
  const h = 720;
  ctx.fillStyle = 'rgba(8,12,20,0.92)';
  ctx.fillRect(0, h - 30, w, 30);
  ctx.fillStyle = '#cdd8ea';
  ctx.font = '12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  const objective = s.loot.taken
    ? 'GET TO THE GETAWAY DOOR — it is open now.'
    : `LIFT ${s.loot.name.toUpperCase()} — hold E beside the pedestal, then run.`;
  ctx.fillText(objective, 16, h - 11);
  ctx.textAlign = 'right';
  ctx.fillText('WASD move · E grab · 1/2/3 tools · click: throw noise · M mute · Esc pause', w - 16, h - 11);
}

/** A centred message line, used by toasts. */
function drawToast(ctx, s) {
  if (!s.toast || s.toast.ttl <= 0) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, s.toast.ttl);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(s.toast.text, 640, 92);
  ctx.restore();
}

// ---------------------------------------------------------------- screens

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(6,9,16,0.82)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(289, 139, 702, 442);
  ctx.fillStyle = '#0d1322';
  ctx.fillRect(290, 140, 700, 440);
  ctx.fillStyle = accent;
  ctx.font = 'bold 34px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, 640, 210);
  ctx.fillStyle = '#cdd8ea';
  ctx.font = '16px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, 640, 262 + i * 30));
}

export function renderMenu(ctx, s) {
  drawFloor(ctx);
  drawCover(ctx, s.level);
  drawLoot(ctx, s.loot, s.time);
  drawExit(ctx, s.exit);
  panel(ctx, 'VESPER', [
    'The Meridian Job — a one-room heist in three acts.',
    '',
    'Cross the room. Read the cones before you move.',
    'Lift the piece, then reach the getaway door alive.',
    'Noise-makers lure guards · EMP kills cameras · Smoke hides you.',
    'Every tool costs heat. Every second the alarm drains — slowly.',
    '',
    'WASD / arrows to move · E to grab · 1/2/3 tools · click throws noise',
    'Press ENTER or click to begin.',
  ], '#d4af37');
}

export function renderPaused(ctx) {
  panel(ctx, 'PAUSED', ['The room waits. The guards do not — not really.', '', 'Esc to resume · R to restart the room'], '#9aa5b8');
}

export function renderCaught(ctx, s) {
  panel(ctx, 'CAUGHT!', [
    `The alarm hit 100% in ${s.level.name}.`,
    `The ${s.loot.name} stays on its pedestal.`,
    '',
    `Peak alarm ${Math.round(s.alarm.peak)}% · Time ${formatTime(s.elapsed)}`,
    '',
    'Press R to run the room again.',
  ], '#ff4d4d');
}

export function renderLevelClear(ctx, s) {
  const bonus = s.lastClearBonus;
  panel(ctx, 'CLEAN GETAWAY', [
    `${s.loot.name} lifted. The ${s.level.name} is behind you.`,
    '',
    `Time ${formatTime(s.elapsed)} (par ${s.level.par}s) · Peak alarm ${Math.round(s.alarm.peak)}%`,
    `Room bonus +${bonus}`,
    '',
    s.level.id < 3 ? 'Press ENTER for the next room.' : 'Press ENTER for the final tally.',
  ], '#3ddc84');
}

export function renderVictory(ctx, s) {
  panel(ctx, 'THE MERIDIAN JOB — DONE', [
    'Three rooms. Three pieces. One very quiet thief.',
    '',
    `Final score ${s.score} · Total time ${formatTime(s.totalTime)}`,
    `Best room: ${s.bestRoom}`,
    '',
    'Press ENTER to run it all again.',
  ], '#d4af37');
}

/** The playing frame: floor, cones, entities, HUD. */
export function renderGame(ctx, s) {
  drawFloor(ctx);
  drawCover(ctx, s.level);
  drawExit(ctx, s.exit);
  drawLoot(ctx, s.loot, s.time);
  for (const c of s.cameras) drawCamera(ctx, c, s.time);
  for (const g of s.guards) drawGuard(ctx, g);
  drawThief(ctx, s.thief, s.time);
  drawPings(ctx, s.tools.pings);
  const anyoneSees =
    s.guards.some((g) => g.seesThief) || s.cameras.some((c) => c.seesThief);
  drawHud(ctx, s, anyoneSees);
  drawHints(ctx, s);
  drawToast(ctx, s);
  if (s.alarm.stage === 'hunt') {
    // A red vignette while the whole room is hunting you.
    const pulse = 0.1 + 0.05 * Math.sin(s.time * 6);
    const grad = ctx.createRadialGradient(640, 360, 240, 640, 360, 640);
    grad.addColorStop(0, 'rgba(255,40,40,0)');
    grad.addColorStop(1, `rgba(255,40,40,${pulse})`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);
  }
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
