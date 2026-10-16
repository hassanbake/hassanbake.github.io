// Draws the hero girih on a canvas: every line grows from its start to its end once, from the
// middle outwards (each line has its own delay), then the canvas stays as it is. With
// prefers-reduced-motion the finished pattern is painted at once and nothing is animated.
//
// lines: flat [x1, y1, x2, y2, delayMs, ...] in a 1440x640 box, scaled like
// preserveAspectRatio="xMidYMid slice". Mirroring for right-to-left pages is done in CSS.
const BOX_W = 1440;
const BOX_H = 640;
const BASE_DELAY = 300;
const DURATION = 2100;
const STROKE = "rgba(91, 157, 255, 0.7)"; // --ac at .7, as in the SVG version
const WIDTH = 1.5;

// cubic-bezier(.4, 0, .2, 1), the same easing the CSS version used
function ease(x) {
  const [x1, y1, x2, y2] = [0.4, 0, 0.2, 1];
  const bez = (t, a, b) => 3 * a * t * (1 - t) ** 2 + 3 * b * t * t * (1 - t) + t ** 3;
  let lo = 0, hi = 1, t = x;
  for (let i = 0; i < 18; i++) {
    t = (lo + hi) / 2;
    bez(t, x1, x2) < x ? (lo = t) : (hi = t);
  }
  return bez(t, y1, y2);
}
const EASE = Array.from({ length: 65 }, (_, i) => ease(i / 64));
const eased = (t) => EASE[Math.round(t * 64)];

export function drawGirih(canvas, lines, { animate = true } = {}) {
  const ctx = canvas.getContext("2d");
  const done = document.createElement("canvas");
  const dctx = done.getContext("2d");
  const count = lines.length / 5;
  const finished = new Uint8Array(count);
  let start = 0, raf = 0, w = 0, h = 0, k = 1, ox = 0, oy = 0, dpr = 1;

  const style = (c) => {
    c.lineCap = "round";
    c.strokeStyle = STROKE;
    c.lineWidth = WIDTH * k;
  };
  const line = (c, i, p) => {
    const x1 = ox + lines[i] * k, y1 = oy + lines[i + 1] * k;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x1 + (ox + lines[i + 2] * k - x1) * p, y1 + (oy + lines[i + 3] * k - y1) * p);
    c.stroke();
  };
  const progress = (i, now) => Math.min(1, Math.max(0, (now - start - BASE_DELAY - lines[i + 4]) / DURATION));

  function size() {
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = done.width = Math.max(1, Math.round(w * dpr));
    canvas.height = done.height = Math.max(1, Math.round(h * dpr));
    k = Math.max(w / BOX_W, h / BOX_H);
    ox = (w - BOX_W * k) / 2;
    oy = (h - BOX_H * k) / 2;
    for (const c of [ctx, dctx]) {
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      style(c);
    }
  }

  // Repaint everything that has finished by `now` (after a resize, or for the final state).
  function rebuild(now) {
    dctx.clearRect(0, 0, w, h);
    for (let n = 0; n < count; n++) {
      const t = progress(n * 5, now);
      finished[n] = t >= 1 ? 1 : 0;
      if (finished[n]) line(dctx, n * 5, 1);
    }
  }

  function frame(now) {
    raf = 0;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(done, 0, 0, w, h);
    let running = false;
    for (let n = 0; n < count; n++) {
      if (finished[n]) continue;
      const t = progress(n * 5, now);
      if (t >= 1) {
        finished[n] = 1;
        line(dctx, n * 5, 1);
        line(ctx, n * 5, 1);
      } else {
        running = true;
        if (t > 0) line(ctx, n * 5, eased(t));
      }
    }
    if (running) raf = requestAnimationFrame(frame);
  }

  function paintAll() {
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(done, 0, 0, w, h);
  }

  size();
  if (!animate) {
    start = -1e9;
    rebuild(0);
    paintAll();
  } else {
    start = performance.now();
    raf = requestAnimationFrame(frame);
  }

  if ("ResizeObserver" in window) {
    let first = true;
    new ResizeObserver(() => {
      if (first) return void (first = false);
      if (canvas.clientWidth === w && canvas.clientHeight === h) return;
      size();
      rebuild(performance.now());
      raf ? (cancelAnimationFrame(raf), (raf = requestAnimationFrame(frame))) : paintAll();
    }).observe(canvas);
  }
}
