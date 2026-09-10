# Bouquetier

Herramienta para componer un ramo y obtener lista de la compra + diagrama de montaje. Sin cuentas, sin checkout.

## Language

**Ramo**:
La lista ordenada de tallos que el usuario armó (`Stem[]` — qué especies, cuántas de cada una, en qué orden se agregaron). Es lo que persiste en `localStorage` y lo que viaja codificado en el enlace compartido.
_Avoid_: "composición" para referirse al ramo — choca con `Composition` (ver abajo).

**Composición** (`Composition`, tipo en `lib/vogel.ts`):
Los parámetros geométricos de la espiral de Vogel — `density`, `tiltDeg`, `rotation`, `jitter`, `spread`. No dice nada sobre qué especies hay; siempre se derivan automáticamente (`autoDensity`) o vienen de `DEFAULT_COMPOSITION`. El usuario nunca los elige directamente y no viajan en el enlace compartido — solo el Ramo viaja.
_Avoid_: usar "composición" para nombrar el ramo en sí.

**Enlace compartido**:
URL que codifica el Ramo en el parámetro `s` (`especie:cantidad` por especie, compacto). Es la fuente de verdad al cargar la página si está presente — pisa directo lo que hubiera en `localStorage`, sin aviso. Sin `s` en la URL, manda `localStorage`.
_Avoid_: "estado del ramo" a secas cuando se habla específicamente de la versión serializada en URL — usar "Enlace compartido" para esa forma, "Ramo" para el concepto en memoria/store.
