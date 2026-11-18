# CV

- `Jennifer-Guerrero-CV-ES.tex` y `Jennifer-Guerrero-CV-EN.tex`: el contenido de cada versión.
- `jgcv.sty`: el diseño compartido (colores, tipografía, márgenes, secciones).
- `fonts/`: Inter (SIL Open Font License 1.1). Tiene que estar junto a los `.tex`.
- Los `.pdf`: las versiones compiladas que enlaza el sitio.

## Compilar

```bash
latexmk -xelatex Jennifer-Guerrero-CV-ES.tex
latexmk -xelatex Jennifer-Guerrero-CV-EN.tex
latexmk -c        # borra los archivos auxiliares
```

En Ubuntu, si falta algo: `sudo apt install texlive-xetex texlive-latex-extra latexmk`.
En Overleaf: sube esta carpeta completa y elige Menu > Compiler > XeLaTeX.

Los PDF salen aquí mismo con el nombre que usa el sitio. Después de compilar solo hay que subirlos al repositorio.

## Diseño

Una sola columna, texto real y sin íconos ni tablas de maquetación, para que los sistemas de reclutamiento (ATS) lo lean completo. El PDF lleva espacios reales entre palabras (`\XeTeXinterwordspaceshaping=2` en `jgcv.sty`). La extracción de texto se verificó con pdftotext, pypdf y pdfplumber.
