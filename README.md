# Jennifer Guerrero López

Química Farmacéutica Bióloga (QFB) por la UNAM. Portafolio y CV en español e inglés: https://jenn-sher.github.io

- CV en español: [cv/Jennifer-Guerrero-CV-ES.pdf](cv/Jennifer-Guerrero-CV-ES.pdf)
- Résumé in English: [cv/Jennifer-Guerrero-CV-EN.pdf](cv/Jennifer-Guerrero-CV-EN.pdf)
- LinkedIn: https://www.linkedin.com/in/jenn-sher

## Mantener el sitio

- **Textos:** están en `index.html`, cada uno en dos idiomas: `<span lang="es">…</span><span lang="en">…</span>`. Cambia los dos.
- **Título de pestaña y descripción para buscadores:** objeto `META` en `assets/js/main.js`.
- **Enlace directo a un idioma:** agrega `?lang=en` o `?lang=es` a la URL.
- **Enlace directo a un producto:** `#gloss`, `#glowguard`, `#texturas`, `#prototipo` o `#finanzas`.
- **CV:** edita los `.tex` de `cv/` y compílalos (ver `cv/README.md`). Los PDF quedan con el nombre que enlaza el sitio, así que basta con subirlos.
- **Contador de visitas:** atributo `data-gc-code` en la sección de contacto de `index.html` (GoatCounter).

Cada cambio que se sube a la rama `main` se publica solo en uno o dos minutos.

## Estructura

```
index.html              sitio bilingüe (español e inglés)
assets/css/style.css    diseño: paleta lila, morado y rosa, vidrio esmerilado
assets/js/main.js       idioma, menú, centrífuga del inicio, contador de visitas
assets/js/showcase.js   vitrina 3D del gloss y GlowGuard (se carga sólo si hay WebGL)
assets/js/lab.js        texturas, viscosidad, perfil sensorial y sondas del MC 900
assets/js/finance.js    tablero de finanzas
assets/fonts/           Inter para la web
assets/img/             favicon, imágenes de los productos e imagen para redes
cv/                     CV en LaTeX (XeLaTeX) y sus PDF
```

Sitio estático en HTML, CSS y JavaScript. Con movimiento reducido o sin WebGL, la vitrina se muestra como imágenes fijas.

## Créditos

- Tipografía Inter de Rasmus Andersson (SIL Open Font License 1.1).
- `showcase.js` incluye three.js r187 (licencia MIT, ver `assets/js/THREE-LICENSE.txt`).
- Contador de visitas: GoatCounter, sin cookies.
