# TALLO — SCHEMA

Modelo de datos. Todo lo geométrico se deriva; nada se escribe en píxeles.

---

## Especie

Unidad del catálogo. Se edita a mano, no viene de API.

```ts
type Role = 'focal' | 'secondary' | 'filler' | 'green';

type Shape =
  | 'peony' | 'dahlia' | 'ranun' | 'tulip'
  | 'umbel' | 'spray'  | 'leaf'  | 'spike';

interface Species {
  id: string;
  name: string;            // común, en español
  latin: string;           // binomial, en cursiva en UI

  role: Role;
  shape: Shape;            // silueta; en producción, familia de sprite

  color: string;           // OKLCH en producción
  lengthCm: number;        // largo comercial del tallo
  headMm: number;          // Ø de la cabeza

  wholesale: number;       // € por tallo, mayorista, en temporada
  season: number[];        // meses 1–12 de disponibilidad local
  vaseDays: number;        // duración en jarrón
  dry: boolean;            // apto para secado — habilita la fase 2
}
```

**Regla:** `stemPx` y `headPx` se derivan de `lengthCm` y `headMm` con `PX_PER_CM`. Nunca se declaran.

## Tallo colocado

Instancia dentro del ramo. `uid` alimenta el ruido determinista: mismo tallo, mismo jitter siempre.

```ts
interface Stem {
  uid: number;
  species: Species;
}

interface PlacedStem extends Stem {
  n: number;         // índice en la espiral = orden de montaje
  x: number;
  y: number;
  r: number;         // radio desde el eje
  depth: number;     // −1 atrás … +1 delante
  sortKey: number;   // orden de pintado
  scale: number;     // 0.84 … 1.16
  tone: number;      // opacidad por profundidad
}
```

## Parámetros de composición

```ts
interface Composition {
  density: number;    // c de Vogel; auto = Ø medio de cabeza × 0.86
  tiltDeg: number;    // 20–80 · inclinación de la proyección
  rotation: number;   // 0–360 · giro del ramo
  jitter: number;     // 0–1 · desviación orgánica
  spread: number;     // 0–1 · apertura de silueta por rol
}
```

## Constantes

```ts
const GOLDEN     = 137.5° en radianes
const PX_PER_CM  = 2.8
const TRIM_CM    = 8      // sacrificio al recortar la base
const BIND_RATIO = 0.42   // atado, desde las cabezas    [sin validar]
const MAX_TILT   = 38°    // inclinación del tallo exterior [sin validar]

ROLE_SPREAD = { focal: 0.70, secondary: 0.93, filler: 1.15, green: 1.36 }
ROLE_TARGET = { focal: [.10,.22], secondary: [.18,.32],
                filler: [.26,.42], green: [.18,.32] }
STEM_RANGE  = [12, 24]
```

## Salidas derivadas

```ts
interface ShoppingRow {
  species: Species;
  qty: number;
  inSeason: boolean;
  unit: number;          // wholesale × (inSeason ? 1 : 2.4) × zone.margin
  subtotal: number;
  substitute: Species | null;   // mismo rol, en temporada, color más próximo
}

interface AssemblyPlan {
  heightCm: number;      // tallo más largo − TRIM_CM
  bindFromTopCm: number; // heightCm × BIND_RATIO
  belowBindCm: number;
  vaseDays: number;      // el mínimo del ramo manda
  steps: {
    n: number;
    species: Species;
    cutCm: number;       // altura de la cabeza en el layout
    angleDeg: number;    // (r / rMax) × MAX_TILT
    short: boolean;      // el tallo comercial no llega
  }[];
}

interface CompositionNote {
  level: 'error' | 'warn' | 'info' | 'ok';
  text: string;
}
```

## Precio

```
unit  = wholesale × seasonMultiplier × zoneMargin
range = [total × 0.85, total × 1.15]

seasonMultiplier  1.0 en temporada · 2.4 fuera
zoneMargin        periferia 2.4 · centro 2.8 · Salamanca/Chamberí 3.2
```

Los márgenes son estimaciones a calibrar. Documentar la fuente cuando se haga el muestreo.

## Assets (fase visual)

```ts
interface SpriteSet {
  speciesId: string;
  front: string;         // PNG recortado, vista frontal
  threeQuarter?: string;
  anchor: { x: number; y: number };  // punto de inserción del tallo, normalizado
  realWidthMm: number;   // para escalar contra headMm
}
```

**Normalización obligatoria:** mismo ángulo de cámara, misma temperatura de luz, fondo transparente sin halo, escala real declarada, anclaje marcado. Un asset que no cumpla las cinco, se rechaza.
