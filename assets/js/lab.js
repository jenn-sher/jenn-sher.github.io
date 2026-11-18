/* =====================================================================
   Portafolio de Jennifer Guerrero López
   Laboratorio: tablero de texturas (14 prototipos), viscosidad,
   perfil sensorial y pestañas de sondas del MC 900.
   Datos de la estancia en Ashland, sin nombres comerciales ni fórmulas.
   ===================================================================== */
(function () {
  "use strict";

  var JG = window.JG || { lang: function () { return "es"; }, onLang: function () {}, reduceMotion: function () { return false; } };
  var SVGNS = "http://www.w3.org/2000/svg";

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function seg(t, a, b) { return clamp((t - a) / (b - a), 0, 1); }
  function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function fmt(n) { return n.toLocaleString("en-US"); }
  function cw(node) { return Math.round(clamp(node.clientWidth || 520, 300, 640)); }
  function onWidth(node, fn) {
    var last = node.clientWidth, timer = 0;
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var w = node.clientWidth;
        if (Math.abs(w - last) > 16) { last = w; fn(); }
      }, 160);
    });
  }

  /* ------------------------------------------------------------------
     Datos (estancia 2025-2)
     A = modificador con modificación hidrofóbica, B = sin modificación
     ------------------------------------------------------------------ */
  var FAIL_STAB = { B1: "heat", B7: "heat", B3: "cfg", B5: "cfg", B6: "cfg" };
  var FAIL_SENS = { A2: 1, A3: 1, A4: 1, A6: 1, B2: 1, B4: 1 };
  var FAVS = { A1: 1, A5: 1, A7: 1 };

  /* ------------------------------------------------------------------
     Tablero de 14 tubos
     ------------------------------------------------------------------ */
  (function board() {
    var section = document.getElementById("texturas");
    var svg = document.querySelector("[data-tex-svg]");
    if (!section || !svg) return;
    var track = section.querySelector("[data-tex-track]");
    var steps = Array.prototype.slice.call(section.querySelectorAll("[data-tex-steps] > li"));

    var X0 = 82, DX = 66, TW = 30, TH = 124, ROWS = { A: 70, B: 252 };
    var TINTS = ["#ddcdfb", "#f6cfe2", "#e7defb", "#d6c4f8", "#f9d9e8", "#e2d4fb", "#efe6fd"];
    var tubes = [];
    var labels = { top: null, rowA: null, rowB: null, legendA: null, legendB: null, count: null };

    function tubePath(x, y) {
      var r = TW / 2;
      return "M" + (x - 3) + " " + y + "H" + (x + TW + 3) + "M" + x + " " + y + "V" + (y + TH - r) +
        "A" + r + " " + r + " 0 0 0 " + (x + TW) + " " + (y + TH - r) + "V" + y;
    }

    function build() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var defs = el("defs", null, svg);
      labels.top = el("text", { x: X0 + 3 * DX + TW / 2, y: 26, "text-anchor": "middle", "class": "tb-note" }, svg);
      for (var i = 0; i < 7; i++) {
        el("text", { x: X0 + i * DX + TW / 2, y: 50, "text-anchor": "middle" }, svg).textContent = String(i + 1);
      }
      labels.rowA = el("text", { x: 18, y: ROWS.A + TH / 2 + 4, "class": "tb-row" }, svg);
      labels.rowB = el("text", { x: 18, y: ROWS.B + TH / 2 + 4, "class": "tb-row" }, svg);
      labels.rowA.textContent = "A";
      labels.rowB.textContent = "B";
      el("path", { d: "M44 " + (ROWS.A + TH + 34) + "H" + (X0 + 6 * DX + TW + 12), "class": "tb-soft" }, svg);

      ["A", "B"].forEach(function (row) {
        for (var i = 0; i < 7; i++) {
          var id = row + (i + 1);
          var x = X0 + i * DX, y = ROWS[row];
          var g = el("g", { "class": "tb-tube" }, svg);
          var clip = el("clipPath", { id: "tb-clip-" + id }, defs);
          var r = TW / 2;
          el("path", { d: "M" + x + " " + y + "V" + (y + TH - r) + "A" + r + " " + r + " 0 0 0 " + (x + TW) + " " + (y + TH - r) + "V" + y + "Z" }, clip);
          var fill = el("g", { "clip-path": "url(#tb-clip-" + id + ")" }, g);
          var cream = el("rect", { x: x, y: y + TH, width: TW, height: 0, fill: TINTS[i] }, fill);
          var oil = el("rect", { x: x, y: y + 30, width: TW, height: 0, fill: "rgba(240, 206, 110, 0.85)" }, fill);
          var water = el("rect", { x: x, y: y + TH, width: TW, height: 0, fill: "rgba(196, 206, 246, 0.95)" }, fill);
          var shine = el("rect", { x: x + 6, y: y + 14, width: 3, height: TH - 36, rx: 1.5, fill: "rgba(255,255,255,.8)", opacity: 0 }, g);
          var outline = el("path", { d: tubePath(x, y), "class": "tb-outline", pathLength: "1", "stroke-dasharray": "1", "stroke-dashoffset": "1" }, g);
          var ring = el("rect", { x: x - 10, y: y - 10, width: TW + 20, height: TH + 20, rx: 18, "class": "tb-ring", opacity: 0 }, g);
          var mark = el("path", { d: "M" + (x + 4) + " " + (y + 40) + "L" + (x + TW - 4) + " " + (y + 72) + "M" + (x + TW - 4) + " " + (y + 40) + "L" + (x + 4) + " " + (y + 72), "class": "tb-mark", opacity: 0 }, g);
          var label = el("text", { x: x + TW / 2, y: y + TH + 22, "text-anchor": "middle" }, g);
          label.textContent = id;
          tubes.push({ id: id, row: row, i: i, g: g, cream: cream, oil: oil, water: water, outline: outline, ring: ring, mark: mark, label: label, shine: shine, x: x, y: y });
        }
      });
      labels.legendA = el("text", { x: 44, y: 442, "class": "tb-note" }, svg);
      labels.legendB = el("text", { x: 44, y: 460, "class": "tb-note" }, svg);
      labels.count = el("text", { x: X0 + 6 * DX + TW + 8, y: 451, "text-anchor": "end", "class": "tb-row" }, svg);
      setTexts();
    }

    var TXT = {
      es: { top: "Emulsificante", a: "A: modificador con modificación hidrofóbica", b: "B: modificador sin modificación", c: ["14 prototipos", "9 estables", "3 favoritas"] },
      en: { top: "Emulsifier", a: "A: hydrophobically modified rheology modifier", b: "B: unmodified rheology modifier", c: ["14 prototypes", "9 stable", "3 favorites"] }
    };
    var lastCount = 0;
    function setTexts() {
      var tx = TXT[JG.lang()];
      labels.top.textContent = tx.top;
      labels.legendA.textContent = tx.a;
      labels.legendB.textContent = tx.b;
      labels.count.textContent = tx.c[lastCount];
    }

    // Selección "al azar" reproducible: el mismo punto del scroll da el mismo tubo
    function pick(t, pool) {
      var k = Math.floor(t * 260);
      var h = Math.sin(k * 12.9898 + 4.1414) * 43758.5453;
      h = h - Math.floor(h);
      return pool[Math.floor(h * pool.length)];
    }

    function render(t) {
      var scanPool = null, scanT = 0;
      if (t > 0.36 && t < 0.45) { scanPool = tubes; scanT = t; }
      else if (t > 0.6 && t < 0.69) { scanPool = tubes.filter(function (tb) { return !FAIL_STAB[tb.id]; }); scanT = t; }
      var scanned = scanPool ? pick(scanT, scanPool) : null;

      tubes.forEach(function (tb, n) {
        var draw = seg(t, 0.02 + n * 0.011, 0.1 + n * 0.011);
        tb.outline.setAttribute("stroke-dashoffset", (1 - ease(draw)).toFixed(3));
        tb.label.setAttribute("opacity", draw.toFixed(2));
        var fillK = ease(seg(t, 0.2 + tb.i * 0.012 + (tb.row === "B" ? 0.03 : 0), 0.3 + tb.i * 0.012 + (tb.row === "B" ? 0.03 : 0)));
        var liquid = (TH - 30) * fillK;
        var oilH = 0, waterH = 0;
        var failS = FAIL_STAB[tb.id];
        if (failS) {
          var sep = ease(seg(t, 0.45, 0.53));
          oilH = (failS === "heat" ? 30 : 20) * sep;
          waterH = (failS === "heat" ? 22 : 14) * sep;
        }
        tb.water.setAttribute("y", (tb.y + TH - waterH).toFixed(1));
        tb.water.setAttribute("height", waterH.toFixed(1));
        tb.cream.setAttribute("y", (tb.y + TH - liquid).toFixed(1));
        tb.cream.setAttribute("height", Math.max(0, liquid - waterH).toFixed(1));
        tb.oil.setAttribute("y", (tb.y + TH - liquid).toFixed(1));
        tb.oil.setAttribute("height", Math.min(oilH, liquid).toFixed(1));
        tb.shine.setAttribute("opacity", (0.9 * fillK).toFixed(2));

        var out = 0;
        if (failS) out = ease(seg(t, 0.53, 0.58));
        else if (FAIL_SENS[tb.id]) out = ease(seg(t, 0.7, 0.77));
        tb.mark.setAttribute("opacity", out.toFixed(2));
        tb.mark.style.stroke = FAIL_SENS[tb.id] ? "#8e8a99" : "";
        tb.g.setAttribute("opacity", (1 - 0.62 * out).toFixed(2));
        tb.g.setAttribute("transform", "translate(0 " + (6 * out).toFixed(1) + ")");

        var fav = FAVS[tb.id] ? ease(seg(t, 0.82, 0.9)) : 0;
        var scan = scanned === tb ? 1 : 0;
        tb.ring.setAttribute("opacity", Math.max(fav, scan * 0.8).toFixed(2));
        tb.ring.style.strokeDasharray = scan && !fav ? "4 4" : "";
        tb.label.style.fontWeight = fav > 0.5 ? "700" : "";
      });

      var count = t < 0.56 ? 0 : t < 0.78 ? 1 : 2;
      if (count !== lastCount) { lastCount = count; setTexts(); }
      labels.count.setAttribute("opacity", seg(t, 0.12, 0.2).toFixed(2));

      var step = t < 0.34 ? 0 : t < 0.58 ? 1 : t < 0.8 ? 2 : 3;
      steps.forEach(function (li, k) {
        li.classList.toggle("is-on", k <= step);
        li.classList.toggle("is-current", k === step);
      });
    }

    build();
    JG.onLang(setTexts);

    var live = !JG.reduceMotion() && track && "IntersectionObserver" in window;
    if (!live) { render(1); return; }
    section.classList.add("is-live");

    var visible = false, queued = false;
    function progress() {
      var r = track.getBoundingClientRect();
      var span = r.height - window.innerHeight;
      return span > 0 ? clamp(-r.top / span, 0, 1) : 1;
    }
    function tick() {
      queued = false;
      render(progress());
    }
    function onScroll() {
      if (!visible || queued) return;
      queued = true;
      requestAnimationFrame(tick);
    }
    new IntersectionObserver(function (entries) {
      visible = entries.some(function (e) { return e.isIntersecting; });
      if (visible) onScroll();
    }).observe(track);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    render(progress());
  })();

  /* ------------------------------------------------------------------
     Utilidades de gráficas: tooltip, tabla y animación de entrada
     ------------------------------------------------------------------ */
  function tooltip(host) {
    var tip = document.createElement("div");
    tip.className = "viz-tip";
    tip.setAttribute("aria-hidden", "true");
    host.appendChild(tip);
    return {
      show: function (x, y, rows) {
        while (tip.firstChild) tip.removeChild(tip.firstChild);
        rows.forEach(function (r, i) {
          if (i === 0) { var b = document.createElement("b"); b.textContent = r.value; tip.appendChild(b); }
          var row = document.createElement("div");
          row.className = "row";
          if (r.color) { var k = document.createElement("i"); k.className = "key"; k.style.setProperty("--c", r.color); row.appendChild(k); }
          var s = document.createElement("span");
          s.textContent = i === 0 ? r.label : r.value + "  " + r.label;
          row.appendChild(s);
          tip.appendChild(row);
        });
        var hw = host.clientWidth;
        tip.style.left = clamp(x + 12, 0, Math.max(0, hw - tip.offsetWidth)) + "px";
        tip.style.top = Math.max(0, y - tip.offsetHeight - 10) + "px";
        tip.classList.add("is-on");
      },
      hide: function () { tip.classList.remove("is-on"); }
    };
  }

  function tableToggle(host, build) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "viz-table-btn";
    btn.setAttribute("aria-expanded", "false");
    var wrap = document.createElement("div");
    wrap.hidden = true;
    function label() { btn.textContent = JG.lang() === "en" ? (wrap.hidden ? "Show table" : "Hide table") : (wrap.hidden ? "Ver tabla" : "Ocultar tabla"); }
    btn.addEventListener("click", function () {
      wrap.hidden = !wrap.hidden;
      btn.setAttribute("aria-expanded", String(!wrap.hidden));
      if (!wrap.hidden) { while (wrap.firstChild) wrap.removeChild(wrap.firstChild); wrap.appendChild(build()); }
      label();
    });
    label();
    host.appendChild(btn);
    host.appendChild(wrap);
    return { refresh: function () { label(); if (!wrap.hidden) { while (wrap.firstChild) wrap.removeChild(wrap.firstChild); wrap.appendChild(build()); } } };
  }

  function makeTable(head, rows) {
    var table = document.createElement("table");
    table.className = "viz-table";
    var thead = document.createElement("thead");
    var tr = document.createElement("tr");
    head.forEach(function (h) { var th = document.createElement("th"); th.scope = "col"; th.textContent = h; tr.appendChild(th); });
    thead.appendChild(tr);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    rows.forEach(function (r) {
      var row = document.createElement("tr");
      r.forEach(function (c, i) {
        var cell = document.createElement(i === 0 ? "th" : "td");
        if (i === 0) cell.scope = "row";
        cell.textContent = c;
        row.appendChild(cell);
      });
      tbody.appendChild(row);
    });
    table.appendChild(tbody);
    return table;
  }

  function onEnter(node, fn) {
    if (JG.reduceMotion() || !("IntersectionObserver" in window)) { fn(true); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(false); }
    }, { threshold: 0.35 });
    io.observe(node);
  }

  // Barra vertical con extremo redondeado (4 px) y base recta
  function colPath(x, yTop, w, yBase) {
    var r = Math.min(4, w / 2, Math.max(0, yBase - yTop));
    return "M" + x + " " + yBase + "V" + (yTop + r) + "Q" + x + " " + yTop + " " + (x + r) + " " + yTop +
      "H" + (x + w - r) + "Q" + (x + w) + " " + yTop + " " + (x + w) + " " + (yTop + r) + "V" + yBase + "Z";
  }

  /* ------------------------------------------------------------------
     Viscosidad: mismo emulsificante, dos modificadores
     ------------------------------------------------------------------ */
  (function viscosity() {
    var card = document.querySelector('[data-viz="viscosity"]');
    if (!card) return;
    var body = card.querySelector("[data-viz-body]");
    var DATA = [
      { name: 2, rpm: 100, a: 4960, b: 3410, max: 6000, ticks: [0, 2000, 4000, 6000] },
      { name: 4, rpm: 10, a: 53900, b: 11800, max: 60000, ticks: [0, 20000, 40000, 60000] }
    ];
    var TX = {
      es: { panel: function (d) { return "Emulsificante " + d.name + ", " + d.rpm + " rpm"; }, a: "A: con modificación hidrofóbica", b: "B: sin modificación", unit: "cP", times: " veces", head: ["Emulsificante", "A (cP)", "B (cP)", "A ÷ B"] },
      en: { panel: function (d) { return "Emulsifier " + d.name + ", " + d.rpm + " rpm"; }, a: "A: hydrophobically modified", b: "B: unmodified", unit: "cP", times: "×", head: ["Emulsifier", "A (cP)", "B (cP)", "A ÷ B"] }
    };
    var tip = tooltip(body);
    var svg, legend, bars = [];

    function tick(v) { return v >= 10000 ? (v / 1000) + "K" : fmt(v); }

    function draw(animate) {
      var tx = TX[JG.lang()];
      body.textContent = "";
      var W = cw(body), PW = W / 2;
      svg = el("svg", { viewBox: "0 0 " + W + " 246", "class": "viz-svg", role: "img", "aria-label": tx.panel(DATA[0]) + ", " + tx.panel(DATA[1]) }, body);
      bars = [];
      DATA.forEach(function (d, p) {
        var ox = p * PW, left = ox + 42, right = ox + PW - 10, top = 36, base = 196;
        el("text", { x: ox + 4, y: 16, "class": "ax", "font-weight": "600" }, svg).textContent = tx.panel(d);
        d.ticks.forEach(function (v) {
          var y = base - (v / d.max) * (base - top);
          el("line", { x1: left, x2: right, y1: y, y2: y, "class": "grid" }, svg);
          el("text", { x: left - 8, y: y + 4, "text-anchor": "end", "class": "ax" }, svg).textContent = tick(v);
        });
        [["a", "var(--s1)"], ["b", "var(--s2)"]].forEach(function (k, j) {
          var v = d[k[0]], w = 24;
          var cx = left + (right - left) * (0.16 + j * 0.4);
          var yTop = base - (v / d.max) * (base - top);
          var mark = el("path", { d: colPath(cx, yTop, w, base), fill: k[1], "class": "mark" }, svg);
          if (animate) { mark.style.transformOrigin = "0 " + base + "px"; mark.style.transform = "scaleY(0)"; mark.style.transition = "transform .9s cubic-bezier(.25,.7,.15,1) " + (p * 150 + j * 90) + "ms"; bars.push(mark); }
          el("text", { x: cx + w / 2, y: yTop - 7, "text-anchor": "middle", "class": "val" }, svg).textContent = fmt(v);
          el("text", { x: cx + w / 2, y: base + 18, "text-anchor": "middle", "class": "ax" }, svg).textContent = k[0].toUpperCase();
          var hit = el("rect", { x: cx - 18, y: top - 10, width: w + 36, height: base - top + 30, "class": "hit" }, svg);
          hit.addEventListener("pointerenter", function () { mark.classList.add("is-hot"); });
          hit.addEventListener("pointermove", function (e) {
            var r = body.getBoundingClientRect();
            tip.show(e.clientX - r.left, e.clientY - r.top, [{ value: fmt(v) + " cP", label: (k[0] === "a" ? tx.a : tx.b) + ", " + tx.panel(d) }]);
          });
          hit.addEventListener("pointerleave", function () { mark.classList.remove("is-hot"); tip.hide(); });
        });
        var ratio = (d.a / d.b).toFixed(1);
        el("text", { x: (left + right) / 2, y: base + 40, "text-anchor": "middle", "class": "val" }, svg).textContent = JG.lang() === "en" ? "A is " + ratio + "× B" : "A es " + ratio + " veces B";
        el("line", { x1: left, x2: right, y1: base, y2: base, stroke: "rgba(29,29,31,.28)" }, svg);
      });
      legend = document.createElement("div");
      legend.className = "viz-legend";
      [[tx.a, "var(--s1)"], [tx.b, "var(--s2)"]].forEach(function (l) {
        var s = document.createElement("span"); var i = document.createElement("i"); i.style.setProperty("--c", l[1]);
        s.appendChild(i); s.appendChild(document.createTextNode(l[0])); legend.appendChild(s);
      });
      body.appendChild(legend);
      body.appendChild(tipNode);
      if (animate) requestAnimationFrame(function () { requestAnimationFrame(function () { bars.forEach(function (b) { b.style.transform = "scaleY(1)"; }); }); });
    }
    var tipNode = body.querySelector(".viz-tip");
    var table = tableToggle(card, function () {
      var tx = TX[JG.lang()];
      return makeTable(tx.head, DATA.map(function (d) { return [d.name + " (" + d.rpm + " rpm)", fmt(d.a), fmt(d.b), (d.a / d.b).toFixed(2)]; }));
    });
    var drawn = false;
    onEnter(card, function (still) { drawn = true; draw(!still); });
    JG.onLang(function () { if (drawn) draw(false); table.refresh(); });
    onWidth(body, function () { if (drawn) draw(false); });
  })();

  /* ------------------------------------------------------------------
     Perfil sensorial: araña de 13 atributos, una fórmula contra el promedio
     ------------------------------------------------------------------ */
  (function radar() {
    var card = document.querySelector('[data-viz="radar"]');
    var chipsHost = document.querySelector("[data-radar-chips]");
    var scoreEl = document.querySelector("[data-radar-score]");
    if (!card || !chipsHost) return;
    var body = card.querySelector("[data-viz-body]");

    var ATTR = {
      es: ["Cuerpo", "Brillo de la crema", "Blancura", "Facilidad de toma", "Efecto blanco inicial", "Deslizamiento", "Ligereza", "Blanco al frotar", "Desaparición del blanco", "Suavidad", "Absorción", "Brillo en la piel", "Resistencia"],
      en: ["Body", "Cream gloss", "Whiteness", "Pick-up", "Initial whitening", "Slip", "Lightness", "Whitening on rub-in", "Whitening fade", "Softness", "Absorption", "Shine on skin", "Resistance"]
    };
    // Promedios de 4 panelistas (escala 1 a 5)
    var DATA = {
      A1: [3.75, 3.45, 4.15, 4.75, 3.875, 4.75, 4.25, 4.5, 4.2, 4.575, 3.875, 3, 4.75],
      A2: [3.875, 4.5, 4.425, 4.85, 2.75, 4.75, 4.875, 2.375, 2.375, 4.4, 3.2, 3.45, 4.625],
      A3: [4.675, 4.425, 4.8, 4.875, 3.125, 4.95, 4.6, 2.625, 2.875, 3.625, 3.95, 3.125, 4.25],
      A4: [4.75, 4.25, 4.95, 4.575, 2.625, 4.7, 3.25, 1, 1.5, 4.675, 3.675, 2.875, 4.2],
      A5: [4.25, 4.95, 5, 4.75, 2.825, 4.5, 3.7, 3.125, 3.5, 4.625, 3.625, 4.125, 4.325],
      A6: [3.25, 2.5, 3.7, 4.9, 4.2, 4.7, 4.65, 4.375, 3.875, 3.8, 4.075, 2.875, 4.075],
      A7: [3.5, 4.075, 4.65, 4.5, 4.25, 4.45, 4.575, 4.7, 4.875, 4.25, 4.175, 2.75, 4.75],
      B2: [3.375, 3.625, 3.9, 4.75, 3.5, 4.5, 4.65, 2.375, 2.425, 4.875, 3.875, 2.375, 4.375],
      B4: [3.375, 3.3, 3.825, 4.475, 3.5, 4.75, 4.65, 2.075, 1.825, 4.425, 4.125, 2.5, 3.725]
    };
    var ORDER = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "B2", "B4"];
    var AVG = DATA.A1.map(function (_, k) {
      return ORDER.reduce(function (s, id) { return s + DATA[id][k]; }, 0) / ORDER.length;
    });
    function overall(id) { return DATA[id].reduce(function (s, v) { return s + v; }, 0) / 13; }

    var current = "A7";
    var CX = 260, CY = 214, R = 150, N = 13;
    var tip = tooltip(body);
    var tipNode = body.querySelector(".viz-tip");
    var poly, dots = [], avgPoly, svg, anim = null, shown = DATA[current].slice();

    function pt(k, v, rr) {
      var a = -Math.PI / 2 + k * 2 * Math.PI / N;
      var r = (rr || R) * (v / 5);
      return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
    }
    function polyStr(vals) { return vals.map(function (v, k) { return pt(k, v).map(function (n) { return n.toFixed(1); }).join(","); }).join(" "); }

    var mode = "radar";
    function build() {
      mode = body.clientWidth < 470 ? "dots" : "radar";
      if (mode === "dots") { buildDots(); return; }
      body.textContent = "";
      var names = ATTR[JG.lang()];
      svg = el("svg", { viewBox: "0 0 520 430", "class": "viz-svg", role: "img", "aria-label": JG.lang() === "en" ? "Sensory profile radar chart" : "Gráfica de araña del perfil sensorial" }, body);
      for (var ring = 1; ring <= 5; ring++) {
        var vals = []; for (var k = 0; k < N; k++) vals.push(ring);
        el("polygon", { points: polyStr(vals), fill: "none", "class": "grid" }, svg);
      }
      for (var k2 = 0; k2 < N; k2++) {
        var e = pt(k2, 5);
        el("line", { x1: CX, y1: CY, x2: e[0].toFixed(1), y2: e[1].toFixed(1), "class": "grid" }, svg);
        var l = pt(k2, 5, R + 18);
        var a = -Math.PI / 2 + k2 * 2 * Math.PI / N;
        var cos = Math.cos(a);
        var anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        var t = el("text", { x: l[0].toFixed(1), y: (l[1] + 4 + (Math.sin(a) > 0.9 ? 6 : 0)).toFixed(1), "text-anchor": anchor, "class": "ax" }, svg);
        t.textContent = names[k2];
      }
      [1, 3, 5].forEach(function (v) {
        el("text", { x: CX + 4, y: (CY - R * v / 5 + 12).toFixed(1), "class": "ax", "font-size": "10.5" }, svg).textContent = String(v);
      });
      avgPoly = el("polygon", { points: polyStr(AVG), fill: "none", stroke: "var(--s-muted)", "stroke-width": "1.6", "stroke-linejoin": "round" }, svg);
      poly = el("polygon", { points: polyStr(shown), fill: "rgba(107,63,196,.12)", stroke: "var(--s1)", "stroke-width": "2", "stroke-linejoin": "round" }, svg);
      dots = [];
      for (var k3 = 0; k3 < N; k3++) {
        var p = pt(k3, shown[k3]);
        var d = el("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 4.5, fill: "var(--s1)", stroke: "#f5f3fa", "stroke-width": "2" }, svg);
        dots.push(d);
        (function (k) {
          var hit = el("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: 14, "class": "hit" }, svg);
          hit.addEventListener("pointermove", function (ev) {
            var r = body.getBoundingClientRect();
            tip.show(ev.clientX - r.left, ev.clientY - r.top, [
              { value: DATA[current][k].toFixed(2), label: current + ", " + ATTR[JG.lang()][k] },
              { value: AVG[k].toFixed(2), label: JG.lang() === "en" ? "average of all 9" : "promedio de las 9", color: "var(--s-muted)" }
            ]);
          });
          hit.addEventListener("pointerleave", function () { tip.hide(); });
          dots[k].hit = hit;
        })(k3);
      }
      var legend = document.createElement("div");
      legend.className = "viz-legend";
      [[current, "var(--s1)"], [JG.lang() === "en" ? "Average of the 9 stable formulas" : "Promedio de las 9 fórmulas estables", "var(--s-muted)"]].forEach(function (lg, i) {
        var s = document.createElement("span"); var ic = document.createElement("i"); ic.className = "line"; ic.style.setProperty("--c", lg[1]);
        s.appendChild(ic); s.appendChild(document.createTextNode(lg[0])); legend.appendChild(s);
        if (i === 0) legend.firstLabel = s;
      });
      body.appendChild(legend);
      body.appendChild(tipNode);
      body.legend = legend;
    }

    // Versión para celular: una fila por atributo, punto de la fórmula y marca del promedio
    var DX0 = 0, DX1 = 0;
    function dx(v) { return DX0 + (v - 1) / 4 * (DX1 - DX0); }
    function buildDots() {
      body.textContent = "";
      var names = ATTR[JG.lang()];
      var W = cw(body), rowH = 27, top = 26;
      DX0 = 146; DX1 = W - 14;
      var H = top + N * rowH + 8;
      svg = el("svg", { viewBox: "0 0 " + W + " " + H, "class": "viz-svg", role: "img", "aria-label": JG.lang() === "en" ? "Sensory profile by attribute" : "Perfil sensorial por atributo" }, body);
      for (var v = 1; v <= 5; v++) {
        el("line", { x1: dx(v), x2: dx(v), y1: top - 6, y2: H - 6, "class": "grid" }, svg);
        el("text", { x: dx(v), y: 13, "text-anchor": "middle", "class": "ax" }, svg).textContent = String(v);
      }
      dots = [];
      for (var k = 0; k < N; k++) {
        var y = top + k * rowH + rowH / 2;
        el("text", { x: DX0 - 12, y: y + 4, "text-anchor": "end", "class": "ax" }, svg).textContent = names[k];
        el("line", { x1: dx(AVG[k]), x2: dx(AVG[k]), y1: y - 7, y2: y + 7, stroke: "var(--s-muted)", "stroke-width": "2", "stroke-linecap": "round" }, svg);
        var d = el("circle", { cx: dx(shown[k]).toFixed(1), cy: y, r: 5.5, fill: "var(--s1)", stroke: "#f5f3fa", "stroke-width": "2" }, svg);
        dots.push(d);
        (function (k, y) {
          var hit = el("rect", { x: 0, y: y - rowH / 2, width: W, height: rowH, "class": "hit" }, svg);
          hit.addEventListener("pointermove", function (ev) {
            var r = body.getBoundingClientRect();
            tip.show(ev.clientX - r.left, ev.clientY - r.top, [
              { value: DATA[current][k].toFixed(2), label: current + ", " + ATTR[JG.lang()][k] },
              { value: AVG[k].toFixed(2), label: JG.lang() === "en" ? "average of all 9" : "promedio de las 9", color: "var(--s-muted)" }
            ]);
          });
          hit.addEventListener("pointerleave", function () { tip.hide(); });
        })(k, y);
      }
      var legend = document.createElement("div");
      legend.className = "viz-legend";
      [[current, "var(--s1)", false], [JG.lang() === "en" ? "Average of the 9 stable formulas" : "Promedio de las 9 fórmulas estables", "var(--s-muted)", true]].forEach(function (lg, i) {
        var s2 = document.createElement("span"); var ic = document.createElement("i"); ic.className = lg[2] ? "line" : ""; ic.style.setProperty("--c", lg[1]);
        if (!lg[2]) { ic.style.borderRadius = "50%"; }
        s2.appendChild(ic); s2.appendChild(document.createTextNode(lg[0])); legend.appendChild(s2);
        if (i === 0) legend.firstLabel = s2;
      });
      body.appendChild(legend);
      body.appendChild(tipNode);
      body.legend = legend;
    }

    function place(vals) {
      if (mode === "dots") {
        vals.forEach(function (v, k) { dots[k].setAttribute("cx", dx(v).toFixed(1)); });
        return;
      }
      poly.setAttribute("points", polyStr(vals));
      vals.forEach(function (v, k) {
        var p = pt(k, v);
        dots[k].setAttribute("cx", p[0].toFixed(1)); dots[k].setAttribute("cy", p[1].toFixed(1));
        dots[k].hit.setAttribute("cx", p[0].toFixed(1)); dots[k].hit.setAttribute("cy", p[1].toFixed(1));
      });
    }

    function select(id) {
      current = id;
      chips.forEach(function (b) { b.setAttribute("aria-pressed", String(b.getAttribute("data-id") === id)); });
      if (body.legend) body.legend.firstLabel.lastChild.textContent = id;
      var target = DATA[id], from = shown.slice();
      if (anim) cancelAnimationFrame(anim);
      if (JG.reduceMotion()) { shown = target.slice(); place(shown); }
      else {
        var t0 = performance.now();
        (function step(now) {
          var k = Math.min(1, (now - t0) / 450);
          var e = 1 - Math.pow(1 - k, 3);
          shown = from.map(function (v, i) { return v + (target[i] - v) * e; });
          place(shown);
          if (k < 1) anim = requestAnimationFrame(step);
        })(t0);
      }
      writeScore();
    }

    function writeScore() {
      var o = overall(current).toFixed(2);
      var fav = !!FAVS[current];
      scoreEl.textContent = JG.lang() === "en"
        ? current + ": overall average of " + o + " out of 5" + (fav ? ", one of the panel’s three favorites." : ".")
        : current + ": promedio general de " + o + " sobre 5" + (fav ? ", una de las tres favoritas del panel." : ".");
    }

    var chips = ORDER.map(function (id) {
      var b = document.createElement("button");
      b.type = "button";
      b.setAttribute("data-id", id);
      b.setAttribute("aria-pressed", String(id === current));
      b.textContent = id;
      b.addEventListener("click", function () { select(id); });
      chipsHost.appendChild(b);
      return b;
    });

    var table = tableToggle(card, function () {
      var names = ATTR[JG.lang()];
      var head = [JG.lang() === "en" ? "Attribute" : "Atributo"].concat(ORDER).concat([JG.lang() === "en" ? "Avg." : "Prom."]);
      return makeTable(head, names.map(function (n, k) {
        return [n].concat(ORDER.map(function (id) { return DATA[id][k].toFixed(2); })).concat([AVG[k].toFixed(2)]);
      }));
    });
    var wrapTable = card.querySelector(".viz-table-btn").nextElementSibling;
    wrapTable.style.overflowX = "auto";

    build();
    writeScore();
    JG.onLang(function () { build(); writeScore(); table.refresh(); });
    onWidth(body, build);
  })();

  /* ------------------------------------------------------------------
     Pestañas de sondas del Multi Skin Test Center MC 900
     ------------------------------------------------------------------ */
  (function probes() {
    var host = document.querySelector("[data-probes]");
    if (!host) return;
    var tabs = Array.prototype.slice.call(host.querySelectorAll('[role="tab"]'));
    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
      if (focus) tab.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t, false); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight") n = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") n = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") n = tabs[0];
        else if (e.key === "End") n = tabs[tabs.length - 1];
        if (n) { e.preventDefault(); select(n, true); }
      });
    });
  })();
})();
