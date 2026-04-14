/**
 * 主控制器 - 首页
 * 沙沁个人网站 - 俄罗斯方块主题
 * 首页：SQ字母堆叠效果 + Click to Start跳转
 */

document.addEventListener('DOMContentLoaded', () => {
  // ========================================
  // 初始化组件
  // ========================================

  const canvas = document.getElementById('tetris-canvas');
  const startScreen = document.getElementById('start-screen');
  const clickToStart = document.getElementById('click-to-start');
  const nav = document.getElementById('nav');
  const progressBar = document.getElementById('progress-bar');

  // 创建引擎
  const engine = new TetrisEngine(canvas);

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
    const hoverTargets = document.querySelectorAll('a, button');
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
  // Click to Start - 跳转到游戏页
  // ========================================

  clickToStart.addEventListener('click', () => {
    window.location.href = 'game.html';
  });

  // ========================================
  // 入场动画 - SQ字母堆叠
  // ========================================

  function startIntro() {
    // 开始引擎
    engine.start();

    // 创建入场动画（使用SQIntroAnimation）
    const introAnimation = new SQIntroAnimation(engine);
    introAnimation.onComplete = () => {
      // SQ字母堆叠完成后的效果
      engine.fallenBlocks.forEach(block => {
        block.glow = 1;
        setTimeout(() => {
          block.glow = 0;
        }, 500);
      });
    };

    // 开始SQ字母堆叠
    introAnimation.startSQAnimation();
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
    } else {
      engine.resume();
    }
  });

  // ========================================
  // 初始化
  // ========================================

  // 启动入场动画
  setTimeout(startIntro, 500);

  console.log('🎮 沙沁个人网站 - 俄罗斯方块主题已加载');
  console.log('💡 点击 CLICK TO START 开始体验');
});
