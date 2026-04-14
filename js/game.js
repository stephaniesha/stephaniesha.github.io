/**
 * 主控制器 - 游戏页
 * 沙沁个人网站 - 俄罗斯方块主题
 * 开场动画 + 自动游玩 + 键盘控制 + 无限循环
 */

document.addEventListener('DOMContentLoaded', () => {
  // ========================================
  // 初始化组件
  // ========================================

  const canvas = document.getElementById('tetris-canvas');
  const contentPanel = document.getElementById('content-panel');
  const panelBody = document.querySelector('.overlay-body');
  const panelClose = document.querySelector('.overlay-close');
  const panelBackdrop = document.querySelector('.overlay-backdrop');
  const qrcodeModal = document.getElementById('qrcode-modal');
  const copyToast = document.getElementById('copy-toast');
  const nav = document.getElementById('nav');
  const progressBar = document.getElementById('progress-bar');
  const gameBoard = document.getElementById('game-board');

  // SQ动画最小需要：S(5列) + Q(5列) + 间隔(2列) = 12列
  // 游戏尺寸：12列 x 18行
  const GAME_COLS = 12;
  const GAME_ROWS = 18;
  const BLOCK_SIZE = 28;

  // 设置画布尺寸
  canvas.width = GAME_COLS * BLOCK_SIZE;
  canvas.height = GAME_ROWS * BLOCK_SIZE;

  // 设置游戏容器尺寸
  if (gameBoard) {
    gameBoard.style.width = canvas.width + 'px';
    gameBoard.style.height = canvas.height + 'px';
  }

  // 创建引擎（使用固定尺寸）
  const engine = new TetrisEngine(canvas, {
    cols: GAME_COLS,
    rows: GAME_ROWS,
    blockSize: BLOCK_SIZE
  });
  const contentManager = new ContentManager();

  let introAnimation = null;
  let autoPlayer = null;
  let isIntroComplete = false;
  let keyboardEnabled = false;

  // ========================================
  // 自定义光标
  // ========================================

  const cursorDot = document.getElementById('cursor-dot');
  const cursorGlow = document.getElementById('cursor-glow');

  if (cursorDot && cursorGlow) {
    document.addEventListener('mousemove', (e) => {
      cursorDot.style.left = e.clientX + 'px';
      cursorDot.style.top = e.clientY + 'px';
      cursorGlow.style.left = e.clientX + 'px';
      cursorGlow.style.top = e.clientY + 'px';
    });

    // Hover效果
    const hoverTargets = document.querySelectorAll('a, button, .sidebar-entry');
    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        cursorDot.style.transform = 'translate(-50%, -50%) scale(2.5)';
        cursorDot.style.background = '#ec4899';
      });
      el.addEventListener('mouseleave', () => {
        cursorDot.style.transform = 'translate(-50%, -50%) scale(1)';
        cursorDot.style.background = '#fff';
      });
    });
  }

  // ========================================
  // 导航滚动效果
  // ========================================

  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    nav.classList.toggle('scrolled', scrollY > 50);

    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = (scrollY / docHeight) * 100;
    progressBar.style.width = progress + '%';
  }, { passive: true });

  // ========================================
  // 开场动画
  // ========================================

  function startIntro() {
    // 开始引擎
    engine.start();

    // 创建开场动画
    introAnimation = new IntroAnimation(engine);
    introAnimation.onComplete = () => {
      isIntroComplete = true;
      keyboardEnabled = true;
      // 开场动画完成，开始自动游玩
      startAutoPlay();
    };

    // 开始动画
    introAnimation.start();
  }

  // ========================================
  // 自动游玩 - 无限循环
  // ========================================

  function startAutoPlay() {
    // 创建自动游玩控制器
    autoPlayer = new AutoPlayer(engine);

    // 游戏结束回调 - 重新开始
    autoPlayer.onGameOver = () => {
      console.log('🎮 游戏结束，重新开始...');
      resetGame();
      startAutoPlay();
    };

    // 方块落地回调 - 展示图片
    autoPlayer.onBlockLanded = (data) => {
      showImage();
    };

    // 消行回调
    autoPlayer.onLineCleared = (count) => {
      // 消行特效可以在这里添加
    };

    // 开始自动游玩
    autoPlayer.start();
  }

  // ========================================
  // 重置游戏
  // ========================================

  function resetGame() {
    // 清除网格
    engine.clearAll();
    // 重置自动游玩控制器状态
    if (autoPlayer) {
      autoPlayer.blocksPlaced = 0;
      autoPlayer.linesCleared = 0;
    }
  }

  // ========================================
  // 键盘控制
  // ========================================

  document.addEventListener('keydown', (e) => {
    // 内容面板打开时，ESC关闭
    if (e.key === 'Escape') {
      closeContentPanel();
      closeQrcodeModal();
      return;
    }

    // 只有在开场动画完成后才能控制
    if (!keyboardEnabled || !isIntroComplete) return;

    // 暂停自动游玩的控制
    if (autoPlayer && autoPlayer.isRunning) {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          autoPlayer.moveCurrentBlock(-1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          autoPlayer.moveCurrentBlock(1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          autoPlayer.rotateCurrentBlock();
          break;
        case 'ArrowDown':
          e.preventDefault();
          autoPlayer.dropCurrentBlock();
          break;
        case ' ':
          e.preventDefault();
          autoPlayer.hardDropCurrentBlock();
          break;
      }
    }
  });

  // ========================================
  // 图片展示
  // ========================================

  const imageContainer = document.querySelector('#game-sidebar .sidebar-image-container');
  const imageElement = document.getElementById('sidebar-image');
  let imageTimeout = null;

  const images = [
    'assets/images/life/431776098121_.pic.jpg',
    'assets/images/life/451776183807_.pic.jpg',
    'assets/images/life/461776183819_.pic.jpg',
    'assets/images/life/471776183832_.pic.jpg',
    'assets/images/life/521776184286_.pic.jpg',
    'assets/images/life/531776184287_.pic.jpg',
    'assets/images/life/541776184289_.pic.jpg',
    'assets/images/life/561776184291_.pic.jpg',
    'assets/images/life/581776184293_.pic.jpg',
    'assets/images/life/591776184294_.pic.jpg'
  ];
  let currentImageIndex = 0;

  function showImage() {
    if (!imageElement || images.length === 0) return;

    // 选择下一张图片
    const imageSrc = images[currentImageIndex];
    currentImageIndex = (currentImageIndex + 1) % images.length;

    // 设置图片
    imageElement.src = imageSrc;

    // 显示动画
    if (imageContainer) {
      imageContainer.classList.add('visible');
    }

    // 清除之前的定时器
    if (imageTimeout) {
      clearTimeout(imageTimeout);
    }

    // 1.5秒后隐藏
    imageTimeout = setTimeout(() => {
      if (imageContainer) {
        imageContainer.classList.remove('visible');
      }
    }, 1500);
  }

  // ========================================
  // 内容面板
  // ========================================

  // 图片预览
  const imagePreview = document.getElementById('image-preview');
  const previewImage = document.getElementById('preview-image');

  function showImagePreview(src) {
    if (!imagePreview || !previewImage) return;
    previewImage.src = src;
    imagePreview.classList.add('active');
  }

  function hideImagePreview() {
    if (!imagePreview) return;
    imagePreview.classList.remove('active');
  }

  if (imagePreview) {
    imagePreview.addEventListener('click', hideImagePreview);
  }

  function openContentPanel(type) {
    const content = contentManager.getContent(type);
    panelBody.innerHTML = content;
    contentPanel.classList.add('active');

    // 暂停游戏
    if (autoPlayer) autoPlayer.stop();

    setTimeout(() => {
      document.querySelectorAll('.stagger-in').forEach(el => {
        el.classList.add('visible');
      });
    }, 100);

    bindContactEvents();
    bindImagePreviewEvents();
  }

  function bindImagePreviewEvents() {
    // 作品图片点击
    const workImages = document.querySelectorAll('.work-image img');
    workImages.forEach(img => {
      img.addEventListener('click', () => {
        showImagePreview(img.src);
      });
    });

    // 生活图片点击
    const lifePhotos = document.querySelectorAll('.life-photo img');
    lifePhotos.forEach(img => {
      img.addEventListener('click', () => {
        showImagePreview(img.src);
      });
    });
  }

  function closeContentPanel() {
    contentPanel.classList.remove('active');

    // 恢复游戏
    if (autoPlayer && isIntroComplete) autoPlayer.start();
  }

  panelClose.addEventListener('click', closeContentPanel);
  panelBackdrop.addEventListener('click', closeContentPanel);

  // ========================================
  // 分栏点击处理
  // ========================================

  const sidebarEntries = document.querySelectorAll('#game-sidebar .sidebar-entry');
  sidebarEntries.forEach(entry => {
    entry.addEventListener('click', () => {
      const type = entry.dataset.type;
      openContentPanel(type);
    });
  });

  // ========================================
  // 联系方式交互
  // ========================================

  function bindContactEvents() {
    const contactItems = document.querySelectorAll('.contact-item');

    contactItems.forEach(item => {
      item.addEventListener('click', () => {
        const type = item.dataset.type;
        const value = item.dataset.value;

        if (type === 'email') {
          copyToClipboard(value);
        } else if (type === 'wechat') {
          openQrcodeModal();
        }
      });
    });
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      showToast();
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast();
    });
  }

  function showToast() {
    copyToast.classList.add('active');
    setTimeout(() => {
      copyToast.classList.remove('active');
    }, 2000);
  }

  // ========================================
  // 微信二维码弹窗
  // ========================================

  const modalBackdrop = document.querySelector('.modal-backdrop');
  const modalClose = document.querySelector('.modal-close');

  function openQrcodeModal() {
    qrcodeModal.classList.add('active');
  }

  function closeQrcodeModal() {
    qrcodeModal.classList.remove('active');
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', closeQrcodeModal);
  }
  if (modalClose) {
    modalClose.addEventListener('click', closeQrcodeModal);
  }

  // ========================================
  // 响应式处理
  // ========================================

  function handleResize() {
    const width = window.innerWidth;
    if (width <= 768) {
      if (cursorDot) cursorDot.style.display = 'none';
      if (cursorGlow) cursorGlow.style.display = 'none';
    } else {
      if (cursorDot) cursorDot.style.display = '';
      if (cursorGlow) cursorGlow.style.display = '';
    }
  }

  window.addEventListener('resize', handleResize);
  handleResize();

  // ========================================
  // 触摸设备支持
  // ========================================

  if ('ontouchstart' in window) {
    if (cursorDot) cursorDot.style.display = 'none';
    if (cursorGlow) cursorGlow.style.display = 'none';
  }

  // ========================================
  // 页面可见性处理
  // ========================================

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      engine.pause();
      if (autoPlayer) autoPlayer.stop();
    } else {
      engine.resume();
      if (autoPlayer && isIntroComplete) autoPlayer.start();
    }
  });

  // ========================================
  // 初始化
  // ========================================

  // 启动开场动画
  setTimeout(startIntro, 300);

  console.log('🎮 沙沁个人网站 - 俄罗斯方块游戏已加载');
  console.log('💡 开场动画播放中...');
  console.log('⌨️ 方向键控制方块移动，空格键快速下落');
});
