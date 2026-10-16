// Live canvas version of the sphere pieces (reference implementation, no dependencies).
// Geometry comes from sphere-data.json (exported from sphere.py); the light is recomputed in the browser.
//
//   import { mountSphere } from "./sphere-canvas.js";
//   const data = await (await fetch("/art/sphere-data.json")).json();
//   const s = mountSphere(canvas, data, { palette: "navy" });
//   s.setPalette("gel"); s.pause(); s.destroy();
//
// Behaviour: the light drifts slowly; pointer drag or arrow keys move it; it stops when
// prefers-reduced-motion is set or the canvas is off screen. Give the canvas role="img" and an aria-label
// (use the piece's alt text from manifest.json) and a static <img> fallback for no-JS.
//
// Cost control (the full redraw of 330 cells is the most expensive thing on the site): the drift runs
// at 30 frames per second and rests after `orbitMs` of visible time (default 26 s, one full loop of the
// light); dragging or the arrow keys still redraw at once, and play() starts the drift again.
export function mountSphere(canvas, data, opts = {}) {
  const { Rs, K, densifyStep: STEP } = data.params;
  const UMAX = (Rs * Math.PI) / 2 * 0.995;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let palette = opts.palette || "navy";
  let light = (opts.light || data.params.light).slice();
  const FRAME_MS = 1000 / 30, ORBIT_MS = opts.orbitMs ?? 26000;
  let orbit = opts.autoplay !== false && !reduce, dragging = false, visible = true, raf = 0, io;
  let last = 0, ran = 0, t0 = null;

  // Screen polygons and sphere normals do not depend on the light: build them once, as Path2D in canvas pixels.
  // Edges are cut into segments of about SEG pixels (a finer cut changes nothing visible but costs a lot per frame).
  const S = W / (2 * Rs * 1.04), c = W / 2, SEG = 10;
  const step = Math.max(STEP, SEG / S);
  const cells = data.cells.map(([star, cx, cy, flat]) => {
    const path = new Path2D(), n = flat.length / 2;
    let first = true;
    for (let i = 0; i < n; i++) {
      const ax = flat[2 * i], ay = flat[2 * i + 1], bx = flat[2 * ((i + 1) % n)], by = flat[2 * ((i + 1) % n) + 1];
      const m = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / step));
      for (let k = 0; k < m; k++) {
        const x = ax + ((bx - ax) * k) / m, y = ay + ((by - ay) * k) / m;
        const u = Math.hypot(x, y), s = (Rs * Math.sin(Math.min(u, UMAX) / Rs)) / (u + 1e-12);
        const X = c + x * s * S, Y = c - y * s * S;
        first ? path.moveTo(X, Y) : path.lineTo(X, Y);
        first = false;
      }
    }
    path.closePath();
    const uc = Math.hypot(cx, cy), uu = Math.min(uc, UMAX), rr = Rs * Math.sin(uu / Rs), fore = Math.cos(uu / Rs);
    return { star, path, nx: (cx / (uc + 1e-9)) * rr / Rs, ny: (cy / (uc + 1e-9)) * rr / Rs, nz: fore, line: W * 0.0034 * (0.25 + 0.75 * fore) };
  });

  // Only cells whose shade changed since the last frame are repainted (the light drifts slowly, so a few
  // cells per frame); a new palette or a first paint repaints everything.
  const shade = new Int8Array(cells.length).fill(-1);
  let shadedWith = null;
  function draw() {
    const p = data.palettes[palette], l = Math.hypot(...light);
    const L = light.map((v) => v / l);
    const all = shadedWith !== palette;
    if (all) { ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, W); ctx.lineJoin = "round"; ctx.strokeStyle = p.ink; shadedWith = palette; }
    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      const lam = Math.min(1, Math.max(0, cell.nx * L[0] + cell.ny * L[1] + cell.nz * L[2]));
      const idx = Math.min(K - 1, Math.max(0, Math.floor((0.06 + 0.94 * Math.pow(lam, 0.85)) * K)));
      if (!all && idx === shade[i]) continue;
      shade[i] = idx;
      ctx.fillStyle = (cell.star ? p.accent : p.base)[idx]; ctx.fill(cell.path);
      ctx.lineWidth = cell.line; ctx.stroke(cell.path);
    }
  }
  function tick(ts) {
    raf = 0;
    if (!orbit || dragging || !visible) return;
    if (t0 === null) t0 = ts - ran;
    ran = ts - t0;
    if (ran > ORBIT_MS) { orbit = false; return; }
    if (ts - last < FRAME_MS - 2) { raf = requestAnimationFrame(tick); return; }
    last = ts;
    const a = ran / 4200;
    light = [-0.55 + 0.5 * Math.cos(a), 0.6 + 0.35 * Math.sin(a * 1.3), 0.58];
    draw(); raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf && orbit && visible) { t0 = null; raf = requestAnimationFrame(tick); } };
  function fromPointer(e) {
    const r = canvas.getBoundingClientRect();
    light = [((e.clientX - r.left) / r.width - 0.5) * 2.2, -((e.clientY - r.top) / r.height - 0.5) * 2.2, 0.5]; draw();
  }
  const down = (e) => { dragging = true; try { canvas.setPointerCapture(e.pointerId); } catch {} fromPointer(e); };
  const move = (e) => { if (dragging) fromPointer(e); };
  const up = () => { dragging = false; };
  const key = (e) => {
    const d = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, 0.12], ArrowDown: [0, -0.12] }[e.key];
    if (!d) return; e.preventDefault(); orbit = false; light = [light[0] + d[0], light[1] + d[1], 0.5]; draw();
  };
  canvas.style.touchAction = "pan-y"; if (!canvas.hasAttribute("tabindex")) canvas.tabIndex = 0;
  canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up); canvas.addEventListener("keydown", key);
  if ("IntersectionObserver" in window) { io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible) kick(); }); io.observe(canvas); }
  draw(); kick();
  return {
    setPalette(id) { if (data.palettes[id]) { palette = id; draw(); } },
    setLight(v) { light = v.slice(); draw(); },
    play() { orbit = !reduce; ran = 0; kick(); },
    pause() { orbit = false; },
    destroy() {
      orbit = false; if (raf) cancelAnimationFrame(raf); io && io.disconnect();
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up); canvas.removeEventListener("keydown", key);
    },
  };
}
