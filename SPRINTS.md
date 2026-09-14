# TALLO — SPRINTS

Un sprint = una sesión de trabajo con entregable verificable. No se avanza al siguiente sin cerrar el anterior.

---

## Sprint 0 · Andamiaje
**Objetivo** Proyecto en marcha y desplegado, aunque esté vacío.

- Next.js 15 + React 19 + TypeScript strict
- Tailwind v4 CSS-first, tokens OKLCH en `tokens/theme.css`
- Canvas crema `#EDECE6` fijado desde el primer commit — **no dark**
- Fraunces + IBM Plex Sans/Mono
- Deploy en Vercel

**Hecho cuando** la home pinta el canvas correcto en producción.

---

## Sprint 1 · Motor
**Objetivo** Portar el prototipo validado a la arquitectura real.

- `lib/vogel.ts` — layout puro, sin React
- `lib/species.ts` — catálogo tipado, 12 especies iniciales
- `store/bouquet.ts` — Zustand
- `components/BouquetCanvas.tsx` — SVG
- Test unitario del layout: determinismo con misma seed

**Hecho cuando** se puede componer y el resultado es idéntico entre recargas.

---

## Sprint 2 · Catálogo completo
**Objetivo** 35 especies con datos reales.

- Medidas y temporada verificadas contra catálogos mayoristas
- Precios con fuente documentada por especie
- Filtro por rol, color y temporada
- Muestreo de 8–10 floristerías de Madrid → calibrar `zoneMargin`

**Hecho cuando** cada precio tiene fuente citada en el propio dato.

---

## Sprint 3 · Salidas
**Objetivo** Lista de la compra y diagrama de montaje en producción.

- Lista con sustitución por temporada
- Diagrama con cortes, ángulos y punto de atado
- Validador de composición
- Export a PDF imprimible — se usa de pie en la floristería
- **Cuestionario a florista profesional** → validar `BIND_RATIO`, `MAX_TILT`, orden de mano

**Hecho cuando** el PDF es legible en móvil y un profesional no encuentra errores de técnica.

---

## Sprint 4 · Assets — CERRADO, no viable

**Objetivo** Sustituir SVG paramétrico por fotografía.

- Pipeline de normalización documentado (`docs/photo-pipeline.md`)
- 5 especies producidas y evaluadas (peonía, dalia, amarilis, tulipán, eucalipto)
- **Veredicto (2026-09-10): collage, no foto.** Ramo de prueba de 15 tallos (3 por especie) montado en la app real — la amarilis, encuadrada en close-up extremo frente al margen amplio de las otras 4, dominaba la composición; el resto se veía "raro" y con elementos sueltos poco coherentes entre sí. Se vuelve a SVG ilustrado — regla de la casa cumplida, tema cerrado.
- `photo` removido de las 5 especies en `lib/species.ts`. PNGs (`public/photos/`) y pipeline (`scripts/prepare-photo.mjs`, `docs/photo-pipeline.md`) quedan en el repo sin borrar, como referencia.

**Hecho.**

---

## Sprint 5 · Compartir
**Objetivo** Que el ramo salga de la sesión.

- Estado en URL con `nuqs` — sin cuentas
- Export PNG del ramo
- Metadatos Open Graph con la imagen generada

**Hecho cuando** un enlace pegado en WhatsApp reconstruye el ramo exacto.

---

## Sprint 6 · Pulido
**Objetivo** Nivel portfolio.

- Transiciones al añadir y quitar con `useGSAP()`
- `prefers-reduced-motion` en CSS y JS
- Navegación por teclado completa, foco visible
- Lighthouse ≥ 95, CLS < 0.1
- Caso de estudio escrito

**Hecho cuando** se puede enseñar sin explicar nada.

**Hecho.** Transiciones GSAP en añadir/quitar (con `prefers-reduced-motion`), foco de
teclado visible, fix de contraste WCAG AA, y [`CASE_STUDY.md`](CASE_STUDY.md) en la raíz
del repo.

---

## Fuera de alcance hasta que v1 esté publicada

Cuidados y secado · combinaciones sugeridas · más tipologías · cuentas · idiomas.

Regla de la casa: **se publica v1 antes de abrir cualquiera de estas.**
