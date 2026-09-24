"use client";

import { useEffect, useRef } from "react";

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uMouse;
uniform vec2 uResolution;
varying vec2 vUv;

// Simplex 2D noise
vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
    dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution.xy;
  st.x *= uResolution.x / uResolution.y;

  // Add mouse interaction
  float dist = distance(st, uMouse);
  float mouseEffect = smoothstep(0.5, 0.0, dist) * 1.5;

  vec2 pos = vec2(st * 4.0);

  float n = snoise(pos + uTime * 0.15 + mouseEffect);

  // Colors for a subtle paper/liquid look
  // Base color: #F3EEE3 (0.953, 0.933, 0.890)
  vec3 colorA = vec3(0.953, 0.933, 0.890);
  vec3 colorB = vec3(0.98, 0.97, 0.94);

  vec3 finalColor = mix(colorA, colorB, n * 0.5 + 0.5);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

/**
 * The landing's liquid paper: one full-screen noise shader that drifts over
 * time and swells a little around the pointer. Plain WebGL (it used to be
 * drawn through three.js / react-three-fiber, whose defaults this keeps:
 * drawing buffer at min(devicePixelRatio, 2), resolution uniform in CSS
 * pixels, pointer from the canvas eased 10% per frame, no colour
 * conversion). It only draws while `active` (the landing is on screen).
 */
export default function FluidBackground({ active = true }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const wakeRef = useRef<() => void>(() => {});
  useEffect(() => {
    activeRef.current = active;
    if (active) wakeRef.current();
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const attrs = { alpha: false, antialias: false, powerPreference: "high-performance" } as const;
    const gl = (canvas.getContext("webgl2", attrs) ?? canvas.getContext("webgl", attrs)) as WebGLRenderingContext | null;
    if (!gl) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, `precision highp float;\nattribute vec3 position;\nattribute vec2 uv;\n${vertexShader}`));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, `precision highp float;\n${fragmentShader}`));
    gl.linkProgram(program);
    gl.useProgram(program);

    // The full-screen quad, as two triangles (position xyz, uv).
    const quad = new Float32Array([-1, -1, 0, 0, 0, 1, -1, 0, 1, 0, -1, 1, 0, 0, 1, -1, 1, 0, 0, 1, 1, -1, 0, 1, 0, 1, 1, 0, 1, 1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, quad, gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "position");
    const uv = gl.getAttribLocation(program, "uv");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 20, 0);
    if (uv >= 0) {
      gl.enableVertexAttribArray(uv);
      gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 20, 12);
    }
    const uTime = gl.getUniformLocation(program, "uTime");
    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uResolution = gl.getUniformLocation(program, "uResolution");

    // Pointer in -1..1 over the canvas; starts at the centre.
    const pointer = { x: 0, y: 0 };
    const start = performance.now();
    const mouse = { x: 0.5, y: 0.5 };
    let width = 1;
    let height = 1;
    const draw = () => {
      const aspect = width / height;
      mouse.x += ((pointer.x + 1) / 2 * aspect - mouse.x) * 0.1;
      mouse.y += ((pointer.y + 1) / 2 - mouse.y) * 0.1;
      gl.uniform1f(uTime, (performance.now() - start) / 1000);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.uniform2f(uResolution, width, height);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const resize = () => {
      width = canvas.clientWidth || 1;
      height = canvas.clientHeight || 1;
      const dpr = Math.min(Math.max(1, window.devicePixelRatio || 1), 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      // Resizing clears the canvas: repaint at once, even while asleep, so it
      // never shows empty when the landing comes back into view.
      draw();
    };
    resize();
    const observer = new ResizeObserver(() => {
      resize();
      wake();
    });
    observer.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / height) * 2 + 1;
    };
    canvas.addEventListener("pointermove", onMove);

    let raf = 0;
    const frame = () => {
      raf = 0;
      if (!activeRef.current) return;
      draw();
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!raf && activeRef.current) raf = requestAnimationFrame(frame);
    };
    wakeRef.current = wake;
    wake();

    return () => {
      cancelAnimationFrame(raf);
      wakeRef.current = () => {};
      observer.disconnect();
      canvas.removeEventListener("pointermove", onMove);
      // Free what this effect made; the context itself stays with the canvas
      // (a remount, e.g. React's strict mode in development, gets it back).
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full pointer-events-auto">
      <canvas ref={canvasRef} className="block w-full h-full" />
    </div>
  );
}
