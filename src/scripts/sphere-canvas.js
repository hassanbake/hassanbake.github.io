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
export function mountSphere(canvas, data, opts = {}) {
  const { Rs, K, densifyStep: STEP } = data.params;
  const UMAX = (Rs * Math.PI) / 2 * 0.995;
  const ctx = canvas.getContext("2d");
  const W = canvas.width;
  const reduce = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  let palette = opts.palette || "navy";
  let light = (opts.light || data.params.light).slice();
  let orbit = opts.autoplay !== false && !reduce, dragging = false, visible = true, raf = 0, io;

  // screen polygons and sphere normals do not depend on the light: compute once
  const cells = data.cells.map(([star, cx, cy, flat]) => {
    const pts = [], n = flat.length / 2;
    for (let i = 0; i < n; i++) {
      const ax = flat[2 * i], ay = flat[2 * i + 1], bx = flat[2 * ((i + 1) % n)], by = flat[2 * ((i + 1) % n) + 1];
      const m = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / STEP));
      for (let k = 0; k < m; k++) {
        const x = ax + ((bx - ax) * k) / m, y = ay + ((by - ay) * k) / m;
        const u = Math.hypot(x, y), s = (Rs * Math.sin(Math.min(u, UMAX) / Rs)) / (u + 1e-12);
        pts.push(x * s, y * s);
      }
    }
    const uc = Math.hypot(cx, cy), uu = Math.min(uc, UMAX), rr = Rs * Math.sin(uu / Rs);
    return { star, pts, nx: (cx / (uc + 1e-9)) * rr / Rs, ny: (cy / (uc + 1e-9)) * rr / Rs, nz: Math.cos(uu / Rs), fore: Math.cos(uu / Rs) };
  });

  function draw() {
    const p = data.palettes[palette], l = Math.hypot(...light), S = W / (2 * Rs * 1.04), c = W / 2;
    const L = light.map((v) => v / l);
    ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, W);
    ctx.lineJoin = "round"; ctx.strokeStyle = p.ink;
    for (const cell of cells) {
      const lam = Math.min(1, Math.max(0, cell.nx * L[0] + cell.ny * L[1] + cell.nz * L[2]));
      const idx = Math.min(K - 1, Math.max(0, Math.floor((0.06 + 0.94 * Math.pow(lam, 0.85)) * K)));
      ctx.beginPath();
      for (let j = 0; j < cell.pts.length; j += 2) {
        const X = c + cell.pts[j] * S, Y = c - cell.pts[j + 1] * S;
        j === 0 ? ctx.moveTo(X, Y) : ctx.lineTo(X, Y);
      }
      ctx.closePath();
      ctx.fillStyle = (cell.star ? p.accent : p.base)[idx]; ctx.fill();
      ctx.lineWidth = W * 0.0034 * (0.25 + 0.75 * cell.fore); ctx.stroke();
    }
  }
  function tick(ts) {
    raf = 0;
    if (!orbit || dragging || !visible) return;
    const a = ts / 4200;
    light = [-0.55 + 0.5 * Math.cos(a), 0.6 + 0.35 * Math.sin(a * 1.3), 0.58];
    draw(); raf = requestAnimationFrame(tick);
  }
  const kick = () => { if (!raf && orbit && visible) raf = requestAnimationFrame(tick); };
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
    play() { orbit = !reduce; kick(); },
    pause() { orbit = false; },
    destroy() {
      orbit = false; if (raf) cancelAnimationFrame(raf); io && io.disconnect();
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up); canvas.removeEventListener("keydown", key);
    },
  };
}
