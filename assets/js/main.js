/* Sonabee website: animation and small interactions. No third-party code, no network calls. */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* ---------- Footer year ---------- */
  var yr = $("#yr");
  if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Sona, drawn in SVG (same shapes as the app mascot) ---------- */
  var uid = 0;
  function sonaSVG(pose) {
    uid += 1;
    var id = "sc" + uid;
    var ink = "#1F2A44";
    var eyes = pose === "listen"
      ? '<path d="M93 128q7 7 14 0M133 128q7 7 14 0" fill="none" stroke="' + ink + '" stroke-width="4.5" stroke-linecap="round"/>'
      : '<g class="eyes"><circle cx="99" cy="126" r="6.5" fill="' + ink + '"/><circle cx="141" cy="126" r="6.5" fill="' + ink + '"/><circle cx="97" cy="123.5" r="2.2" fill="#fff"/><circle cx="139" cy="123.5" r="2.2" fill="#fff"/></g>';
    var mouth = pose === "celebrate"
      ? '<path d="M102 138q18 26 36 0z" fill="' + ink + '" stroke="' + ink + '" stroke-width="3" stroke-linejoin="round"/><path d="M112 150q8 8 16 0" fill="#F4A3A0"/>'
      : '<path d="M107 140q13 13 26 0" fill="none" stroke="' + ink + '" stroke-width="4.5" stroke-linecap="round"/>';
    var extra = "";
    if (pose === "listen") {
      extra = '<g fill="none" stroke="#2A9D8F" stroke-width="5" stroke-linecap="round">' +
        '<path class="wave" d="M42 108a44 44 0 0 0 0 52"/><path class="wave b" d="M28 98a60 60 0 0 0 0 72"/>' +
        '<path class="wave" d="M198 108a44 44 0 0 1 0 52"/><path class="wave b" d="M212 98a60 60 0 0 1 0 72"/></g>';
    }
    if (pose === "celebrate") {
      var star = "M0-12 3-3 12 0 3 3 0 12-3 3-12 0-3-3Z";
      extra = '<path class="spark" d="' + star + '" transform="translate(30 40)" fill="#F5A524"/>' +
        '<path class="spark b" d="' + star + '" transform="translate(212 56) scale(.8)" fill="#2A9D8F"/>' +
        '<path class="spark c" d="' + star + '" transform="translate(206 186) scale(.7)" fill="#F4A3A0"/>' +
        '<path class="spark b" d="' + star + '" transform="translate(34 178) scale(.7)" fill="#2A9D8F"/>';
    }
    return '<svg class="sona sona--' + pose + '" viewBox="0 0 240 240" role="img" aria-label="Sona the bee">' +
      '<g class="wing wing-l"><ellipse cx="66" cy="72" rx="24" ry="44" transform="rotate(-28 66 72)" fill="#DCEFF7" stroke="#9BCBE0" stroke-width="5"/></g>' +
      '<g class="wing wing-r"><ellipse cx="174" cy="72" rx="24" ry="44" transform="rotate(28 174 72)" fill="#DCEFF7" stroke="#9BCBE0" stroke-width="5"/></g>' +
      '<path d="M104 68Q98 32 80 28" fill="none" stroke="' + ink + '" stroke-width="6" stroke-linecap="round"/><circle cx="80" cy="28" r="8" fill="' + ink + '"/>' +
      '<path d="M136 68Q142 32 160 28" fill="none" stroke="' + ink + '" stroke-width="6" stroke-linecap="round"/><circle cx="160" cy="28" r="8" fill="' + ink + '"/>' +
      '<clipPath id="' + id + '"><circle cx="120" cy="134" r="65"/></clipPath>' +
      '<circle cx="120" cy="134" r="70" fill="' + ink + '"/>' +
      '<g clip-path="url(#' + id + ')"><rect x="40" y="60" width="160" height="160" fill="#FFD166"/><rect x="40" y="163" width="160" height="17" fill="' + ink + '"/><rect x="40" y="191" width="160" height="40" fill="' + ink + '"/></g>' +
      '<ellipse cx="82" cy="142" rx="11" ry="7.500" fill="#F4A3A0"/><ellipse cx="158" cy="142" rx="11" ry="7.500" fill="#F4A3A0"/>' +
      eyes + mouth + extra + "</svg>";
  }
  $$("[data-sona]").forEach(function (el) { el.innerHTML = sonaSVG(el.getAttribute("data-sona")); });
  // Decorative bees are hidden from screen readers; the page text carries the meaning.
  $$("[data-sona] svg").forEach(function (s) { s.setAttribute("aria-hidden", "true"); s.removeAttribute("role"); s.removeAttribute("aria-label"); });

  /* ---------- Nav background ---------- */
  var nav = $("#nav");
  var hero = $("#top");
  var heroCopy = $(".hero-grid");
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || 0;
      if (nav) nav.classList.toggle("is-stuck", y > 40);
      if (hero && !reduce) {
        var p = clamp(y / (hero.offsetHeight * 0.85), 0, 1);
        hero.style.setProperty("--hp", p.toFixed(3));
      }
      updateWords();
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);

  /* ---------- Hero: pointer parallax ---------- */
  if (hero && !reduce && window.matchMedia("(pointer: fine)").matches) {
    hero.addEventListener("pointermove", function (e) {
      var r = hero.getBoundingClientRect();
      hero.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
      hero.style.setProperty("--my", ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
    });
  }

  /* ---------- Hero: drifting pollen ---------- */
  var canvas = $("#pollen");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d");
    var parts = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), visible = true, rafId = 0;
    var size = function () {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round(clamp(W * H / 16000, 24, 90));
      parts = [];
      for (var i = 0; i < n; i++) {
        parts.push({ x: Math.random() * W, y: Math.random() * H, r: 1 + Math.random() * 3.2, vy: -(0.12 + Math.random() * 0.4), vx: (Math.random() - 0.5) * 0.25, ph: Math.random() * 6.28, a: 0.3 + Math.random() * 0.6 });
      }
    };
    var draw = function (t) {
      rafId = 0;
      if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y += p.vy; p.x += p.vx + Math.sin(t / 1800 + p.ph) * 0.22;
        if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; }
        if (p.x < -10) p.x = W + 10; else if (p.x > W + 10) p.x = -10;
        var tw = 0.55 + 0.45 * Math.sin(t / 700 + p.ph);
        var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 5);
        g.addColorStop(0, "rgba(255,248,236," + (p.a * tw).toFixed(3) + ")");
        g.addColorStop(1, "rgba(255,248,236,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 5, 0, 6.2832); ctx.fill();
      }
      rafId = requestAnimationFrame(draw);
    };
    size();
    window.addEventListener("resize", size);
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible && !rafId) rafId = requestAnimationFrame(draw);
    }).observe(canvas);
    rafId = requestAnimationFrame(draw);
  }

  /* ---------- Tracing demo: a finger draws "sh" along the dotted path ---------- */
  function traceDemo(svg) {
    var inks = $$(".ink", svg), dot = $(".dot", svg);
    if (!inks.length || !dot) return;
    var lens = inks.map(function (p) { return p.getTotalLength(); });
    var durs = [1900, 1000, 1300], gap = 280, hold = 2200;
    var total = durs.reduce(function (a, b) { return a + b; }, 0) + gap * (inks.length - 1) + hold;
    var ease = function (t) { return 0.5 - Math.cos(Math.PI * t) / 2; };
    function set(ms) {
      var t = ms, cur = -1, prog = 0, fade = 1;
      for (var i = 0; i < inks.length; i++) {
        var p = 0;
        if (t >= durs[i]) { p = 1; t -= durs[i] + gap; }
        else if (t > 0) { p = ease(t / durs[i]); cur = i; t = -1; }
        else { p = 0; t = -1; }
        if (cur === i) prog = p;
        inks[i].style.strokeDasharray = lens[i];
        inks[i].style.strokeDashoffset = lens[i] * (1 - p);
      }
      var drawn = durs.reduce(function (a, b) { return a + b; }, 0) + gap * (inks.length - 1);
      if (ms > drawn + hold - 500) fade = clamp((drawn + hold - ms) / 500, 0, 1);
      inks.forEach(function (p) { p.style.opacity = fade; });
      if (cur >= 0) {
        var pt = inks[cur].getPointAtLength(lens[cur] * prog);
        dot.setAttribute("cx", pt.x); dot.setAttribute("cy", pt.y); dot.style.opacity = 1;
      } else if (ms < 120) {
        var s = inks[0].getPointAtLength(0);
        dot.setAttribute("cx", s.x); dot.setAttribute("cy", s.y); dot.style.opacity = 1;
      } else if (ms < drawn) { // pause between strokes: wait at the next start
        var k = 0, acc = 0;
        for (var j = 0; j < inks.length; j++) { acc += durs[j] + gap; if (ms < acc) { k = j + 1; break; } }
        var q = inks[Math.min(k, inks.length - 1)].getPointAtLength(0);
        dot.setAttribute("cx", q.x); dot.setAttribute("cy", q.y); dot.style.opacity = 1;
      } else { dot.style.opacity = 0; }
    }
    if (reduce) { inks.forEach(function (p) { p.style.strokeDasharray = "none"; p.style.strokeDashoffset = 0; }); dot.style.opacity = 0; return; }
    var start = 0, running = false, raf = 0;
    function frame(now) {
      if (!running) return;
      if (!start) start = now;
      set((now - start) % total);
      raf = requestAnimationFrame(frame);
    }
    set(0);
    new IntersectionObserver(function (es) {
      var on = es[0].isIntersecting;
      if (on && !running) { running = true; start = 0; raf = requestAnimationFrame(frame); }
      else if (!on) { running = false; cancelAnimationFrame(raf); }
    }).observe(svg);
  }
  $$(".js-trace").forEach(traceDemo);

  /* ---------- Scroll story: the phone follows the steps ---------- */
  var steps = $$(".step");
  var screens = $$(".scr[data-scr]");
  function setStep(i) {
    steps.forEach(function (s, k) { s.classList.toggle("is-active", k === i); });
    screens.forEach(function (s) { s.classList.toggle("is-active", +s.getAttribute("data-scr") === i); });
  }
  if (steps.length && "IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setStep(+e.target.getAttribute("data-step")); });
    }, { rootMargin: "-42% 0px -42% 0px" });
    steps.forEach(function (s) { so.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    reveals.forEach(function (r) { ro.observe(r); });
  } else {
    reveals.forEach(function (r) { r.classList.add("in"); });
  }
  var dash = $("#dash");
  if (dash) {
    if ("IntersectionObserver" in window && !reduce) {
      var dobs = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { dash.classList.add("in"); dobs.disconnect(); }
      }, { threshold: 0.35 });
      dobs.observe(dash);
    } else { dash.classList.add("in"); }
  }

  /* ---------- Words that light up as you scroll ---------- */
  var words = [];
  var bw = $(".big-words[data-split]");
  function splitNode(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (c) {
      if (c.nodeType === 3) {
        var frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var sp = document.createElement("span"); sp.className = "rw"; sp.textContent = part;
          frag.appendChild(sp); words.push(sp);
        });
        node.replaceChild(frag, c);
      } else if (c.nodeType === 1) { splitNode(c); }
    });
  }
  function updateWords() {
    if (!bw || reduce || !words.length) return;
    var r = bw.getBoundingClientRect(), vh = window.innerHeight;
    var p = clamp((vh * 0.82 - r.top) / (r.height + vh * 0.22), 0, 1);
    var n = Math.round(p * words.length * 1.08);
    for (var i = 0; i < words.length; i++) words[i].classList.toggle("on", i < n);
  }
  if (bw) { splitNode(bw); if (reduce) words.forEach(function (w) { w.classList.add("on"); }); }

  /* ---------- Comfort settings playground ---------- */
  var word = $("#word"), preview = $("#preview"), sizeIn = $("#size");
  if (word && preview && sizeIn) {
    var state = { size: +sizeIn.value, sp: 0 };
    var fit = function () {
      word.style.fontSize = state.size + "px";
      word.style.letterSpacing = (state.sp * state.size) + "px";
      var avail = preview.clientWidth - 40;
      if (word.scrollWidth > avail && avail > 0) {
        var f = state.size * avail / word.scrollWidth;
        word.style.fontSize = f + "px";
        word.style.letterSpacing = (state.sp * f) + "px";
      }
    };
    sizeIn.addEventListener("input", function () { state.size = +sizeIn.value; fit(); });
    $$("[data-sp]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.sp = +b.getAttribute("data-sp");
        $$("[data-sp]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
        fit();
      });
    });
    $$("[data-tint]").forEach(function (b) {
      b.addEventListener("click", function () {
        preview.style.setProperty("--tint", b.getAttribute("data-tint"));
        $$("[data-tint]").forEach(function (o) { o.setAttribute("aria-pressed", String(o === b)); });
      });
    });
    window.addEventListener("resize", fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
    fit();
  }

  /* ---------- Legal pages: highlight the current section in the contents list ---------- */
  var tocLinks = $$(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var heads = $$(".prose h2[id]");
    var lo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id); });
        }
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    heads.forEach(function (h) { lo.observe(h); });
  }

  onScroll();
})();
