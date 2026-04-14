/**
 * 俄罗斯方块游戏引擎
 * 沙沁个人网站 - 主题交互核心
 */

class TetrisEngine {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // 配置 - 支持固定尺寸
    this.blockSize = options.blockSize || 30;
    this.cols = options.cols || 0;
    this.rows = options.rows || 0;
    this.grid = [];
    this.fixedSize = !!(options.cols && options.rows); // 是否使用固定尺寸

    // 状态
    this.isRunning = false;
    this.isPaused = false;
    this.currentBlock = null;
    this.nextBlock = null;
    this.fallenBlocks = []; // 已落下的方块（用于展示）

    // 动画
    this.animationId = null;
    this.lastTime = 0;
    this.dropInterval = 2000; // 方块下落间隔(ms)
    this.lastDrop = 0;

    // 颜色映射
    this.colors = {
      skill: { primary: '#7322F2', secondary: '#9780FF', glow: 'rgba(151, 128, 255, 0.5)' },
      work: { primary: '#06B6D4', secondary: '#22D3EE', glow: 'rgba(34, 211, 238, 0.5)' },
      exp: { primary: '#EA580C', secondary: '#F97316', glow: 'rgba(249, 115, 22, 0.5)' },
      life: { primary: '#DB2777', secondary: '#EC4899', glow: 'rgba(236, 72, 153, 0.5)' },
      contact: { primary: '#059669', secondary: '#10B981', glow: 'rgba(16, 185, 129, 0.5)' },
      decor: { primary: 'rgba(255,255,255,0.1)', secondary: 'rgba(255,255,255,0.2)', glow: 'rgba(255, 255, 255, 0.2)' }
    };

    // 方块形状定义（俄罗斯方块7种基本形状）
    this.shapes = {
      I: [[1, 1, 1, 1]],
      O: [[1, 1], [1, 1]],
      T: [[0, 1, 0], [1, 1, 1]],
      S: [[0, 1, 1], [1, 1, 0]],
      Z: [[1, 1, 0], [0, 1, 1]],
      J: [[1, 0, 0], [1, 1, 1]],
      L: [[0, 0, 1], [1, 1, 1]]
    };

    // 绑定方法
    this.update = this.update.bind(this);
    this.resize = this.resize.bind(this);

    // 初始化
    if (this.fixedSize) {
      // 固定尺寸模式
      this.initGrid();
    } else {
      // 自适应模式
      this.resize();
      window.addEventListener('resize', this.resize);
    }
  }

  /**
   * 调整画布尺寸
   */
  resize() {
    if (this.fixedSize) return; // 固定尺寸不调整

    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();

    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);

    // 计算网格
    this.cols = Math.ceil(rect.width / this.blockSize);
    this.rows = Math.ceil(rect.height / this.blockSize);

    // 初始化网格
    this.initGrid();
  }

  /**
   * 初始化网格
   */
  initGrid() {
    this.grid = [];
    for (let row = 0; row < this.rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.cols; col++) {
        this.grid[row][col] = null;
      }
    }
  }

  /**
   * 开始游戏
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastDrop = this.lastTime;
    this.update(this.lastTime);
  }

  /**
   * 暂停游戏
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * 恢复游戏
   */
  resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    this.lastDrop = this.lastTime;
  }

  /**
   * 停止游戏
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * 游戏主循环
   */
  update(time) {
    if (!this.isRunning) return;

    const deltaTime = time - this.lastTime;
    this.lastTime = time;

    if (!this.isPaused) {
      // 更新当前方块位置
      if (this.currentBlock) {
        if (time - this.lastDrop > this.dropInterval) {
          this.dropBlock();
          this.lastDrop = time;
        }
      }
    }

    // 渲染
    this.render();

    // 继续循环
    this.animationId = requestAnimationFrame(this.update);
  }

  /**
   * 创建新方块
   */
  createBlock(type = null, x = null, y = null) {
    const shapeKeys = Object.keys(this.shapes);
    const randomShape = shapeKeys[Math.floor(Math.random() * shapeKeys.length)];
    const typeKeys = Object.keys(this.colors);
    const randomType = type || typeKeys[Math.floor(Math.random() * typeKeys.length)];

    const shape = this.shapes[randomShape];
    const color = this.colors[randomType];

    // 计算初始位置（居中）
    const startX = x !== null ? x : Math.floor(this.cols / 2) - Math.floor(shape[0].length / 2);
    const startY = y !== null ? y : -shape.length;

    return {
      shape: shape,
      type: randomType,
      color: color,
      x: startX,
      y: startY,
      rotation: 0,
      targetY: null, // 目标Y位置（用于动画）
      isAnimating: false,
      scale: 1,
      glow: 0
    };
  }

  /**
   * 设置当前方块
   */
  setCurrentBlock(type = null) {
    this.currentBlock = this.createBlock(type);
    this.currentBlock.y = -this.currentBlock.shape.length;
    this.currentBlock.isAnimating = true;
    return this.currentBlock;
  }

  /**
   * 下落方块
   */
  dropBlock() {
    if (!this.currentBlock) return;

    const nextY = this.currentBlock.y + 1;

    // 检查碰撞
    if (this.checkCollision(this.currentBlock.shape, this.currentBlock.x, nextY)) {
      // 落地
      this.landBlock();
    } else {
      this.currentBlock.y = nextY;
    }
  }

  /**
   * 快速下落
   */
  hardDrop() {
    if (!this.currentBlock) return;

    while (!this.checkCollision(this.currentBlock.shape, this.currentBlock.x, this.currentBlock.y + 1)) {
      this.currentBlock.y++;
    }
    this.landBlock();
  }

  /**
   * 移动方块
   */
  moveBlock(direction) {
    if (!this.currentBlock) return false;

    const newX = this.currentBlock.x + direction;

    if (!this.checkCollision(this.currentBlock.shape, newX, this.currentBlock.y)) {
      this.currentBlock.x = newX;
      return true;
    }
    return false;
  }

  /**
   * 旋转方块
   */
  rotateBlock() {
    if (!this.currentBlock) return false;

    const rotated = this.rotateMatrix(this.currentBlock.shape);

    // 尝试旋转，如果碰撞则尝试左右移动
    if (!this.checkCollision(rotated, this.currentBlock.x, this.currentBlock.y)) {
      this.currentBlock.shape = rotated;
      return true;
    }

    // 墙踢
    for (let offset of [-1, 1, -2, 2]) {
      if (!this.checkCollision(rotated, this.currentBlock.x + offset, this.currentBlock.y)) {
        this.currentBlock.shape = rotated;
        this.currentBlock.x += offset;
        return true;
      }
    }

    return false;
  }

  /**
   * 旋转矩阵
   */
  rotateMatrix(matrix) {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated = [];

    for (let col = 0; col < cols; col++) {
      rotated[col] = [];
      for (let row = rows - 1; row >= 0; row--) {
        rotated[col][rows - 1 - row] = matrix[row][col];
      }
    }

    return rotated;
  }

  /**
   * 碰撞检测
   */
  checkCollision(shape, x, y) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;

          // 边界检测
          if (newX < 0 || newX >= this.cols || newY >= this.rows) {
            return true;
          }

          // 已有方块检测
          if (newY >= 0 && this.grid[newY] && this.grid[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * 方块落地
   */
  landBlock() {
    if (!this.currentBlock) return;

    const block = this.currentBlock;

    // 将方块添加到网格
    for (let row = 0; row < block.shape.length; row++) {
      for (let col = 0; col < block.shape[row].length; col++) {
        if (block.shape[row][col]) {
          const gridY = block.y + row;
          const gridX = block.x + col;

          if (gridY >= 0 && gridY < this.rows && gridX >= 0 && gridX < this.cols) {
            this.grid[gridY][gridX] = {
              type: block.type,
              color: block.color
            };
          }
        }
      }
    }

    // 添加到已落下方块列表
    this.fallenBlocks.push({
      ...block,
      landTime: performance.now()
    });

    // 触发落地事件
    this.onBlockLanded && this.onBlockLanded(block);

    // 检查消行（可选，这里不自动消除）
    // this.clearLines();

    // 创建新方块或结束
    this.currentBlock = null;
  }

  /**
   * 消行
   */
  clearLines() {
    let linesCleared = 0;

    for (let row = this.rows - 1; row >= 0; row--) {
      if (this.grid[row].every(cell => cell !== null)) {
        // 移除该行
        this.grid.splice(row, 1);
        // 在顶部添加新行
        this.grid.unshift(new Array(this.cols).fill(null));
        linesCleared++;
        row++; // 重新检查当前行
      }
    }

    if (linesCleared > 0) {
      this.onLinesCleared && this.onLinesCleared(linesCleared);
    }
  }

  /**
   * 渲染
   */
  render() {
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();

    // 清除画布
    ctx.clearRect(0, 0, rect.width, rect.height);

    // 渲染已落下的方块
    this.renderGrid(ctx);

    // 渲染当前方块
    if (this.currentBlock) {
      this.renderBlock(ctx, this.currentBlock);
    }
  }

  /**
   * 渲染网格中的方块
   */
  renderGrid(ctx) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const cell = this.grid[row][col];
        if (cell) {
          this.renderCell(ctx, col, row, cell.color);
        }
      }
    }
  }

  /**
   * 渲染单个方块
   */
  renderBlock(ctx, block) {
    for (let row = 0; row < block.shape.length; row++) {
      for (let col = 0; col < block.shape[row].length; col++) {
        if (block.shape[row][col]) {
          const x = (block.x + col) * this.blockSize;
          const y = (block.y + row) * this.blockSize;

          this.renderCell(ctx, block.x + col, block.y + row, block.color, block.glow, block.scale);
        }
      }
    }
  }

  /**
   * 渲染单元格
   */
  renderCell(ctx, col, row, color, glow = 0, scale = 1) {
    const x = col * this.blockSize;
    const y = row * this.blockSize;
    const size = this.blockSize - 2;
    const offset = (this.blockSize - size * scale) / 2;

    // 主体渐变
    const gradient = ctx.createLinearGradient(x, y, x + size, y + size);
    gradient.addColorStop(0, color.secondary);
    gradient.addColorStop(1, color.primary);

    // 发光效果
    if (glow > 0) {
      ctx.shadowColor = color.glow;
      ctx.shadowBlur = 20 * glow;
    }

    // 绘制方块
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x + offset + 1, y + offset + 1, size * scale, size * scale, 3);
    ctx.fill();

    // 高光边缘
    ctx.strokeStyle = `rgba(255, 255, 255, 0.3)`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // 内部高光
    ctx.fillStyle = `rgba(255, 255, 255, 0.1)`;
    ctx.beginPath();
    ctx.roundRect(x + offset + 3, y + offset + 3, (size * scale) / 3, (size * scale) / 3, 2);
    ctx.fill();

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  /**
   * 清除所有方块
   */
  clearAll() {
    this.initGrid();
    this.fallenBlocks = [];
    this.currentBlock = null;
  }

  /**
   * 销毁
   */
  destroy() {
    this.stop();
    window.removeEventListener('resize', this.resize);
  }
}

/**
 * 预定义的SQ字样方块布局
 */
const SQ_PATTERN = [
  // S 字母
  { col: 2, row: 8, type: 'skill' },
  { col: 3, row: 8, type: 'skill' },
  { col: 4, row: 8, type: 'work' },
  { col: 4, row: 9, type: 'work' },
  { col: 3, row: 10, type: 'exp' },
  { col: 2, row: 10, type: 'exp' },
  { col: 2, row: 11, type: 'life' },
  { col: 3, row: 11, type: 'life' },
  { col: 4, row: 11, type: 'contact' },

  // Q 字母
  { col: 6, row: 8, type: 'skill' },
  { col: 7, row: 8, type: 'skill' },
  { col: 8, row: 8, type: 'work' },
  { col: 6, row: 9, type: 'work' },
  { col: 8, row: 9, type: 'exp' },
  { col: 6, row: 10, type: 'exp' },
  { col: 8, row: 10, type: 'life' },
  { col: 6, row: 11, type: 'life' },
  { col: 7, row: 11, type: 'contact' },
  { col: 8, row: 11, type: 'contact' },
  { col: 9, row: 12, type: 'decor' }, // Q的尾巴
];

/**
 * SQ字母入场动画控制器（首页专用）
 */
class SQIntroAnimation {
  constructor(engine) {
    this.engine = engine;
    this.isRunning = false;
    this.queue = [];
    this.currentIndex = 0;
    this.onComplete = null;
  }

  /**
   * 开始SQ字母堆叠动画
   */
  startSQAnimation() {
    this.isRunning = true;
    this.queue = this.buildSQSequence();
    this.currentIndex = 0;
    this.dropNext();
  }

  /**
   * 构建SQ字母方块序列
   */
  buildSQSequence() {
    const sequence = [];

    // 按行分组
    const rows = {};
    SQ_PATTERN.forEach(block => {
      if (!rows[block.row]) rows[block.row] = [];
      rows[block.row].push(block);
    });

    // 按行顺序生成下落序列
    Object.keys(rows).sort((a, b) => a - b).forEach(row => {
      rows[row].forEach(block => {
        sequence.push({
          type: block.type,
          targetX: block.col,
          targetY: block.row
        });
      });
    });

    return sequence;
  }

  /**
   * 下落下一个方块
   */
  dropNext() {
    if (!this.isRunning || this.currentIndex >= this.queue.length) {
      this.complete();
      return;
    }

    const item = this.queue[this.currentIndex];
    const block = this.engine.createBlock('O', item.targetX, -3); // 从顶部开始
    block.type = item.type;
    block.color = this.engine.colors[item.type];
    block.targetY = item.targetY;

    this.engine.currentBlock = block;

    // 动画下落到目标位置
    this.animateDrop(block, () => {
      this.engine.landBlock();
      this.currentIndex++;

      // 延迟后下落下一个
      setTimeout(() => this.dropNext(), 150);
    });
  }

  /**
   * 动画下落
   */
  animateDrop(block, callback) {
    const startY = block.y;
    const endY = block.targetY;
    const duration = 800;
    const startTime = performance.now();

    const animate = (time) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // 缓动函数
      const eased = 1 - Math.pow(1 - progress, 3);

      block.y = startY + (endY - startY) * eased;

      // 落地效果
      if (progress >= 1) {
        block.glow = 1;
        block.scale = 1.05;

        setTimeout(() => {
          block.glow = 0;
          block.scale = 1;
          callback();
        }, 100);
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * 完成
   */
  complete() {
    this.isRunning = false;
    this.onComplete && this.onComplete();
  }

  /**
   * 停止
   */
  stop() {
    this.isRunning = false;
  }
}

// 导出
window.TetrisEngine = TetrisEngine;
window.SQIntroAnimation = SQIntroAnimation;
window.SQ_PATTERN = SQ_PATTERN;
