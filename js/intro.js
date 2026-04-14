/**
 * 开场动画控制器
 * 流程：方块快速下落堆积 → 重组SQ → 定格 → 方块打散飞出
 */

class IntroAnimation {
  constructor(engine) {
    this.engine = engine;
    this.canvas = engine.canvas;
    this.ctx = engine.ctx;

    this.phase = 'idle';
    this.phaseProgress = 0;
    this.animTime = 0;

    this.sqSequence = [];
    this.currentIndex = 0;
    this.currentBlock = null;
    this.sqCells = [];
    this.scatteredBlocks = [];

    // 打散飞出的方块
    this.flyingBlocks = [];

    this.cols = 0;
    this.rows = 0;
    this.blockSize = 0;

    this.onComplete = null;

    // 俄罗斯方块7种基本形状
    this.shapes = {
      I: [[1, 1, 1, 1]],
      O: [[1, 1], [1, 1]],
      T: [[0, 1, 0], [1, 1, 1]],
      S: [[0, 1, 1], [1, 1, 0]],
      Z: [[1, 1, 0], [0, 1, 1]],
      J: [[1, 0, 0], [1, 1, 1]],
      L: [[0, 0, 1], [1, 1, 1]]
    };

    this.update = this.update.bind(this);
  }

  start() {
    this.phase = 'falling';
    this.phaseProgress = 0;
    this.animTime = 0;

    this.cols = this.engine.cols;
    this.rows = this.engine.rows;
    this.blockSize = this.engine.blockSize;

    this.engine.clearAll();
    this.engine.pause();

    // 生成SQ目标图案
    this.generateSQPattern();
    // 生成随机下落序列
    this.sqSequence = this.buildRandomFallSequence();
    this.currentIndex = 0;
    this.sqCells = [];
    this.scatteredBlocks = [];

    this.lastTime = performance.now();
    this.dropNext();
    this.update(this.lastTime);
  }

  generateSQPattern() {
    this.patternCells = [];
    const types = ['skill', 'work', 'contact', 'life'];

    // 紧凑版S字母 - 适合窄宽度
    const baseS = [
      [0,1,1,1,1],
      [1,1,1,1,1],
      [1,1,0,0,0],
      [0,1,1,1,1],
      [0,0,0,1,1],
      [1,1,1,1,1],
      [0,1,1,1,0]
    ];

    // 紧凑版Q字母 - 适合窄宽度
    const baseQ = [
      [0,1,1,1,0],
      [1,1,1,1,1],
      [1,1,0,0,1],
      [1,1,0,0,1],
      [1,1,1,1,1],
      [0,1,1,1,0],
      [0,0,1,1,0]
    ];

    // 计算缩放比例 - 最小缩放为1，根据可用空间调整
    const scale = Math.max(1, Math.floor(Math.min(this.cols, this.rows) / 12));
    const sPattern = this.scalePattern(baseS, scale);
    const qPattern = this.scalePattern(baseQ, scale);

    const gap = 2 * scale;
    const totalWidth = sPattern[0].length + qPattern[0].length + gap;
    const totalHeight = Math.max(sPattern.length, qPattern.length);

    const sOffsetCol = Math.floor((this.cols - totalWidth) / 2);
    const qOffsetCol = sOffsetCol + sPattern[0].length + gap;
    const offsetRow = Math.floor((this.rows - totalHeight) / 2);

    for (let row = 0; row < sPattern.length; row++) {
      for (let col = 0; col < sPattern[row].length; col++) {
        if (sPattern[row][col]) {
          this.patternCells.push({
            col: sOffsetCol + col,
            row: offsetRow + row,
            type: types[Math.floor(Math.random() * types.length)]
          });
        }
      }
    }

    for (let row = 0; row < qPattern.length; row++) {
      for (let col = 0; col < qPattern[row].length; col++) {
        if (qPattern[row][col]) {
          this.patternCells.push({
            col: qOffsetCol + col,
            row: offsetRow + row,
            type: types[Math.floor(Math.random() * types.length)]
          });
        }
      }
    }
  }

  scalePattern(pattern, scale) {
    if (scale <= 1) return pattern;
    const result = [];
    for (let row = 0; row < pattern.length; row++) {
      for (let sRow = 0; sRow < scale; sRow++) {
        const newRow = [];
        for (let col = 0; col < pattern[row].length; col++) {
          for (let sCol = 0; sCol < scale; sCol++) {
            newRow.push(pattern[row][col]);
          }
        }
        result.push(newRow);
      }
    }
    return result;
  }

  buildRandomFallSequence() {
    const sequence = [];
    const shapeKeys = Object.keys(this.shapes);
    const types = ['skill', 'work', 'contact', 'life'];

    const totalCells = this.patternCells.length;
    const blocksNeeded = Math.ceil(totalCells / 2);

    const totalDuration = 800;
    const avgBlockDuration = totalDuration / blocksNeeded;

    this.fallenGrid = [];
    for (let r = 0; r < this.rows; r++) {
      this.fallenGrid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        this.fallenGrid[r][c] = false;
      }
    }

    const centerX = Math.floor(this.cols / 2);
    const spreadX = Math.floor(this.cols * 0.12);

    for (let i = 0; i < blocksNeeded; i++) {
      const shapeKey = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
      const shape = this.shapes[shapeKey];

      let finalShape = shape;
      const rotations = Math.floor(Math.random() * 4);
      for (let r = 0; r < rotations; r++) {
        finalShape = this.rotateShape(finalShape);
      }

      const randomX = centerX - spreadX + Math.floor(Math.random() * spreadX * 2);
      let clampedX = Math.max(0, Math.min(this.cols - finalShape[0].length, randomX));

      const landingY = this.findLandingPosition(finalShape, clampedX);

      if (landingY >= 0) {
        this.markShapeInGrid(finalShape, clampedX, landingY);

        sequence.push({
          shape: finalShape,
          type: types[Math.floor(Math.random() * types.length)],
          targetX: clampedX,
          targetY: landingY,
          startTime: i * avgBlockDuration * 0.4,
          duration: Math.max(50, avgBlockDuration * 0.25)
        });
      }
    }

    return sequence;
  }

  rotateShape(shape) {
    const rows = shape.length;
    const cols = shape[0].length;
    const rotated = [];
    for (let c = 0; c < cols; c++) {
      rotated[c] = [];
      for (let r = rows - 1; r >= 0; r--) {
        rotated[c][rows - 1 - r] = shape[r][c];
      }
    }
    return rotated;
  }

  findLandingPosition(shape, x) {
    for (let y = 0; y <= this.rows - shape.length; y++) {
      if (this.checkShapeCollision(shape, x, y + 1)) {
        return y;
      }
    }
    return this.rows - shape.length;
  }

  checkShapeCollision(shape, x, y) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const gridX = x + col;
          const gridY = y + row;
          if (gridX < 0 || gridX >= this.cols || gridY >= this.rows) {
            return true;
          }
          if (gridY >= 0 && this.fallenGrid[gridY] && this.fallenGrid[gridY][gridX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  markShapeInGrid(shape, x, y) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const gridX = x + col;
          const gridY = y + row;
          if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols) {
            this.fallenGrid[gridY][gridX] = true;
          }
        }
      }
    }
  }

  dropNext() {
    if (this.currentIndex >= this.sqSequence.length) {
      this.startReassemble();
      return;
    }

    const item = this.sqSequence[this.currentIndex];
    const shape = item.shape;

    this.currentBlock = {
      shape: shape,
      type: item.type,
      color: this.engine.colors[item.type],
      x: item.targetX,
      y: -shape.length - 2,
      targetY: item.targetY,
      startTime: performance.now(),
      duration: item.duration
    };

    this.animateDrop();
  }

  animateDrop() {
    const block = this.currentBlock;
    const startY = block.y;
    const endY = block.targetY;
    const startTime = block.startTime;
    const duration = block.duration;

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const eased = progress * progress * (3 - 2 * progress);

      block.y = startY + (endY - startY) * eased;

      if (progress >= 1) {
        for (let row = 0; row < block.shape.length; row++) {
          for (let col = 0; col < block.shape[row].length; col++) {
            if (block.shape[row][col]) {
              this.scatteredBlocks.push({
                col: block.x + col,
                row: block.y + row,
                type: block.type,
                glow: 1
              });
            }
          }
        }

        this.currentIndex++;
        this.dropNext();
      } else {
        this.dropAnimationId = requestAnimationFrame(animate);
      }
    };

    this.dropAnimationId = requestAnimationFrame(animate);
  }

  startReassemble() {
    this.phase = 'reassemble';
    this.phaseProgress = 0;
    this.reassembleStartTime = performance.now();
    this.reassembleDuration = 1000;

    this.assignTargets();
  }

  assignTargets() {
    const availableTargets = [...this.patternCells];

    while (this.scatteredBlocks.length < this.patternCells.length) {
      const targetIdx = this.scatteredBlocks.length;
      const target = this.patternCells[targetIdx];
      this.scatteredBlocks.push({
        col: target.col + (Math.random() - 0.5) * 8,
        row: target.row + (Math.random() - 0.5) * 8,
        type: target.type,
        glow: 0.5
      });
    }

    const usedBlocks = new Set();
    const remainingTargets = [...this.patternCells];

    this.patternCells.forEach(target => {
      let nearestIdx = -1;
      let minDist = Infinity;

      this.scatteredBlocks.forEach((block, idx) => {
        if (!usedBlocks.has(idx)) {
          const dist = Math.abs(block.col - target.col) + Math.abs(block.row - target.row);
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = idx;
          }
        }
      });

      if (nearestIdx >= 0) {
        usedBlocks.add(nearestIdx);
        const block = this.scatteredBlocks[nearestIdx];
        block.targetCol = target.col;
        block.targetRow = target.row;
        block.startCol = block.col;
        block.startRow = block.row;
      }
    });

    this.scatteredBlocks = this.scatteredBlocks.filter(b => b.targetCol !== undefined);

    if (this.scatteredBlocks.length > this.patternCells.length) {
      this.scatteredBlocks = this.scatteredBlocks.slice(0, this.patternCells.length);
    }
  }

  updateReassemble(deltaTime) {
    const elapsed = performance.now() - this.reassembleStartTime;
    this.phaseProgress = Math.min(elapsed / this.reassembleDuration, 1);

    const eased = this.easeOutBack(this.phaseProgress);

    this.scatteredBlocks.forEach(block => {
      if (block.targetCol !== undefined && block.targetRow !== undefined) {
        block.col = block.startCol + (block.targetCol - block.startCol) * eased;
        block.row = block.startRow + (block.targetRow - block.startRow) * eased;
        block.glow = Math.sin(this.phaseProgress * Math.PI) * 0.5;
      }
    });

    if (this.phaseProgress >= 1) {
      this.phase = 'hold';
      this.phaseProgress = 0;
      this.holdStartTime = performance.now();
      this.holdDuration = 800;

      this.sqCells = this.scatteredBlocks.map(b => ({
        col: Math.round(b.targetCol || b.col),
        row: Math.round(b.targetRow || b.row),
        type: b.type,
        glow: 0.3
      }));

      this.calculateSQCenter();
    }
  }

  calculateSQCenter() {
    if (this.sqCells.length === 0) return;

    let minCol = Infinity, maxCol = -Infinity;
    let minRow = Infinity, maxRow = -Infinity;

    this.sqCells.forEach(cell => {
      minCol = Math.min(minCol, cell.col);
      maxCol = Math.max(maxCol, cell.col);
      minRow = Math.min(minRow, cell.row);
      maxRow = Math.max(maxRow, cell.row);
    });

    this.sqCenterCol = (minCol + maxCol) / 2;
    this.sqCenterRow = (minRow + maxRow) / 2;
  }

  updateHold(deltaTime) {
    const elapsed = performance.now() - this.holdStartTime;
    this.phaseProgress = Math.min(elapsed / this.holdDuration, 1);

    this.sqCells.forEach(cell => {
      cell.glow = 0.2 + Math.sin(elapsed * 0.01) * 0.1;
    });

    if (this.phaseProgress >= 1) {
      this.startExplode();
    }
  }

  startExplode() {
    this.phase = 'explode';
    this.phaseProgress = 0;
    this.explodeStartTime = performance.now();
    this.explodeDuration = 800;

    // 将SQ字母中的每个方块转为飞出动画
    this.flyingBlocks = this.sqCells.map(cell => {
      const x = cell.col * this.blockSize;
      const y = cell.row * this.blockSize;

      // 随机飞出方向（向外辐射）
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;

      return {
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.3,
        type: cell.type,
        alpha: 1,
        size: this.blockSize - 2,
        gravity: 0.15,
        friction: 0.98
      };
    });
  }

  updateExplode(deltaTime) {
    const elapsed = performance.now() - this.explodeStartTime;
    this.phaseProgress = Math.min(elapsed / this.explodeDuration, 1);

    // 更新每个飞出的方块
    this.flyingBlocks.forEach(block => {
      // 应用物理
      block.vx *= block.friction;
      block.vy *= block.friction;
      block.vy += block.gravity;

      block.x += block.vx;
      block.y += block.vy;

      // 旋转
      block.rotation += block.rotationSpeed;

      // 逐渐消失
      block.alpha = 1 - this.phaseProgress;
    });

    if (this.phaseProgress >= 1) {
      this.phase = 'complete';
      if (this.onComplete) {
        this.onComplete();
      }
    }
  }

  update(time) {
    const deltaTime = time - this.lastTime;
    this.lastTime = time;
    this.animTime += deltaTime;

    const ctx = this.ctx;
    ctx.fillStyle = '#0A0A0F';
    ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

    switch (this.phase) {
      case 'falling':
        this.drawFalling();
        break;
      case 'reassemble':
        this.updateReassemble(deltaTime);
        this.drawReassemble();
        break;
      case 'hold':
        this.updateHold(deltaTime);
        this.drawHold();
        break;
      case 'explode':
        this.updateExplode(deltaTime);
        this.drawExplode();
        break;
    }

    if (this.phase !== 'complete') {
      requestAnimationFrame(this.update);
    }
  }

  drawFalling() {
    const ctx = this.ctx;

    this.scatteredBlocks.forEach(cell => {
      const x = cell.col * this.blockSize;
      const y = cell.row * this.blockSize;
      const color = this.engine.colors[cell.type];
      this.drawBlock(x, y, color, cell.glow || 0);
    });

    if (this.currentBlock) {
      this.drawTetromino(this.currentBlock);
    }
  }

  drawReassemble() {
    const ctx = this.ctx;

    this.scatteredBlocks.forEach(cell => {
      const x = cell.col * this.blockSize;
      const y = cell.row * this.blockSize;
      const color = this.engine.colors[cell.type];
      this.drawBlock(x, y, color, cell.glow || 0);
    });
  }

  drawHold() {
    const ctx = this.ctx;

    this.sqCells.forEach(cell => {
      const x = cell.col * this.blockSize;
      const y = cell.row * this.blockSize;
      const color = this.engine.colors[cell.type];
      this.drawBlock(x, y, color, cell.glow || 0);
    });
  }

  drawExplode() {
    const ctx = this.ctx;

    // 绘制飞出的方块
    this.flyingBlocks.forEach(block => {
      if (block.alpha <= 0) return;

      const color = this.engine.colors[block.type];
      if (!color) return;

      ctx.save();
      ctx.globalAlpha = block.alpha;
      ctx.translate(block.x + block.size / 2, block.y + block.size / 2);
      ctx.rotate(block.rotation);

      const gradient = ctx.createLinearGradient(-block.size / 2, -block.size / 2, block.size / 2, block.size / 2);
      gradient.addColorStop(0, color.secondary);
      gradient.addColorStop(1, color.primary);

      ctx.fillStyle = gradient;
      this.drawRoundedRect(-block.size / 2, -block.size / 2, block.size, block.size, 4);
      ctx.fill();

      ctx.restore();
    });
  }

  drawTetromino(tetromino) {
    const shape = tetromino.shape;
    const color = tetromino.color;

    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const x = (tetromino.x + col) * this.blockSize;
          const y = (tetromino.y + row) * this.blockSize;
          this.drawBlock(x, y, color, 0);
        }
      }
    }
  }

  drawBlock(x, y, color, glow = 0, alpha = 1) {
    const ctx = this.ctx;
    const size = this.blockSize - 2;

    ctx.save();
    ctx.globalAlpha = alpha;

    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, color.secondary);
    gradient.addColorStop(1, color.primary);

    if (glow > 0) {
      ctx.shadowColor = color.glow;
      ctx.shadowBlur = 20 * glow;
    }

    ctx.fillStyle = gradient;
    this.drawRoundedRect(x + 1, y + 1, size, size, 4);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  drawRoundedRect(x, y, width, height, radius) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  stop() {
    if (this.dropAnimationId) {
      cancelAnimationFrame(this.dropAnimationId);
    }
    this.phase = 'idle';
  }
}

window.IntroAnimation = IntroAnimation;
