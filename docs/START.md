# TALLO — START

Punto de entrada. Leer antes de tocar código.

---

## Qué es

Herramienta web para componer un ramo de flores y obtener lista de la compra con precio estimado y diagrama de montaje con medidas reales.

No vende flores. No tiene checkout. No tiene cuentas.

## Estado

| | |
|---|---|
| Motor de composición | Validado en prototipo |
| Medidas reales | Integradas |
| Lista de la compra | Funcionando, precios sin calibrar |
| Diagrama de montaje | Funcionando, técnica sin validar |
| Validador | Funcionando |
| Assets fotográficos | **Sin resolver — riesgo principal** |
| Nombre | Provisional, sin verificar |

## Stack

```
Next.js 15 · React 19 · TypeScript strict
Tailwind v4 CSS-first · tokens OKLCH
Zustand · nuqs · GSAP vía useGSAP()
Vercel
```

## Reglas no negociables

**Canvas crema.** `#EDECE6`. El fondo oscuro es el reflejo por defecto y aquí está mal: el producto son flores sobre luz. Se fija en Sprint 0 y no se toca.

**Medidas reales, píxeles derivados.** Toda especie declara `lengthCm` y `headMm`. `PX_PER_CM` traduce. Ningún tamaño en píxeles se escribe a mano.

**Determinismo.** El jitter viene de `uid`, no de `Math.random()`. Mismo ramo, mismo dibujo, siempre.

**GSAP.** Solo `useGSAP()` de `@gsap/react`. `registerPlugin` centralizado en `lib/gsap.ts`. Animar solo `transform`, `opacity`, `clip-path`. Siempre tras `prefers-reduced-motion`.

**El precio es un rango.** Nunca una cifra exacta. El modelo no da para más y fingir precisión cuesta credibilidad.

## Lo que hay que validar antes de escalar

1. **Assets** — 5 especies normalizadas antes de comprometer 35. Es el punto donde el proyecto vive o muere.
2. **Técnica** — cuestionario a florista: punto de atado, ángulos, orden de mano.
3. **Precio** — muestreo de floristerías de Madrid para calibrar márgenes.
4. **Nombre** — dominio y marca.

## Orden de trabajo

`Sprint 0 → 1 → 2 → 3` y ahí se para a validar assets. Sprint 4 no se abre sin la prueba de 5 especies cerrada.

## Riesgo conocido del proyecto

Este proyecto tiene tres extensiones muy tentadoras: cuidados, secado y combinaciones sugeridas. Las tres son buenas ideas. Las tres van después de publicar v1.

Si aparece el impulso de abrir una de ellas antes de tiempo, probablemente sea porque hay una tarea de validación incómoda pendiente. Revisar la lista de arriba antes de ceder.
