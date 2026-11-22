// main.js — "Vesper: The Meridian Job".
// Boots the canvas, owns the screen state machine (menu / playing / paused /
// caught / clear / victory), steps every system once a frame, and stages
// screenshot scenes from ?shot=cover|play|caught|win.
//
// Screens: menu → playing → (caught → retry | clear → next) → victory.
// The game is fully static: no network requests, no assets, no build step.

import { LEVELS, FLOOR, borderWalls } from './levels.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { Alarm } from './alarm.js';
import { Loot, ExitDoor, nearestGuard } from './loot.js';
import { Tools } from './tools.js';
import { Input } from './input.js';
import { AudioFX } from './audio.js';
import { Thief, createGameState, setToast } from './state.js';
import {
  renderMenu,
  renderGame,
  renderPaused,
  renderCaught,
  renderLevelClear,
  renderVictory,
} from './render.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const state = createGameState(LEVELS[0]);
state.input = new Input(canvas);
state.audio = new AudioFX();

let screen = 'menu'; // menu | playing | paused | caught | clear | victory
let levelIndex = 0;
let spottedStingPlayed = false;

/** Build all of a level's live objects from its definition. */
function loadLevel(index) {
  levelIndex = index;
  const def = LEVELS[index];
  state.level = def;
  state.thief = new Thief(def.spawn.x, def.spawn.y);
  state.guards = def.guards.map((g) => new Guard(g));
  state.cameras = def.cameras.map((c) => new Camera(c));
  state.loot = new Loot(def.loot);
  state.exit = new ExitDoor(def.exit);
  state.alarm = new Alarm();
  state.tools = new Tools(def.tools);
  state.elapsed = 0;
  state.lastClearBonus = 0;
  state.toast = null;
  state.solids = { rects: [...borderWalls(), ...def.walls], circles: def.pillars };
  spottedStingPlayed = false;
}

function startGame() {
  state.score = 0;
  state.totalTime = 0;
  state.bestRoom = '—';
  loadLevel(0);
  screen = 'playing';
  setToast(state, LEVELS[0].hint, 5);
}

function retryLevel() {
  loadLevel(levelIndex);
  screen = 'playing';
  setToast(state, 'Run it again — quieter this time.', 3);
}

function nextLevel() {
  if (levelIndex + 1 < LEVELS.length) {
    loadLevel(levelIndex + 1);
    screen = 'playing';
    setToast(state, LEVELS[levelIndex].hint, 5);
  } else {
    screen = 'victory';
  }
}

/** Score for a cleared room: the piece, a time bonus, minus the heat. */
function clearBonus() {
  const def = state.level;
  const timeBonus = Math.max(0, Math.round((def.par - state.elapsed) * 10));
  const heatCost = Math.round(state.alarm.peak * 2);
  return Math.max(50, state.loot.value + timeBonus - heatCost);
}

function onLootTaken() {
  state.exit.open = true;
  state.alarm.add(6, 'grab');
  state.audio.chime();
  const g = nearestGuard(state.guards, state.loot.x, state.loot.y);
  if (g) g.investigate(state.loot.x, state.loot.y);
  setToast(state, `${state.loot.name} is yours — get to the ${state.exit.label.toLowerCase()}!`, 4);
}

function onCaught() {
  screen = 'caught';
  state.audio.caught();
}

function onLevelClear() {
  const bonus = clearBonus();
  state.lastClearBonus = bonus;
  state.score += bonus;
  state.totalTime += state.elapsed;
  if (state.bestRoom === '—' || bonus > (state.bestBonus || 0)) {
    state.bestRoom = state.level.name;
    state.bestBonus = bonus;
  }
  state.audio.win();
  screen = 'clear';
}

// ---------------------------------------------------------------- per-frame

function updatePlaying(dt) {
  const input = state.input;
  state.elapsed += dt;

  // --- tools: 1/2/3 select, Space uses the selected one, click throws noise.
  if (input.pressed('1')) {
    state.tools.selected = 'noise';
    state.audio.blip(660);
  }
  if (input.pressed('2')) {
    state.tools.selected = 'emp';
    state.audio.blip(660);
  }
  if (input.pressed('3')) {
    state.tools.selected = 'smoke';
    state.audio.blip(660);
  }
  if (input.pressed(' ')) {
    const msg =
      state.tools.selected === 'emp'
        ? state.tools.fireEmp(state)
        : state.tools.selected === 'smoke'
          ? state.tools.lightSmoke(state)
          : 'Click a spot to throw the noise-maker.';
    setToast(state, msg, 2.5);
  }
  const click = input.takeClick();
  if (click && state.tools.selected === 'noise') {
    setToast(state, state.tools.throwNoise(click.x, click.y, state), 2.5);
  }

  // --- the thief moves.
  const mv = input.moveVector();
  state.thief.move(mv.x, mv.y, dt, state.solids);
  state.tools.update(dt);

  // --- the room reacts.
  const watch = {
    thief: state.thief,
    walls: state.solids.rects,
    pillars: state.solids.circles,
    alarm: state.alarm,
  };
  for (const g of state.guards) g.update(dt, watch);
  for (const c of state.cameras) c.update(dt, watch);

  // A guard that has you certain drives the alarm up fast.
  for (const g of state.guards) {
    if (g.seesThief && g.suspicion >= 1) state.alarm.add(22 * dt, 'guard');
    else if (g.seesThief && g.suspicion >= 0.45) state.alarm.add(4 * dt, 'guard');
    if (g.seesThief && !spottedStingPlayed) {
      spottedStingPlayed = true;
      state.audio.spotted();
    }
    if (!g.seesThief) spottedStingPlayed = false;
  }
  const anyoneSees =
    state.guards.some((g) => g.seesThief) || state.cameras.some((c) => c.seesThief);
  state.alarm.decay(dt, anyoneSees);

  // --- the loot and the door.
  if (state.loot.update(dt, { thief: state.thief, input }) === 'taken') onLootTaken();
  if (state.loot.taken && state.exit.thiefInside(state.thief)) onLevelClear();

  // --- caught?
  if (state.alarm.stage === 'caught') onCaught();

  if (state.toast) state.toast.ttl -= dt;
}

function update(dt) {
  const input = state.input;
  state.time += dt;
  state.audio.ensure();

  if (input.pressed('m')) {
    const muted = state.audio.toggleMute();
    setToast(state, muted ? 'Sound off.' : 'Sound on.', 1.5);
  }

  if (screen === 'menu') {
    if (input.pressed('enter') || input.takeClick()) startGame();
  } else if (screen === 'playing') {
    if (input.pressed('escape')) {
      screen = 'paused';
    } else {
      updatePlaying(dt);
    }
  } else if (screen === 'paused') {
    if (input.pressed('escape') || input.pressed('enter')) screen = 'playing';
    if (input.pressed('r')) retryLevel();
  } else if (screen === 'caught') {
    if (input.pressed('r') || input.pressed('enter')) retryLevel();
  } else if (screen === 'clear') {
    if (input.pressed('enter')) nextLevel();
  } else if (screen === 'victory') {
    if (input.pressed('enter')) startGame();
  }
  input.endFrame();
}

function render() {
  ctx.clearRect(0, 0, FLOOR.w, FLOOR.h);
  if (screen === 'menu') renderMenu(ctx, state);
  else if (screen === 'paused') {
    renderGame(ctx, state);
    renderPaused(ctx);
  } else if (screen === 'caught') {
    renderGame(ctx, state);
    renderCaught(ctx, state);
  } else if (screen === 'clear') {
    renderGame(ctx, state);
    renderLevelClear(ctx, state);
  } else if (screen === 'victory') {
    renderGame(ctx, state);
    renderVictory(ctx, state);
  } else {
    renderGame(ctx, state);
  }
}

// ---------------------------------------------------------------- screenshots

/**
 * Stage a scene for a screenshot (?shot=cover|play|caught|win). These are
 * real game states — the same code renders them during play — frozen at a
 * moment that shows the room at its best. No gameplay is changed by them.
 */
function stageShot(shot) {
  if (shot === 'cover') {
    loadLevel(0);
    screen = 'playing';
    // The thief crouched by the south-west case, just past the pillar's
    // shadow; Rook stands above, sweeping his cone across the room.
    state.thief.x = 470;
    state.thief.y = 478;
    state.thief.facing = -Math.PI / 2;
    state.alarm.add(44, 'guard');
    state.alarm.lastSource = 'guard';
    const rook = state.guards[0];
    rook.x = 380;
    rook.y = 300;
    rook.facing = 0.9;
    rook.pause = 4;
    rook.mode = 'patrol';
    state.tools.selected = 'noise';
    setToast(state, 'Three gaps in the partition: vent, main gap, service gap.', 60);
  } else if (shot === 'play') {
    loadLevel(0);
    screen = 'playing';
    // The piece is lifted; Rook heard the grab and is walking to the empty
    // pedestal while the thief slips down the right side toward the door.
    state.loot.taken = true;
    state.exit.open = true;
    state.thief.x = 1150;
    state.thief.y = 620;
    state.thief.facing = -1.57;
    state.alarm.add(42, 'camera');
    state.alarm.lastSource = 'camera';
    state.guards[0].investigate(state.loot.x, state.loot.y);
    state.elapsed = 41;
    state.score = 0;
    setToast(state, 'The Star of Meridian is yours — get to the service door!', 60);
  } else if (shot === 'caught') {
    loadLevel(0);
    screen = 'caught';
    state.thief.x = 640;
    state.thief.y = 250;
    state.alarm.add(100, 'guard');
    state.alarm.lastSource = 'guard';
    const g = state.guards[0];
    g.x = 640;
    g.y = 370;
    g.facing = -Math.PI / 2;
    g.suspicion = 1;
    g.mode = 'chase';
    g.seesThief = true;
    state.elapsed = 57;
  } else if (shot === 'win') {
    loadLevel(0);
    screen = 'clear';
    state.loot.taken = true;
    state.exit.open = true;
    state.thief.x = 1180;
    state.thief.y = 90;
    state.elapsed = 74;
    state.lastClearBonus = 1180;
    state.score = 1180;
    state.alarm.add(41, 'guard');
  }
}

// ---------------------------------------------------------------- boot

loadLevel(0);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) stageShot(shot);

/** Debug handle for play-testing: state, screens and staging, live. */
window.__heist = {
  state,
  get screen() {
    return screen;
  },
  loadLevel,
  startGame,
  retryLevel,
  stageShot,
};

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
