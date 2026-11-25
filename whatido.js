// ===== WHAT I DO: 3 animated visuals =====
(() => {
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // slide dekhati hoy tyare j animation chale (CPU bachave)
  function watch(el, cb) {
    if (!("IntersectionObserver" in window)) { cb(true); return; }
    new IntersectionObserver(es => cb(es[0].isIntersecting), { threshold: 0.05 }).observe(el);
  }

  // ---------- 1) PRODUCT DESIGN: auto-play Tetris (uparthi ave, gothvai jay) ----------
  (() => {
    const cv = document.getElementById("tetCanvas"); if (!cv) return;
    const ctx = cv.getContext("2d"), dpr = Math.min(2, window.devicePixelRatio || 1);
    const COLS = 8, ROWS = 10, C = 24, PAD = 12, W = COLS * C + PAD * 2, H = ROWS * C + PAD * 2;
    cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    const BASE = [
      { n: 4, c: [[0,1],[1,1],[2,1],[3,1]] }, { n: 2, c: [[0,0],[1,0],[0,1],[1,1]] },
      { n: 3, c: [[1,0],[0,1],[1,1],[2,1]] }, { n: 3, c: [[1,0],[2,0],[0,1],[1,1]] },
      { n: 3, c: [[0,0],[1,0],[1,1],[2,1]] }, { n: 3, c: [[0,0],[0,1],[1,1],[2,1]] },
      { n: 3, c: [[2,0],[0,1],[1,1],[2,1]] },
    ];
    const PAL = [["#6ef4ff", "#ff9ae6", "#fff0b8"], ["#ffffff", "#a6f2ff", "#ff9ae6"], ["#ff9ae6", "#d2a6ff", "#ffeaa6"]];
    const TICK = 0.12;
    let board, cur = null, tgt = null, acc = 0, clearing = null, over = 0, vis = true, last = 0;

    const rotate = (cells, n, r) => { let c = cells; for (let i = 0; i < r; i++) c = c.map(([x, y]) => [n - 1 - y, x]); return c; };
    const emptyBoard = () => Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    const cellsOf = (p, r = p.rot, x = p.x, y = p.y) => rotate(BASE[p.t].c, BASE[p.t].n, r).map(([cx, cy]) => [cx + x, cy + y]);
    const hit = cells => cells.some(([x, y]) => x < 0 || x >= COLS || y >= ROWS || (y >= 0 && board[y][x]));

    function evaluate(b) {
      const hs = Array(COLS).fill(0); let holes = 0, lines = 0, bump = 0;
      for (let x = 0; x < COLS; x++) { let seen = false;
        for (let y = 0; y < ROWS; y++) { if (b[y][x]) { if (!seen) { hs[x] = ROWS - y; seen = true; } } else if (seen) holes++; } }
      for (let y = 0; y < ROWS; y++) if (b[y].every(Boolean)) lines++;
      for (let x = 0; x < COLS - 1; x++) bump += Math.abs(hs[x] - hs[x + 1]);
      return -0.51 * hs.reduce((a, v) => a + v, 0) + 0.76 * lines - 0.36 * holes - 0.18 * bump;
    }
    function plan(p) {
      let best = null;
      for (let r = 0; r < 4; r++) {
        const cs = rotate(BASE[p.t].c, BASE[p.t].n, r), xs = cs.map(c => c[0]), minx = Math.min(...xs), maxx = Math.max(...xs);
        for (let x = -minx; x <= COLS - 1 - maxx; x++) {
          let y = -4; if (hit(cellsOf(p, r, x, y))) continue;
          while (!hit(cellsOf(p, r, x, y + 1))) y++;
          const cells = cellsOf(p, r, x, y); if (cells.some(c => c[1] < 0)) continue;
          const b = board.map(row => row.slice()); cells.forEach(([cx, cy]) => b[cy][cx] = 1);
          const s = evaluate(b) + Math.random() * 0.15;
          if (!best || s > best.s) best = { s, r, x };
        }
      }
      return best;
    }
    function spawn() {
      const t = Math.floor(Math.random() * 7);
      cur = { t, rot: 0, x: Math.floor((COLS - BASE[t].n) / 2), y: -3, pal: t % 3 };
      tgt = plan(cur);
      if (!tgt) { cur = null; over = 0.9; }
    }
    function fullRows() { const f = []; board.forEach((r, y) => { if (r.every(Boolean)) f.push(y); }); return f; }
    function removeRows(rows) {
      board = board.filter((_, y) => !rows.includes(y));
      while (board.length < ROWS) board.unshift(Array(COLS).fill(0));
    }
    function lockPiece() {
      const cs = cellsOf(cur);
      if (cs.some(c => c[1] < 0)) { cur = null; over = 0.9; return; }
      cs.forEach(([x, y]) => board[y][x] = cur.pal + 1);
      cur = null;
      const f = fullRows();
      if (f.length) clearing = { rows: f, t: 0.3 }; else spawn();
    }
    function step() {
      if (cur.rot !== tgt.r) { const nr = (cur.rot + 1) % 4; if (!hit(cellsOf(cur, nr))) cur.rot = nr; }
      else if (cur.x !== tgt.x) { const nx = cur.x + Math.sign(tgt.x - cur.x); if (!hit(cellsOf(cur, cur.rot, nx))) cur.x = nx; }
      if (!hit(cellsOf(cur, cur.rot, cur.x, cur.y + 1))) cur.y++; else lockPiece();
    }
    function update(dt) {
      if (over > 0) { over -= dt; if (over <= 0) { board = emptyBoard(); spawn(); } return; }
      if (clearing) { clearing.t -= dt; if (clearing.t <= 0) { removeRows(clearing.rows); clearing = null; spawn(); } return; }
      acc += dt; while (acc >= TICK && cur) { acc -= TICK; step(); }
    }

    function cell(px, py, pal, filled, alpha) {
      const s = C - 3, r = 4;
      ctx.save(); ctx.translate(px + 1.5, py + 1.5); ctx.globalAlpha = alpha;
      ctx.beginPath(); ctx.roundRect(0, 0, s, s, r);
      if (filled) {
        const g = ctx.createLinearGradient(0, 0, s, s);
        g.addColorStop(0, pal[0]); g.addColorStop(.55, pal[1]); g.addColorStop(1, pal[2]);
        ctx.shadowColor = "rgba(255,170,235,.65)"; ctx.shadowBlur = 16; ctx.fillStyle = g; ctx.fill();
        ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1; ctx.stroke();
      } else {
        const g = ctx.createLinearGradient(0, 0, 0, s);
        g.addColorStop(0, "rgba(70,170,180,.55)"); g.addColorStop(1, "rgba(120,110,130,.35)");
        ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "rgba(140,230,235,.3)"; ctx.lineWidth = 1; ctx.stroke();
      }
      ctx.restore();
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const flash = clearing && Math.floor(clearing.t * 20) % 2 === 0, dead = over > 0 && Math.floor(over * 10) % 2 === 0;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
        const v = board[y][x], px = PAD + x * C, py = PAD + y * C;
        if (!v) { cell(px, py, null, false, 1); continue; }
        const white = (clearing && clearing.rows.includes(y) && flash) || dead;
        cell(px, py, white ? ["#fff", "#fff", "#fff"] : PAL[v - 1], true, 1);
      }
      if (cur) {
        const fy = !hit(cellsOf(cur, cur.rot, cur.x, cur.y + 1)) ? acc / TICK : 0;
        cellsOf(cur).forEach(([x, y]) => cell(PAD + x * C, PAD + (y + fy) * C, PAL[cur.pal], true, 1));
      }
    }
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (vis && !REDUCE) { update(dt); draw(); }
      requestAnimationFrame(frame);
    }

    board = emptyBoard();
    for (let i = 0; i < 7; i++) {      // shuru ma thoda blocks pehla thi goththela
      spawn(); if (!cur) break;
      cur.rot = tgt.r; cur.x = tgt.x; let y = -3;
      while (!hit(cellsOf(cur, cur.rot, cur.x, y + 1))) y++;
      cur.y = y; cellsOf(cur).forEach(([x, yy]) => { if (yy >= 0) board[yy][x] = cur.pal + 1; });
      const f = fullRows(); if (f.length) removeRows(f);
    }
    over = 0; spawn();
    draw();
    watch(cv, v => vis = v);
    requestAnimationFrame(frame);
  })();

  // ---------- 2) COLOR AND CRAFT: pencil pote j dore chhe ----------
  (() => {
    const win = document.getElementById("paintWin"), fit = document.getElementById("paintFit"); if (!win) return;
    const TOOLS = ["✧", "▭", "◧", "◐", "⌕", "✎", "▮", "A", "╲", "∿", "□", "◇", "○", "▢"];
    const COLORS = ["#06323d","#6b6b9a","#ee6a44","#a5a540","#3aa55a","#0f6a6a","#3a4fb0","#9a5fc8","#b8a45c","#13544f","#38e0e8","#4c8bd0","#a8a8ff","#d98a3a",
                    "#ffffff","#e8e8ff","#ffa070","#f0e060","#a0f0b0","#b0fff0","#80c0ff","#ff9ad0","#fff0a0","#c0ffe0","#e0ffff","#e0d0ff","#ffd0d0","#ffd8a0"];
    win.innerHTML =
      '<div class="pw-title"><span class="pw-ico"></span><span>untitled - Paint</span><span class="pw-btns"><i>_</i><i>▢</i><i>×</i></span></div>' +
      '<div class="pw-menu"><span><u>F</u>ile</span><span><u>E</u>dit</span><span><u>V</u>iew</span><span><u>I</u>mage</span><span><u>O</u>ptions</span><span><u>H</u>elp</span></div>' +
      '<div class="pw-tools">' + TOOLS.map((t, i) => '<i' + (i === 5 ? ' class="on"' : '') + '>' + t + '</i>').join("") + '</div>' +
      '<div class="pw-canvas"><svg id="paintSvg" viewBox="0 0 436 248" fill="none" stroke="#0b3d45" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
        '<g id="paintArt">' +
          '<path d="M118 92 C96 66 112 34 142 38 C168 42 172 74 156 90"/>' +
          '<path d="M256 78 C262 44 298 32 320 52 C338 72 322 100 296 100"/>' +
          '<path d="M140 128 C138 78 180 66 222 74 C268 84 296 124 276 160 C256 196 196 202 168 172 C150 156 140 142 140 128 Z"/>' +
          '<path d="M184 116 a3 4.5 0 1 0 6 0 a3 4.5 0 1 0 -6 0"/>' +
          '<path d="M236 116 a3 4.5 0 1 0 6 0 a3 4.5 0 1 0 -6 0"/>' +
          '<path d="M205 136 a6 5 0 1 0 12 0 a6 5 0 1 0 -12 0"/>' +
          '<path d="M184 150 C198 170 232 170 246 148"/>' +
          '<text id="paintText" x="218" y="228" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="21" font-weight="500" fill="#0b3d45" stroke="none"></text>' +
        '</g>' +
        '<g id="pencil" stroke="none"><g transform="rotate(38)"><polygon points="0,0 -3.4,-10 3.4,-10" fill="#f2c9a0"/><polygon points="0,0 -1.3,-4 1.3,-4" fill="#222"/>' +
          '<rect x="-3.4" y="-36" width="6.8" height="26" fill="#ffd23f"/><rect x="-3.4" y="-38" width="6.8" height="3" fill="#aab"/><rect x="-3.4" y="-44" width="6.8" height="6" fill="#ff8fb8"/></g></g>' +
      '</svg></div><div class="pw-vs"></div><div class="pw-hs"></div>' +
      '<div class="pw-pal"><b class="pw-cur"></b><div class="pw-sw">' + COLORS.map(c => '<i style="background:' + c + '"></i>').join("") + '</div></div>' +
      '<div class="pw-status"><span>For Help, click Help Topics on the Help Menu.</span><span id="paintXY">250,30</span></div>' +
      '<div class="pw-tag">Sketch first, pixels later</div>';

    const ro = new ResizeObserver(() => {
      win.style.setProperty("--k", Math.max(0.2, Math.min(fit.clientWidth / 600, fit.clientHeight / 440)));
    });
    ro.observe(fit);

    const art = document.getElementById("paintArt"), txt = document.getElementById("paintText"),
          pencil = document.getElementById("pencil"), xy = document.getElementById("paintXY");
    const paths = [...art.querySelectorAll("path")];
    const FULL = "hello, i'm Sanidhy";
    let bb = { x: 130, width: 176 };
    try { txt.textContent = FULL; const b = txt.getBBox(); if (b.width) bb = { x: b.x, width: b.width }; } catch (e) {}
    txt.textContent = "";
    const BASE_Y = 228;

    const segs = []; let T = 0, pos = { x: 218, y: 230 };
    const add = (kind, dur, d) => { segs.push(Object.assign({ kind, t0: T, t1: T + dur }, d)); T += dur; };
    paths.forEach(p => {
      const len = p.getTotalLength(), s = p.getPointAtLength(0), e = p.getPointAtLength(len);
      p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      add("move", 0.22, { from: pos, to: { x: s.x, y: s.y } });
      add("draw", Math.max(0.3, len / 170), { el: p, len });
      pos = { x: e.x, y: e.y };
    });
    add("move", 0.3, { from: pos, to: { x: bb.x, y: BASE_Y } });
    add("type", FULL.length * 0.09, {});
    const HOLD = 1.8, FADE = 0.5, CYCLE = T + HOLD + FADE;
    const ease = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

    function render(tl) {
      let pt = { x: bb.x + bb.width, y: BASE_Y };
      for (const s of segs) {
        const p = Math.min(1, Math.max(0, (tl - s.t0) / (s.t1 - s.t0)));
        if (s.kind === "draw") s.el.style.strokeDashoffset = s.len * (1 - p);
        if (s.kind === "type") txt.textContent = FULL.slice(0, Math.floor(p * FULL.length));
        if (tl >= s.t0 && tl < s.t1) {
          if (s.kind === "move") { const k = ease(p); pt = { x: s.from.x + (s.to.x - s.from.x) * k, y: s.from.y + (s.to.y - s.from.y) * k }; }
          else if (s.kind === "draw") pt = s.el.getPointAtLength(p * s.len);
          else pt = { x: bb.x + bb.width * p, y: BASE_Y };
        }
      }
      const fade = tl > T + HOLD ? 1 - (tl - T - HOLD) / FADE : 1;
      art.style.opacity = pencil.style.opacity = Math.max(0, fade);
      pencil.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
      xy.textContent = Math.round(pt.x) + "," + Math.round(pt.y);
    }

    if (REDUCE) {
      paths.forEach(p => p.style.strokeDashoffset = 0); txt.textContent = FULL; pencil.style.display = "none"; return;
    }
    let vis = true, tl = 0, last = 0;
    watch(fit, v => vis = v);
    (function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (vis) { tl = (tl + dt) % CYCLE; render(tl); }
      requestAnimationFrame(loop);
    })(performance.now());
  })();

  // ---------- 3) PACKAGING DESIGN: cubes pote farey chhe ----------
  (() => {
    const box = document.getElementById("cubes"); if (!box) return;
    const faces = ["fr", "bk", "rt", "lf", "tp", "bt"];
    for (let i = 0; i < 9; i++) {
      const c = document.createElement("div"); c.className = "cube"; c.style.setProperty("--i", i);
      faces.forEach(f => { const d = document.createElement("div"); d.className = "f " + f; c.append(d); });
      box.append(c);
    }
  })();
})();
