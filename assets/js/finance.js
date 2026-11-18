/* =====================================================================
   Portafolio de Jennifer Guerrero López
   Tablero de finanzas: casos prácticos del diplomado (IVA, régimen,
   arrendamiento, portafolio BMV) y dos ejemplos interactivos
   (amortización y VPN). Gráficas hechas a mano en SVG, sin librerías.
   ===================================================================== */
(function () {
  "use strict";

  var JG = window.JG || { lang: function () { return "es"; }, onLang: function () {}, reduceMotion: function () { return false; } };
  var SVGNS = "http://www.w3.org/2000/svg";
  var C1 = "var(--d1)", C2 = "var(--d2)", C3 = "var(--d3)", CM = "var(--d-muted)";

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    if (attrs) Object.keys(attrs).forEach(function (k) { if (attrs[k] != null) n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(tag, cls, parent, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    if (parent) parent.appendChild(n);
    return n;
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function L() { return JG.lang(); }
  function money(v, dec) {
    var d = dec == null ? (Math.abs(v) % 1 ? 2 : 0) : dec;
    var s = Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });
    return (v < 0 ? "−$" : "$") + s;
  }
  function compact(v) {
    var a = Math.abs(v), s;
    if (a >= 1e6) s = (a / 1e6).toFixed(a % 1e6 ? 1 : 0) + "M";
    else if (a >= 1e4) s = Math.round(a / 1e3) + "K";
    else s = a.toLocaleString("en-US");
    return (v < 0 ? "−" : "") + s;
  }
  function cw(node) { return Math.round(clamp(node.clientWidth || 520, 300, 640)); }
  function niceStep(span, n) {
    var raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
    return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
  }

  /* ---------- Piezas comunes ---------- */
  function tooltip(host) {
    var tip = h("div", "viz-tip", host);
    tip.setAttribute("aria-hidden", "true");
    return {
      node: tip,
      show: function (x, y, title, rows) {
        tip.textContent = "";
        h("b", null, tip, title);
        rows.forEach(function (r) {
          var row = h("div", "row", tip);
          if (r.c) { var k = h("i", "key", row); k.style.setProperty("--c", r.c); }
          h("span", null, row, r.t);
        });
        var hw = host.clientWidth;
        tip.style.left = clamp(x + 12, 0, Math.max(0, hw - tip.offsetWidth)) + "px";
        tip.style.top = Math.max(0, y - tip.offsetHeight - 12) + "px";
        tip.classList.add("is-on");
      },
      hide: function () { tip.classList.remove("is-on"); }
    };
  }
  function bindTip(target, body, tip, fn) {
    function show(e) {
      var r = body.getBoundingClientRect();
      var x, y;
      if (e && e.clientX != null) { x = e.clientX - r.left; y = e.clientY - r.top; }
      else { var b = target.getBoundingClientRect(); x = b.left - r.left + b.width / 2; y = b.top - r.top; }
      var d = fn();
      tip.show(x, y, d.title, d.rows);
      if (d.mark) d.mark.classList.add("is-hot");
    }
    function hide() { tip.hide(); var d = fn(); if (d.mark) d.mark.classList.remove("is-hot"); }
    target.addEventListener("pointermove", show);
    target.addEventListener("pointerleave", hide);
    target.addEventListener("focus", show);
    target.addEventListener("blur", hide);
  }
  function legend(parent, items, line) {
    var lg = h("div", "viz-legend", parent);
    items.forEach(function (it) {
      var s = h("span", null, lg);
      var i = h("i", line ? "line" : null, s);
      i.style.setProperty("--c", it[1]);
      s.appendChild(document.createTextNode(it[0]));
    });
    return lg;
  }
  function tableToggle(host, build) {
    var btn = h("button", "viz-table-btn", host);
    btn.type = "button";
    btn.setAttribute("aria-expanded", "false");
    var wrap = h("div", null, host);
    wrap.hidden = true;
    wrap.style.overflowX = "auto";
    function label() { btn.textContent = L() === "en" ? (wrap.hidden ? "Show table" : "Hide table") : (wrap.hidden ? "Ver tabla" : "Ocultar tabla"); }
    function fill() { wrap.textContent = ""; wrap.appendChild(build()); }
    btn.addEventListener("click", function () {
      wrap.hidden = !wrap.hidden;
      btn.setAttribute("aria-expanded", String(!wrap.hidden));
      if (!wrap.hidden) fill();
      label();
    });
    label();
    return { refresh: function () { label(); if (!wrap.hidden) fill(); } };
  }
  function makeTable(head, rows) {
    var t = h("table", "viz-table");
    var tr = h("tr", null, h("thead", null, t));
    head.forEach(function (x) { var th = h("th", null, tr, x); th.scope = "col"; });
    var tb = h("tbody", null, t);
    rows.forEach(function (r) {
      var row = h("tr", null, tb);
      r.forEach(function (c, i) { var cell = h(i === 0 ? "th" : "td", null, row, c); if (i === 0) cell.scope = "row"; });
    });
    return t;
  }
  function onEnter(node, fn) {
    if (JG.reduceMotion() || !("IntersectionObserver" in window)) { fn(false); return; }
    var io = new IntersectionObserver(function (entries) {
      if (entries.some(function (e) { return e.isIntersecting; })) { io.disconnect(); fn(true); }
    }, { threshold: 0.3 });
    io.observe(node);
  }
  function grow(nodes, axis, delay) {
    nodes.forEach(function (n, i) {
      n.style.transform = axis === "x" ? "scaleX(0)" : "scaleY(0)";
      n.style.transition = "transform .9s cubic-bezier(.25,.7,.15,1) " + ((delay || 0) + i * 70) + "ms";
    });
    requestAnimationFrame(function () { requestAnimationFrame(function () { nodes.forEach(function (n) { n.style.transform = "none"; }); }); });
  }
  // Barra horizontal: base recta a la izquierda, extremo de 4 px redondeado
  function hbar(x, y, w, hgt) {
    var r = Math.min(4, w, hgt / 2);
    if (w <= 0) return "";
    return "M" + x + " " + y + "H" + (x + w - r) + "Q" + (x + w) + " " + y + " " + (x + w) + " " + (y + r) +
      "V" + (y + hgt - r) + "Q" + (x + w) + " " + (y + hgt) + " " + (x + w - r) + " " + (y + hgt) + "H" + x + "Z";
  }
  // Columna con el extremo de datos redondeado (arriba si es positiva, abajo si es negativa)
  function vbar(x, y0, y1, w) {
    var top = Math.min(y0, y1), bot = Math.max(y0, y1), hgt = bot - top;
    if (hgt < 0.5) return "";
    var r = Math.min(4, w / 2, hgt);
    if (y1 < y0) return "M" + x + " " + bot + "V" + (top + r) + "Q" + x + " " + top + " " + (x + r) + " " + top + "H" + (x + w - r) + "Q" + (x + w) + " " + top + " " + (x + w) + " " + (top + r) + "V" + bot + "Z";
    return "M" + x + " " + top + "V" + (bot - r) + "Q" + x + " " + bot + " " + (x + r) + " " + bot + "H" + (x + w - r) + "Q" + (x + w) + " " + bot + " " + (x + w) + " " + (bot - r) + "V" + top + "Z";
  }

  function widget(name, render) {
    var card = document.querySelector('[data-viz="' + name + '"]');
    if (!card) return;
    var body = card.querySelector("[data-viz-body]");
    var ctx = { card: card, body: body, animate: false, drawn: false };
    var api = render(ctx);
    var lastW = 0, timer = 0;
    onEnter(card, function (animate) { ctx.drawn = true; ctx.animate = animate; lastW = body.clientWidth; api.draw(); ctx.animate = false; });
    JG.onLang(function () { if (ctx.drawn) api.draw(); if (api.table) api.table.refresh(); });
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var w = body.clientWidth;
        if (ctx.drawn && Math.abs(w - lastW) > 16) { lastW = w; (api.resize || api.draw)(); }
      }, 160);
    });
  }

  /* ------------------------------------------------------------------
     1. IVA: mismo negocio con tasa 16%, tasa 0% y exento
     ------------------------------------------------------------------ */
  widget("iva", function (ctx) {
    var DATA = [
      { k: { es: "Tasa 16%", en: "16% rate" }, v: 157384.85, tr: 24640, ac: 180211.52 },
      { k: { es: "Tasa 0%", en: "0% rate" }, v: 180211.52, tr: 0, ac: 180211.52 },
      { k: { es: "Exento", en: "Exempt" }, v: 0, tr: null, ac: null }
    ];
    var tip = tooltip(ctx.body);
    function draw() {
      var lang = L();
      ctx.body.textContent = "";
      h("p", "stat-label", ctx.body, lang === "en" ? "VAT credit balance in December" : "Saldo de IVA a favor en diciembre");
      var W = cw(ctx.body);
      var svg = el("svg", { viewBox: "0 0 " + W + " 150", "class": "viz-svg", role: "img", "aria-label": lang === "en" ? "VAT credit by treatment" : "Saldo de IVA a favor por tratamiento" }, ctx.body);
      var left = 78, right = W - 96, max = 200000, marks = [];
      [0, 100000, 200000].forEach(function (v) {
        var x = left + (v / max) * (right - left);
        el("line", { x1: x, x2: x, y1: 8, y2: 128, "class": "grid" }, svg);
        el("text", { x: x, y: 146, "text-anchor": "middle", "class": "ax" }, svg).textContent = compact(v);
      });
      DATA.forEach(function (d, i) {
        var y = 16 + i * 38, w = (d.v / max) * (right - left);
        el("text", { x: left - 10, y: y + 15, "text-anchor": "end", "class": "ax" }, svg).textContent = d.k[lang];
        var m = el("path", { d: hbar(left, y, w, 22), fill: C1, "class": "mark" }, svg);
        m.style.transformOrigin = left + "px 0";
        marks.push(m);
        el("text", { x: left + w + 8, y: y + 15, "class": "val" }, svg).textContent = d.v ? money(d.v) : (lang === "en" ? "$0, VAT becomes a cost" : "$0, el IVA se vuelve costo");
        var hit = el("rect", { x: 0, y: y - 6, width: W, height: 34, "class": "hit", tabindex: "0", role: "img",
          "aria-label": d.k[lang] + ": " + money(d.v) }, svg);
        bindTip(hit, ctx.body, tip, function () {
          var rows = [];
          if (d.tr != null) rows.push({ t: (lang === "en" ? "VAT charged: " : "IVA trasladado: ") + money(d.tr) });
          if (d.ac != null) rows.push({ t: (lang === "en" ? "Creditable VAT: " : "IVA acreditable: ") + money(d.ac) });
          if (d.tr == null) rows.push({ t: lang === "en" ? "Deduction rises to $1,306,533.52" : "La deducción sube a $1,306,533.52" });
          return { title: money(d.v), rows: [{ t: d.k[lang] }].concat(rows), mark: m };
        });
      });
      ctx.body.appendChild(tip.node);
      if (ctx.animate) grow(marks, "x");
    }
    var table = tableToggle(ctx.card, function () {
      var lang = L();
      return makeTable(lang === "en" ? ["Treatment", "VAT charged", "Creditable VAT", "December balance"] : ["Tratamiento", "IVA trasladado", "IVA acreditable", "Saldo a diciembre"],
        DATA.map(function (d) { return [d.k[lang], d.tr == null ? "—" : money(d.tr), d.ac == null ? (lang === "en" ? "becomes a cost" : "se vuelve costo") : money(d.ac), d.v ? money(-d.v) + (lang === "en" ? " credit" : " a favor") : "$0"]; }));
    });
    return { draw: draw, table: table };
  });

  /* ------------------------------------------------------------------
     2. Régimen: ISR del año en tres escenarios con los mismos datos
     ------------------------------------------------------------------ */
  widget("regime", function (ctx) {
    var DATA = [
      { k: { es: "Actividad empresarial con pérdidas", en: "Business activity, with losses" }, v: 29077, win: true },
      { k: { es: "RESICO", en: "RESICO (simplified regime)" }, v: 47000 },
      { k: { es: "Actividad empresarial sin pérdidas", en: "Business activity, no losses" }, v: 93000 }
    ];
    var tip = tooltip(ctx.body);
    function draw() {
      var lang = L();
      ctx.body.textContent = "";
      h("p", "stat-label", ctx.body, lang === "en" ? "Income tax for the year" : "ISR total del año");
      var W = cw(ctx.body);
      var svg = el("svg", { viewBox: "0 0 " + W + " 176", "class": "viz-svg", role: "img", "aria-label": lang === "en" ? "Annual income tax by regime" : "ISR anual por régimen" }, ctx.body);
      var left = 0, right = W - 78, max = 100000, marks = [];
      DATA.forEach(function (d, i) {
        var y = 6 + i * 56;
        el("text", { x: left, y: y + 12, "class": "ax" }, svg).textContent = d.k[lang];
        var w = (d.v / max) * (right - left);
        var m = el("path", { d: hbar(left, y + 22, w, 20), fill: d.win ? C1 : CM, "class": "mark" }, svg);
        m.style.transformOrigin = left + "px 0";
        marks.push(m);
        el("text", { x: left + w + 8, y: y + 37, "class": "val" }, svg).textContent = money(d.v);
        var hit = el("rect", { x: 0, y: y - 4, width: W, height: 50, "class": "hit", tabindex: "0", role: "img", "aria-label": d.k[lang] + ": " + money(d.v) }, svg);
        bindTip(hit, ctx.body, tip, function () {
          return { title: money(d.v), rows: [{ t: d.k[lang] }, { t: d.win ? (lang === "en" ? "Lowest tax: losses carry forward" : "El menor ISR: las pérdidas se amortizan") : (lang === "en" ? "vs. " : "contra ") + money(DATA[0].v) + (lang === "en" ? " with losses" : " con pérdidas") }], mark: m };
        });
      });
      ctx.body.appendChild(tip.node);
      if (ctx.animate) grow(marks, "x");
    }
    var table = tableToggle(ctx.card, function () {
      var lang = L();
      return makeTable(lang === "en" ? ["Scenario", "Income tax"] : ["Escenario", "ISR del año"], DATA.map(function (d) { return [d.k[lang], money(d.v)]; }));
    });
    return { draw: draw, table: table };
  });

  /* ------------------------------------------------------------------
     3. Arrendamiento: cómo se reparte la renta de febrero con deducción ciega
     ------------------------------------------------------------------ */
  widget("rent", function (ctx) {
    var PARTS = [
      { k: { es: "Deducción ciega (35%)", en: "Blind deduction (35%)" }, v: 5950, c: C1 },
      { k: { es: "Predial pagado", en: "Property tax paid" }, v: 5000, c: C2 },
      { k: { es: "Base gravable", en: "Taxable base" }, v: 6050, c: C3, dark: true }
    ];
    function draw() {
      var lang = L();
      ctx.body.textContent = "";
      var stat = h("div", "stat-row", ctx.body);
      var a = h("div", null, stat);
      h("p", "stat-label", a, lang === "en" ? "Monthly rent" : "Renta mensual");
      h("p", "stat-value", a, "$17,000");
      var b = h("div", null, stat);
      h("p", "stat-label", b, lang === "en" ? "Taxable base" : "Base gravable");
      h("p", "stat-value", b, "$6,050");
      var bar = h("div", "seg-bar" + (ctx.animate ? "" : ""), ctx.body);
      bar.setAttribute("role", "img");
      bar.setAttribute("aria-label", PARTS.map(function (p) { return p.k[lang] + " " + money(p.v); }).join(", "));
      var spans = PARTS.map(function (p) {
        var s = h("span", p.dark ? "is-dark" : null, bar, money(p.v));
        s.style.setProperty("--c", p.c);
        s.style.flex = p.v + " 1 0";
        s.title = p.k[lang] + ": " + money(p.v) + " (" + Math.round(p.v / 170) + "%)";
        return s;
      });
      legend(ctx.body, PARTS.map(function (p) { return [p.k[lang], p.c]; }));
      var calc = h("ul", "calc", ctx.body);
      [[lang === "en" ? "Rent" : "Renta", "$17,000"],
       [lang === "en" ? "− 35% blind deduction" : "− Deducción ciega del 35%", "$5,950"],
       [lang === "en" ? "− Property tax paid" : "− Predial pagado", "$5,000"],
       [lang === "en" ? "= Taxable base" : "= Base gravable", "$6,050"]].forEach(function (r) {
        var li = h("li", null, calc);
        h("span", null, li, r[0]);
        h("span", null, li, r[1]);
      });
      if (ctx.animate) grow(spans, "x");
    }
    var table = tableToggle(ctx.card, function () {
      var lang = L();
      return makeTable(lang === "en" ? ["Part of the rent", "Amount", "Share"] : ["Parte de la renta", "Monto", "Proporción"],
        PARTS.map(function (p) { return [p.k[lang], money(p.v), (p.v / 170).toFixed(1) + "%"]; }).concat([[lang === "en" ? "Total" : "Total", "$17,000", "100%"]]));
    });
    return { draw: draw, table: table };
  });

  /* ------------------------------------------------------------------
     4. Portafolio simulado en la BMV
     ------------------------------------------------------------------ */
  widget("portfolio", function (ctx) {
    var POS = [
      { k: "Banorte", n: 2000, v: 380000 },
      { k: "FEMSA", n: 1500, v: 325500 },
      { k: "Peñoles", n: 350, v: 280000 },
      { k: "OMA", n: 500, v: 104700 }
    ];
    var TOTAL = 2000000, INVESTED = 1090200;
    var tip = tooltip(ctx.body);
    function draw() {
      var lang = L();
      ctx.body.textContent = "";
      var stat = h("div", "stat-row", ctx.body);
      var a = h("div", null, stat);
      h("p", "stat-label", a, lang === "en" ? "Invested" : "Invertido");
      h("p", "stat-value is-hero", a, (INVESTED / TOTAL * 100).toFixed(1) + "%");
      var b = h("div", null, stat);
      h("p", "stat-label", b, lang === "en" ? "Cash to deploy" : "Efectivo por asignar");
      h("p", "stat-value", b, "$" + Math.round((TOTAL - INVESTED) / 1000) + "K");
      var meter = h("div", "meter", ctx.body);
      meter.setAttribute("role", "img");
      meter.setAttribute("aria-label", (lang === "en" ? "Invested: " : "Invertido: ") + (INVESTED / TOTAL * 100).toFixed(1) + "%");
      var fill = h("i", null, meter);
      fill.style.width = (INVESTED / TOTAL * 100) + "%";
      var W = cw(ctx.body);
      var svg = el("svg", { viewBox: "0 0 " + W + " 150", "class": "viz-svg", role: "img", "aria-label": lang === "en" ? "Weight of each position" : "Peso de cada posición" }, ctx.body);
      var left = 70, right = W - 56, max = 25, marks = [];
      [0, 10, 20].forEach(function (v) {
        var x = left + (v / max) * (right - left);
        el("line", { x1: x, x2: x, y1: 4, y2: 128, "class": "grid" }, svg);
        el("text", { x: x, y: 146, "text-anchor": "middle", "class": "ax" }, svg).textContent = v + "%";
      });
      POS.forEach(function (p, i) {
        var y = 8 + i * 30, pct = p.v / TOTAL * 100, w = (pct / max) * (right - left);
        el("text", { x: left - 10, y: y + 13, "text-anchor": "end", "class": "ax" }, svg).textContent = p.k;
        var m = el("path", { d: hbar(left, y, w, 18), fill: C1, "class": "mark" }, svg);
        m.style.transformOrigin = left + "px 0";
        marks.push(m);
        el("text", { x: left + w + 8, y: y + 13, "class": "val" }, svg).textContent = pct.toFixed(1) + "%";
        var hit = el("rect", { x: 0, y: y - 6, width: W, height: 30, "class": "hit", tabindex: "0", role: "img", "aria-label": p.k + ": " + pct.toFixed(1) + "%" }, svg);
        bindTip(hit, ctx.body, tip, function () {
          return { title: pct.toFixed(1) + "%", rows: [{ t: p.k }, { t: fmtN(p.n) + (lang === "en" ? " shares, about " : " títulos, aprox. ") + money(p.v) }], mark: m };
        });
      });
      ctx.body.appendChild(tip.node);
      if (ctx.animate) { grow(marks, "x"); fill.style.transform = "scaleX(0)"; fill.style.transformOrigin = "left"; fill.style.transition = "transform 1s cubic-bezier(.25,.7,.15,1)"; requestAnimationFrame(function () { requestAnimationFrame(function () { fill.style.transform = "none"; }); }); }
    }
    function fmtN(n) { return n.toLocaleString("en-US"); }
    var table = tableToggle(ctx.card, function () {
      var lang = L();
      return makeTable(lang === "en" ? ["Position", "Shares", "Approx. amount", "Weight"] : ["Posición", "Títulos", "Monto aprox.", "Peso"],
        POS.map(function (p) { return [p.k, fmtN(p.n), money(p.v), (p.v / TOTAL * 100).toFixed(1) + "%"]; })
          .concat([[lang === "en" ? "Cash" : "Efectivo", "—", money(TOTAL - INVESTED), ((TOTAL - INVESTED) / TOTAL * 100).toFixed(1) + "%"]]));
    });
    return { draw: draw, table: table };
  });

  /* ------------------------------------------------------------------
     5. Amortización: calculadora con método francés y alemán
     ------------------------------------------------------------------ */
  widget("amort", function (ctx) {
    var st = { amount: 100000, rate: 12, months: 12, method: "fr" };
    var tip = tooltip(ctx.body);
    var chartHost = null, statsHost = null, legendHost = null;

    function schedule() {
      var i = st.rate / 100 / 12, n = st.months, bal = st.amount, rows = [];
      var pay = i ? st.amount * i / (1 - Math.pow(1 + i, -n)) : st.amount / n;
      var cap = st.amount / n;
      for (var m = 1; m <= n; m++) {
        var int = bal * i;
        var principal = st.method === "fr" ? pay - int : cap;
        var p = st.method === "fr" ? pay : cap + int;
        bal = Math.max(0, bal - principal);
        rows.push({ m: m, pay: p, int: int, cap: principal, bal: bal });
      }
      return rows;
    }

    function controls() {
      var lang = L();
      var wrap = h("div", "ctrls", ctx.body);
      var tg = h("div", "toggle", wrap);
      tg.setAttribute("role", "group");
      tg.setAttribute("aria-label", lang === "en" ? "Method" : "Método");
      [["fr", lang === "en" ? "French" : "Francés"], ["de", lang === "en" ? "German" : "Alemán"]].forEach(function (o) {
        var b = h("button", null, tg, o[1]);
        b.type = "button";
        b.setAttribute("aria-pressed", String(st.method === o[0]));
        b.addEventListener("click", function () {
          st.method = o[0];
          Array.prototype.forEach.call(tg.children, function (x) { x.setAttribute("aria-pressed", String(x === b)); });
          update();
        });
      });
      slider(wrap, lang === "en" ? "Loan amount" : "Monto", 20000, 500000, 10000, "amount", function (v) { return money(v); });
      slider(wrap, lang === "en" ? "Annual rate" : "Tasa anual", 4, 36, 0.5, "rate", function (v) { return v.toFixed(1) + "%"; });
      slider(wrap, lang === "en" ? "Term" : "Plazo", 6, 36, 1, "months", function (v) { return v + (lang === "en" ? " months" : " meses"); });
    }
    var uid = 0;
    function slider(parent, label, min, max, step, key, show) {
      var id = "amort-" + key + "-" + (uid++);
      var c = h("div", "ctrl", parent);
      var row = h("div", "ctrl-row", c);
      var lab = h("label", null, row, label);
      lab.htmlFor = id;
      var out = h("output", null, row, show(st[key]));
      var input = h("input", null, c);
      input.type = "range"; input.id = id; input.min = min; input.max = max; input.step = step; input.value = st[key];
      input.addEventListener("input", function () { st[key] = parseFloat(input.value); out.textContent = show(st[key]); update(); });
    }

    function update() {
      var lang = L();
      var rows = schedule();
      var totalInt = rows.reduce(function (s, r) { return s + r.int; }, 0);
      statsHost.textContent = "";
      var a = h("div", null, statsHost);
      h("p", "stat-label", a, st.method === "fr" ? (lang === "en" ? "Monthly payment" : "Pago mensual") : (lang === "en" ? "First payment" : "Primer pago"));
      h("p", "stat-value", a, money(rows[0].pay, 2));
      var b = h("div", null, statsHost);
      h("p", "stat-label", b, lang === "en" ? "Total interest" : "Intereses totales");
      h("p", "stat-value", b, money(totalInt, 2));

      chartHost.textContent = "";
      var W = cw(chartHost), H = 200, left = 46, right = W - 8, top = 8, base = 170;
      var maxPay = Math.max.apply(null, rows.map(function (r) { return r.pay; }));
      var step = niceStep(maxPay, 3), ymax = Math.ceil(maxPay / step) * step;
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "class": "viz-svg", role: "img",
        "aria-label": (lang === "en" ? "Payment split per month, " : "Composición del pago por mes, ") + (st.method === "fr" ? (lang === "en" ? "French method" : "método francés") : (lang === "en" ? "German method" : "método alemán")) }, chartHost);
      for (var v = 0; v <= ymax + 1e-9; v += step) {
        var y = base - (v / ymax) * (base - top);
        el("line", { x1: left, x2: right, y1: y, y2: y, "class": "grid" }, svg);
        el("text", { x: left - 8, y: y + 4, "text-anchor": "end", "class": "ax" }, svg).textContent = compact(v);
      }
      var n = rows.length, band = (right - left) / n, w = Math.min(24, band * 0.72);
      var segs = [];
      rows.forEach(function (r, k) {
        var x = left + k * band + (band - w) / 2;
        var yCap = base - (r.cap / ymax) * (base - top);
        var yTop = base - (r.pay / ymax) * (base - top);
        // Capital abajo (base recta), interés arriba con extremo redondeado y 2 px de separación
        var capPath = el("path", { d: "M" + x + " " + base + "V" + yCap + "H" + (x + w) + "V" + base + "Z", fill: C1, "class": "mark" }, svg);
        var intPath = el("path", { d: yCap - 2 - yTop >= 0.5 ? vbar(x, yCap - 2, yTop, w) : "", fill: C2, "class": "mark" }, svg);
        capPath.style.transformOrigin = "0 " + base + "px"; intPath.style.transformOrigin = "0 " + base + "px";
        segs.push(capPath, intPath);
        if (n <= 12 || (k + 1) % 6 === 0 || k === 0) el("text", { x: x + w / 2, y: base + 16, "text-anchor": "middle", "class": "ax" }, svg).textContent = String(r.m);
        var hit = el("rect", { x: left + k * band, y: top, width: band, height: base - top + 20, "class": "hit" }, svg);
        bindTip(hit, chartHost, tip, function () {
          return { title: money(r.pay, 2), rows: [
            { t: (lang === "en" ? "Month " : "Mes ") + r.m },
            { t: (lang === "en" ? "Principal " : "Capital ") + money(r.cap, 2), c: C1 },
            { t: (lang === "en" ? "Interest " : "Interés ") + money(r.int, 2), c: C2 },
            { t: (lang === "en" ? "Balance " : "Saldo ") + money(r.bal, 2) }
          ], mark: intPath };
        });
      });
      el("line", { x1: left, x2: right, y1: base, y2: base, stroke: "rgba(255,255,255,.3)" }, svg);
      el("text", { x: right, y: H - 2, "text-anchor": "end", "class": "ax" }, svg).textContent = lang === "en" ? "month" : "mes";
      chartHost.appendChild(tip.node);
      if (ctx.animate) { grow(segs, "y"); ctx.animate = false; }
    }

    function draw() {
      var lang = L();
      ctx.body.textContent = "";
      controls();
      statsHost = h("div", "stat-row", ctx.body);
      chartHost = h("div", "viz-body", ctx.body);
      chartHost.style.position = "relative";
      legendHost = legend(ctx.body, [[lang === "en" ? "Principal" : "Capital", C1], [lang === "en" ? "Interest" : "Interés", C2]]);
      update();
    }
    var table = tableToggle(ctx.card, function () {
      var lang = L();
      return makeTable(lang === "en" ? ["Month", "Payment", "Interest", "Principal", "Balance"] : ["Mes", "Pago", "Interés", "Capital", "Saldo"],
        schedule().map(function (r) { return [String(r.m), money(r.pay, 2), money(r.int, 2), money(r.cap, 2), money(r.bal, 2)]; }));
    });
    return { draw: draw, table: table, resize: function () { update(); } };
  });

  /* ------------------------------------------------------------------
     6. VPN: flujos descontados y valor acumulado (ejemplo ilustrativo)
     ------------------------------------------------------------------ */
  widget("npv", function (ctx) {
    var INV = 500000, FLOW = 150000, YEARS = 5;
    var st = { rate: 12 };
    var tip = tooltip(ctx.body);
    var chartHost, statsHost;

    function flows(rate) {
      var r = rate / 100, acc = 0, out = [];
      for (var t = 0; t <= YEARS; t++) {
        var cf = t === 0 ? -INV : FLOW;
        var pv = cf / Math.pow(1 + r, t);
        acc += pv;
        out.push({ t: t, cf: cf, pv: pv, acc: acc });
      }
      return out;
    }
    function irr() {
      var lo = 0, hi = 1;
      for (var k = 0; k < 80; k++) {
        var mid = (lo + hi) / 2;
        var v = flows(mid * 100);
        if (v[YEARS].acc > 0) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2 * 100;
    }
    var IRR = irr();

    function update() {
      var lang = L();
      var data = flows(st.rate);
      var npv = data[YEARS].acc;
      statsHost.textContent = "";
      var a = h("div", null, statsHost);
      h("p", "stat-label", a, lang === "en" ? "NPV at " + st.rate.toFixed(1) + "%" : "VPN al " + st.rate.toFixed(1) + "%");
      h("p", "stat-value is-hero", a, money(Math.round(npv), 0));
      var b = h("div", null, statsHost);
      h("p", "stat-label", b, lang === "en" ? "IRR" : "TIR");
      h("p", "stat-value", b, IRR.toFixed(1) + "%");
      var c = h("div", null, statsHost);
      h("p", "stat-label", c, lang === "en" ? "Decision" : "Decisión");
      h("p", "stat-value", c, npv >= 0 ? (lang === "en" ? "Invest" : "Invertir") : (lang === "en" ? "Pass" : "No invertir"));

      chartHost.textContent = "";
      var W = cw(chartHost), H = 210, left = 52, right = W - 10, top = 10, bottom = 176;
      var ymin = -500000, ymax = 200000;
      function Y(v) { return top + (ymax - v) / (ymax - ymin) * (bottom - top); }
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, "class": "viz-svg", role: "img", "aria-label": lang === "en" ? "Discounted cash flows and cumulative value" : "Flujos descontados y valor acumulado" }, chartHost);
      [-400000, -200000, 0, 200000].forEach(function (v) {
        el("line", { x1: left, x2: right, y1: Y(v), y2: Y(v), "class": v === 0 ? "zero" : "grid" }, svg);
        el("text", { x: left - 8, y: Y(v) + 4, "text-anchor": "end", "class": "ax" }, svg).textContent = compact(v);
      });
      var band = (right - left) / (YEARS + 1), w = Math.min(24, band * 0.6), marks = [];
      var pts = [];
      data.forEach(function (d) {
        var x = left + d.t * band + (band - w) / 2;
        var m = el("path", { d: vbar(x, Y(0), Y(d.pv), w), fill: d.pv < 0 ? C2 : C1, "class": "mark" }, svg);
        m.style.transformOrigin = "0 " + Y(0) + "px";
        marks.push(m);
        el("text", { x: x + w / 2, y: bottom + 18, "text-anchor": "middle", "class": "ax" }, svg).textContent = (lang === "en" ? "Y" : "A") + d.t;
        pts.push([x + w / 2, Y(d.acc)]);
        var hit = el("rect", { x: left + d.t * band, y: top, width: band, height: bottom - top + 24, "class": "hit" }, svg);
        bindTip(hit, chartHost, tip, function () {
          return { title: money(Math.round(d.acc), 0), rows: [
            { t: (lang === "en" ? "Year " : "Año ") + d.t + (lang === "en" ? ", cumulative" : ", acumulado"), c: C3 },
            { t: (lang === "en" ? "Cash flow " : "Flujo ") + money(d.cf, 0) },
            { t: (lang === "en" ? "Present value " : "Valor presente ") + money(Math.round(d.pv), 0), c: d.pv < 0 ? C2 : C1 }
          ], mark: m };
        });
      });
      var line = el("polyline", { points: pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join(" "), fill: "none", stroke: C3, "stroke-width": "2", "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
      pts.forEach(function (p, i) {
        el("circle", { cx: p[0].toFixed(1), cy: p[1].toFixed(1), r: i === YEARS ? 5 : 4, fill: C3, stroke: "#2a1d44", "stroke-width": "2" }, svg);
      });
      var last = pts[YEARS];
      el("text", { x: last[0] + 12, y: last[1] + (npv >= 0 ? 24 : -12), "text-anchor": "end", "class": "val" }, svg).textContent = (lang === "en" ? "NPV " : "VPN ") + compact(Math.round(npv));
      chartHost.appendChild(tip.node);
      if (ctx.animate) {
        grow(marks, "y");
        var len = line.getTotalLength ? line.getTotalLength() : 600;
        line.style.strokeDasharray = len; line.style.strokeDashoffset = len;
        line.style.transition = "stroke-dashoffset 1.2s cubic-bezier(.25,.7,.15,1) .3s";
        requestAnimationFrame(function () { requestAnimationFrame(function () { line.style.strokeDashoffset = "0"; }); });
        ctx.animate = false;
      }
    }

    function draw() {
      var lang = L();
      ctx.body.textContent = "";
      var wrap = h("div", "ctrls", ctx.body);
      var c = h("div", "ctrl", wrap);
      var row = h("div", "ctrl-row", c);
      var lab = h("label", null, row, lang === "en" ? "Discount rate" : "Tasa de descuento");
      lab.htmlFor = "npv-rate";
      var out = h("output", null, row, st.rate.toFixed(1) + "%");
      var input = h("input", null, c);
      input.type = "range"; input.id = "npv-rate"; input.min = 4; input.max = 30; input.step = 0.5; input.value = st.rate;
      input.addEventListener("input", function () { st.rate = parseFloat(input.value); out.textContent = st.rate.toFixed(1) + "%"; update(); });
      statsHost = h("div", "stat-row", ctx.body);
      chartHost = h("div", "viz-body", ctx.body);
      chartHost.style.position = "relative";
      legend(ctx.body, [[lang === "en" ? "Inflow, present value" : "Flujo positivo, valor presente", C1], [lang === "en" ? "Investment" : "Inversión", C2], [lang === "en" ? "Cumulative value" : "Valor acumulado", C3]]);
      update();
    }
    var table = tableToggle(ctx.card, function () {
      var lang = L();
      return makeTable(lang === "en" ? ["Year", "Cash flow", "Present value", "Cumulative"] : ["Año", "Flujo", "Valor presente", "Acumulado"],
        flows(st.rate).map(function (d) { return [String(d.t), money(d.cf, 0), money(Math.round(d.pv), 0), money(Math.round(d.acc), 0)]; }));
    });
    return { draw: draw, table: table, resize: function () { update(); } };
  });
})();
