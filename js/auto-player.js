/**
 * AI自动游玩控制器
 * 混合策略：随机堆叠 + 智能消除
 * 支持键盘干预
 */

class AutoPlayer {
  constructor(engine) {
    this.engine = engine;
    this.isRunning = false;
    this.currentStrategy = 'random'; // random, smart
    this.strategyThreshold = 0.5; // 50%空间切换策略

    // 配置
    this.dropInterval = 1000; // 基础下落间隔
    this.minDropInterval = 400;
    this.maxDropInterval = 1500;

    // 统计
    this.blocksPlaced = 0;
    this.linesCleared = 0;
    this.totalRows = 0;

    // 当前下落中的方块信息
    this.currentDroppingBlock = null;
    this.currentLanding = null;

    // 回调
    this.onBlockLanded = null;
    this.onLineCleared = null;
    this.onGameOver = null;

    // 方块形状
    this.shapes = {
      I: [[1, 1, 1, 1]],
      O: [[1, 1], [1, 1]],
      T: [[0, 1, 0], [1, 1, 1]],
      S: [[0, 1, 1], [1, 1, 0]],
      Z: [[1, 1, 0], [0, 1, 1]],
      J: [[1, 0, 0], [1, 1, 1]],
      L: [[0, 0, 1], [1, 1, 1]]
    };

    this.shapeKeys = Object.keys(this.shapes);
    this.typeKeys = ['skill', 'work', 'life', 'contact'];
  }

  start() {
    this.isRunning = true;
    this.blocksPlaced = 0;
    this.linesCleared = 0;
    this.totalRows = this.engine.rows;
    this.playNext();
  }

  stop() {
    this.isRunning = false;
  }

  /**
   * 播放下一个方块
   */
  playNext() {
    if (!this.isRunning) return;

    // 检查游戏是否应该结束
    if (this.checkGameOver()) {
      this.stop();
      if (this.onGameOver) {
        this.onGameOver();
      }
      return;
    }

    // 根据当前状态选择策略
    this.updateStrategy();

    // 创建新方块
    const block = this.createNextBlock();

    // 计算落点
    const landing = this.calculateLanding(block);

    // 保存当前方块信息（用于键盘控制）
    this.currentDroppingBlock = block;
    this.currentLanding = landing;

    // 执行下落动画
    this.animateDrop(block, landing);
  }

  /**
   * 更新策略
   */
  updateStrategy() {
    const fillRatio = this.calculateFillRatio();

    if (fillRatio < this.strategyThreshold) {
      this.currentStrategy = 'random';
      this.dropInterval = 1000;
    } else {
      this.currentStrategy = 'smart';
      this.dropInterval = 600;
    }
  }

  /**
   * 计算填充比例
   */
  calculateFillRatio() {
    let filledCells = 0;
    const totalCells = this.engine.rows * this.engine.cols;

    for (let row = 0; row < this.engine.rows; row++) {
      for (let col = 0; col < this.engine.cols; col++) {
        if (this.engine.grid[row] && this.engine.grid[row][col]) {
          filledCells++;
        }
      }
    }

    return filledCells / totalCells;
  }

  /**
   * 创建下一个方块
   */
  createNextBlock() {
    const shapeKey = this.shapeKeys[Math.floor(Math.random() * this.shapeKeys.length)];
    const type = this.typeKeys[Math.floor(Math.random() * this.typeKeys.length)];

    let shape = this.shapes[shapeKey];

    // 随机旋转
    const rotations = Math.floor(Math.random() * 4);
    for (let i = 0; i < rotations; i++) {
      shape = this.rotateShape(shape);
    }

    return {
      shape: shape,
      type: type,
      color: this.engine.colors[type],
      shapeKey: shapeKey
    };
  }

  /**
   * 计算落点
   */
  calculateLanding(block) {
    if (this.currentStrategy === 'random') {
      return this.randomLanding(block);
    } else {
      return this.smartLanding(block);
    }
  }

  /**
   * 随机落点策略
   */
  randomLanding(block) {
    const shape = block.shape;
    const shapeWidth = shape[0].length;

    // 随机X位置，偏向中心
    const centerX = Math.floor(this.engine.cols / 2);
    const spread = Math.floor(this.engine.cols * 0.3);
    let x = centerX - spread + Math.floor(Math.random() * spread * 2);
    x = Math.max(0, Math.min(this.engine.cols - shapeWidth, x));

    // 计算落点Y
    const y = this.findLandingY(shape, x);

    return { x, y };
  }

  /**
   * 智能落点策略
   */
  smartLanding(block) {
    const shape = block.shape;
    const shapeWidth = shape[0].length;
    const shapeHeight = shape.length;

    let bestScore = -Infinity;
    let bestX = 0;
    let bestY = 0;

    // 尝试所有可能的X位置
    for (let x = 0; x <= this.engine.cols - shapeWidth; x++) {
      const y = this.findLandingY(shape, x);

      if (y < 0) continue;

      // 计算得分
      const score = this.evaluatePosition(shape, x, y);

      if (score > bestScore) {
        bestScore = score;
        bestX = x;
        bestY = y;
      }
    }

    return { x: bestX, y: bestY };
  }

  /**
   * 评估位置得分
   */
  evaluatePosition(shape, x, y) {
    let score = 0;

    // 1. 检查是否能形成完整行
    const linesFormed = this.countLinesFormed(shape, x, y);
    score += linesFormed * 100;

    // 2. 惩罚留下空洞
    const holesCreated = this.countHolesCreated(shape, x, y);
    score -= holesCreated * 50;

    // 3. 奖励降低高度
    const heightPenalty = (this.engine.rows - y) * 2;
    score -= heightPenalty;

    // 4. 奖励平整表面
    const surfaceRoughness = this.calculateSurfaceRoughness(shape, x, y);
    score -= surfaceRoughness * 10;

    return score;
  }

  /**
   * 计算形成的完整行数
   */
  countLinesFormed(shape, x, y) {
    let count = 0;
    const shapeHeight = shape.length;

    for (let row = 0; row < shapeHeight; row++) {
      const gridRow = y + row;
      if (gridRow < 0 || gridRow >= this.engine.rows) continue;

      let isFull = true;
      for (let col = 0; col < this.engine.cols; col++) {
        // 检查是否被方块覆盖
        const shapeCol = col - x;
        const isShapeCell = shapeCol >= 0 && shapeCol < shape[row].length && shape[row][shapeCol];

        if (!isShapeCell && (!this.engine.grid[gridRow] || !this.engine.grid[gridRow][col])) {
          isFull = false;
          break;
        }
      }

      if (isFull) count++;
    }

    return count;
  }

  /**
   * 计算创建的空洞数
   */
  countHolesCreated(shape, x, y) {
    let holes = 0;
    const shapeWidth = shape[0].length;
    const shapeHeight = shape.length;

    // 检查方块下方是否有空洞
    for (let col = 0; col < shapeWidth; col++) {
      const gridCol = x + col;
      if (gridCol < 0 || gridCol >= this.engine.cols) continue;

      // 找到该列最低的方块格子
      let lowestRow = -1;
      for (let row = shapeHeight - 1; row >= 0; row--) {
        if (shape[row][col]) {
          lowestRow = row;
          break;
        }
      }

      if (lowestRow < 0) continue;

      // 检查下方是否有空洞
      for (let checkRow = y + lowestRow + 1; checkRow < this.engine.rows; checkRow++) {
        if (!this.engine.grid[checkRow] || !this.engine.grid[checkRow][gridCol]) {
          holes++;
        } else {
          break;
        }
      }
    }

    return holes;
  }

  /**
   * 计算表面粗糙度
   */
  calculateSurfaceRoughness(shape, x, y) {
    const heights = [];

    for (let col = 0; col < this.engine.cols; col++) {
      let height = this.engine.rows;

      for (let row = 0; row < this.engine.rows; row++) {
        // 检查方块
        const shapeCol = col - x;
        const shapeRow = row - y;
        const isShapeCell = shapeCol >= 0 && shapeCol < shape[0].length &&
                           shapeRow >= 0 && shapeRow < shape.length &&
                           shape[shapeRow][shapeCol];

        if (isShapeCell || (this.engine.grid[row] && this.engine.grid[row][col])) {
          height = row;
          break;
        }
      }

      heights.push(height);
    }

    // 计算相邻高度差
    let roughness = 0;
    for (let i = 1; i < heights.length; i++) {
      roughness += Math.abs(heights[i] - heights[i - 1]);
    }

    return roughness;
  }

  /**
   * 找到落点Y
   */
  findLandingY(shape, x) {
    for (let y = 0; y <= this.engine.rows - shape.length; y++) {
      if (this.checkCollision(shape, x, y + 1)) {
        return y;
      }
    }
    return this.engine.rows - shape.length;
  }

  /**
   * 碰撞检测
   */
  checkCollision(shape, x, y) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const gridX = x + col;
          const gridY = y + row;

          if (gridX < 0 || gridX >= this.engine.cols || gridY >= this.engine.rows) {
            return true;
          }

          if (gridY >= 0 && this.engine.grid[gridY] && this.engine.grid[gridY][gridX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * 旋转形状
   */
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

  /**
   * 动画下落
   */
  animateDrop(block, landing) {
    const engine = this.engine;

    // 设置当前方块
    engine.currentBlock = {
      shape: block.shape,
      type: block.type,
      color: block.color,
      x: landing.x,
      y: -block.shape.length,
      rotation: 0,
      isAnimating: true,
      scale: 1,
      glow: 0
    };

    this.animationStartTime = performance.now();
    this.animationStartY = engine.currentBlock.y;
    this.animationDuration = this.dropInterval;

    const animate = (time) => {
      if (!this.isRunning) return;

      const elapsed = time - this.animationStartTime;
      const progress = Math.min(elapsed / this.animationDuration, 1);

      // 缓动
      const eased = progress * progress * (3 - 2 * progress);

      // 使用动态的落点位置（键盘控制会更新 this.currentLanding）
      const targetY = this.currentLanding ? this.currentLanding.y : landing.y;
      engine.currentBlock.y = this.animationStartY + (targetY - this.animationStartY) * eased;

      // 检查是否已经到达或超过目标位置
      if (engine.currentBlock.y >= targetY || progress >= 1) {
        engine.currentBlock.y = targetY;
        // 落地 - 使用当前实际的落点位置
        const actualLanding = this.currentLanding || landing;
        const actualBlock = this.currentDroppingBlock || block;
        this.placeBlock(actualBlock, actualLanding);
      } else {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * 放置方块
   */
  placeBlock(block, landing) {
    const engine = this.engine;
    // 使用当前方块的形状和位置
    const shape = engine.currentBlock ? engine.currentBlock.shape : block.shape;
    const actualX = engine.currentBlock ? engine.currentBlock.x : landing.x;
    const actualY = engine.currentBlock ? Math.floor(engine.currentBlock.y) : landing.y;

    // 添加到网格
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const gridY = actualY + row;
          const gridX = actualX + col;

          if (gridY >= 0 && gridY < engine.rows && gridX >= 0 && gridX < engine.cols) {
            engine.grid[gridY][gridX] = {
              type: block.type,
              color: block.color
            };
          }
        }
      }
    }

    // 清除当前方块
    engine.currentBlock = null;
    this.currentDroppingBlock = null;
    this.currentLanding = null;

    // 统计
    this.blocksPlaced++;

    // 触发落地回调
    if (this.onBlockLanded) {
      this.onBlockLanded({
        block: block,
        position: { x: actualX, y: actualY }
      });
    }

    // 检查消行
    const linesCleared = this.clearLines();
    if (linesCleared > 0) {
      this.linesCleared += linesCleared;
      if (this.onLineCleared) {
        this.onLineCleared(linesCleared);
      }
    }

    // 继续下一个
    setTimeout(() => this.playNext(), 100);
  }

  /**
   * 消行
   */
  clearLines() {
    let linesCleared = 0;

    for (let row = this.engine.rows - 1; row >= 0; row--) {
      if (this.engine.grid[row].every(cell => cell !== null)) {
        // 移除该行
        this.engine.grid.splice(row, 1);
        // 在顶部添加新行
        this.engine.grid.unshift(new Array(this.engine.cols).fill(null));
        linesCleared++;
        row++; // 重新检查当前行
      }
    }

    return linesCleared;
  }

  /**
   * 检查游戏结束
   */
  checkGameOver() {
    // 检查顶部是否有方块
    for (let col = 0; col < this.engine.cols; col++) {
      if (this.engine.grid[0] && this.engine.grid[0][col]) {
        return true;
      }
    }
    return false;
  }

  // ========================================
  // 键盘控制方法
  // ========================================

  /**
   * 移动当前方块（左/右）
   */
  moveCurrentBlock(direction) {
    if (!this.engine.currentBlock) return;

    const newX = this.engine.currentBlock.x + direction;
    const shape = this.engine.currentBlock.shape;

    // 检查边界
    if (newX < 0 || newX + shape[0].length > this.engine.cols) return;

    // 检查碰撞
    if (!this.checkCollision(shape, newX, Math.floor(this.engine.currentBlock.y))) {
      this.engine.currentBlock.x = newX;

      // 更新落点
      if (this.currentDroppingBlock) {
        this.currentLanding = {
          x: newX,
          y: this.findLandingY(shape, newX)
        };
      }
    }
  }

  /**
   * 旋转当前方块
   */
  rotateCurrentBlock() {
    if (!this.engine.currentBlock) return;

    const shape = this.engine.currentBlock.shape;
    const rotated = this.rotateShape(shape);
    const x = this.engine.currentBlock.x;

    // 检查旋转后是否有效
    if (!this.checkCollision(rotated, x, Math.floor(this.engine.currentBlock.y))) {
      this.engine.currentBlock.shape = rotated;

      // 更新落点
      if (this.currentDroppingBlock) {
        this.currentDroppingBlock.shape = rotated;
        this.currentLanding = {
          x: x,
          y: this.findLandingY(rotated, x)
        };
      }
    } else {
      // 尝试墙踢
      for (let offset of [-1, 1, -2, 2]) {
        const newX = x + offset;
        if (newX >= 0 && newX + rotated[0].length <= this.engine.cols &&
            !this.checkCollision(rotated, newX, Math.floor(this.engine.currentBlock.y))) {
          this.engine.currentBlock.shape = rotated;
          this.engine.currentBlock.x = newX;

          if (this.currentDroppingBlock) {
            this.currentDroppingBlock.shape = rotated;
            this.currentLanding = {
              x: newX,
              y: this.findLandingY(rotated, newX)
            };
          }
          break;
        }
      }
    }
  }

  /**
   * 加速下落当前方块
   */
  dropCurrentBlock() {
    if (!this.engine.currentBlock) return;

    // 直接移动到落点
    if (this.currentLanding) {
      this.engine.currentBlock.y = this.currentLanding.y;
    }
  }

  /**
   * 硬降落（立即落地）
   */
  hardDropCurrentBlock() {
    if (!this.engine.currentBlock || !this.currentDroppingBlock) return;

    // 立即放置方块
    const landing = {
      x: this.engine.currentBlock.x,
      y: this.findLandingY(this.engine.currentBlock.shape, this.engine.currentBlock.x)
    };

    this.placeBlock(this.currentDroppingBlock, landing);
  }
}

window.AutoPlayer = AutoPlayer;
