# Coding — Design System

**Coding** es un programa de aprendizaje para materias de Ingenieria de Software: Bases de datos I y II, Programacion I y II, Algoritmos, Desarrollo web, etc. Este design system define su identidad visual completa bajo el lenguaje **Liquid Glass**: superficies de vidrio translucido con blur, refraccion en los bordes, brillos especulares, profundidad por sombras frias y movimiento con masa (resortes y desaceleraciones largas) sobre un fondo aurora oscuro.

## Fuentes de entrada

- **Repo GitHub:** https://github.com/Jsua3/Coding — *vacio al momento de crear este sistema (sin commits)*. Explora el repositorio cuando tenga codigo para basar los disenos en el producto real.
- **Carpeta local adjunta:** `coding/` — *tambien vacia*.
- Por lo anterior, **todo este sistema fue creado desde cero** a partir de la descripcion del producto + la direccion "Liquid Glass" pedida por el usuario. Cuando exista codigo real, hay que reconciliar tokens y componentes con el.

## CONTENT FUNDAMENTALS

- **Idioma:** espanol; los fragmentos de codigo (SQL, Java, JS) van en su sintaxis original en ingles.
- **Voz:** tuteo directo y cercano — "Continua donde quedaste", "Tu progreso", "No podras cambiar tus respuestas despues". Nunca "usted".
- **Tono:** academico pero motivador; preciso con los terminos tecnicos (clave primaria, integridad referencial, polimorfismo) sin jerga innecesaria.
- **Casing:** sentence case en titulos y botones ("Continuar leccion", "Ver temario"). MAYUSCULAS solo en eyebrows/metadatos con tracking +0.08em ("UNIDAD 3 · 12 LECCIONES").
- **Microcopy:** imperativos cortos en botones (Continuar, Enviar, Reiniciar). Metadatos con separador "·" (12 lecciones · 4 h).
- **Emoji:** no se usan. Los estados se comunican con Badge + color + punto luminoso.
- **Vocabulario del producto:** materias, unidades, lecciones, quiz, XP, racha (streak), temario, progreso.

## VISUAL FOUNDATIONS

- **Fondo:** siempre el gradiente aurora (`--aurora-page`): tinta azul profunda (#05070F→#0A0F1E) con manchas radiales azul/violeta/cian. Fijo (`background-attachment: fixed`); el vidrio necesita algo colorido detras para leerse.
- **El material (regla de oro):** toda superficie = relleno blanco translucido (7/11/17/22%) + `backdrop-filter: blur(14/28/48px) saturate(135%)` + borde 1px blanco 20–32% + arista de refraccion (`--refraction-edge`: inset superior blanco 45%, laterales 13%) + sombra fria (`--shadow-rest/glass/float`) + brillo especular opcional (`--specular`, gradiente 24%→0 al 60%). Recetas listas: clases `.glass`, `.glass--subtle`, `.glass--strong`, `.glass--specular` en `tokens/utilities.css`.
- **El blur nunca toca el texto:** `backdrop-filter` jamas vive en el elemento que contiene texto; va en una capa absoluta propia con `z-index: -1` (`.glass::before` o la capa interna de cada componente). El texto se pinta fuera de la capa filtrada y queda siempre nitido. Nunca uses `filter` sobre elementos con texto.
- **Color:** 4 acentos aurora — azul #5E97E6 (primario/CTA), cian #52C9B8 (exito de aprendizaje, links), violeta #9289E3, ambar #E6AF6B. Cada materia tiene tono fijo: Programacion=azul, Bases de datos=cian, Algoritmos=violeta, Web=ambar. Semanticos: #4CC793 / #E6B56B / #E67984 / azul.
- **Texto:** blancos translucidos, nunca gris solido — primario 96%, secundario 72%, terciario 45%. Sobre acentos: tinta #051022.
- **Tipografia:** Figtree (display y cuerpo; sustituto de SF Pro) y JetBrains Mono (codigo). Titulares heavy 800 con tracking -0.03em; cuerpo 15px; numeros tabulares en estadisticas.
- **Radios:** generosos, "guijarros de vidrio" — tarjetas 22–28px, campos 16px, controles y botones pill (999).
- **Botones:** pill. Primario = gradiente azul vertical (#6FA0E0→#4E86D6) + inset blanco superior + halo azul; secundario = vidrio; ghost = transparente.
- **Hover:** aclarar (fill sube un nivel, brightness 1.08) + levitar (translateY(-1/-4px)); nunca oscurecer.
- **Press:** encoger con resorte — scale(0.96) botones, 0.92 iconos.
- **Focus:** halo exterior de 4px rgba(94,151,230,0.18) + borde azul.
- **Movimiento:** el vidrio tiene masa. `--ease-glass` (0.22,1,0.36,1) para transiciones, `--ease-spring` (0.34,1.56,0.64,1) con overshoot para thumbs/checks/dialogos, 160/320/640ms. Dialogos: scale(0.92)+translateY(16) → identidad sobre scrim blur 14px.
- **Sombras:** frias y profundas (negro azulado 35–55%), nunca duras. Halos de acento (`--shadow-glow-blue/cyan`) reservados a elementos activos/CTA.
- **Overlays (menus, toasts, dialogos):** fondo tinta translucida rgba(20,28,50,0.72–0.85) + blur-lg; no blanco.
- **Imagenes:** no hay fotografia en el sistema; el color viene de los blobs aurora y el vidrio tintado.
- **Layout:** contenido max ~1200px; navegacion como barras de vidrio flotantes (no pegadas al borde); jerarquia por profundidad (blur+sombra), no por lineas divisorias.

## ICONOGRAPHY

- **No se recibieron assets de iconos** (fuentes vacias). No existe logo: **la marca se escribe en tipografia plana** ("Coding" en Figtree heavy) — no dibujar logos.
- Los glifos funcionales integrados en los componentes (chevron, check, X, lupa, llama) son SVG de linea: stroke 1.6–2, `stroke-linecap: round`, viewBox 16, sin relleno.
- **Set extendido recomendado: [Lucide](https://lucide.dev) via CDN** — mismo estilo de linea redondeada. `<script src="https://unpkg.com/lucide@latest"></script>` o SVGs sueltos. *Sustitucion flagged: si el producto real usa otro set, reemplazar.*
- Sin emoji ni caracteres unicode como iconos.

## Componentes (16)

Namespace del bundle: `window.CodingDesignSystem_2ecb3a`.

- **Superficies:** GlassPanel, Card
- **Formularios:** Button, IconButton, Input, Select, Checkbox, Radio, Switch
- **Feedback:** Badge, Tag, Progress, Toast, Tooltip
- **Navegacion:** Tabs
- **Overlays:** Dialog

Cada componente: `components/<grupo>/<Nombre>.jsx` + `.d.ts` (contrato de props) + `.prompt.md` (uso). Demos en `<grupo>/<grupo>.card.html`.

**Adiciones intencionales** (sin inventario fuente, set estandar +2): GlassPanel — el material base del lenguaje merece ser componente; Progress — una plataforma de aprendizaje vive del progreso (barra y anillo).

## UI Kit

- `ui_kits/coding-app/` — la app de aprendizaje: login, dashboard de materias, detalle de curso y leccion con quiz. Ver su README.

## Indice

- `styles.css` — punto de entrada (solo @imports)
- `tokens/` — colors, typography, spacing, radius, glass (material), motion, fonts, utilities
- `components/` — 16 componentes en 5 grupos (arriba)
- `guidelines/` — 16 especimenes de fundaciones (cards del tab Design System)
- `ui_kits/coding-app/` — pantallas de la app
- `SKILL.md` — punto de entrada para agentes

## Caveats

- **Fuentes tipograficas:** no se recibieron binarios. Figtree y JetBrains Mono se cargan desde Google Fonts (`tokens/fonts.css`). Si la marca tiene fuentes propias (p. ej. SF Pro), reemplazar ahi.
- **Repo y carpeta vacios:** cuando `Jsua3/Coding` tenga codigo, validar tokens/componentes contra el producto real.
