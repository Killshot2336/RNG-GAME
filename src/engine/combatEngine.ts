import { gameStore } from '../store/gameStore';
import type { CombatEntity, DamageSplash, Particle } from '../types/game';

type InputState = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
  mx: number;
  my: number;
};

const POOL_PARTICLES = 220;
const POOL_SPLASH = 48;

export class CombatEngine {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  running = false;
  raf = 0;
  last = 0;
  w = 390;
  h = 700;
  wave = 1;
  kills = 0;
  spawnAcc = 0;
  fireAcc = 0;
  shake = 0;
  player: CombatEntity;
  enemies: CombatEntity[] = [];
  bullets: CombatEntity[] = [];
  particles: Particle[] = [];
  splashes: DamageSplash[] = [];
  input: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    shoot: false,
    mx: 0,
    my: 0
  };
  boundKeyDown: (e: KeyboardEvent) => void;
  boundKeyUp: (e: KeyboardEvent) => void;
  boundPointer: (e: PointerEvent) => void;
  uid = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('2d context required');
    this.ctx = ctx;
    this.player = this.makePlayer();
    this.boundKeyDown = (e) => this.onKey(e, true);
    this.boundKeyUp = (e) => this.onKey(e, false);
    this.boundPointer = (e) => this.onPointer(e);
    for (let i = 0; i < POOL_PARTICLES; i++) {
      this.particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 0.4, r: 2, color: '#5ee0d0' });
    }
    for (let i = 0; i < POOL_SPLASH; i++) {
      this.splashes.push({ x: 0, y: 0, text: '', life: 0, max: 0.7, crit: false });
    }
  }

  makePlayer(): CombatEntity {
    return {
      id: 'player',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      r: 14,
      hp: 100,
      maxHp: 100,
      alive: true,
      kind: 'player'
    };
  }

  nextId(prefix: string) {
    this.uid += 1;
    return `${prefix}_${this.uid}`;
  }

  mount() {
    this.resize();
    this.player.x = this.w * 0.5;
    this.player.y = this.h * 0.62;
    this.player.hp = this.player.maxHp;
    this.player.alive = true;
    this.enemies = [];
    this.bullets = [];
    this.wave = 1;
    this.kills = 0;
    this.spawnAcc = 0;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    this.canvas.addEventListener('pointerdown', this.boundPointer);
    this.canvas.addEventListener('pointermove', this.boundPointer);
    this.canvas.addEventListener('pointerup', this.boundPointer);
    this.canvas.addEventListener('pointercancel', this.boundPointer);
    this.running = true;
    this.last = performance.now();
    const tick = (t: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (t - this.last) / 1000);
      this.last = t;
      this.update(dt);
      this.draw();
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  unmount() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.canvas.removeEventListener('pointerdown', this.boundPointer);
    this.canvas.removeEventListener('pointermove', this.boundPointer);
    this.canvas.removeEventListener('pointerup', this.boundPointer);
    this.canvas.removeEventListener('pointercancel', this.boundPointer);
    this.input.shoot = false;
  }

  resize() {
    const parent = this.canvas.parentElement || document.body;
    this.w = Math.max(320, parent.clientWidth || window.innerWidth);
    this.h = Math.max(480, parent.clientHeight || window.innerHeight);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.canvas.width = Math.floor(this.w * dpr);
    this.canvas.height = Math.floor(this.h * dpr);
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  onKey(e: KeyboardEvent, down: boolean) {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') this.input.up = down;
    if (k === 's' || k === 'arrowdown') this.input.down = down;
    if (k === 'a' || k === 'arrowleft') this.input.left = down;
    if (k === 'd' || k === 'arrowright') this.input.right = down;
    if (k === ' ' || k === 'j') this.input.shoot = down;
  }

  onPointer(e: PointerEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.input.mx = (e.clientX - rect.left) * (this.w / rect.width);
    this.input.my = (e.clientY - rect.top) * (this.h / rect.height);
    if (e.type === 'pointerdown') this.input.shoot = true;
    if (e.type === 'pointerup' || e.type === 'pointercancel') this.input.shoot = false;
  }

  weaponMult() {
    const p = gameStore.getState().profiles[gameStore.getState().activeProfileId];
    const name = p?.activeWeapon || '';
    if (name.includes('Final')) return 2.2;
    if (name.includes('Rift')) return 1.4;
    if (name.includes('Pulse')) return 1.18;
    return 1.05 + (p?.level || 1) * 0.02;
  }

  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x = this.w * 0.5;
    let y = -20;
    if (side === 1) {
      x = this.w + 20;
      y = Math.random() * this.h * 0.7;
    } else if (side === 2) {
      x = Math.random() * this.w;
      y = this.h + 20;
    } else if (side === 3) {
      x = -20;
      y = Math.random() * this.h * 0.7;
    } else {
      x = Math.random() * this.w;
      y = -20;
    }
    const boss = this.wave % 5 === 0 && Math.random() > 0.55;
    const hp = boss ? 90 + this.wave * 28 : 18 + this.wave * 6;
    this.enemies.push({
      id: this.nextId('e'),
      x,
      y,
      vx: 0,
      vy: 0,
      r: boss ? 22 : 11 + Math.random() * 4,
      hp,
      maxHp: hp,
      alive: true,
      kind: 'enemy',
      tint: boss ? '#ff4d6d' : '#ff8a3d'
    });
  }

  fireBullet() {
    const ang = Math.atan2(this.input.my - this.player.y, this.input.mx - this.player.x);
    const spd = 520;
    const dmg = (14 + this.wave * 0.8) * this.weaponMult();
    this.bullets.push({
      id: this.nextId('b'),
      x: this.player.x,
      y: this.player.y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      r: 4,
      hp: 1,
      maxHp: 1,
      alive: true,
      kind: 'bullet',
      dmg,
      ttl: 1.2
    });
  }

  burst(x: number, y: number, n: number, color: string) {
    let used = 0;
    for (const p of this.particles) {
      if (p.life > 0) continue;
      const a = Math.random() * Math.PI * 2;
      const s = 60 + Math.random() * 180;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.life = 0.25 + Math.random() * 0.35;
      p.max = p.life;
      p.r = 2 + Math.random() * 3;
      p.color = color;
      used += 1;
      if (used >= n) break;
    }
  }

  splash(x: number, y: number, text: string, crit: boolean) {
    for (const s of this.splashes) {
      if (s.life > 0) continue;
      s.x = x;
      s.y = y;
      s.text = text;
      s.life = 0.7;
      s.max = 0.7;
      s.crit = crit;
      return;
    }
  }

  aabb(a: CombatEntity, b: CombatEntity) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const rr = a.r + b.r;
    return dx * dx + dy * dy <= rr * rr;
  }

  update(dt: number) {
    if (!this.player.alive) return;
    if (this.shake > 0) this.shake -= dt;

    let ix = 0;
    let iy = 0;
    if (this.input.up) iy -= 1;
    if (this.input.down) iy += 1;
    if (this.input.left) ix -= 1;
    if (this.input.right) ix += 1;
    const len = Math.hypot(ix, iy) || 1;
    const speed = 210;
    this.player.vx = (ix / len) * speed;
    this.player.vy = (iy / len) * speed;
    this.player.x = Math.max(this.player.r, Math.min(this.w - this.player.r, this.player.x + this.player.vx * dt));
    this.player.y = Math.max(this.player.r + 60, Math.min(this.h - this.player.r - 80, this.player.y + this.player.vy * dt));

    this.spawnAcc += dt;
    const spawnEvery = Math.max(0.35, 1.2 - this.wave * 0.05);
    if (this.spawnAcc >= spawnEvery) {
      this.spawnAcc = 0;
      this.spawnEnemy();
    }

    this.fireAcc += dt;
    if (this.input.shoot && this.fireAcc >= 0.14) {
      this.fireAcc = 0;
      this.fireBullet();
    }

    for (const b of this.bullets) {
      if (!b.alive) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.ttl = (b.ttl || 0) - dt;
      if (b.ttl <= 0 || b.x < -40 || b.x > this.w + 40 || b.y < -40 || b.y > this.h + 40) b.alive = false;
    }

    for (const e of this.enemies) {
      if (!e.alive) continue;
      const dx = this.player.x - e.x;
      const dy = this.player.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const spd = 55 + this.wave * 3;
      e.x += (dx / d) * spd * dt;
      e.y += (dy / d) * spd * dt;
      if (this.aabb(e, this.player)) {
        this.player.hp -= (e.r > 18 ? 18 : 8) * dt * 4;
        this.shake = Math.max(this.shake, 0.15);
        if (this.player.hp <= 0) {
          this.player.alive = false;
          this.player.hp = 0;
          this.burst(this.player.x, this.player.y, 28, '#ff4d6d');
          gameStore.getState().addXp(gameStore.getState().activeProfileId, this.kills * 2);
          gameStore.getState().addCredits(gameStore.getState().activeProfileId, this.kills * 3);
        }
      }
    }

    for (const b of this.bullets) {
      if (!b.alive) continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        if (!this.aabb(b, e)) continue;
        b.alive = false;
        const crit = Math.random() < 0.12;
        const dmg = Math.floor((b.dmg || 10) * (crit ? 2 : 1));
        e.hp -= dmg;
        this.splash(e.x, e.y - 10, String(dmg), crit);
        this.burst(e.x, e.y, crit ? 10 : 5, e.tint || '#ff8a3d');
        if (e.hp <= 0) {
          e.alive = false;
          this.kills += 1;
          this.shake = Math.max(this.shake, 0.12);
          this.burst(e.x, e.y, 16, '#5ee0d0');
          if (this.kills % 12 === 0) this.wave += 1;
        }
        break;
      }
    }

    this.enemies = this.enemies.filter((e) => e.alive);
    this.bullets = this.bullets.filter((b) => b.alive);

    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 40 * dt;
    }
    for (const s of this.splashes) {
      if (s.life <= 0) continue;
      s.life -= dt;
      s.y -= 28 * dt;
    }
  }

  draw() {
    const ctx = this.ctx;
    let ox = 0;
    let oy = 0;
    if (this.shake > 0) {
      ox = (Math.random() - 0.5) * 10;
      oy = (Math.random() - 0.5) * 10;
    }
    ctx.save();
    ctx.translate(ox, oy);
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#07060c');
    g.addColorStop(0.5, '#12101a');
    g.addColorStop(1, '#0a0810');
    ctx.fillStyle = g;
    ctx.fillRect(-20, -20, this.w + 40, this.h + 40);

    ctx.strokeStyle = 'rgba(94,224,208,0.06)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < this.w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.h);
      ctx.stroke();
    }
    for (let y = 0; y < this.h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.w, y);
      ctx.stroke();
    }

    for (const p of this.particles) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const b of this.bullets) {
      ctx.fillStyle = '#9ffff0';
      ctx.shadowColor = '#5ee0d0';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    for (const e of this.enemies) {
      ctx.fillStyle = e.tint || '#ff8a3d';
      ctx.shadowColor = e.tint || '#ff8a3d';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(e.x - e.r, e.y + e.r + 4, e.r * 2, 3);
      ctx.fillStyle = '#d4a05a';
      ctx.fillRect(e.x - e.r, e.y + e.r + 4, e.r * 2 * Math.max(0, e.hp / e.maxHp), 3);
    }

    if (this.player.alive) {
      const ang = Math.atan2(this.input.my - this.player.y, this.input.mx - this.player.x);
      ctx.save();
      ctx.translate(this.player.x, this.player.y);
      ctx.rotate(ang);
      ctx.fillStyle = '#5ee0d0';
      ctx.shadowColor = '#5ee0d0';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(16, 0);
      ctx.lineTo(-12, 10);
      ctx.lineTo(-8, 0);
      ctx.lineTo(-12, -10);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      ctx.shadowBlur = 0;
    }

    for (const s of this.splashes) {
      if (s.life <= 0) continue;
      ctx.globalAlpha = Math.max(0, s.life / s.max);
      ctx.fillStyle = s.crit ? '#ffd36a' : '#ffffff';
      ctx.font = `${s.crit ? 18 : 14}px Rajdhani, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(s.text, s.x, s.y);
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(6,5,8,0.55)';
    ctx.fillRect(12, 12, 168, 64);
    ctx.strokeStyle = 'rgba(94,224,208,0.35)';
    ctx.strokeRect(12.5, 12.5, 167, 63);
    ctx.fillStyle = '#f2ebe0';
    ctx.font = '700 16px Rajdhani, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`WAVE ${this.wave}`, 24, 36);
    ctx.fillStyle = '#d4a05a';
    ctx.fillText(`KILLS ${this.kills}`, 24, 58);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(12, this.h - 28, this.w - 24, 10);
    ctx.fillStyle = '#5ee0d0';
    ctx.fillRect(12, this.h - 28, (this.w - 24) * Math.max(0, this.player.hp / this.player.maxHp), 10);

    if (!this.player.alive) {
      ctx.fillStyle = 'rgba(6,5,8,0.72)';
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.fillStyle = '#f2ebe0';
      ctx.font = '700 28px Cinzel, serif';
      ctx.textAlign = 'center';
      ctx.fillText('DOWNED', this.w / 2, this.h * 0.45);
      ctx.font = '600 14px Rajdhani, sans-serif';
      ctx.fillStyle = '#9a9080';
      ctx.fillText('Switch tab or re-enter Combat to retry', this.w / 2, this.h * 0.45 + 28);
    }
    ctx.restore();
  }
}

let outpostTimer: ReturnType<typeof setInterval> | null = null;

export function startOutpostLoop() {
  if (outpostTimer) return;
  outpostTimer = setInterval(() => {
    const state = gameStore.getState();
    if (state.activeTab === 'combat') return;
    const elapsed = Date.now() - state.outpost.lastHarvest;
    if (elapsed > 3_600_000 && state.outpost.activeSeeds.length > 0) {
      /* passive accrual marker — harvest remains explicit */
    }
  }, 1000);
}

export function stopOutpostLoop() {
  if (!outpostTimer) return;
  clearInterval(outpostTimer);
  outpostTimer = null;
}
