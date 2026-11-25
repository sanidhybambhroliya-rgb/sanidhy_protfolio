// ===== INTRO + THEME GLITCH =====
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- 1) website open: "TOO MUCH THOUGHT" ----------
  const intro = document.getElementById("intro");
  if (intro) {
    const HOLD = reduce ? 500 : 2800;      // ketla ms sudhi text dekhay (badlo)
    let done = false;
    const close = () => {
      if (done) return; done = true;
      if (reduce) { intro.remove(); return; }
      intro.classList.add("out");
      setTimeout(() => intro.remove(), 820);
    };
    setTimeout(close, HOLD);
    intro.addEventListener("click", close);   // click karo to skip
  }

  // ---------- 2) night <-> light: glitch transition ----------
  const btn = document.getElementById("themeBtn");
  const stage = document.getElementById("stage");
  if (!btn || !stage) return;

  const rnd = (a, b) => a + Math.random() * (b - a);
  let busy = false, pass = false;

  function play(toLight) {
    const bg = toLight ? "#fff8ee" : "#06323d";
    const cols = toLight ? ["#ffff40", "#c6faf5", "#ffb3e6", "#ffff40"] : ["#e8ff00", "#18f0ff", "#ff2bd6", "#e8ff00"];
    const fx = document.createElement("div");
    fx.className = "gfx"; fx.style.background = bg;
    const bars = [];
    for (let k = 0; k < 11; k++) {
      const b = document.createElement("i");
      b.style.top = rnd(0, 96) + "%";
      b.style.height = (k % 3 === 0 ? rnd(1.5, 3) : rnd(3, 9)) + "%";
      b.style.background = cols[k % cols.length];
      fx.append(b); bars.push(b);
    }
    document.body.append(fx);

    const total = reduce ? 200 : 1000;
    fx.animate([
      { opacity: 0 }, { opacity: 1, offset: .12 }, { opacity: .35, offset: .22 }, { opacity: 1, offset: .32 },
      { opacity: 1, offset: .62 }, { opacity: .4, offset: .72 }, { opacity: .9, offset: .8 }, { opacity: 0 }
    ], { duration: total, fill: "forwards" });
    if (!reduce) bars.forEach(b => {
      const x = rnd(40, 160) * (Math.random() < .5 ? -1 : 1);
      b.animate([
        { transform: "translateX(0)", opacity: 1 },
        { transform: `translateX(${x}px)`, opacity: 1, offset: .25 },
        { transform: `translateX(${-x}px)`, opacity: .2, offset: .5 },
        { transform: `translateX(${x / 2}px)`, opacity: 1, offset: .75 },
        { transform: "translateX(0)", opacity: 0 }
      ], { duration: total, delay: rnd(0, 120), easing: "steps(6,end)", fill: "both" });
    });

    setTimeout(() => { pass = true; btn.click(); pass = false; }, total * 0.38);   // beech ma theme badle
    setTimeout(() => { fx.remove(); busy = false; }, total + 150);
  }

  btn.addEventListener("click", e => {
    if (pass) return;                       // asli toggle ne java do
    e.stopImmediatePropagation(); e.preventDefault();
    if (busy) return; busy = true;
    play(stage.dataset.theme === "dark");   // dark -> light hoy to true
  }, true);
})();
