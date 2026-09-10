# Pipeline de fotos — Sprint 4 (prueba de 5 especies)

## Estado

**Cerrado — no viable (2026-09-10).** Las 5 fotos se recibieron,
procesaron e integraron (`photo: true` en las 5 especies). Se montó un
ramo de prueba de 15 tallos (3 por especie) en la app real y el
veredicto fue collage, no foto: `amarilis.png` está encuadrada en
close-up extremo frente al margen amplio de las otras 4, dominando la
composición; el resto se veía con elementos sueltos poco coherentes
entre sí. Por la regla de `SPRINTS.md`, se revirtió a SVG ilustrado —
`photo` fue removido de las 5 entradas en `lib/species.ts`. Este
documento y los PNGs en `public/photos/` quedan como referencia, sin
borrarse; el pipeline (`scripts/prepare-photo.mjs`) sigue siendo válido
si se retoma el tema con fotos mejor encuadradas.

## Convención de entrega

Una foto por especie de prueba, PNG con fondo transparente, flor
centrada llenando ~90% del frame, sin recorte estricto necesario (el
pipeline recorta el margen transparente sobrante). Nombre de archivo =
id de la especie (`peonia.png`, `tulipan.png`, `dalia.png`,
`eucalipto.png`, `amarilis.png`), colocado en `assets/photos-raw/`
(carpeta ignorada por git — solo el resultado normalizado se versiona).

## Ejecutar el pipeline

```bash
node scripts/prepare-photo.mjs <especie-id>
```

Antes de procesar, valida que la foto tenga canal alpha
(`sharp().metadata().hasAlpha`) — si no lo tiene, aborta con error en vez
de recortar sobre un fondo opaco sin avisar.

Recorta el margen transparente (`sharp().trim()`), redimensiona a
480×480 preservando proporción, dejando el contenido **anclado abajo**
(`position: 'bottom'`, el relleno transparente sobrante queda arriba) si
hace falta, sin agrandar fotos ya más chicas que 480×480
(`withoutEnlargement: true` — evita difuminar por upscale, solo rellena
más), y escribe en `public/photos/<especie-id>.png`. El nombre del
archivo de salida es siempre `<especie-id>.png` — el render nunca lee un
nombre de archivo suelto, lo deriva de `Species.id` (ver más abajo), así
que no hay forma de que id y nombre de archivo diverjan.

Por qué anclado abajo y no centrado: cada foto recorta a un bounding box
con proporción distinta, así que el relleno necesario para llegar a
480×480 varía por especie. Si ese relleno se centrara, la base visual de
la flor caería en una altura distinta dentro del frame para cada
especie — rompiendo la posibilidad de usar una sola constante de anclaje
compartida (ver más abajo). Anclando el contenido abajo, la base de
cualquier foto procesada queda siempre en la misma posición relativa del
frame, sin importar su proporción original.

**Riesgo conocido, no probable con fixtures sintéticos**: `sharp().trim()`
usa un umbral de transparencia para decidir dónde recortar. Fotos reales
recortadas por un usuario suelen tener bordes con antialiasing/pluma
(alpha degradado, no un corte binario), y con ese tipo de borde `trim()`
puede recortar de más o dejar un halo de píxeles semitransparentes. Este
fallo es imposible de verificar con los fixtures sintéticos usados durante
la implementación (bordes duros, opacos) — solo se puede comprobar con
una foto real. Antes de correr el pipeline sobre las 5, procesa una
primera foto y **inspecciona sus bordes con zoom alto**: un halo o fleco
visible alrededor de la flor es exactamente el artefacto "collage" que
esta prueba existe para descartar.

Sin corrección de color/exposición — cada foto es responsabilidad del
usuario en el momento de captura. Si la prueba revela inconsistencia
visible entre las 5, queda como hallazgo documentado para el plan de
35 especies, no se corrige aquí.

## Integración en el render

`Species.photo` (opcional, boolean) marca que existe
`public/photos/<id>.png`. Cuando está en `true`, `FlowerHead.tsx`
renderiza un `<image>` en vez de la forma paramétrica — sustitución
completa, no mezcla ambos modos para una misma especie. El nombre de
archivo se deriva siempre de `Species.id` (`/photos/${id}.png`), nunca de
un string suelto — elimina cualquier posibilidad de que id y archivo
diverjan por error de tipeo. Si la imagen falla al cargar (404, ruta mal
generada), `FlowerHead` cae automáticamente a la forma paramétrica
(`onError` en el `<image>` cambia estado local `imgFailed`) en vez de
dejar el tallo sin flor.

Ancla — **depende de la forma**, no es un único offset compartido:
`(0,0)` en `FlowerHead` es el punto de unión del tallo (mismo origen que
usan las formas SVG existentes), pero esas formas no comparten un mismo
tipo de dibujo. `tulip` es la única forma que dibuja de abajo hacia
arriba desde el origen (el tallo entra por la base de la flor) — para
esa forma el offset correcto es `y={-s}` (borde inferior del `<image>`
al ras del origen). El resto de formas (`peony`, `dahlia`, `ranun`,
`umbel`, `spray`, `leaf`, `spike`) dibujan pétalos/frondas centrados
alrededor del origen en todas direcciones — visualmente el tallo entra
por el *centro* de la flor, no por su base — así que esas formas usan
`y={-s / 2}` (imagen centrada en el origen). `FlowerHead.tsx` mantiene
esta distinción en `BASE_ANCHORED_SHAPES` (hoy solo `tulip`; de las 5
especies de prueba, `tulipan` es la única que cae ahí — `peonia`,
`dalia`, `amarilis`, `eucalipto` usan el anclaje centrado).

**Punto de partida correcto, no resultado final**: ambos offsets asumen
que el contenido recortado llena casi todo el frame de 480×480 (por eso
el pipeline pide "flor llenando ~90%"). Una foto real, aunque pase por
el pipeline, rara vez queda perfectamente al ras en su recorte (pétalos
sueltos, sombras, recorte imperfecto), así que puede hacer falta un
ajuste fino a ojo por especie una vez existan las 5 fotos de prueba —
eso sigue siendo una pregunta abierta que solo fotos reales pueden
responder.

Opacidad: los tallos con foto usan el mismo `stem.tone`
(~0.72–1.0) que los tallos vectoriales — sin caso especial. Este efecto
de profundidad no es solo cosmético de pétalo-vectorial: junto con
`scale` y el orden de pintado, es el mecanismo que simula
rotación/profundidad/oclusión sobre "flat sprites" (ver la sección de
proyección 2.5D del proyecto) — precisamente lo que una foto es. Saltarlo
para tallos-foto rompía esa señal de profundidad para todo el `<g>` del
tallo (línea de conexión y base incluidas, no solo la flor), haciendo
que los tallos-foto siempre lean "al frente" sin importar su posición
real — un riesgo mayor para el look "collage" que la opacidad reducida
en sí. Si una foto real se ve mal a 0.72 de opacidad (halo de borde
difuminado, ver riesgo de `trim()` abajo), es señal a evaluar en la
prueba de 15 tallos, no algo para parchear de antemano sin evidencia.

## Próximo paso — completado, tema cerrado

1. ~~Recibir las 5 fotos~~ — hecho.
2. ~~Ejecutar el pipeline sobre cada una~~ — hecho.
3. ~~Poner `photo: true` en esas 5 entradas~~ — hecho, y revertido tras el veredicto (ver "Estado" arriba).
4. ~~Ajustar el offset de anclaje a ojo~~ — hecho, sin cambios sobre el offset por defecto (`y={-s}` tulipán, `y={-s/2}` resto).
5. ~~Montar un ramo de 15 tallos, enseñar el resultado~~ — hecho (2026-09-10), veredicto: collage.
6. Se revirtió `photo` en las 5 especies, tema cerrado por regla de `SPRINTS.md`. No reabrir sin nueva decisión del usuario; si se retoma, el punto de partida es re-encuadrar `amarilis.png` con el mismo margen que las otras 4 antes de re-evaluar.
