/**
 * 内容数据和管理
 * 沙沁个人网站
 */

const ContentData = {
  // 技能数据
  skills: [
    {
      id: 'figma',
      name: 'Figma',
      icon: '🎨',
      desc: '全链路设计、组件库搭建、设计系统管理',
      tags: ['全链路设计', '组件库', '设计系统', '原型设计']
    },
    {
      id: 'stable-diffusion',
      name: 'Stable Diffusion',
      icon: '🖼️',
      desc: 'AI视觉创作、概念图生成、风格化设计',
      tags: ['AI绘图', '概念设计', '风格化']
    },
    {
      id: 'chatgpt',
      name: 'ChatGPT',
      icon: '💬',
      desc: 'Prompt工程、用户洞察挖掘、设计决策支持',
      tags: ['Prompt工程', '用户洞察', '决策支持']
    },
    {
      id: 'midjourney',
      name: 'Midjourney',
      icon: '✨',
      desc: '视觉风格探索、情绪板制作、高质量配图',
      tags: ['风格探索', '情绪板', '配图生成']
    },
    {
      id: 'claude-code',
      name: 'Claude Code',
      icon: '💻',
      desc: '页面快速实现、组件代码生成、技术验证',
      tags: ['代码生成', '快速原型', '技术验证']
    },
    {
      id: 'comfyui',
      name: 'ComfyUI',
      icon: '🔧',
      desc: '模型调优、LoRA训练、批量图像生成',
      tags: ['模型调优', 'LoRA训练', '批量生成']
    }
  ],

  // 设计能力
  designSkills: [
    '用户研究', '数据分析', '设计系统', '增长设计', '全链路体验设计'
  ],

  // 作品数据
  works: [
    {
      id: 'esign-global',
      title: 'eSignGlobal 海外签',
      desc: '0-1打造跨境数字签名解决方案，服务全球用户，支持多语言多时区',
      tags: ['#B端', '#国际化', '#全链路', '#0-1'],
      color: 'work',
      image: 'assets/images/works/eSignGlabal.png'
    },
    {
      id: 'tianyin',
      title: '天印问题治理',
      desc: '系统性产品体验问题治理战役，通过数据驱动发现问题、跨部门协作解决问题',
      tags: ['#策略', '#数据驱动', '#跨部门', '#治理'],
      color: 'exp',
      image: 'assets/images/works/tianyin.png'
    },
    {
      id: 'digital-gov',
      title: '数字政府场景应用平台',
      desc: '电子签名与政务场景深度融合，降低使用门槛，提升政务服务效率',
      tags: ['#G端', '#场景化', '#降门槛', '#政务'],
      color: 'skill',
      image: 'assets/images/works/shuzheng.png'
    },
    {
      id: 'design-platform',
      title: 'e签宝设计中台',
      desc: '搭建支撑多条业务线的设计中台体系，提升团队协作效率',
      tags: ['#设计系统', '#中台', '#团队协作', '#效率'],
      color: 'contact',
      image: 'assets/images/works/zujian.png'
    }
  ],

  // 经历数据
  experiences: [
    {
      id: 'tiangu',
      company: '天谷信息科技有限公司',
      position: '体验设计师',
      period: '2021.08 - 至今',
      desc: '负责天印、eSignGlobal、数政等多条产品线全链路体验设计',
      highlights: ['海外签0-1', '问题治理战役', '设计系统搭建']
    },
    {
      id: 'digital-biandan',
      company: '数字扁担',
      position: '体验设计师',
      period: '2020.04 - 2021.08',
      desc: '智慧城市、数字孪生及低代码平台体验设计',
      highlights: ['智慧城市项目', '低代码平台', '数据可视化']
    },
    {
      id: 'university',
      company: '上海第二工业大学',
      position: '艺术设计 本科',
      period: '2010 - 2014',
      desc: '艺术设计专业学习，奠定设计思维基础',
      highlights: ['设计思维', '视觉表达', '用户研究']
    }
  ],

  // 联系方式
  contacts: [
    {
      id: 'email',
      type: 'email',
      label: '邮箱',
      value: 'shaqinyx@163.com',
      action: '点击复制邮箱',
      icon: '📧'
    },
    {
      id: 'wechat',
      type: 'wechat',
      label: '微信',
      value: 'qq1476685495',
      action: '点击添加好友',
      icon: '💬'
    }
  ],

  // 生活照片
  lifePhotos: [
    { id: 1, src: 'assets/images/life_main/601776184444_.pic.jpg', caption: '入职培训还未经历杀猪刀' },
    { id: 2, src: 'assets/images/life_main/561776184291_.pic.jpg', caption: '在海拔4000米的天宝雪山徒步18km' },
    { id: 3, src: 'assets/images/life_main/541776184289_.pic.jpg', caption: '徒手修电脑' },
    { id: 4, src: 'assets/images/life_main/631776190242_.pic.jpg', caption: '精致牛马' },
    { id: 5, src: 'assets/images/life_main/581776184293_.pic.jpg', caption: '奔赴山海' },
    { id: 6, src: 'assets/images/life_main/611776189823_.pic.jpg', caption: '上班OOTD' }
  ]
};

/**
 * 内容管理器
 */
class ContentManager {
  constructor() {
    this.data = ContentData;
  }

  /**
   * 获取技能内容HTML
   */
  getSkillsHTML() {
    return `
      <div class="panel-section">
        <h2 class="panel-title">
          <span class="panel-title-icon skill-block"></span>
          技能方块
        </h2>
        <p class="panel-subtitle">每项技能都是一块积木，组合起来解决复杂问题</p>

        <div class="skill-cards stagger-in">
          ${this.data.skills.map(skill => `
            <div class="skill-card">
              <div class="skill-card-header">
                <div class="skill-icon">${skill.icon}</div>
                <span class="skill-name">${skill.name}</span>
              </div>
              <p class="skill-desc">${skill.desc}</p>
              <div class="skill-tags">
                ${skill.tags.map(tag => `<span class="skill-tag">${tag}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel-section">
        <h3 class="panel-title" style="font-size: 1.1rem;">设计能力</h3>
        <div class="skill-tags" style="gap: 12px;">
          ${this.data.designSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 获取作品内容HTML
   */
  getWorksHTML() {
    return `
      <div class="panel-section">
        <h2 class="panel-title">
          <span class="panel-title-icon work-block"></span>
          作品方块
        </h2>
        <p class="panel-subtitle">每个项目都是一次拼图，将创意与需求完美契合</p>

        <div class="work-cards stagger-in">
          ${this.data.works.map(work => `
            <div class="work-card">
              <div class="work-image">
                <img src="${work.image}" alt="${work.title}" loading="lazy">
              </div>
              <div class="work-info">
                <h3 class="work-title">${work.title}</h3>
                <p class="work-desc">${work.desc}</p>
                <div class="work-tags">
                  ${work.tags.map(tag => `<span class="work-tag">${tag}</span>`).join('')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 获取经历内容HTML
   */
  getExperienceHTML() {
    return `
      <div class="panel-section">
        <h2 class="panel-title">
          <span class="panel-title-icon exp-block"></span>
          经历方块
        </h2>
        <p class="panel-subtitle">每段经历都是成长路上的重要一块</p>

        <div class="timeline stagger-in">
          ${this.data.experiences.map(exp => `
            <div class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-date">${exp.period}</div>
                <h3 class="timeline-title">${exp.position}</h3>
                <div class="timeline-company">${exp.company}</div>
                <p class="timeline-desc">${exp.desc}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 获取生活内容HTML
   */
  getLifeHTML() {
    return `
      <div class="panel-section">
        <h2 class="panel-title">
          <span class="panel-title-icon life-block"></span>
          生活方块
        </h2>
        <p class="panel-subtitle">左手精致牛马，右手丐版土著，怀揣远方和冒险。</p>

        <div class="life-gallery stagger-in">
          ${this.data.lifePhotos.map(photo => `
            <div class="life-photo">
              <img src="${photo.src}" alt="${photo.caption}" loading="lazy">
              <div class="life-photo-caption">${photo.caption}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 获取联系内容HTML
   */
  getContactHTML() {
    return `
      <div class="panel-section">
        <h2 class="panel-title">
          <span class="panel-title-icon contact-block"></span>
          联系方块
        </h2>
        <p class="panel-subtitle">每一条连接，都是一块积木</p>

        <div class="contact-items stagger-in">
          ${this.data.contacts.map(contact => `
            <div class="contact-item" data-type="${contact.type}" data-value="${contact.value}">
              <div class="contact-icon">${contact.icon}</div>
              <div class="contact-info">
                <div class="contact-label">${contact.label}</div>
                <div class="contact-value">${contact.value}</div>
              </div>
              <span class="contact-action">${contact.action}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="panel-section" style="margin-top: 24px; text-align: center;">
        <p style="color: var(--text-muted); font-size: 0.85rem;">
          期待与你建立连接 ✨
        </p>
      </div>
    `;
  }

  /**
   * 根据类型获取内容
   */
  getContent(type) {
    switch (type) {
      case 'skill':
        return this.getSkillsHTML();
      case 'work':
        return this.getWorksHTML();
      case 'experience':
        return this.getExperienceHTML();
      case 'life':
        return this.getLifeHTML();
      case 'contact':
        return this.getContactHTML();
      default:
        return '';
    }
  }
}

// 导出
window.ContentData = ContentData;
window.ContentManager = ContentManager;
