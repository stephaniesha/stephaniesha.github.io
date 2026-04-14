// 页面初始入场动画
function initPageAnimations() {
  // 先显示导航
  const nav = document.getElementById('nav');
  if (nav) {
    setTimeout(() => {
      nav.classList.add('animate-visible');
    }, 200);
  }

  // 再显示 Hero 元素 - 按期望的顺序
  const heroOrder = [
    '.hero-tag',
    '.hero-title',
    '.hero-sub',
    '.btn-group',
    '.hero-visual',
    '.hero-scroll-hint'
  ];

  heroOrder.forEach((selector, index) => {
    const el = document.querySelector(selector);
    if (el) {
      setTimeout(() => {
        el.classList.add('animate-visible');
      }, 300 + index * 120);
    }
  });
}

// 等待页面加载完成后触发动画
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPageAnimations);
} else {
  initPageAnimations();
}

// 鼠标跟踪
const dot = document.getElementById('cursor-dot');
const glow = document.getElementById('cursor-glow');
document.addEventListener('mousemove', e => {
  dot.style.left = e.clientX + 'px';
  dot.style.top = e.clientY + 'px';
  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
});

// hover 时鼠标变大
document.querySelectorAll('a, button, .work-card, .philosophy-card, .skill-tag').forEach(el => {
  el.addEventListener('mouseenter', () => {
    dot.style.transform = 'translate(-50%,-50%) scale(2.5)';
    dot.style.background = '#ec4899';
  });
  el.addEventListener('mouseleave', () => {
    dot.style.transform = 'translate(-50%,-50%) scale(1)';
    dot.style.background = '#fff';
  });
});

// 滚动进度条
const bar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const pct = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
  bar.style.width = pct + '%';
}, { passive: true });

// 导航滚动效果
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 50);
}, { passive: true });

// 导航高亮
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 200) current = s.id; });
  navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
}, { passive: true });

// 滚动渐入
const observer = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) setTimeout(() => e.target.classList.add('visible'), i * 100);
  });
}, { threshold: 0.08 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// 打字机效果
const texts = ['设计是手段，解决问题才是目的。', '系统性设计思维实践者', 'AI 辅助设计工作流探索者', '全链路体验设计师'];
let ti = 0, ci = 0, deleting = false;
const tw = document.getElementById('typewriter');
function type() {
  const cur = texts[ti];
  tw.textContent = deleting ? cur.slice(0, ci--) : cur.slice(0, ci++);
  if (!deleting && ci > cur.length) { deleting = true; setTimeout(type, 2000); return; }
  if (deleting && ci < 0) { deleting = false; ti = (ti + 1) % texts.length; ci = 0; }
  setTimeout(type, deleting ? 35 : 75);
}
type();

// Tab 切换
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// 视差滚动 — Hero 内容随滚动缓慢上移
const heroInner = document.querySelector('.hero-inner');
window.addEventListener('scroll', () => {
  const y = window.scrollY;
  if (heroInner && y < window.innerHeight) {
    heroInner.style.transform = `translateY(${y * 0.2}px)`;
    heroInner.style.opacity = 1 - y / window.innerHeight * 1.2;
  }
}, { passive: true });

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  });
});

// 规划区块折叠卡片交互
document.querySelectorAll('.planning-card-header').forEach(header => {
  header.addEventListener('click', () => {
    const card = header.parentElement;
    const isActive = card.classList.contains('active');
    // 切换当前卡片状态
    card.classList.toggle('active', !isActive);
  });
});

// 规划卡片 hover 时鼠标变大
document.querySelectorAll('.planning-card-header').forEach(el => {
  el.addEventListener('mouseenter', () => {
    dot.style.transform = 'translate(-50%,-50%) scale(2.5)';
    dot.style.background = '#ec4899';
  });
  el.addEventListener('mouseleave', () => {
    dot.style.transform = 'translate(-50%,-50%) scale(1)';
    dot.style.background = '#fff';
  });
});

// 微信二维码弹窗
const qrcodeModal = document.getElementById('qrcode-modal');
const wechatLink = document.querySelector('.social-link[title="微信"]');

function closeQrcodeModal() {
  qrcodeModal.classList.remove('active');
  document.body.style.overflow = '';
}

if (qrcodeModal && wechatLink) {
  // 点击微信链接显示弹窗
  wechatLink.addEventListener('click', (e) => {
    e.preventDefault();
    qrcodeModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  // 点击背景关闭
  qrcodeModal.querySelector('.qrcode-backdrop').addEventListener('click', closeQrcodeModal);

  // 点击关闭按钮关闭
  qrcodeModal.querySelector('.qrcode-close').addEventListener('click', closeQrcodeModal);

  // ESC 关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && qrcodeModal.classList.contains('active')) {
      closeQrcodeModal();
    }
  });
}
