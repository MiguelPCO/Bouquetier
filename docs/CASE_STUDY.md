# Bouquetier — caso de estudio

## El problema

Elegir flores para un ramo a mano es un problema de composición que casi nadie fuera del
oficio sabe resolver: cuántos tallos focales frente a relleno, qué proporción de verde,
cómo distribuirlos para que el resultado no se vea plano ni amontonado. Bouquetier es una
app que resuelve ese problema con un algoritmo — una espiral de Vogel (el mismo patrón que
usan los girasoles para acomodar sus semillas) — en vez de con prueba y error.

El usuario elige especies de un catálogo con datos reales (precio mayorista, temporada,
duración en jarrón), la app calcula la posición de cada tallo, y el resultado es
imprimible: lista de la compra con sustitución por temporada, diagrama de montaje con
ángulos y puntos de corte, y ahora también un enlace para compartirlo.

## Decisiones de diseño

**SVG paramétrico, no fotografía.** La primera versión de cada flor se dibujó a mano en
SVG — formas geométricas por especie (pétalos, radios, jitter aleatorio por semilla) en vez
de fotos reales. En el Sprint 4 se probó lo contrario: sustituir 5 especies por fotografías
normalizadas, para ver si el ramo se veía más realista. El resultado, con un ramo de prueba
de 15 tallos montado en la app real, fue negativo — una especie fotografiada en primer
plano dominaba visualmente sobre las demás, y el conjunto se veía incoherente comparado con
el resto del ramo, todavía en SVG. Se revirtió la decisión y se volvió a SVG puro en todo
el catálogo. El pipeline de normalización de fotos (`photo-pipeline.md`) se dejó en el
repo como referencia, sin borrar, pero sin uso en producción.

**Enlaces compartibles sin cuentas.** Compartir un ramo no debía requerir registrarse ni
guardar nada en un servidor. Qué especies y cuántas hay en el ramo vive codificado en la
propia URL (`?s=especie:cantidad,...`), y una imagen de vista previa
(Open Graph) se genera al vuelo a partir de ese mismo parámetro — así un enlace pegado en
WhatsApp muestra el ramo exacto sin que nadie tenga que abrir la app primero. El detalle
técnico de esa decisión está documentado en
[`adr/0001-share-link-encoding-and-og-image.md`](adr/0001-share-link-encoding-and-og-image.md).

**Pulido con intención, no por checklist.** Antes de animar nada o de perseguir una
puntuación de Lighthouse, se midió el estado real de la app en producción: ya cumplía el
objetivo de rendimiento (98/100) y de estabilidad visual (CLS 0) del sprint de pulido. El
único hallazgo real fue un contraste de color insuficiente en un tono de texto secundario,
así que el trabajo de este sprint se enfocó en lo que sí faltaba — transiciones al
añadir/quitar flores (con soporte para `prefers-reduced-motion`) y foco de teclado visible
— en vez de optimizar algo que ya funcionaba.

## Capturas

*(pendiente: agregar capturas del composer, la vista de exportación y un enlace
compartido abierto en otro dispositivo)*

## Stack técnico

- **Next.js 15** (App Router, Turbopack) + **React 19** + **TypeScript** en modo estricto
- **Tailwind CSS v4** (CSS-first), tokens de color en OKLCH (`tokens/theme.css`)
- **Zustand 5** para estado global, con persistencia en `localStorage`
- **nuqs** para sincronizar el estado del ramo con la URL (`?s=...`)
- **GSAP** (`@gsap/react`) para las transiciones de añadir/quitar flores
- **sharp** para rasterizar el SVG del ramo a PNG en el servidor (imagen Open Graph,
  `app/api/og/route.ts`); el export manual del ramo (`lib/exportPng.ts`) usa el Canvas API
  del navegador directamente, sin dependencias nuevas
- **Vitest** para los tests unitarios de la lógica de layout, catálogo, codificación de
  enlaces y contraste de color

## Decisiones documentadas

- [ADR 0001 — Codificación del enlace compartido e imagen Open Graph](adr/0001-share-link-encoding-and-og-image.md)
- [Pipeline de normalización de fotos (Sprint 4, referencia — no está en uso)](photo-pipeline.md)
- Roadmap completo de sprints: [`SPRINTS.md`](SPRINTS.md)
