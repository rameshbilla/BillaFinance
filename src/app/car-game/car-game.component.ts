import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener, NgZone } from '@angular/core';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-car-game',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="game-wrapper" #gameContainer [class.shake]="isShaking">
      
      <!-- Game Canvas -->
      <canvas #gameCanvas></canvas>
      
      <!-- UI Layer that perfectly aligns with Canvas boundaries -->
      <div class="game-ui-layer pointer-events-none" [style.width.px]="width" [style.height.px]="height">
        
        <!-- Start Menu -->
        <div *ngIf="!isPlaying && !isGameOver" class="menu start-menu pointer-events-auto">
          <h1 class="neon-text">NEON RACER</h1>
          <p class="subtitle">Use Left/Right arrows or Touch sides to steer.</p>
          <button (click)="startGame()" class="cyber-btn">IGNITE ENGINE</button>
        </div>
        
        <!-- Game Over Menu -->
        <div *ngIf="isGameOver" class="menu game-over-menu pointer-events-auto">
          <h1 class="neon-text error">SYSTEM CRASH</h1>
          <div class="stats-box">
            <p>FINAL SCORE: <span>{{ score }}</span></p>
            <p>LEVEL REACHED: <span>{{ level }}</span></p>
          </div>
          <button (click)="startGame()" class="cyber-btn">REBOOT</button>
        </div>

        <!-- HUD -->
        <div class="hud" *ngIf="isPlaying || isGameOver">
          <div class="hud-item score-box">SCORE <span class="value">{{ score }}</span></div>
          <div class="hud-item level-box">LEVEL <span class="value">{{ level }}</span></div>
        </div>

        <!-- Powerups HUD -->
        <div class="hud-powerups" *ngIf="isPlaying && (hasShield || ghostTimer > 0)">
           <div *ngIf="hasShield" class="hud-item shield-box">SHIELD ACTIVE</div>
           <div *ngIf="ghostTimer > 0" class="hud-item ghost-box">GHOST MODE: {{ Math.ceil(ghostTimer / 60) }}s</div>
        </div>

        <!-- Level Up Toast -->
        <div class="level-up-toast" [class.show]="showLevelUp">LEVEL UP!</div>

        <!-- Back Button -->
        <button class="back-btn pointer-events-auto" (click)="goBack()">
           <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
           <span>EXIT</span>
        </button>
      </div>

      <!-- Touch Controls -->
      <div class="touch-controls">
        <div class="left-zone" (touchstart)="touchMove(-1)" (touchend)="touchMove(0)" (mousedown)="touchMove(-1)" (mouseup)="touchMove(0)"></div>
        <div class="right-zone" (touchstart)="touchMove(1)" (touchend)="touchMove(0)" (mousedown)="touchMove(1)" (mouseup)="touchMove(0)"></div>
      </div>

      <!-- Scanline overlay for retro effect -->
      <div class="scanlines pointer-events-none"></div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

    .game-wrapper {
      position: relative;
      width: 100%;
      height: 100vh;
      height: 100dvh;
      overflow: hidden;
      background: radial-gradient(circle at 50% 30%, #2b0b42 0%, #090214 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Orbitron', sans-serif;
    }
    
    .scanlines {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0) 50%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.2));
      background-size: 100% 4px;
      z-index: 40;
      opacity: 0.3;
    }

    canvas {
      display: block;
      background: transparent;
      max-width: 100%;
      max-height: 100%;
      box-shadow: 0 0 50px rgba(224, 34, 255, 0.2);
      border-left: 2px solid rgba(0, 255, 255, 0.3);
      border-right: 2px solid rgba(0, 255, 255, 0.3);
      position: relative;
      z-index: 10;
    }

    .game-ui-layer {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 100;
    }

    .pointer-events-none { pointer-events: none; }
    .pointer-events-auto { pointer-events: auto; }

    .hud {
      position: absolute;
      top: 15px;
      left: 15px;
      z-index: 30;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .hud-item {
      color: rgba(255, 255, 255, 0.7);
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 1px;
      background: rgba(10, 2, 20, 0.85);
      padding: 8px 12px;
      border-radius: 4px;
      border-left: 3px solid #0ff;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.2);
      backdrop-filter: blur(4px);
    }

    .hud-item .value {
      color: #fff;
      font-size: 14px;
      margin-left: 6px;
      text-shadow: 0 0 8px #0ff;
    }
    
    .level-box {
      border-left-color: #f0f;
    }
    .level-box .value {
      text-shadow: 0 0 8px #f0f;
    }

    .hud-powerups {
      position: absolute;
      top: 50px;
      right: 15px;
      z-index: 30;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: flex-end;
    }

    .shield-box { border-left-color: #0ff; color: #0ff; text-shadow: 0 0 5px #0ff; }
    .ghost-box { border-left-color: #f0f; color: #f0f; text-shadow: 0 0 5px #f0f; }

    .level-up-toast {
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.5);
      color: #fff;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 4px;
      text-shadow: 0 0 10px #f0f, 0 0 20px #f0f, 0 0 40px #f0f;
      opacity: 0;
      z-index: 100;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }
    .level-up-toast.show {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }

    .menu {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(10, 2, 24, 0.85);
      padding: 50px 40px;
      border-radius: 8px;
      text-align: center;
      z-index: 100;
      border: 1px solid rgba(0, 255, 255, 0.3);
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.1), inset 0 0 20px rgba(255, 0, 255, 0.1);
      backdrop-filter: blur(10px);
      min-width: 340px;
      border-top: 4px solid #f0f;
      width: 90%;
      max-width: 340px;
    }

    .neon-text {
      margin-top: 0;
      font-size: 32px;
      color: #fff;
      font-weight: 900;
      letter-spacing: 4px;
      text-transform: uppercase;
      text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 20px #0ff, 0 0 40px #0ff;
      margin-bottom: 10px;
    }
    
    .neon-text.error {
      text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 20px #f00, 0 0 40px #f00;
    }

    .subtitle {
      font-size: 12px;
      letter-spacing: 1px;
      margin-bottom: 35px;
      color: rgba(255,255,255,0.6);
    }

    .stats-box {
      background: rgba(0,0,0,0.5);
      padding: 20px;
      border-radius: 4px;
      margin-bottom: 30px;
      border: 1px solid rgba(255,255,255,0.1);
    }

    .stats-box p {
      margin: 10px 0;
      font-size: 12px;
      color: #aaa;
      letter-spacing: 2px;
      display: flex;
      justify-content: space-between;
    }
    
    .stats-box span {
      color: #fff;
      font-size: 16px;
      font-weight: bold;
      text-shadow: 0 0 5px #f0f;
    }

    .cyber-btn {
      padding: 15px 40px;
      font-size: 14px;
      font-family: 'Orbitron', sans-serif;
      font-weight: 900;
      letter-spacing: 3px;
      cursor: pointer;
      background: transparent;
      color: #0ff;
      border: 2px solid #0ff;
      border-radius: 0;
      transition: all 0.3s ease;
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.2), inset 0 0 10px rgba(0, 255, 255, 0.2);
      text-transform: uppercase;
      position: relative;
      overflow: hidden;
    }
    
    .cyber-btn:hover {
      background: #0ff;
      color: #000;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.6), inset 0 0 20px rgba(0, 255, 255, 0.6);
      transform: scale(1.05);
    }
    
    .cyber-btn:active {
      transform: scale(0.95);
    }

    .touch-controls {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 70%;
      display: flex;
      z-index: 60;
    }

    .left-zone, .right-zone {
      flex: 1;
      opacity: 0;
      -webkit-tap-highlight-color: transparent;
    }

    .back-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      z-index: 60;
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(10, 2, 20, 0.7);
      color: rgba(255,255,255,0.7);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 6px 12px;
      border-radius: 4px;
      font-family: 'Orbitron', sans-serif;
      font-size: 10px;
      font-weight: bold;
      letter-spacing: 1px;
      cursor: pointer;
      backdrop-filter: blur(8px);
      transition: all 0.2s;
      text-transform: uppercase;
    }

    .back-btn:hover {
      background: rgba(255, 0, 255, 0.2);
      color: #fff;
      border-color: #f0f;
      box-shadow: 0 0 10px rgba(255, 0, 255, 0.3);
    }

    .back-btn svg {
      width: 16px;
      height: 16px;
    }

    /* Shaking animation */
    @keyframes shake {
      0% { transform: translate(2px, 1px) rotate(0deg); }
      10% { transform: translate(-1px, -2px) rotate(-1deg); }
      20% { transform: translate(-3px, 0px) rotate(1deg); }
      30% { transform: translate(0px, 2px) rotate(0deg); }
      40% { transform: translate(1px, -1px) rotate(1deg); }
      50% { transform: translate(-1px, 2px) rotate(-1deg); }
      60% { transform: translate(-3px, 1px) rotate(0deg); }
      70% { transform: translate(2px, 1px) rotate(-1deg); }
      80% { transform: translate(-1px, -1px) rotate(1deg); }
      90% { transform: translate(2px, 2px) rotate(0deg); }
      100% { transform: translate(1px, -2px) rotate(-1deg); }
    }
    .shake {
      animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
    }
  `]
})
export class CarGameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameCanvas', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('gameContainer', { static: false }) containerRef!: ElementRef<HTMLDivElement>;

  ctx!: CanvasRenderingContext2D;
  
  // Game state
  isPlaying = false;
  isGameOver = false;
  isShaking = false;
  score = 0;
  level = 1;
  showLevelUp = false;
  animationId = 0;
  Math = Math; // for template
  
  // Powerup States
  hasShield = false;
  ghostTimer = 0;
  powerups: any[] = [];
  
  // Canvas dimensions
  width = 400;
  height = 700;
  
  // Visual effects
  gridOffset = 0;
  particles: any[] = [];
  stars: any[] = [];
  
  // Player
  player = {
    x: 200,
    y: 550,
    targetX: 200,
    width: 38,
    height: 75,
    speed: 7,
    glow: '#0ff',
    tilt: 0
  };
  
  // Obstacles
  obstacles: any[] = [];
  obstacleSpeed = 5;
  obstacleSpawnTimer = 0;
  obstacleSpawnRate = 80; // frames
  
  // Controls
  keys: any = {
    ArrowLeft: false,
    ArrowRight: false,
    a: false,
    d: false
  };

  touchDirection = 0; // -1 for left, 1 for right, 0 for none

  // Cyberpunk color palette
  enemyColors = ['#f0f', '#ff0055', '#ffaa00', '#00ffaa'];

  constructor(private ngZone: NgZone, private location: Location) {}

  goBack() {
    this.location.back();
  }

  ngAfterViewInit() {
    this.initCanvas();
    window.addEventListener('resize', this.resizeCanvas.bind(this));
    this.initStars();
  }

  ngOnDestroy() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.resizeCanvas.bind(this));
  }

  initCanvas() {
    if (!this.canvasRef) return;
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d', { alpha: true })!;
    this.resizeCanvas();
    this.drawInitialState();
  }

  initStars() {
    this.stars = [];
    for(let i=0; i<50; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2,
        speed: Math.random() * 3 + 1
      });
    }
  }

  resizeCanvas() {
    if (!this.canvasRef || !this.containerRef) return;
    
    const canvas = this.canvasRef.nativeElement;
    const container = this.containerRef.nativeElement;
    
    // Always fill the available vertical height
    this.height = container.clientHeight || window.innerHeight;
    // Fill width up to a maximum of 500px to maintain playability on ultra-wide screens
    this.width = Math.min(container.clientWidth || window.innerWidth, 500);
    
    canvas.width = this.width;
    canvas.height = this.height;
    
    this.player.y = this.height - 120;
    this.player.x = this.width / 2 - this.player.width / 2;
    this.player.targetX = this.player.x;
    
    this.initStars();
    
    if (!this.isPlaying && !this.isGameOver) {
      this.drawInitialState();
    }
  }

  drawInitialState() {
    this.clearCanvas();
    this.drawBackground();
    this.drawPlayer();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (this.keys.hasOwnProperty(event.key)) {
      this.keys[event.key] = true;
    }
  }

  @HostListener('window:keyup', ['$event'])
  handleKeyUp(event: KeyboardEvent) {
    if (this.keys.hasOwnProperty(event.key)) {
      this.keys[event.key] = false;
    }
  }

  touchMove(dir: number) {
    this.touchDirection = dir;
  }

  startGame() {
    this.isPlaying = true;
    this.isGameOver = false;
    this.isShaking = false;
    this.score = 0;
    this.level = 1;
    this.obstacleSpeed = 5 + (this.height / 300); 
    this.obstacleSpawnRate = 80;
    this.obstacles = [];
    this.particles = [];
    this.powerups = [];
    this.hasShield = false;
    this.ghostTimer = 0;
    
    this.player.x = this.width / 2 - this.player.width / 2;
    this.player.targetX = this.player.x;
    
    this.ngZone.runOutsideAngular(() => {
      this.gameLoop();
    });
  }

  gameOver() {
    this.isPlaying = false;
    this.isGameOver = true;
    this.isShaking = true;
    
    // Create explosion
    this.createExplosion(this.player.x + this.player.width/2, this.player.y + this.player.height/2, '#0ff');
    
    setTimeout(() => {
      this.isShaking = false;
    }, 400);

    cancelAnimationFrame(this.animationId);
    
    // Draw one last frame with explosion
    this.draw();
    
    this.ngZone.run(() => {});
  }

  levelUp() {
    this.level++;
    this.showLevelUp = true;
    this.obstacleSpeed += 1;
    if (this.obstacleSpawnRate > 25) {
      this.obstacleSpawnRate -= 5;
    }
    
    // Add speed boost particles
    for(let i=0; i<20; i++) {
      this.particles.push({
        x: this.player.x + Math.random() * this.player.width,
        y: this.player.y + this.player.height,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.random() * 5 + 5,
        life: 1,
        color: '#fff',
        size: Math.random() * 3 + 2
      });
    }

    setTimeout(() => {
      this.showLevelUp = false;
    }, 2000);
  }

  gameLoop() {
    if (!this.isPlaying) return;
    
    this.update();
    this.draw();
    
    this.animationId = requestAnimationFrame(() => this.gameLoop());
  }

  update() {
    // 1. Smooth Player steering (Lerp)
    let moveDir = 0;
    if (this.keys.ArrowLeft || this.keys.a || this.touchDirection === -1) {
      moveDir = -1;
    } else if (this.keys.ArrowRight || this.keys.d || this.touchDirection === 1) {
      moveDir = 1;
    }

    this.player.targetX += moveDir * this.player.speed;
    
    // Boundaries for target
    if (this.player.targetX < 20) this.player.targetX = 20;
    if (this.player.targetX > this.width - this.player.width - 20) {
      this.player.targetX = this.width - this.player.width - 20;
    }

    // Lerp actual x to target x for smooth curving
    const diff = this.player.targetX - this.player.x;
    this.player.x += diff * 0.2;
    
    // Calculate motion tilt based on movement speed
    this.player.tilt = diff * 0.015;

    // 2. Background effects
    this.gridOffset = (this.gridOffset + (this.obstacleSpeed * 0.8)) % 60;
    
    // Stars update
    this.stars.forEach(star => {
      star.y += star.speed + (this.obstacleSpeed * 0.2);
      if(star.y > this.height) {
        star.y = 0;
        star.x = Math.random() * this.width;
      }
    });

    // 3. Engine exhaust particles
    if (Math.random() > 0.5) {
      this.particles.push({
        x: this.player.x + this.player.width/2 + (Math.random() * 10 - 5),
        y: this.player.y + this.player.height,
        vx: (Math.random() - 0.5),
        vy: Math.random() * 3 + 2,
        life: 1,
        color: '#0ff',
        size: Math.random() * 3 + 1
      });
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.02;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 4. Obstacles logic
    this.obstacleSpawnTimer++;
    if (this.obstacleSpawnTimer >= this.obstacleSpawnRate) {
      const w = 40;
      const h = 75;
      const x = 20 + Math.random() * (this.width - 40 - w);
      
      const color = this.enemyColors[Math.floor(Math.random() * this.enemyColors.length)];
      
      this.obstacles.push({
        x, y: -h, width: w, height: h, color, passed: false,
        vx: (Math.random() - 0.5) * 3 // Slight lateral drift for motion view
      });
      
      this.obstacleSpawnTimer = 0;
    }

    // 5. Powerups logic
    if (Math.random() < 0.003) { // Small chance each frame
      const typeRand = Math.random();
      let type = 'COIN';
      let color = '#ffd700'; // Gold
      if (typeRand < 0.3) {
        type = 'SHIELD';
        color = '#0ff'; // Cyan
      } else if (typeRand < 0.6) {
        type = 'GHOST';
        color = '#f0f'; // Purple
      }
      this.powerups.push({
        x: 20 + Math.random() * (this.width - 60),
        y: -40,
        width: 30,
        height: 30,
        type,
        color,
        rotation: 0
      });
    }

    // Update Ghost Timer
    if (this.ghostTimer > 0) {
      this.ghostTimer--;
    }

    // Powerup Update & Collision
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      p.y += this.obstacleSpeed * 0.8;
      p.rotation += 0.05;

      const hitBoxShrink = 0;
      if (
        this.player.x < p.x + p.width &&
        this.player.x + this.player.width > p.x &&
        this.player.y < p.y + p.height &&
        this.player.y + this.player.height > p.y
      ) {
        // Collect
        this.createExplosion(p.x + p.width/2, p.y + p.height/2, p.color, 15);
        if (p.type === 'COIN') {
          this.ngZone.run(() => {
            this.score += 50;
            if (this.score % 100 < 50 && this.score > 50) this.levelUp(); // level up edge case logic handles 100 intervals
          });
        } else if (p.type === 'SHIELD') {
          this.hasShield = true;
        } else if (p.type === 'GHOST') {
          this.ghostTimer = 300; // 5 secs at 60fps
        }
        this.powerups.splice(i, 1);
        continue;
      }

      if (p.y > this.height) {
        this.powerups.splice(i, 1);
      }
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.y += this.obstacleSpeed;

      // Enemy lateral movement
      obs.x += obs.vx;
      if (obs.x < 10 || obs.x + obs.width > this.width - 10) obs.vx *= -1;

      // Collision detection (with slight forgiveness hitbox)
      const hitBoxShrink = 8;
      if (
        this.player.x + hitBoxShrink < obs.x + obs.width - hitBoxShrink &&
        this.player.x + this.player.width - hitBoxShrink > obs.x + hitBoxShrink &&
        this.player.y + hitBoxShrink < obs.y + obs.height - hitBoxShrink &&
        this.player.y + this.player.height - hitBoxShrink > obs.y + hitBoxShrink
      ) {
        if (this.ghostTimer > 0) {
          // Pass right through, no collision
        } else if (this.hasShield) {
          this.hasShield = false;
          this.createExplosion(obs.x + obs.width/2, obs.y + obs.height/2, obs.color, 30);
          this.obstacles.splice(i, 1);
          // Small screen shake on impact
          this.isShaking = true;
          setTimeout(() => this.isShaking = false, 200);
          continue;
        } else {
          this.gameOver();
          return;
        }
      }

      // Score logic
      if (!obs.passed && obs.y > this.player.y + this.player.height) {
        obs.passed = true;
        this.ngZone.run(() => {
          this.score += 10;
          if (this.score % 100 === 0) {
            this.levelUp();
          }
        });
      }

      // Cleanup
      if (obs.y > this.height) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  createExplosion(x: number, y: number, color: string, particleCount: number = 40) {
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 2;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: Math.random() > 0.5 ? color : '#fff',
        size: Math.random() * 4 + 2
      });
    }
  }

  draw() {
    this.clearCanvas();
    this.drawBackground();
    this.drawPowerups();
    this.drawObstacles();
    if (!this.isGameOver || this.particles.length > 0) {
      // If game over, player disappears into explosion
      if (!this.isGameOver) this.drawPlayer();
      this.drawParticles();
    }
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  drawBackground() {
    // Synthwave Sun
    const sunY = this.height * 0.2;
    const sunGradient = this.ctx.createLinearGradient(0, sunY - 100, 0, sunY + 100);
    sunGradient.addColorStop(0, '#f0f');
    sunGradient.addColorStop(1, '#ffaa00');
    
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(this.width/2, sunY, 100, 0, Math.PI * 2);
    this.ctx.fillStyle = sunGradient;
    this.ctx.shadowColor = '#f0f';
    this.ctx.shadowBlur = 40;
    this.ctx.fill();

    // Sun stripes
    this.ctx.globalCompositeOperation = 'destination-out';
    for(let i=0; i<6; i++) {
      this.ctx.fillRect(this.width/2 - 110, sunY + i*20, 220, 4 + i*2);
    }
    this.ctx.restore();

    // Stars/Speedlines
    this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
    this.stars.forEach(star => {
      this.ctx.fillRect(star.x, star.y, star.size, star.size * 4);
    });

    // 3D Perspective Grid
    this.ctx.save();
    this.ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + (this.level * 0.05)})`;
    this.ctx.lineWidth = 1;
    this.ctx.shadowColor = '#f0f';
    this.ctx.shadowBlur = 5;

    const horizon = this.height * 0.4;
    
    // Horizontal lines
    for (let y = horizon; y < this.height + 100; y += 60) {
      let actualY = y + this.gridOffset;
      if (actualY > this.height) actualY -= (this.height - horizon + 100);
      
      // Perspective scaling
      const scale = (actualY - horizon) / (this.height - horizon);
      if (scale < 0) continue;
      
      this.ctx.globalAlpha = scale;
      this.ctx.beginPath();
      this.ctx.moveTo(0, actualY);
      this.ctx.lineTo(this.width, actualY);
      this.ctx.stroke();
    }

    // Vertical lines
    this.ctx.globalAlpha = 0.5;
    const vanishX = this.width / 2;
    for (let x = -this.width; x < this.width * 2; x += 60) {
      this.ctx.beginPath();
      this.ctx.moveTo(vanishX, horizon);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    
    this.ctx.restore();
  }

  drawPowerups() {
    this.powerups.forEach(p => {
      this.ctx.save();
      this.ctx.translate(p.x + p.width/2, p.y + p.height/2);
      this.ctx.rotate(p.rotation);
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      
      if (p.type === 'COIN') {
        this.ctx.rect(-8, -8, 16, 16);
      } else if (p.type === 'SHIELD') {
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(12, 0);
        this.ctx.lineTo(0, 12);
        this.ctx.lineTo(-12, 0);
      } else if (p.type === 'GHOST') {
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(12, 10);
        this.ctx.lineTo(-12, 10);
      }
      
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.restore();
    });
  }

  drawPlayer() {
    this.ctx.save();
    if (this.ghostTimer > 0) {
      // Make player translucent and flashing
      this.ctx.globalAlpha = (Math.floor(this.ghostTimer / 5) % 2 === 0) ? 0.8 : 0.4;
      this.player.glow = '#f0f';
    } else {
      this.player.glow = '#0ff';
    }
    
    this.drawCar(this.player.x, this.player.y, this.player.width, this.player.height, this.player.glow, true, this.player.tilt);
    
    this.ctx.restore();

    // Draw Shield Bubble
    if (this.hasShield) {
      this.ctx.save();
      this.ctx.beginPath();
      this.ctx.arc(this.player.x + this.player.width/2, this.player.y + this.player.height/2, this.player.height * 0.7, 0, Math.PI * 2);
      this.ctx.strokeStyle = '#0ff';
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = '#0ff';
      this.ctx.shadowBlur = 20;
      this.ctx.stroke();
      
      // Faint inner fill
      this.ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
      this.ctx.fill();
      this.ctx.restore();
    }
  }

  drawObstacles() {
    for (let i = 0; i < this.obstacles.length; i++) {
      const obs = this.obstacles[i];
      this.drawCar(obs.x, obs.y, obs.width, obs.height, obs.color, false, obs.vx * 0.05);
    }
  }

  drawCar(x: number, y: number, w: number, h: number, glowColor: string, isPlayer: boolean, tilt: number = 0) {
    this.ctx.save();
    
    // Anchor rotation to the center of the car
    this.ctx.translate(x + w/2, y + h/2);
    this.ctx.rotate(tilt);
    
    // 1. Drop shadow for 3D depth
    this.ctx.shadowColor = 'rgba(0,0,0,0.8)';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowOffsetX = 10;
    this.ctx.shadowOffsetY = 10;
    
    // 2. Tires (4x)
    this.ctx.fillStyle = '#0a0a0a';
    const tW = w * 0.25;
    const tH = h * 0.22;
    this.ctx.fillRect(-w/2 - 2, -h/2 + 5, tW, tH); // Front Left
    this.ctx.fillRect(w/2 - tW + 2, -h/2 + 5, tW, tH); // Front Right
    this.ctx.fillRect(-w/2 - 2, h/2 - tH - 5, tW, tH); // Rear Left
    this.ctx.fillRect(w/2 - tW + 2, h/2 - tH - 5, tW, tH); // Rear Right
    
    // Clear shadow so it doesn't apply to the car body itself
    this.ctx.shadowColor = 'transparent';
    
    // 3. Metallic Body base
    const grad = this.ctx.createLinearGradient(-w/2, 0, w/2, 0);
    grad.addColorStop(0, '#111');
    grad.addColorStop(0.15, glowColor);
    grad.addColorStop(0.5, '#ffffff'); // Center metallic shine
    grad.addColorStop(0.85, glowColor);
    grad.addColorStop(1, '#111');
    
    this.ctx.fillStyle = grad;
    
    // Car Body Aerodynamic Shape
    this.ctx.beginPath();
    this.ctx.moveTo(-w/2 + 4, -h/2); // Front left
    this.ctx.quadraticCurveTo(0, -h/2 - 15, w/2 - 4, -h/2); // Front rounded hood
    this.ctx.lineTo(w/2, h/2 - 5);
    this.ctx.lineTo(-w/2, h/2 - 5);
    this.ctx.fill();

    // 4. Roof (Adds 3D height perspective)
    const roofGrad = this.ctx.createLinearGradient(-w/2, 0, w/2, 0);
    roofGrad.addColorStop(0, '#0a0a0a');
    roofGrad.addColorStop(0.5, glowColor);
    roofGrad.addColorStop(1, '#0a0a0a');
    
    this.ctx.fillStyle = roofGrad;
    this.ctx.beginPath();
    this.ctx.moveTo(-w/2 + 8, -h/2 + 15);
    this.ctx.lineTo(w/2 - 8, -h/2 + 15);
    this.ctx.lineTo(w/2 - 5, h/2 - 18);
    this.ctx.lineTo(-w/2 + 5, h/2 - 18);
    this.ctx.fill();
    
    // 5. Windshield (glass reflection)
    this.ctx.fillStyle = 'rgba(10, 15, 30, 0.95)';
    this.ctx.beginPath();
    this.ctx.moveTo(-w/2 + 10, -h/2 + 18);
    this.ctx.quadraticCurveTo(0, -h/2 + 12, w/2 - 10, -h/2 + 18); // Curved windshield
    this.ctx.lineTo(w/2 - 7, -h/2 + 30);
    this.ctx.lineTo(-w/2 + 7, -h/2 + 30);
    this.ctx.fill();

    // Glass shine overlay
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.beginPath();
    this.ctx.moveTo(-w/2 + 12, -h/2 + 19);
    this.ctx.lineTo(0, -h/2 + 15);
    this.ctx.lineTo(0, -h/2 + 28);
    this.ctx.lineTo(-w/2 + 8, -h/2 + 28);
    this.ctx.fill();

    // 6. Rear window
    this.ctx.fillStyle = 'rgba(10, 15, 30, 0.9)';
    this.ctx.beginPath();
    this.ctx.moveTo(-w/2 + 8, h/2 - 25);
    this.ctx.lineTo(w/2 - 8, h/2 - 25);
    this.ctx.lineTo(w/2 - 6, h/2 - 18);
    this.ctx.lineTo(-w/2 + 6, h/2 - 18);
    this.ctx.fill();
    
    // 7. Spoiler
    this.ctx.fillStyle = '#111';
    this.ctx.fillRect(-w/2 - 2, h/2 - 12, w + 4, 6);
    // Spoiler struts
    this.ctx.fillRect(-w/2 + 10, h/2 - 18, 4, 6);
    this.ctx.fillRect(w/2 - 14, h/2 - 18, 4, 6);

    // 8. Neon Glow / Lights
    this.ctx.shadowColor = glowColor;
    this.ctx.shadowBlur = 20;
    this.ctx.fillStyle = glowColor;
    
    if (isPlayer) {
      // Powerful Headlights
      this.ctx.fillStyle = '#fff';
      this.ctx.shadowColor = '#fff';
      this.ctx.fillRect(-w/2 + 6, -h/2 + 2, 8, 5);
      this.ctx.fillRect(w/2 - 14, -h/2 + 2, 8, 5);
      
      // Cyber neon racing stripes
      this.ctx.fillStyle = '#0ff';
      this.ctx.shadowColor = '#0ff';
      this.ctx.fillRect(-2, -h/2 + 15, 4, h - 35);
    } else {
      // Enemy Taillights
      this.ctx.fillStyle = '#f00';
      this.ctx.shadowColor = '#f00';
      this.ctx.fillRect(-w/2 + 4, h/2 - 6, 12, 4);
      this.ctx.fillRect(w/2 - 16, h/2 - 6, 12, 4);
    }
    
    this.ctx.restore();
  }

  drawParticles() {
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });
  }
}
