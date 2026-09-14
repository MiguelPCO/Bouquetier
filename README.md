# Bouquetier

Herramienta web para componer un ramo de flores de forma visual y obtener, al terminar, una **lista de la compra con precio estimado** y un **diagrama de montaje con medidas reales**.

No vende flores. No tiene checkout. No tiene cuentas de usuario.

## El problema

Comprar un ramo en floristería cuesta entre 40 y 80 € en Madrid. Los mismos tallos comprados sueltos cuestan la mitad, pero montarlo uno mismo tiene tres barreras:

1. No se sabe qué comprar — cuántos tallos, de qué tipo, en qué proporción.
2. No se sabe cuánto va a costar hasta estar en la floristería.
3. No se sabe montarlo — la técnica en espiral no es evidente y el resultado casero se nota.

Bouquetier resuelve las tres a la vez: composición visual, precio estimado y diagrama de montaje.

## Cómo funciona

- **Composición algorítmica, no drag & drop.** El usuario elige qué especies añadir; el sistema coloca cada tallo siguiendo la espiral de Vogel (θ = n · 137,5°, r = c · √n), la misma geometría que produce un florista al montar en espiral a mano.
- **Medidas reales.** Cada especie declara su largo de tallo y tamaño de cabeza en centímetros/milímetros; el render deriva los píxeles desde ahí, nunca al revés.
- **Determinismo.** El jitter visual de cada tallo viene de un `uid` estable, no de `Math.random()` — el mismo ramo genera siempre el mismo dibujo.
- **Validación de composición.** Avisos en vivo sobre balance de roles (focal/relleno/verde), especies fuera de temporada y riesgo de sobrecarga cromática.
- **Forma vectorial paramétrica** por especie. Se probó reemplazarla por fotografía normalizada en 5 especies; la prueba no pasó (se veía como collage) y se descartó — pipeline y hallazgos documentados en [`docs/photo-pipeline.md`](docs/photo-pipeline.md).
- **Precio como rango**, nunca cifra exacta: el modelo no da para más precisión y fingirla cuesta credibilidad.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) + [React 19](https://react.dev/) + TypeScript en modo estricto
- [Tailwind CSS v4](https://tailwindcss.com/) (CSS-first), tokens de color en OKLCH
- [Zustand](https://github.com/pmndrs/zustand) para estado global, con persistencia en `localStorage`
- [Vitest](https://vitest.dev/) para tests unitarios
- [sharp](https://sharp.pixelplumbing.com/) para el pipeline de normalización de fotos y para
  rasterizar la imagen Open Graph en el servidor (`app/api/og/route.ts`)
- Despliegue en [Vercel](https://vercel.com/)

## Desarrollo

```bash
npm install
npm run dev      # servidor de desarrollo (Turbopack) en localhost:3000
npm run build    # build de producción
npm run test     # tests unitarios (Vitest)
npm run lint     # ESLint
```

## Estado del proyecto

Prototipo en fase de validación. El motor de composición, las medidas reales, la lista de la compra y el diagrama de montaje funcionan; los precios y la técnica de montaje están pendientes de calibración con datos de campo. La prueba de fotos con 5 especies se completó y no pasó (ver [`docs/photo-pipeline.md`](docs/photo-pipeline.md)) — el catálogo usa forma vectorial paramétrica.

## Documentación

- [`docs/CASE_STUDY.md`](docs/CASE_STUDY.md) — caso de estudio: problema, decisiones de diseño y stack
- [`docs/PRD.md`](docs/PRD.md) — producto, alcance, decisiones y riesgos
- [`docs/SCHEMA.md`](docs/SCHEMA.md) — modelo de datos de especies
- [`docs/SPRINTS.md`](docs/SPRINTS.md) — plan de desarrollo por sprints
- [`docs/photo-pipeline.md`](docs/photo-pipeline.md) — pipeline de normalización de fotos de especies
- [`docs/florist-questionnaire.md`](docs/florist-questionnaire.md) — validación de la técnica de montaje con un florista profesional

## Licencia

Privado. Sin licencia de uso público por el momento.
