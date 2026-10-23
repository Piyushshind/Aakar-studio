// Hand-written WebGL2 renderer for the hero photo transition (spec 5 item 3; Phase 7).
// One full-screen triangle and one fragment shader: object-fit cover with each photo's focal
// point, a noise-displaced "liquid" wipe between two photos, and a faint ripple that follows the
// pointer. Textures come from <img> elements the page has already loaded (no second download).
// It renders only when asked; the caller drives frames while something is moving.

const VERT = `#version 300 es
out vec2 vUv;
void main() {
  // Full-screen triangle from the vertex id: no buffers needed.
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform vec2 uRes;
uniform vec2 uFromSize;
uniform vec2 uToSize;
uniform vec2 uFromFocus;
uniform vec2 uToFocus;
uniform float uProgress;
uniform float uTime;
uniform vec2 uPointer;
uniform float uRipple;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) { return 0.6 * noise(p) + 0.3 * noise(p * 2.1) + 0.1 * noise(p * 4.3); }

// object-fit: cover + object-position: focus (focus in CSS terms: 0,0 = top left).
vec2 cover(vec2 uv, vec2 img, vec2 focus) {
  float rc = uRes.x / uRes.y;
  float ri = img.x / img.y;
  vec2 s = rc > ri ? vec2(1.0, ri / rc) : vec2(rc / ri, 1.0);
  vec2 f = vec2(focus.x, 1.0 - focus.y);
  return uv * s + (1.0 - s) * f;
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;

  // Pointer ripple: a few soft rings, fading with distance and with uRipple.
  vec2 d = (uv - uPointer) * vec2(aspect, 1.0);
  float dist = length(d);
  uv += (dist > 0.0 ? d / dist : vec2(0.0)) * sin(dist * 38.0 - uTime * 3.0) * exp(-dist * 5.0) * uRipple * 0.0035;

  // Liquid wipe: a noisy front sweeps across, displacing both photos near it.
  float n = fbm(uv * 3.0 + uTime * 0.05);
  float front = uProgress * 1.5 - 0.25;
  float m = smoothstep(front - 0.18, front + 0.18, 1.0 - (uv.x * 0.7 + n * 0.45));
  float wave = sin(uProgress * 3.14159);
  vec2 shift = (vec2(n, fbm(uv * 3.0 + 7.0)) - 0.5) * 0.12 * wave;

  vec4 a = texture(uFrom, cover(uv + shift * (1.0 - m), uFromSize, uFromFocus));
  vec4 b = texture(uTo, cover(uv - shift * m, uToSize, uToFocus));
  outColor = mix(a, b, m);
}`;

export interface GLSlide {
  img: HTMLImageElement;
  /** CSS object-position as fractions, e.g. [0.46, 0.55]. */
  focus: [number, number];
}

export interface HeroGL {
  /** Show `from` alone (progress 0) or mid-way to `to`. */
  draw(from: GLSlide, to: GLSlide | null, progress: number, time: number): void;
  setPointer(x: number, y: number, strength: number): void;
  resize(): void;
  destroy(): void;
}

const MAX_DPR = 1.75;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    if (import.meta.env.DEV) console.warn('heroGL shader:', gl.getShaderInfoLog(s));
    return null;
  }
  return s;
}

/** Returns null when WebGL2 isn't available or fails to set up (the caller keeps the CSS fade). */
export function createHeroGL(canvas: HTMLCanvasElement, onLost: () => void): HeroGL | null {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);
  gl.bindVertexArray(gl.createVertexArray());

  const u = (name: string) => gl.getUniformLocation(program, name);
  const loc = {
    from: u('uFrom'),
    to: u('uTo'),
    res: u('uRes'),
    fromSize: u('uFromSize'),
    toSize: u('uToSize'),
    fromFocus: u('uFromFocus'),
    toFocus: u('uToFocus'),
    progress: u('uProgress'),
    time: u('uTime'),
    pointer: u('uPointer'),
    ripple: u('uRipple'),
  };
  gl.uniform1i(loc.from, 0);
  gl.uniform1i(loc.to, 1);

  const textures = new Map<string, WebGLTexture>();
  const texture = (img: HTMLImageElement) => {
    const key = img.currentSrc || img.src;
    let t = textures.get(key);
    if (t) return t;
    t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    textures.set(key, t);
    return t;
  };

  let pointer: [number, number, number] = [0.5, 0.5, 0];
  const lost = (e: Event) => {
    e.preventDefault();
    onLost();
  };
  canvas.addEventListener('webglcontextlost', lost);

  const api: HeroGL = {
    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(loc.res, w, h);
    },
    setPointer(x, y, strength) {
      pointer = [x, y, strength];
    },
    draw(from, to, progress, time) {
      const next = to ?? from;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture(from.img));
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texture(next.img));
      gl.uniform2f(loc.fromSize, from.img.naturalWidth, from.img.naturalHeight);
      gl.uniform2f(loc.toSize, next.img.naturalWidth, next.img.naturalHeight);
      gl.uniform2f(loc.fromFocus, ...from.focus);
      gl.uniform2f(loc.toFocus, ...next.focus);
      gl.uniform1f(loc.progress, to ? progress : 0);
      gl.uniform1f(loc.time, time);
      gl.uniform2f(loc.pointer, pointer[0], pointer[1]);
      gl.uniform1f(loc.ripple, pointer[2]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      canvas.removeEventListener('webglcontextlost', lost);
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteProgram(program);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
  api.resize();
  return api;
}
