/* =====================================================================
   Portafolio de Jennifer Guerrero López
   Núcleo: idioma ES/EN, navegación, línea de tiempo, centrífuga del
   inicio, contador de visitas y carga diferida de la vitrina 3D.
   Sin dependencias.
   ===================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* Pequeño bus compartido con lab.js, finance.js y la vitrina 3D */
  var listeners = [];
  var JG = window.JG = {
    lang: function () { return root.getAttribute("data-lang") === "en" ? "en" : "es"; },
    onLang: function (fn) { listeners.push(fn); },
    reduceMotion: function () { return reduceMotion.matches; },
    showcaseGoto: null
  };

  /* ------------------------------------------------------------------
     Idioma
     ------------------------------------------------------------------ */
  var META = {
    es: {
      title: "Jennifer Guerrero López | QFB, formulación cosmética",
      description: "Portafolio y CV de Jennifer Guerrero López, Química Farmacéutica Bióloga por la UNAM con experiencia en formulación cosmética y atención bilingüe a clientes."
    },
    en: {
      title: "Jennifer Guerrero López | Pharmaceutical chemist",
      description: "Portfolio and résumé of Jennifer Guerrero López, a pharmaceutical chemist from UNAM with experience in cosmetic formulation and bilingual customer service."
    }
  };

  var langButtons = document.querySelectorAll("[data-set-lang]");
  var metaDescription = document.querySelector('meta[name="description"]');

  var frost = document.createElement("div");
  frost.className = "frost";
  frost.setAttribute("aria-hidden", "true");
  document.body.appendChild(frost);

  function syncLangUI(lang) {
    root.setAttribute("data-lang", lang);
    root.lang = lang;
    document.title = META[lang].title;
    if (metaDescription) metaDescription.setAttribute("content", META[lang].description);
    langButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-set-lang") === lang));
    });
    listeners.forEach(function (fn) { try { fn(lang); } catch (e) { /* un módulo no debe romper a los demás */ } });
  }

  function rememberLang(lang) {
    try { localStorage.setItem("jg-lang", lang); } catch (e) { /* almacenamiento no disponible */ }
    try {
      var url = new URL(window.location.href);
      url.searchParams.set("lang", lang);
      history.replaceState(history.state, "", url.toString());
    } catch (e) { /* sin cambios en la URL */ }
  }

  function setLang(lang) {
    if (lang === JG.lang()) return;
    rememberLang(lang);
    if (reduceMotion.matches) { syncLangUI(lang); return; }
    // Un panel esmerilado cubre la pantalla, cambia el texto debajo y se aclara
    frost.classList.add("is-active");
    window.setTimeout(function () {
      syncLangUI(lang);
      window.requestAnimationFrame(function () { frost.classList.remove("is-active"); });
    }, 190);
  }

  langButtons.forEach(function (btn) {
    btn.addEventListener("click", function () { setLang(btn.getAttribute("data-set-lang")); });
  });

  /* ------------------------------------------------------------------
     Navegación: borde al hacer scroll, menú móvil y sección activa
     ------------------------------------------------------------------ */
  var nav = document.querySelector("[data-nav]");
  var menuBtn = document.querySelector("[data-menu-btn]");

  function setMenu(open) {
    if (!nav || !menuBtn) return;
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  }

  if (menuBtn) {
    menuBtn.addEventListener("click", function () { setMenu(!nav.classList.contains("is-open")); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !nav.contains(e.target)) setMenu(false);
    });
  }

  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
  navLinks.forEach(function (a) { a.addEventListener("click", function () { setMenu(false); }); });

  // Las secciones de detalle de los proyectos encienden el enlace "Proyectos"
  var SECTION_OWNER = { producto: "proyectos", texturas: "proyectos", prototipo: "proyectos", equipo: "proyectos", finanzas: "proyectos" };

  if ("IntersectionObserver" in window && navLinks.length) {
    var byId = {};
    navLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var watched = Object.keys(byId).concat(Object.keys(SECTION_OWNER));
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = SECTION_OWNER[entry.target.id] || entry.target.id;
        navLinks.forEach(function (a) { a.classList.remove("is-active"); a.removeAttribute("aria-current"); });
        var link = byId[id];
        if (link) { link.classList.add("is-active"); link.setAttribute("aria-current", "true"); }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    watched.forEach(function (id) {
      var section = document.getElementById(id);
      if (section) sectionObserver.observe(section);
    });
  }

  // Enlaces a #gloss y #glowguard: si la vitrina 3D está activa, ella decide a dónde bajar
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href="#gloss"], a[href="#glowguard"]');
    if (!a || typeof JG.showcaseGoto !== "function") return;
    var name = a.getAttribute("href").slice(1);
    if (JG.showcaseGoto(name)) {
      e.preventDefault();
      try { history.pushState(null, "", "#" + name); } catch (err) { /* sin historial */ }
    }
  });

  /* ------------------------------------------------------------------
     Línea de tiempo: la barra se llena conforme avanzas
     ------------------------------------------------------------------ */
  var timeline = document.querySelector("[data-timeline]");

  function updateTimeline() {
    if (!timeline) return;
    if (reduceMotion.matches) { timeline.style.setProperty("--p", "1"); return; }
    var rect = timeline.getBoundingClientRect();
    var start = window.innerHeight * 0.72;
    var progress = (start - rect.top) / rect.height;
    progress = Math.min(1, Math.max(0, progress));
    timeline.style.setProperty("--p", progress.toFixed(3));
  }

  // La barra se aparta mientras la vitrina 3D o la animación de texturas
  // ocupan la pantalla, y vuelve cuando la animación ya casi salió.
  function updateTuck() {
    if (!nav) return;
    var tuck = false;
    if (!nav.classList.contains("is-open")) {
      var vh = window.innerHeight;
      var navH = nav.offsetHeight || 56;
      var tracks = document.querySelectorAll(".showcase.is-live [data-sc-track], .tex.is-live [data-tex-track]");
      for (var i = 0; i < tracks.length && !tuck; i++) {
        var r = tracks[i].getBoundingClientRect();
        tuck = r.top <= navH && r.bottom >= vh * 0.6;
      }
    }
    nav.classList.toggle("is-tucked", tuck);
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      ticking = false;
      if (nav) nav.classList.toggle("is-scrolled", window.scrollY > 4);
      updateTuck();
      updateTimeline();
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ------------------------------------------------------------------
     Centrífuga: prueba de estabilidad de emulsiones
     Tres ciclos de 15 min a 3000 rpm. Una emulsión muy inestable se
     separa en el primer ciclo, una inestable en el segundo o el tercero
     y una estable pasa los tres.
     ------------------------------------------------------------------ */
  (function centrifuge() {
    var box = document.querySelector("[data-cfg]");
    if (!box) return;

    var T = {
      es: {
        load: "Carga los 3 tubos",
        run: "Centrifugar",
        running: "Centrifugando…",
        next: function (c) { return "Siguiente ciclo (" + c + " de 3)"; },
        again: "Preparar otro lote",
        intro: "Tres emulsiones recién preparadas. Toca cada tubo para cargarlo en el rotor.",
        missing: function (n) { return n === 1 ? "Falta un tubo: el rotor necesita los tres para quedar equilibrado." : "Faltan " + n + " tubos: el rotor necesita los tres para quedar equilibrado."; },
        ready: "Rotor equilibrado. Listo para el primer ciclo.",
        spinning: "Centrifugando a 3000 rpm.",
        none: function (c) { return "Ciclo " + c + " de 3: ningún tubo se separó."; },
        split: function (c, list, many) { return "Ciclo " + c + " de 3: " + (many ? "los tubos " + list + " se separaron." : "el tubo " + list + " se separó."); },
        done: function (n) { return n === 0 ? "Prueba terminada: ningún tubo pasó." : n === 3 ? "Prueba terminada: los tres tubos pasaron." : "Prueba terminada: " + n + " de 3 " + (n === 1 ? "pasó." : "pasaron."); },
        and: " y ",
        stable: "Estable\npasa la prueba",
        high: "Muy inestable\nciclo 1",
        unstable: function (c) { return "Inestable\nciclo " + c; },
        tube: "Tubo"
      },
      en: {
        load: "Load all 3 tubes",
        run: "Spin",
        running: "Spinning…",
        next: function (c) { return "Next cycle (" + c + " of 3)"; },
        again: "Prepare a new batch",
        intro: "Three freshly made emulsions. Tap each tube to load it into the rotor.",
        missing: function (n) { return n === 1 ? "One tube to go: the rotor needs all three to stay balanced." : n + " tubes to go: the rotor needs all three to stay balanced."; },
        ready: "Rotor balanced. Ready for the first cycle.",
        spinning: "Spinning at 3000 rpm.",
        none: function (c) { return "Cycle " + c + " of 3: no tube separated."; },
        split: function (c, list, many) { return "Cycle " + c + " of 3: " + (many ? "tubes " + list + " separated." : "tube " + list + " separated."); },
        done: function (n) { return n === 0 ? "Test complete: no tube passed." : n === 3 ? "Test complete: all three tubes passed." : "Test complete: " + n + " of 3 passed."; },
        and: " and ",
        stable: "Stable\npasses the test",
        high: "Highly unstable\ncycle 1",
        unstable: function (c) { return "Unstable\ncycle " + c; },
        tube: "Tube"
      }
    };
    function t() { return T[JG.lang()]; }

    var NAMES = ["A", "B", "C"];
    var CAPS = ["#8b63e0", "#e0569a", "#a99bd0"];
    var CREAMS = ["#e4d8fb", "#f8d4e4", "#f6f3fb"];

    var tubeEls = Array.prototype.slice.call(box.querySelectorAll("[data-tube]"));
    var runBtn = box.querySelector("[data-cfg-run]");
    var statusEl = box.querySelector("[data-cfg-status]");
    var rotor = box.querySelector("[data-cfg-rotor]");
    var slotsG = box.querySelector("[data-cfg-slots]");
    var rpmEl = box.querySelector("[data-cfg-rpm]");
    var timeEl = box.querySelector("[data-cfg-time]");
    var cycleEl = box.querySelector("[data-cfg-cycle-n]");

    var SVGNS = "http://www.w3.org/2000/svg";
    var CX = 160, CY = 118, R = 54;
    var caps = [];
    NAMES.forEach(function (name, i) {
      var a = (-90 + i * 120) * Math.PI / 180;
      var x = CX + R * Math.cos(a), y = CY + R * Math.sin(a);
      var hole = document.createElementNS(SVGNS, "circle");
      hole.setAttribute("cx", x.toFixed(2)); hole.setAttribute("cy", y.toFixed(2)); hole.setAttribute("r", "17");
      hole.setAttribute("class", "slot-hole");
      slotsG.appendChild(hole);
      var g = document.createElementNS(SVGNS, "g");
      g.setAttribute("class", "slot-cap");
      g.style.transformOrigin = x.toFixed(2) + "px " + y.toFixed(2) + "px";
      var c = document.createElementNS(SVGNS, "circle");
      c.setAttribute("cx", x.toFixed(2)); c.setAttribute("cy", y.toFixed(2)); c.setAttribute("r", "13.5");
      c.setAttribute("fill", CAPS[i]);
      var hi = document.createElementNS(SVGNS, "circle");
      hi.setAttribute("cx", (x - 4).toFixed(2)); hi.setAttribute("cy", (y - 4).toFixed(2)); hi.setAttribute("r", "4");
      hi.setAttribute("fill", "rgba(255,255,255,.55)");
      var tx = document.createElementNS(SVGNS, "text");
      tx.setAttribute("x", x.toFixed(2)); tx.setAttribute("y", (y + 4).toFixed(2));
      tx.setAttribute("text-anchor", "middle");
      tx.textContent = name;
      g.appendChild(c); g.appendChild(hi); g.appendChild(tx);
      slotsG.appendChild(g);
      caps.push(g);
    });

    tubeEls.forEach(function (el, i) {
      el.style.setProperty("--tc", CREAMS[i]);
      el.style.setProperty("--cap", CAPS[i]);
    });

    var state = { tubes: [], cycle: 0, running: false, first: true };

    function rand() { return Math.random(); }

    function newBatch() {
      var kinds;
      if (state.first) {
        // El primer lote trae uno de cada tipo, en orden aleatorio
        kinds = ["stable", "unstable", "high"].sort(function () { return rand() - 0.5; });
        state.first = false;
      } else {
        kinds = [0, 1, 2].map(function () {
          var r = rand();
          return r < 0.28 ? "high" : r < 0.64 ? "unstable" : "stable";
        });
      }
      state.tubes = kinds.map(function (kind) {
        return {
          kind: kind,
          fail: kind === "high" ? 1 : kind === "unstable" ? (rand() < 0.45 ? 2 : 3) : 0,
          loaded: false,
          oil: 0,
          water: 0
        };
      });
      state.cycle = 0;
      render();
    }

    function loadedCount() { return state.tubes.filter(function (x) { return x.loaded; }).length; }

    function resultText(tb) {
      var s = t();
      if (tb.fail && state.cycle >= tb.fail) return tb.fail === 1 ? s.high : s.unstable(tb.fail);
      if (state.cycle >= 3) return s.stable;
      return "";
    }

    function render() {
      var s = t();
      tubeEls.forEach(function (el, i) {
        var tb = state.tubes[i];
        el.setAttribute("aria-pressed", String(tb.loaded));
        el.disabled = state.running || state.cycle > 0;
        el.style.setProperty("--oil", tb.oil + "%");
        el.style.setProperty("--water", tb.water + "%");
        var res = el.querySelector("[data-result]");
        var txt = resultText(tb);
        res.textContent = txt;
        res.className = "tube-result" + (txt ? (tb.fail ? " is-fail" : " is-pass") : "");
        caps[i].classList.toggle("is-in", tb.loaded);
      });
      cycleEl.textContent = String(state.cycle);
      var n = loadedCount();
      runBtn.disabled = state.running || (state.cycle === 0 && n < 3);
      if (state.running) runBtn.textContent = s.running;
      else if (state.cycle >= 3) runBtn.textContent = s.again;
      else if (state.cycle > 0) runBtn.textContent = s.next(state.cycle + 1);
      else runBtn.textContent = n < 3 ? s.load : s.run;
    }

    function say(msg) { statusEl.textContent = msg; }

    function idleStatus() {
      var s = t();
      var n = loadedCount();
      if (n === 0) say(s.intro);
      else if (n < 3) say(s.missing(3 - n));
      else say(s.ready);
    }

    tubeEls.forEach(function (el, i) {
      el.addEventListener("click", function () {
        if (state.running || state.cycle > 0) return;
        state.tubes[i].loaded = !state.tubes[i].loaded;
        render();
        idleStatus();
      });
    });

    function fmtTime(sec) {
      var m = Math.floor(sec / 60), s = Math.floor(sec % 60);
      return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    var angle = 0;
    function setAngle(a) { rotor.setAttribute("transform", "rotate(" + a.toFixed(2) + " " + CX + " " + CY + ")"); }

    function spin(done) {
      var still = reduceMotion.matches;
      var total = still ? 1100 : 3000;
      var up = still ? 0 : 520, down = still ? 0 : 700;
      var start = performance.now(), last = start;
      var maxDegPerMs = 1.15; // velocidad visual, no la real
      box.classList.add("is-running");
      function frame(now) {
        var el = now - start;
        var dt = now - last; last = now;
        var k;
        if (el < up) k = el / up;
        else if (el > total - down) k = Math.max(0, (total - el) / down);
        else k = 1;
        if (still) k = el < total ? 1 : 0;
        if (!still) { angle = (angle + maxDegPerMs * k * k * dt) % 360; setAngle(angle); }
        rpmEl.textContent = String(Math.round(3000 * (still ? (el < total ? 1 : 0) : k) / 10) * 10);
        var frac = Math.min(1, el / total);
        timeEl.textContent = fmtTime(900 * (1 - frac));
        if (el < total) { requestAnimationFrame(frame); return; }
        rpmEl.textContent = "0";
        timeEl.textContent = "00:00";
        box.classList.remove("is-running");
        done();
      }
      requestAnimationFrame(frame);
    }

    function separate(tb, c) {
      if (!tb.fail || c < tb.fail) return;
      var extra = c - tb.fail;
      if (tb.kind === "high") { tb.oil = 24 + extra * 6; tb.water = 17 + extra * 4; }
      else { tb.oil = 12 + extra * 5; tb.water = 8 + extra * 4; }
    }

    function runCycle() {
      if (state.running) return;
      if (state.cycle >= 3) { newBatch(); idleStatus(); return; }
      state.tubes.forEach(function (tb) { tb.loaded = true; });
      state.running = true;
      render();
      say(t().spinning);
      spin(function () {
        state.running = false;
        state.cycle += 1;
        var c = state.cycle;
        var fresh = [];
        state.tubes.forEach(function (tb, i) {
          if (tb.fail === c) fresh.push(NAMES[i]);
          separate(tb, c);
          tb.loaded = false;
        });
        render();
        var s = t();
        var list = fresh.join(s.and).replace(/ (y|and) (?=.* (y|and) )/, ", ");
        var msg = fresh.length ? s.split(c, list, fresh.length > 1) : s.none(c);
        if (c >= 3) {
          var passed = state.tubes.filter(function (tb) { return !tb.fail; }).length;
          msg = (fresh.length ? msg + " " : "") + s.done(passed);
        }
        say(msg);
      });
    }

    runBtn.addEventListener("click", runCycle);

    JG.onLang(function () {
      render();
      if (!state.running && state.cycle === 0) idleStatus();
      else if (state.cycle >= 3) {
        var passed = state.tubes.filter(function (tb) { return !tb.fail; }).length;
        say(t().done(passed));
      }
    });

    newBatch();
    idleStatus();
    setAngle(0);
  })();

  /* ------------------------------------------------------------------
     Contador de visitas con GoatCounter (sin cookies)
     ------------------------------------------------------------------ */
  (function views() {
    var card = document.querySelector("[data-views]");
    if (!card) return;
    var code = (card.getAttribute("data-gc-code") || "").trim().toLowerCase();
    var numEl = card.querySelector("[data-views-num]");
    var isLive = /(^|\.)github\.io$/.test(location.hostname);

    if (!/^[a-z0-9][a-z0-9-]{1,49}$/.test(code)) {
      // Sin cuenta conectada: en la vista previa se muestra la tarjeta vacía para ver dónde queda
      if (!isLive) { card.hidden = false; card.classList.add("is-setup"); }
      return;
    }

    // Registra la visita sólo en el sitio publicado: las vistas previas y las
    // pruebas en la computadora no suman. La ruta no incluye ?lang= para que
    // ES y EN cuenten igual.
    if (isLive) {
      window.goatcounter = { path: function () { return location.pathname || "/"; } };
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://gc.zgo.at/count.js";
      s.setAttribute("data-goatcounter", "https://" + code + ".goatcounter.com/count");
      document.head.appendChild(s);
    }

    // Muestra el total del sitio (GoatCounter lo guarda en caché hasta 4 horas)
    if (!window.fetch) return;
    fetch("https://" + code + ".goatcounter.com/counter/TOTAL.json", { mode: "cors" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        var raw = String(data && data.count || "").trim();
        var n = parseInt(raw.replace(/[^\d]/g, ""), 10);
        if (!raw || isNaN(n)) return;
        numEl.textContent = n.toLocaleString("en-US");
        card.classList.toggle("is-one", n === 1);
        card.hidden = false;
      })
      .catch(function () { card.hidden = true; });
  })();

  /* ------------------------------------------------------------------
     Vitrina 3D (gloss y GlowGuard): se carga sólo si hay WebGL
     ------------------------------------------------------------------ */
  (function showcase() {
    var section = document.querySelector("[data-showcase]");
    if (!section) return;

    function hasWebGL() {
      try {
        var c = document.createElement("canvas");
        return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
      } catch (e) { return false; }
    }

    if (reduceMotion.matches || !hasWebGL() || !("IntersectionObserver" in window)) return;

    // El espacio para el recorrido se reserva desde el inicio: así la página no salta después
    section.classList.add("is-live", "is-loading");

    var started = false;
    function start() {
      if (started) return;
      started = true;
      import("./showcase.js")
        .then(function (m) { return m.init(section, JG); })
        .then(function () { section.classList.remove("is-loading"); })
        .catch(function () {
          section.classList.remove("is-live", "is-loading");
          JG.showcaseGoto = null;
        });
    }

    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); start(); }
    }, { rootMargin: "200% 0px 200% 0px" });
    io.observe(section);

    // Si la página abre directo en #gloss o #glowguard, carga de inmediato
    if (/^#(gloss|glowguard|producto)$/.test(location.hash)) start();
    else if ("requestIdleCallback" in window) {
      window.addEventListener("load", function () { requestIdleCallback(start, { timeout: 4000 }); });
    }
  })();

  syncLangUI(JG.lang());
})();
