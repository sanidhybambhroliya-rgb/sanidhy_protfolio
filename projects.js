// =====================================================================
//  PROJECTS  –  tamara 4 projects. Photos `images` folder ma mukho.
//  Naam alag hoy to `images:[...]` ma e j naam lakho.
// =====================================================================
const PROJECTS = [
  { title: "Web Banner", tag: "Web banners · Hoarding", kind: "hoarding",
    desc: "Eye-catching web banners and hoarding designs made to grab attention at first glance. Bold colours, clear messages and clean layouts that work on screens and on the street.",
    images: ["images/web-banner-1.jpg", "images/web-banner-2.jpg", "images/web-banner-3.jpg"],   // photos 1-3
    captions: ["Banner one", "Banner two", "Banner three"],
    notes: ["Original hoarding view", "Original hoarding view", "Original hoarding view"] },

  { title: "Effect", tag: "Photo effects · Retouch", kind: "float",
    desc: "A set of photo effects and retouching experiments. I played with colour, light and layers to turn ordinary photos into scroll-stopping visuals.",
    images: ["images/effect-1.jpg", "images/effect-2.jpg", "images/effect-3.jpg", "images/effect-4.jpg",
             "images/effect-5.jpg", "images/effect-6.jpg", "images/effect-7.jpg"] },   // photos 4-10

  { title: "Product and Packaging Design", tag: "Packaging · Product", kind: "rows",
    desc: "Product and packaging designs where looks meet function. Each pack is built around the brand's personality, with clear labels and colours that stand out on the shelf.",
    images: ["images/packaging-1.jpg", "images/packaging-2.jpg", "images/packaging-3.jpg"],   // photos 11-13
    captions: ["Design one", "Design two", "Design three"],
    notes: ["The main pack, built around the brand colours.", "Label details and typography up close.", "The final look, ready for the shelf."] },

  { title: "Festival Design", tag: "Festival creatives", kind: "fan",
    desc: "Festival creatives made to capture the joy of the occasion. Vibrant colours, warm moods and playful details that make every greeting feel special.",
    images: ["images/festival-1.jpg", "images/festival-2.jpg"] },   // photos 16-18 (hu 17 j joi shakyo; 18mi hoy to festival-3.jpg umero)
];

// ---------- helpers ----------
const grid = document.getElementById("workGrid");
const stageEl = document.getElementById("stage");
const $ = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

// photo na hoy tyare gradient placeholder dekhase
function ph(label, w, h, i) {
  const hue = [200, 330, 160, 40, 270][i % 5];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,68%)"/><stop offset="1" stop-color="hsl(${hue + 60},70%,52%)"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="50%" font-family="sans-serif" font-size="${Math.round(w / 11)}" fill="white" text-anchor="middle">Add photo</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}
function mkImg(src, label, w, h, i) {
  const im = new Image(); im.alt = label; im.decoding = "async";
  // .jpg na hoy to .jpeg / .png / .webp pan try kare (nahi to placeholder)
  const base = src.replace(/\.[a-z0-9]+$/i, ""), exts = [".jpg", ".jpeg", ".png", ".webp", ".JPG", ".PNG"];
  let tryN = 0;
  im.onerror = () => {
    if (tryN < exts.length) { im.src = base + exts[tryN++]; return; }
    im.onerror = null; im.src = ph(label, w, h, i);
  };
  im.addEventListener("load", () => shift());
  im.src = src; return im;
}
function phone(src, label, i) {
  const p = $("div", "phone"); p.append($("span", "notch"));
  const s = $("div", "screen"); s.append(mkImg(src, label, 540, 1500, i)); p.append(s); return p;
}

// ---------- work cards ----------
PROJECTS.forEach((p, i) => {
  const a = $("a", "card"); a.href = "#"; a.setAttribute("aria-label", "Open " + p.title);
  a.append(mkImg(p.images[0], p.title, 600, 450, i));
  a.append($("div", "", `<h4>${p.title}</h4><p>${p.tag}</p>`));
  a.addEventListener("click", e => { e.preventDefault(); openProject(i, e.clientX, e.clientY); });
  grid.append(a);
});

// ---------- 4 alag layouts ----------
const BUILD = {
  // 1) Web Banner: hoarding (outdoor board) ma banner
  hoarding(p) {
    const wrap = $("div", "pv-body");
    p.images.forEach((src, j) => {
      const row = $("section", "hd-row" + (j % 2 ? " alt" : ""));
      const h = $("div", "hoarding pv-rv");
      h.append($("div", "lamps", "<i></i><i></i><i></i>"));
      const b = $("div", "board"); b.append(mkImg(src, p.title + " " + (j + 1), 1200, 675, j)); b.append($("span", "shine")); h.append(b);
      h.append($("div", "poles", "<b></b><b></b>"));
      const n = $("div", "hd-note pv-rv " + (j % 2 ? "l" : "r"));
      n.innerHTML = `<h3 class="serif">${(p.captions && p.captions[j]) || "Banner " + (j + 1)}</h3><p>${(p.notes && p.notes[j]) || "Original hoarding view"}</p>`;
      row.append(h, n); wrap.append(row);
    });
    return wrap;
  },
  // 2) Effect: tarta phones, mouse sathe tilt
  float(p) {
    const st = $("div", "pv-body fl-stage"), rots = [-7, 3, -3, 8, -5, 6];
    p.images.forEach((src, j) => {
      const it = $("div", "pv-rv z fl-item"); it.style.setProperty("--d", j * 0.15 + "s"); it.style.marginTop = (j % 2 ? 70 : 0) + "px";
      const t = $("div", "tilt"); t.style.setProperty("--r", rots[j % 6] + "deg"); t.style.setProperty("--bd", j * 0.7 + "s");
      t.append(phone(src, p.title + " " + (j + 1), j)); it.append(t); st.append(it);
    });
    st.append($("i", "orb o1"), $("i", "orb o2"));
    st.addEventListener("mousemove", e => {
      const r = st.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      st.style.setProperty("--ry", x * 10 + "deg"); st.style.setProperty("--rx", -y * 8 + "deg");
    });
    return st;
  },
  // 3) Product and Packaging: ek pachhi ek row, phone + text (aamne-saamne)
  rows(p) {
    const wrap = $("div", "pv-body");
    p.images.forEach((src, j) => {
      const row = $("section", "pk-row" + (j % 2 ? " alt" : ""));
      const f = $("div", "pk-phone pv-rv " + (j % 2 ? "r" : "l")); f.append(phone(src, p.title + " " + (j + 1), j));
      const t = $("div", "pk-text pv-rv " + (j % 2 ? "l" : "r")); t.style.setProperty("--d", ".15s");
      t.innerHTML = `<h3 class="display">${(p.captions && p.captions[j]) || "Detail " + (j + 1)}</h3><p>${(p.notes && p.notes[j]) || ""}</p>`;
      row.append(f, t); wrap.append(row);
    });
    return wrap;
  },
  // 4) Festival: phones pankha ni jem khule + confetti
  fan(p) {
    const w = $("div", "pv-body fan-wrap"), colors = ["#ffd23f", "#ff6b9d", "#4cc9f0", "#9bff5c", "#ff9a3c"];
    for (let k = 0; k < 28; k++) {
      const c = $("i", "confetti"); c.style.left = Math.random() * 100 + "%"; c.style.background = colors[k % 5];
      c.style.animationDuration = 6 + Math.random() * 7 + "s"; c.style.animationDelay = -Math.random() * 10 + "s"; w.append(c);
    }
    const f = $("div", "fan pv-obs"), n = p.images.length, mid = (n - 1) / 2;
    p.images.forEach((src, j) => {
      const s = $("div", "phone-slot"), off = j - mid;
      s.style.setProperty("--r", off * 9 + "deg"); s.style.setProperty("--y", Math.abs(off) * 26 + "px");
      s.style.setProperty("--d", Math.abs(off) * 0.12 + "s"); s.style.zIndex = 10 - Math.round(Math.abs(off));
      const ph = phone(src, p.title + " " + (j + 1), j); s.append(ph); f.append(s);
      // photo na asli size mujab phone ni screen banao, jethi photo kapay nahi (akho dekhay)
      const im = ph.querySelector("img"), scr = ph.querySelector(".screen");
      im.addEventListener("load", () => {
        if (im.naturalWidth && im.naturalHeight) scr.style.setProperty("--ar", Math.min(1.3, Math.max(0.45, im.naturalWidth / im.naturalHeight)));
      });
    });
    w.append(f); return w;
  },
};

// ---------- project page (full screen, uparthi niche scroll) ----------
const pv = $("div", "pv"); pv.tabIndex = -1; pv.setAttribute("role", "dialog"); pv.setAttribute("aria-modal", "true");
stageEl.append(pv);
let io = null;

function render(i) {
  const p = PROJECTS[i]; pv.innerHTML = "";
  const top = $("div", "pv-top");
  const back = $("button", "pv-back", "← Back to work"); back.addEventListener("click", closeProject);
  top.append(back, $("span", "pv-tag", p.tag)); pv.append(top);

  const hero = $("header", "pv-hero"), h1 = $("h1", "display huge pv-title");
  let k = 0;
  p.title.split(" ").forEach(word => {
    const w = $("span", "w"); [...word].forEach(ch => { const s = $("span", "", ch); s.style.setProperty("--i", k++); w.append(s); });
    h1.append(w, " ");
  });
  const d = $("p", "pv-desc pv-rv", p.desc); d.style.setProperty("--d", ".5s");
  hero.append(h1, d); pv.append(hero);

  pv.append(BUILD[p.kind](p));

  const nextI = (i + 1) % PROJECTS.length, foot = $("footer", "pv-foot pv-rv");
  const nb = $("button", "cta", "Next: " + PROJECTS[nextI].title + " →");
  nb.addEventListener("click", () => { render(nextI); pv.scrollTop = 0; shift(); });
  foot.append(nb); pv.append(foot);

  if (io) io.disconnect();
  io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("show"); io.unobserve(e.target); } }), { root: pv, threshold: 0.18 });
  pv.querySelectorAll(".pv-rv,.pv-obs").forEach(el => io.observe(el));
}
function openProject(i, x, y) {
  render(i);
  const r = stageEl.getBoundingClientRect();
  pv.style.setProperty("--ox", (x - r.left) + "px"); pv.style.setProperty("--oy", (y - r.top) + "px");
  pv.scrollTop = 0; pv.classList.add("open"); window.projOpen = true; pv.focus({ preventScroll: true });
  setTimeout(shift, 120);
}
function closeProject() { pv.classList.remove("open"); window.projOpen = false; }
window.addEventListener("keydown", e => { if (e.key === "Escape" && window.projOpen) closeProject(); });

// scroll karo to phone ni andar photo uparthi niche chale
function shift() {
  const vh = pv.clientHeight, top0 = pv.getBoundingClientRect().top;
  pv.querySelectorAll(".screen").forEach(s => {
    const im = s.firstChild; if (!im) return;
    const r = s.getBoundingClientRect();
    const pr = Math.min(1, Math.max(0, (vh - (r.top - top0)) / (vh + r.height)));
    const max = Math.max(0, im.offsetHeight - s.clientHeight);
    im.style.transform = `translateY(${-max * pr}px)`;
  });
}
let ticking = false;
pv.addEventListener("scroll", () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; shift(); }); }, { passive: true });
