// ===== 2. ENTRANCE ANIMATION SETUP =====
// rv(selector, direction, start delay, gap between items)
// direction: "" = niche thi upar, "l" = dabi baju thi, "r" = jami baju thi, "z" = zoom
function rv(sel, dir, start, gap = 0.12) {
  document.querySelectorAll(sel).forEach((el, i) => {
    el.classList.add("rv"); if (dir) el.classList.add(dir);
    el.style.setProperty("--d", (start + i * gap) + "s");
  });
}
rv("#home .home-top > div", "", 0.1);
rv("#home .tags", "r", 0.3);
rv("#home .maze-wrap", "z", 0.4);
rv("#home .maze-foot", "", 0.75);
rv(".polaroid", "l", 0.1);
rv(".about-wrap h2", "", 0.25);
rv(".about-wrap h3", "", 0.45);
rv(".about-wrap .body", "", 0.6, 0.15);
rv("#whatido .cols > div", "", 0.15, 0.2);
rv("#work h2", "", 0.1);
rv("#work .card", "z", 0.3, 0.12);
rv("#pitstops h2", "", 0.1);
rv("#pitstops .timeline li", "l", 0.3, 0.15);
rv("#contact > *", "", 0.1, 0.13);

// ===== 3. CONTINUOUS SMOOTH SCROLL (Home ane About beu adhdha dekhay evu) =====
const track = document.getElementById("track");
const slides = [...document.querySelectorAll(".slide")];
const links = [...document.querySelectorAll("#pillnav a")];
const WHEEL_SPEED = 2.2;   // vadhare number = scroll vadhu fast
const FOLLOW = 7;          // vadhare = snappy, ochhu = vadhu smooth/dhimu
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
let current = 0, target = 0, running = false, lastT = 0;

const maxScroll = () => track.scrollWidth - track.clientWidth;
const clamp = v => Math.max(0, Math.min(maxScroll(), v));

function updateActive() {
  const w = track.clientWidth;
  slides.forEach(s => {
    const vis = Math.max(0, 1 - Math.abs(s.offsetLeft - current) / w);   // kitli slide dekhay chhe
    if (vis > 0.4) s.classList.add("in"); else if (vis < 0.1) s.classList.remove("in");
  });
  const n = Math.min(slides.length - 1, Math.round(current / w));
  links.forEach((l, j) => l.classList.toggle("on", j === n));
}
function loop(now) {
  const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016); lastT = now;
  const diff = target - current;
  if (Math.abs(diff) < 0.4) { current = target; running = false; }
  else current += diff * (1 - Math.exp(-(reduceMotion ? 1000 : FOLLOW) * dt));
  track.scrollLeft = current;
  updateActive();
  if (running) requestAnimationFrame(loop);
}
function kick() { if (!running) { running = true; lastT = performance.now(); requestAnimationFrame(loop); } }
function scrollToIndex(i) {
  i = Math.min(slides.length - 1, Math.max(0, i));
  target = clamp(slides[i].offsetLeft); kick();
}
const indexOf = id => slides.findIndex(s => s.id === id);

// pill nav + sidebar links
links.forEach(l => l.addEventListener("click", e => { e.preventDefault(); scrollToIndex(indexOf(l.getAttribute("href").slice(1))); }));
document.querySelectorAll("[data-go]").forEach(l => l.addEventListener("click", e => { e.preventDefault(); scrollToIndex(indexOf(l.dataset.go)); }));

// mouse wheel / touchpad: scroll jetlo karo etlu j aagal jaay
track.addEventListener("wheel", e => {
  const slide = e.target.closest(".slide");
  const dy = e.deltaY, dx = e.deltaX;
  if (Math.abs(dy) < 1 && Math.abs(dx) < 1) return;
  const vertical = Math.abs(dy) >= Math.abs(dx);
  if (slide && vertical) {                       // section ni andar j scroll baki hoy to pehla e
    const canDown = slide.scrollTop + slide.clientHeight < slide.scrollHeight - 2;
    const canUp = slide.scrollTop > 2;
    if ((dy > 0 && canDown) || (dy < 0 && canUp)) return;
  }
  e.preventDefault();
  if (gestureStart === null) gestureStart = Math.round(current / track.clientWidth);
  target = clamp(target + (vertical ? dy : dx) * WHEEL_SPEED);
  kick();
  clearTimeout(settleTimer);
  settleTimer = setTimeout(settle, 140);   // scroll band thay pachhi poori slide par besi jaay
}, { passive: false });

// scroll aatke tyare nazdik ni (ke agali) slide par poora besi jaao, jethi kai kapay nahi
let settleTimer = null, gestureStart = null;
function settle() {
  const w = track.clientWidth, d = target / w - gestureStart;
  const i = Math.abs(d) >= 0.5 ? Math.round(target / w)
          : gestureStart + (Math.abs(d) > 0.1 ? Math.sign(d) : 0);   // thodu pan scroll karyu to agali slide par
  gestureStart = null;
  scrollToIndex(i);
}

// keyboard (game chalu hoy tyare nahi)
window.addEventListener("keydown", e => {
  if (window.pacPlaying || window.projOpen) return;
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  const next = ["ArrowRight", "ArrowDown", "PageDown"].includes(e.key);
  const prev = ["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key);
  if (!next && !prev) return;
  e.preventDefault();
  scrollToIndex(Math.round(target / track.clientWidth) + (next ? 1 : -1));
});

// touch swipe (mobile): angdhi sathe chale, chhode tyare nazdik ni slide par besi jaay
let lastX = 0, lastY = 0, dragging = null;
track.addEventListener("touchstart", e => { lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; dragging = null; }, { passive: true });
track.addEventListener("touchmove", e => {
  if (window.pacPlaying) return;
  const x = e.touches[0].clientX, y = e.touches[0].clientY;
  if (dragging === null && Math.max(Math.abs(x - lastX), Math.abs(y - lastY)) > 6) dragging = Math.abs(x - lastX) > Math.abs(y - lastY);
  if (dragging) { target = clamp(target - (x - lastX) * 1.4); kick(); }
  lastX = x; lastY = y;
}, { passive: true });
track.addEventListener("touchend", () => { if (dragging) scrollToIndex(Math.round(target / track.clientWidth)); dragging = null; }, { passive: true });

window.addEventListener("resize", () => {
  const i = Math.round(target / (track.clientWidth || 1));
  current = target = clamp(slides[i] ? slides[i].offsetLeft : 0);
  track.scrollLeft = current; updateActive();
});
setTimeout(updateActive, 150);   // pehli slide ni animation chalu

// ===== 4. DARK / LIGHT MODE =====
const stage = document.getElementById("stage");
const label = document.getElementById("themeLabel");
document.getElementById("themeBtn").addEventListener("click", () => {
  const dark = stage.dataset.theme === "dark";
  stage.dataset.theme = dark ? "light" : "dark";
  label.textContent = dark ? "light mode" : "dark mode";
});

// ===== 5. BOOKMARK + COPY EMAIL =====
const bm = document.getElementById("bookmarkBtn");
bm?.addEventListener("click", () => bm.classList.toggle("on"));
document.querySelectorAll(".copy").forEach(b => b.addEventListener("click", () => {
  navigator.clipboard?.writeText(b.dataset.copy); b.textContent = "copied!";
  setTimeout(() => b.textContent = "copy", 1500);
}));
