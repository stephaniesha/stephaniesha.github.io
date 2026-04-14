import * as ogl from 'https://cdn.jsdelivr.net/npm/ogl@1.0.0/src/index.js/+esm';

const VERT = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAG = `#version 300 es
precision highp float;

uniform float uTime;
uniform float uAmplitude;
uniform vec3 uColorStops[3];
uniform vec2 uResolution;
uniform float uBlend;

out vec4 fragColor;

vec3 permute(vec3 x) {
  return mod(((x * 34.0) + 1.0) * x, 289.0);
}

float snoise(vec2 v){
  const vec4 C = vec4(
    0.211324865405187, 0.366025403784439,
    -0.577350269189626, 0.024390243902439
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);

  vec3 p = permute(
    permute(i.y + vec3(0.0, i1.y, 1.0))
    + i.x + vec3(0.0, i1.x, 1.0)
  );

  vec3 m = max(
    0.5 - vec3(
      dot(x0, x0),
      dot(x12.xy, x12.xy),
      dot(x12.zw, x12.zw)
    ),
    0.0
  );
  m = m * m;
  m = m * m;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

struct ColorStop {
  vec3 color;
  float position;
};

#define COLOR_RAMP(colors, factor, finalColor) {              \
  int index = 0;                                            \
  for (int i = 0; i < 2; i++) {                               \
    ColorStop currentColor = colors[i];                    \
    bool isInBetween = currentColor.position <= factor;    \
    index = int(mix(float(index), float(i), float(isInBetween))); \
  }                                                         \
  ColorStop currentColor = colors[index];                   \
  ColorStop nextColor = colors[index + 1];                  \
  float range = nextColor.position - currentColor.position; \
  float lerpFactor = (factor - currentColor.position) / range; \
  finalColor = mix(currentColor.color, nextColor.color, lerpFactor); \
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;

  ColorStop colors[3];
  colors[0] = ColorStop(uColorStops[0], 0.0);
  colors[1] = ColorStop(uColorStops[1], 0.5);
  colors[2] = ColorStop(uColorStops[2], 1.0);

  vec3 rampColor;
  COLOR_RAMP(colors, uv.x, rampColor);

  float height = snoise(vec2(uv.x * 2.0 + uTime * 0.1, uTime * 0.25)) * 0.5 * uAmplitude;
  height = exp(height);
  height = (uv.y * 2.0 - height + 0.2);
  float intensity = 0.6 * height;

  float midPoint = 0.20;
  float auroraAlpha = smoothstep(midPoint - uBlend * 0.5, midPoint + uBlend * 0.5, intensity);

  vec3 auroraColor = intensity * rampColor;

  fragColor = vec4(auroraColor * auroraAlpha, auroraAlpha);
}
`;

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ] : [0, 0, 0];
}

function initAurora() {
  const container = document.getElementById('aurora-container');
  if (!container) return;

  const { Renderer, Program, Mesh, Triangle } = ogl;

  const renderer = new Renderer({
    alpha: true,
    premultipliedAlpha: true,
    antialias: true
  });
  const gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.canvas.style.backgroundColor = 'transparent';

  let program;
  const props = {
    colorStops: ['#5227FF', '#9780FF', '#E296FF'],
    amplitude: 1.5,
    blend: 0.8,
    speed: 1.0
  };

  function resize() {
    const width = container.offsetWidth;
    const height = container.offsetHeight;
    renderer.setSize(width, height);
    if (program) {
      program.uniforms.uResolution.value = [width, height];
    }
  }
  window.addEventListener('resize', resize);

  const geometry = new Triangle(gl);
  if (geometry.attributes.uv) {
    delete geometry.attributes.uv;
  }

  const colorStopsArray = props.colorStops.map(hex => hexToRgb(hex));

  program = new Program(gl, {
    vertex: VERT,
    fragment: FRAG,
    uniforms: {
      uTime: { value: 0 },
      uAmplitude: { value: props.amplitude },
      uColorStops: { value: colorStopsArray },
      uResolution: { value: [container.offsetWidth, container.offsetHeight] },
      uBlend: { value: props.blend }
    }
  });

  const mesh = new Mesh(gl, { geometry, program });
  container.appendChild(gl.canvas);

  let startTime = performance.now();
  const update = () => {
    requestAnimationFrame(update);
    const t = (performance.now() - startTime) * 0.01;
    program.uniforms.uTime.value = t * props.speed * 0.1;
    renderer.render({ scene: mesh });
  };
  requestAnimationFrame(update);

  resize();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAurora);
} else {
  initAurora();
}

// ========================================
// 工具与能力区域 - 滚动触发依次飞入飞出动画
// ========================================
function initSkillsScrollAnimation() {
  const skillsSection = document.getElementById('philosophy');
  if (!skillsSection) return;

  // 使用 IntersectionObserver 监听区域进入/离开视口
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // 进入视口：添加飞入动画类，移除飞出类
        skillsSection.classList.remove('skills-exit');
        // 使用 setTimeout 确保 DOM 更新后添加，触发过渡动画
        setTimeout(() => {
          skillsSection.classList.add('skills-animated');
        }, 10);
      } else {
        // 离开视口：添加飞出动画，重置飞入
        skillsSection.classList.remove('skills-animated');
        setTimeout(() => {
          skillsSection.classList.add('skills-exit');
        }, 10);
      }
    });
  }, {
    // 阈值设置：当 25% 进入可见区域时触发入场
    // 当完全离开可见区域时触发离场
    threshold: 0.25,
    rootMargin: '0px 0px -10% 0px'
  });

  observer.observe(skillsSection);
}

// DOM 就绪后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSkillsScrollAnimation);
} else {
  initSkillsScrollAnimation();
}
