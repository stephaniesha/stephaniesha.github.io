/**
 * 右侧分栏管理器
 * 管理分栏入口和图片展示
 */

class SidebarManager {
  constructor() {
    this.sidebar = document.getElementById('sidebar');
    this.imageElement = document.getElementById('sidebar-image');
    this.entries = document.querySelectorAll('.sidebar-entry');

    // 分栏配置
    this.entryOrder = ['skill', 'work', 'life', 'contact'];
    this.entryLabels = {
      skill: { label: '技能', sublabel: 'Skills' },
      work: { label: '作品', sublabel: 'Works' },
      life: { label: '生活', sublabel: 'Life' },
      contact: { label: '联系', sublabel: 'Contact' }
    };

    // 状态
    this.currentEntryIndex = 0;
    this.activeEntries = new Set();

    // 图片列表
    this.images = [
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
    this.currentImageIndex = 0;

    // 图片展示状态
    this.imageVisible = false;
    this.imageTimeout = null;

    // 回调
    this.onEntryClick = null;

    // 初始化
    this.init();
  }

  init() {
    // 绑定分栏点击事件
    this.entries.forEach(entry => {
      entry.addEventListener('click', () => {
        const type = entry.dataset.type;
        if (entry.dataset.active === 'true') {
          this.handleEntryClick(type);
        }
      });
    });
  }

  /**
   * 显示分栏
   */
  show() {
    if (this.sidebar) {
      this.sidebar.classList.add('visible');
    }
  }

  /**
   * 隐藏分栏
   */
  hide() {
    if (this.sidebar) {
      this.sidebar.classList.remove('visible');
    }
  }

  /**
   * 激活下一个分栏入口
   */
  activateNextEntry() {
    if (this.currentEntryIndex >= this.entryOrder.length) {
      // 循环
      this.currentEntryIndex = 0;
    }

    const type = this.entryOrder[this.currentEntryIndex];
    this.activateEntry(type);
    this.currentEntryIndex++;
  }

  /**
   * 激活指定分栏入口
   */
  activateEntry(type) {
    const entry = document.querySelector(`.sidebar-entry[data-type="${type}"]`);
    if (entry) {
      entry.dataset.active = 'true';
      entry.classList.add('active');

      // 弹出动画
      entry.style.animation = 'none';
      entry.offsetHeight; // 触发重排
      entry.style.animation = 'entryPop 0.3s ease-out';

      this.activeEntries.add(type);
    }
  }

  /**
   * 处理分栏点击
   */
  handleEntryClick(type) {
    if (this.onEntryClick) {
      this.onEntryClick(type);
    }
  }

  /**
   * 展示图片
   */
  showImage() {
    if (!this.imageElement || this.images.length === 0) return;

    // 选择下一张图片
    const imageSrc = this.images[this.currentImageIndex];
    this.currentImageIndex = (this.currentImageIndex + 1) % this.images.length;

    // 设置图片
    this.imageElement.src = imageSrc;

    // 显示动画
    const container = this.imageElement.parentElement;
    if (container) {
      container.classList.add('visible');
    }

    this.imageVisible = true;

    // 清除之前的定时器
    if (this.imageTimeout) {
      clearTimeout(this.imageTimeout);
    }

    // 1.5秒后隐藏
    this.imageTimeout = setTimeout(() => {
      this.hideImage();
    }, 1500);
  }

  /**
   * 隐藏图片
   */
  hideImage() {
    if (!this.imageElement) return;

    const container = this.imageElement.parentElement;
    if (container) {
      container.classList.remove('visible');
    }

    this.imageVisible = false;
  }

  /**
   * 重置状态
   */
  reset() {
    this.currentEntryIndex = 0;
    this.activeEntries.clear();
    this.currentImageIndex = 0;

    // 重置所有分栏状态
    this.entries.forEach(entry => {
      entry.dataset.active = 'false';
      entry.classList.remove('active');
    });

    // 隐藏图片
    this.hideImage();
  }

  /**
   * 获取当前激活的分栏数量
   */
  get activeCount() {
    return this.activeEntries.size;
  }
}

window.SidebarManager = SidebarManager;
