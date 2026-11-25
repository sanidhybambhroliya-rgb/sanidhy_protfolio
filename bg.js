// ===== BACKGROUND: uparthi niche padta Tetris blocks =====
(() => {
  const cv = document.getElementById("bgCanvas");
  if (!cv) return;
  const stage = document.getElementById("stage");
  const track = document.getElementById("track");
  const ctx = cv.getContext("2d");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const PIECES = 16;                       // ketla blocks ek sathe
  const SIZES = [22, 28, 34, 42];          // block nu size (px)
  const BLURS = [0, 1.5, 3.5];             // 0 = sharp (aagal), 3.5 = jhapsa (pachhal)
  const SHAPES = [
    [[0,0],[1,0],[2,0],[3,0]], [[0,0],[1,0],[0,1],[1,1]], [[1,0],[0,1],[1,1],[2,1]],
    [[1,0],[2,0],[0,1],[1,1]], [[0,0],[1,0],[1,1],[2,1]], [[0,0],[0,1],[1,1],[2,1]], [[2,0],[0,1],[1,1],[2,1]],
  ];
  let W = 0, H = 0, theme = "", cache = new Map(), list = [], frame = 0, last = 0;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  function rr(c, x, y, w, h, r) {
    c.beginPath(); c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  // ek block ni image ek var j banavi lo (fast chalva mate)
  function sprite(si, s, blur) {
    const key = si + "|" + s + "|" + blur;
    if (cache.has(key)) return cache.get(key);
    const shape = SHAPES[si], cols = Math.max(...shape.map(c => c[0])) + 1, rows = Math.max(...shape.map(c => c[1])) + 1;
    const pad = Math.ceil(blur * 3) + 4, w = cols * s + pad * 2, h = rows * s + pad * 2;
    const c = document.createElement("canvas"); c.width = w * dpr; c.height = h * dpr;
    const x = c.getContext("2d"); x.scale(dpr, dpr);
    if (blur) x.filter = "blur(" + blur + "px)";
    const dark = theme !== "light";
    shape.forEach(([cx, cy]) => {
      const px = pad + cx * s + 1.5, py = pad + cy * s + 1.5, sz = s - 3;
      x.fillStyle = dark ? "rgba(135,190,200,.55)" : "rgba(110,160,235,.75)";
      rr(x, px, py, sz, sz, s * 0.2); x.fill();
      const g = x.createLinearGradient(px, py, px + sz, py + sz);
      if (dark) { g.addColorStop(0, "rgba(255,170,220,.55)"); g.addColorStop(.5, "rgba(150,235,255,.35)"); g.addColorStop(1, "rgba(255,240,160,.5)"); }
      else { g.addColorStop(0, "rgba(255,255,255,.5)"); g.addColorStop(1, "rgba(80,130,220,.25)"); }
      x.fillStyle = g; rr(x, px, py, sz, sz, s * 0.2); x.fill();
      x.strokeStyle = dark ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.6)"; x.lineWidth = 1.2; x.stroke();
    });
    const out = { c, w, h }; cache.set(key, out); return out;
  }
  function spawn(p, fromTop) {
    const si = Math.floor(Math.random() * SHAPES.length), s = pick(SIZES), blur = pick(BLURS);
    Object.assign(p, {
      si, s, blur, spr: sprite(si, s, blur),
      x: rnd(0, W + 200), y: fromTop ? rnd(-250, -60) : rnd(-100, H),
      speed: rnd(22, 70) * (1 - blur * 0.08), alpha: blur ? rnd(.35, .6) : rnd(.6, .95),
      depth: rnd(.08, .35), rot: 0, rotT: 0, t: rnd(1, 5),
    });
    return p;
  }
  function resize() {
    W = stage.clientWidth; H = stage.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!list.length) for (let i = 0; i < PIECES; i++) list.push(spawn({}, false));
  }
  function loop(now) {
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    if (frame++ % 30 === 0 && stage.dataset.theme !== theme) {
      theme = stage.dataset.theme; cache.clear();
      list.forEach(p => p.spr = sprite(p.si, p.s, p.blur));
    }
    ctx.clearRect(0, 0, W, H);
    const sl = track.scrollLeft;
    list.forEach(p => {
      if (!reduce) {
        p.y += p.speed * dt; p.t -= dt;
        if (p.t < 0) { p.rotT += Math.PI / 2; p.t = rnd(2.5, 6); }   // kyarek 90° farey (Tetris jevu)
        p.rot += (p.rotT - p.rot) * (1 - Math.exp(-dt * 7));
        if (p.y - p.spr.h > H) spawn(p, true);
      }
      const px = (((p.x - sl * p.depth) % (W + 200)) + (W + 200)) % (W + 200) - 100;   // scroll sathe halke chale
      ctx.globalAlpha = p.alpha;
      ctx.save(); ctx.translate(px, p.y); ctx.rotate(p.rot);
      ctx.drawImage(p.spr.c, -p.spr.w / 2, -p.spr.h / 2, p.spr.w, p.spr.h);
      ctx.restore();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(loop);
  }
  theme = stage.dataset.theme;
  resize();
  new ResizeObserver(resize).observe(stage);
  requestAnimationFrame(loop);
})();
