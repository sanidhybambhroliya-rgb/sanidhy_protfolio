// ===== MAZE GAME (Home section) =====
(() => {
  const cv = document.getElementById("pacCanvas");
  if (!cv) return;

  const HERO_TEXT = "PLAY WITH DESIGN";   // <-- maze ni vachhe je text dekhase te ahiya badlo

  // Maze (aadhu bhag). '#' = diwal, '.' = dot, 'o' = power pellet, 'x' = khali jagya (text mate)
  const half = [
    "#############",
    "#o....#.....#",
    "#.###.#.###..",
    "#.....#......",
    "#.###.#####.#",
    "#............",
    "#xxxxxxxxxxxx",
    "#xxxxxxxxxxxx",
    "#xxxxxxxxxxxx",
    "#............",
    "#.###.#####.#",
    "#.....#......",
    "#.###.#.###..",
    "#o....#.....#",
    "#############",
  ];
  const MAP = half.map(r => r + r.slice(0, 12).split("").reverse().join(""));
  const ROWS = MAP.length, COLS = MAP[0].length, T = 28, W = COLS * T, H = ROWS * T;
  const DIRS = [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
  const GHOST_COLORS = ["#ffffff", "#ffb3e6", "#9ff3ff", "#ffd27a"];

  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = W * dpr; cv.height = H * dpr;
  const ctx = cv.getContext("2d");
  ctx.scale(dpr, dpr);

  const stage = document.getElementById("stage");
  const track = document.getElementById("track");
  const home = document.getElementById("home");
  const livesEl = document.getElementById("pacLives");
  const statusEl = document.getElementById("pacStatus");

  let grid, dotsLeft, score = 0, lives = 3, state = "idle";
  let pac, ghosts, want = {x:-1,y:0}, freeze = 0, frightT = 0, face = Math.PI;
  let colors = null, wallCanvas = null, last = 0, frameNo = 0;

  const isWall = (x, y) => x < 0 || y < 0 || x >= COLS || y >= ROWS || grid[y][x] === "#";

  // ---------- setup ----------
  function newGrid() {
    grid = MAP.map(r => r.replace(/x/g, " ").split(""));
    // jya pahochi na shakay evi dots kadhi nakho
    const seen = new Set(), q = [[12, 11]];
    seen.add("12,11");
    while (q.length) {
      const [x, y] = q.shift();
      DIRS.forEach(d => {
        const nx = x + d.x, ny = y + d.y, k = nx + "," + ny;
        if (!isWall(nx, ny) && !seen.has(k)) { seen.add(k); q.push([nx, ny]); }
      });
    }
    dotsLeft = 0;
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (grid[y][x] === "." || grid[y][x] === "o") {
        if (seen.has(x + "," + y)) dotsLeft++; else grid[y][x] = " ";
      }
    }
  }
  const mk = (tx, ty, speed, extra) => Object.assign({tx, ty, nx: tx, ny: ty, p: 0, dx: 0, dy: 0, speed}, extra);
  function resetActors() {
    pac = mk(12, 11, 6.2, {arrive: eat});
    ghosts = [[6,7],[12,7],[18,7],[12,8]].map((s, i) => mk(s[0], s[1], 4.8, {color: GHOST_COLORS[i]}));
    want = {x: -1, y: 0}; face = Math.PI;
  }
  const pos = e => ({x: e.tx + (e.nx - e.tx) * e.p, y: e.ty + (e.ny - e.ty) * e.p});

  // ---------- movement ----------
  function move(e, dt, choose) {
    if (e.nx === e.tx && e.ny === e.ty) {
      choose(e);
      if (e.nx === e.tx && e.ny === e.ty) { e.p = 0; return; }
    }
    e.p += e.speed * dt;
    while (e.p >= 1) {
      e.p -= 1; e.tx = e.nx; e.ty = e.ny;
      if (e.arrive) e.arrive(e);
      choose(e);
      if (e.nx === e.tx && e.ny === e.ty) { e.p = 0; break; }
    }
  }
  function pacChoose(e) {
    if ((want.x || want.y) && !isWall(e.tx + want.x, e.ty + want.y)) { e.dx = want.x; e.dy = want.y; }
    if ((!e.dx && !e.dy) || isWall(e.tx + e.dx, e.ty + e.dy)) { e.dx = 0; e.dy = 0; }
    e.nx = e.tx + e.dx; e.ny = e.ty + e.dy;
  }
  // DEMO (auto-play): koi click na kare tyare Pac-Man pote j rame chhe
  let demoReset = false;
  function demoChoose(e) {
    const danger = new Set();
    if (frightT <= 0) ghosts.forEach(g => {
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++)
        if (Math.abs(dx) + Math.abs(dy) <= 2) danger.add((g.tx + dx) + "," + (g.ty + dy));
    });
    const moving = e.dx || e.dy, q = [], seen = new Set([e.tx + "," + e.ty]);
    DIRS.forEach(d => {
      const nx = e.tx + d.x, ny = e.ty + d.y, k = nx + "," + ny;
      if (isWall(nx, ny) || danger.has(k) || (moving && d.x === -e.dx && d.y === -e.dy)) return;
      seen.add(k); q.push({ x: nx, y: ny, d });
    });
    let best = null;
    while (q.length) {
      const c = q.shift(), ch = grid[c.y][c.x];
      if (ch === "." || ch === "o") { best = c.d; break; }
      DIRS.forEach(d => {
        const nx = c.x + d.x, ny = c.y + d.y, k = nx + "," + ny;
        if (isWall(nx, ny) || seen.has(k) || danger.has(k)) return;
        seen.add(k); q.push({ x: nx, y: ny, d: c.d });
      });
    }
    if (!best) {
      const opts = DIRS.filter(d => !isWall(e.tx + d.x, e.ty + d.y));
      const safe = opts.filter(d => !danger.has((e.tx + d.x) + "," + (e.ty + d.y)));
      const pool = safe.length ? safe : opts;
      best = pool[Math.floor(Math.random() * pool.length)];
    }
    e.dx = best.x; e.dy = best.y; e.nx = e.tx + best.x; e.ny = e.ty + best.y;
  }
  function ghostChoose(g) {
    let opts = DIRS.filter(d => !isWall(g.tx + d.x, g.ty + d.y) && !(d.x === -g.dx && d.y === -g.dy));
    if (!opts.length) opts = DIRS.filter(d => !isWall(g.tx + d.x, g.ty + d.y));
    if (!opts.length) return;
    const dist = d => Math.hypot(g.tx + d.x - pac.tx, g.ty + d.y - pac.ty);
    const pick = (frightT > 0 || Math.random() < 0.4)
      ? opts[Math.floor(Math.random() * opts.length)]
      : opts.reduce((b, d) => dist(d) < dist(b) ? d : b);
    g.dx = pick.x; g.dy = pick.y; g.nx = g.tx + pick.x; g.ny = g.ty + pick.y;
  }
  function eat(e) {
    const c = grid[e.ty][e.tx];
    if (c === ".") { grid[e.ty][e.tx] = " "; score += 10; dotsLeft--; }
    else if (c === "o") { grid[e.ty][e.tx] = " "; score += 50; dotsLeft--; frightT = 6; }
    else return;
    if (state === "play") statusEl.textContent = "score " + score + " · use arrow keys";
    if (dotsLeft <= 0) { if (state === "idle") demoReset = true; else setState("win"); }
  }
  function setWant(x, y) {
    want = {x, y};
    if ((pac.dx || pac.dy) && pac.dx === -x && pac.dy === -y) {   // ulti disha: turat vali jao
      [pac.tx, pac.nx] = [pac.nx, pac.tx]; [pac.ty, pac.ny] = [pac.ny, pac.ty];
      pac.p = 1 - pac.p; pac.dx = x; pac.dy = y;
    }
  }

  // ---------- state ----------
  function drawLives() {
    livesEl.innerHTML = "";
    for (let i = 0; i < lives; i++) { const s = document.createElement("span"); s.className = "life"; livesEl.appendChild(s); }
  }
  function setState(s) {
    state = s; window.pacPlaying = (s === "play");
    statusEl.textContent = {
      idle: "click the maze to play",
      play: "score " + score + " · use arrow keys",
      paused: "paused · click to resume",
      over: "game over · score " + score + " · click to retry",
      win: "you win! · click to play again",
    }[s];
  }
  function startGame() {
    newGrid(); score = 0; lives = 3; frightT = 0; resetActors(); drawLives(); freeze = 1; setState("play");
  }

  // ---------- input ----------
  const KEYS = {ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0],w:[0,-1],s:[0,1],a:[-1,0],d:[1,0]};
  window.addEventListener("keydown", e => {
    if (state !== "play") return;
    if (e.key === "Escape") { setState("paused"); return; }
    const d = KEYS[e.key] || KEYS[e.key.toLowerCase()];
    if (!d) return;
    e.preventDefault(); setWant(d[0], d[1]);
  }, true);
  cv.addEventListener("click", () => {
    if (state === "idle" || state === "over" || state === "win") startGame();
    else if (state === "paused") setState("play");
  });
  let tx0 = 0, ty0 = 0;
  cv.addEventListener("touchstart", e => { tx0 = e.touches[0].clientX; ty0 = e.touches[0].clientY; }, {passive: true});
  cv.addEventListener("touchend", e => {
    if (state !== "play") return;
    const dx = e.changedTouches[0].clientX - tx0, dy = e.changedTouches[0].clientY - ty0;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 20) return;
    if (Math.abs(dx) > Math.abs(dy)) setWant(Math.sign(dx), 0); else setWant(0, Math.sign(dy));
  }, {passive: true});

  // ---------- drawing ----------
  function readColors() {
    const cs = getComputedStyle(stage), dark = stage.dataset.theme !== "light";
    return {
      line: cs.getPropertyValue("--line").trim() || "#e8ff00",
      ink: cs.getPropertyValue("--ink").trim() || "#e8ff00",
      hero: cs.getPropertyValue("--hero").trim() || "#ffffff",
      dot: dark ? "#35d6d0" : "#3a7ab5",
    };
  }
  function buildWalls() {
    wallCanvas = document.createElement("canvas");
    wallCanvas.width = W * dpr; wallCanvas.height = H * dpr;
    const w = wallCanvas.getContext("2d"); w.scale(dpr, dpr);
    w.lineWidth = 3; w.lineCap = "round"; w.strokeStyle = colors.line;
    w.shadowColor = colors.line; w.shadowBlur = 8;
    const seg = (a, b, c, d) => { w.beginPath(); w.moveTo(a, b); w.lineTo(c, d); w.stroke(); };
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (grid[y][x] !== "#") continue;
      const px = x * T, py = y * T;
      if (y > 0 && !isWall(x, y - 1)) seg(px, py, px + T, py);
      if (y < ROWS - 1 && !isWall(x, y + 1)) seg(px, py + T, px + T, py + T);
      if (x > 0 && !isWall(x - 1, y)) seg(px, py, px, py + T);
      if (x < COLS - 1 && !isWall(x + 1, y)) seg(px + T, py, px + T, py + T);
    }
  }
  function drawHero() {
    let size = 40; ctx.font = "700 " + size + "px Inter, system-ui, sans-serif";
    const gap = 8, widths = () => [...HERO_TEXT].map(c => ctx.measureText(c).width);
    let ws = widths(), total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
    if (total > W - 100) { size *= (W - 100) / total; ctx.font = "700 " + size + "px Inter, system-ui, sans-serif"; ws = widths(); total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1); }
    ctx.fillStyle = colors.hero; ctx.textAlign = "left"; ctx.textBaseline = "middle";
    let x = (W - total) / 2;
    [...HERO_TEXT].forEach((c, i) => { ctx.fillText(c, x, H / 2); x += ws[i] + gap; });
  }
  function drawPac(ts) {
    const p = pos(pac), cx = p.x * T + T / 2, cy = p.y * T + T / 2;
    if (pac.dx || pac.dy) face = Math.atan2(pac.dy, pac.dx);
    const m = ((state === "play" || state === "idle") && freeze <= 0) ? 0.05 + 0.28 * Math.abs(Math.sin(ts / 90)) : 0.25;
    ctx.save(); ctx.shadowColor = colors.ink; ctx.shadowBlur = 10; ctx.fillStyle = colors.ink;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 12, face + m * Math.PI, face + (2 - m) * Math.PI); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  function drawGhost(g, ts) {
    const p = pos(g), cx = p.x * T + T / 2, cy = p.y * T + T / 2, r = 11;
    const fr = frightT > 0, flash = fr && frightT < 2 && Math.floor(ts / 200) % 2;
    ctx.fillStyle = fr ? (flash ? "#ffffff" : "#3b5bdb") : g.color;
    ctx.beginPath(); ctx.arc(cx, cy - 1, r, Math.PI, 0);
    ctx.lineTo(cx + r, cy + r); ctx.lineTo(cx + r * .66, cy + r - 4); ctx.lineTo(cx + r * .33, cy + r);
    ctx.lineTo(cx, cy + r - 4); ctx.lineTo(cx - r * .33, cy + r); ctx.lineTo(cx - r * .66, cy + r - 4);
    ctx.lineTo(cx - r, cy + r); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff";
    [-4, 4].forEach(o => { ctx.beginPath(); ctx.arc(cx + o, cy - 3, 3, 0, 7); ctx.fill(); });
    ctx.fillStyle = "#14213d";
    [-4, 4].forEach(o => { ctx.beginPath(); ctx.arc(cx + o + g.dx * 1.5, cy - 3 + g.dy * 1.5, 1.5, 0, 7); ctx.fill(); });
  }
  function draw(ts) {
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(wallCanvas, 0, 0, W, H);
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      const c = grid[y][x];
      if (c === ".") { ctx.fillStyle = colors.dot; ctx.fillRect(x * T + T / 2 - 2, y * T + T / 2 - 2, 4, 4); }
      else if (c === "o") { ctx.fillStyle = "#ff9a7a"; ctx.beginPath(); ctx.arc(x * T + T / 2, y * T + T / 2, 6 + Math.sin(ts / 200), 0, 7); ctx.fill(); }
    }
    drawHero();
    ghosts.forEach(g => drawGhost(g, ts));
    drawPac(ts);
    const msg = {over: "GAME OVER", win: "YOU WIN!", paused: "PAUSED"}[state];
    if (msg) {
      ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, H / 2 - 40, W, 80);
      ctx.fillStyle = colors.ink; ctx.font = "700 40px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(msg, W / 2, H / 2);
    }
  }

  // ---------- main loop ----------
  function update(dt) {
    const demo = state === "idle";
    if (state !== "play" && !demo) return;
    // demo: home slide dekhati hoy tyare j chale (CPU bachave)
    if (demo && Math.abs(track.scrollLeft - home.offsetLeft) > track.clientWidth * 0.9) return;
    if (freeze > 0) { freeze -= dt; return; }
    frightT = Math.max(0, frightT - dt);
    move(pac, dt, demo ? demoChoose : pacChoose);
    if (demo && demoReset) { demoReset = false; newGrid(); resetActors(); freeze = 1; return; }
    if (state !== "play" && !demo) return;
    ghosts.forEach(g => { g.speed = frightT > 0 ? 3.4 : 4.8; move(g, dt, ghostChoose); });
    const pp = pos(pac);
    for (const g of ghosts) {
      const gp = pos(g);
      if (Math.hypot(pp.x - gp.x, pp.y - gp.y) < 0.6) {
        if (frightT > 0) {
          score += 200; Object.assign(g, {tx: 12, ty: 7, nx: 12, ny: 7, p: 0, dx: 0, dy: 0});
          if (!demo) statusEl.textContent = "score " + score + " · use arrow keys";
        } else if (demo) {
          resetActors(); freeze = 1.2; break;   // demo ma jiv ghatta nathi
        } else {
          lives--; drawLives();
          if (lives <= 0) setState("over"); else { resetActors(); freeze = 1.2; }
          break;
        }
      }
    }
  }
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (frameNo++ % 20 === 0) {
      const old = colors && colors.line; colors = readColors();
      if (!wallCanvas || old !== colors.line) buildWalls();
    }
    if (state === "play" && Math.abs(track.scrollLeft - home.offsetLeft) > track.clientWidth * 0.4) setState("paused");
    update(dt); draw(ts);
    requestAnimationFrame(frame);
  }

  newGrid(); resetActors(); drawLives(); setState("idle");
  colors = readColors(); buildWalls();
  requestAnimationFrame(frame);
})();
