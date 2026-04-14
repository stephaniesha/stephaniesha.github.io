/**
 * 粒子系统
 * 用于开场动画的爆炸消散效果
 */

class Particle {
  constructor(x, y, color, options = {}) {
    this.x = x;
    this.y = y;
    this.color = color;

    // 速度和方向
    const angle = options.angle !== undefined ? options.angle : Math.random() * Math.PI * 2;
    const speed = options.speed !== undefined ? options.speed : 2 + Math.random() * 4;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    // 加速度（重力效果）
    this.gravity = options.gravity !== undefined ? options.gravity : 0.1;
    this.friction = options.friction !== undefined ? options.friction : 0.98;

    // 尺寸
    this.size = options.size !== undefined ? options.size : 3 + Math.random() * 5;
    this.originalSize = this.size;

    // 生命周期
    this.life = 1;
    this.decay = options.decay !== undefined ? options.decay : 0.015 + Math.random() * 0.01;

    // 旋转
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;

    // 拖尾
    this.trail = [];
    this.maxTrailLength = options.trailLength !== undefined ? options.trailLength : 5;

    // 类型
    this.type = options.type || 'square'; // square, circle, diamond
  }

  update() {
    // 保存拖尾位置
    if (this.maxTrailLength > 0) {
      this.trail.push({ x: this.x, y: this.y, size: this.size, life: this.life });
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }

    // 更新位置
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;

    this.x += this.vx;
    this.y += this.vy;

    // 更新生命周期
    this.life -= this.decay;

    // 更新尺寸
    this.size = this.originalSize * this.life;

    // 更新旋转
    this.rotation += this.rotationSpeed;

    return this.life > 0;
  }

  draw(ctx) {
    // 绘制拖尾
    this.trail.forEach((point, index) => {
      const alpha = (index / this.trail.length) * this.life * 0.5;
      const size = point.size * (index / this.trail.length);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = this.color;
      ctx.translate(point.x, point.y);

      ctx.beginPath();
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // 绘制主粒子
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const halfSize = this.size / 2;

    if (this.type === 'square') {
      ctx.fillRect(-halfSize, -halfSize, this.size, this.size);
    } else if (this.type === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'diamond') {
      ctx.beginPath();
      ctx.moveTo(0, -halfSize);
      ctx.lineTo(halfSize, 0);
      ctx.lineTo(0, halfSize);
      ctx.lineTo(-halfSize, 0);
      ctx.closePath();
      ctx.fill();
    }

    // 发光效果
    if (this.life > 0.5) {
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fill();
    }

    ctx.restore();
  }
}

class ParticleSystem {
  constructor(ctx) {
    this.ctx = ctx;
    this.particles = [];
  }

  /**
   * 从方块创建爆炸粒子
   */
  explodeFromBlock(x, y, blockSize, color, count = 15) {
    const centerX = x + blockSize / 2;
    const centerY = y + blockSize / 2;

    // 主要粒子 - 向外辐射
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 3 + Math.random() * 5;

      this.particles.push(new Particle(centerX, centerY, color, {
        angle: angle,
        speed: speed,
        size: 4 + Math.random() * 6,
        gravity: 0.15,
        decay: 0.012 + Math.random() * 0.008,
        trailLength: 4,
        type: 'square'
      }));
    }

    // 小粒子碎片
    for (let i = 0; i < count / 2; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3;

      this.particles.push(new Particle(centerX, centerY, color, {
        angle: angle,
        speed: speed,
        size: 2 + Math.random() * 3,
        gravity: 0.08,
        decay: 0.02 + Math.random() * 0.01,
        trailLength: 2,
        type: 'circle'
      }));
    }
  }

  /**
   * 从多个方块创建爆炸粒子
   */
  explodeFromBlocks(blocks, blockSize, colorFn) {
    blocks.forEach(block => {
      const x = block.col * blockSize;
      const y = block.row * blockSize;
      const color = typeof colorFn === 'function' ? colorFn(block.type) : colorFn;
      this.explodeFromBlock(x, y, blockSize, color, 12);
    });
  }

  /**
   * 创建消散效果 - 从中心向外扩散
   */
  dissipateFromCenter(centerX, centerY, blocks, blockSize, colorFn) {
    blocks.forEach((block, index) => {
      const x = block.col * blockSize + blockSize / 2;
      const y = block.row * blockSize + blockSize / 2;

      // 计算从中心到方块的方向
      const dx = x - centerX;
      const dy = y - centerY;
      const angle = Math.atan2(dy, dx);
      const distance = Math.sqrt(dx * dx + dy * dy);

      // 根据距离延迟生成粒子
      const delay = distance * 0.5;

      setTimeout(() => {
        const color = typeof colorFn === 'function' ? colorFn(block.type) : colorFn;

        // 方块本身变成粒子向外飞
        for (let i = 0; i < 8; i++) {
          const particleAngle = angle + (Math.random() - 0.5) * 1.5;
          const speed = 4 + Math.random() * 6;

          this.particles.push(new Particle(x, y, color, {
            angle: particleAngle,
            speed: speed,
            size: 5 + Math.random() * 5,
            gravity: 0.12,
            decay: 0.01 + Math.random() * 0.01,
            trailLength: 6,
            type: 'square'
          }));
        }
      }, delay);
    });
  }

  /**
   * 更新所有粒子
   */
  update() {
    this.particles = this.particles.filter(p => p.update());
  }

  /**
   * 绘制所有粒子
   */
  draw() {
    this.particles.forEach(p => p.draw(this.ctx));
  }

  /**
   * 检查是否还有活跃粒子
   */
  hasActiveParticles() {
    return this.particles.length > 0;
  }

  /**
   * 清除所有粒子
   */
  clear() {
    this.particles = [];
  }

  /**
   * 获取粒子数量
   */
  get count() {
    return this.particles.length;
  }
}

// 导出
window.Particle = Particle;
window.ParticleSystem = ParticleSystem;
