---
name: coding-design
description: Use this skill to generate well-branded interfaces and assets for Coding (programa de aprendizaje de Ingenieria de Software — Liquid Glass design language), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Key facts:
- Language: Liquid Glass on a dark aurora background — translucent white fills + backdrop blur + refraction edges + specular sheen + cool deep shadows + springy motion. Recipes live in tokens/glass.css and tokens/utilities.css (.glass classes).
- Entry CSS: styles.css (imports all tokens). Fonts: Figtree + JetBrains Mono (Google Fonts).
- Components (window.CodingDesignSystem_2ecb3a): GlassPanel, Card, Button, IconButton, Input, Select, Checkbox, Radio, Switch, Badge, Tag, Progress, Toast, Tooltip, Tabs, Dialog.
- UI kit: ui_kits/coding-app/ (login → dashboard → curso → leccion con quiz).
- Copy: espanol, tuteo, sentence case, sin emoji; materias con color fijo (Programacion azul, Bases de datos cian, Algoritmos violeta, Web ambar).
