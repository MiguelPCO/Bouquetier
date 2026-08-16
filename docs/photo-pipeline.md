# Pipeline de fotos — Sprint 4 (prueba de 5 especies)

## Estado

Prueba de 5 especies **pendiente** — pipeline y renderizado listos, a la
espera de que se entreguen las 5 fotos reales. Ninguna especie del
catálogo tiene `photo` asignado todavía.

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

Recorta el margen transparente (`sharp().trim()`), redimensiona a
480×480 preservando proporción, con relleno transparente **anclado
arriba** (`position: 'bottom'`) si hace falta, y escribe en
`public/photos/<especie-id>.png`.

Por qué anclado abajo y no centrado: cada foto recorta a un bounding box
con proporción distinta, así que el relleno necesario para llegar a
480×480 varía por especie. Si ese relleno se centrara, la base visual de
la flor caería en una altura distinta dentro del frame para cada
especie — rompiendo la posibilidad de usar una sola constante de anclaje
compartida (ver más abajo). Anclando el relleno arriba, la base de
cualquier foto procesada queda siempre en la misma posición relativa del
frame, sin importar su proporción original.

Sin corrección de color/exposición — cada foto es responsabilidad del
usuario en el momento de captura. Si la prueba revela inconsistencia
visible entre las 5, queda como hallazgo documentado para el plan de
35 especies, no se corrige aquí.

## Integración en el render

`Species.photo` (opcional) apunta al nombre de archivo bajo
`public/photos/`. Cuando está presente, `FlowerHead.tsx` renderiza un
`<image>` en vez de la forma paramétrica — sustitución completa, no
mezcla ambos modos para una misma especie.

Ancla: `(0,0)` en `FlowerHead` es el punto de unión del tallo (mismo
origen que usan las formas SVG existentes). El offset actual,
`y={-s * 0.75}`, es una **estimación de partida sin ajustar contra
fotos reales** — se recalibra a ojo una vez existan las 5 fotos de
prueba, no es un valor derivado matemáticamente como los de
`lib/assembly.ts` en el Sprint 3. Solo funciona como constante única
compartida entre las 5 especies gracias al anclaje-abajo del pipeline
descrito arriba.

Opacidad: los tallos con foto se renderizan siempre a opacidad 1,
saltando el efecto de profundidad (`stem.tone`, ~0.72–1.0) que sí se
aplica a las formas SVG. Ese efecto está pensado para pétalos vectoriales
planos con degradado — sobre una fotografía se ve descolorida, y varias
fotos semitransparentes superpuestas es justo el aspecto "collage" que
esta prueba existe para descartar.

## Próximo paso

1. Recibir las 5 fotos (peonía, tulipán, dalia, eucalipto, amarilis) en
   `assets/photos-raw/`.
2. Ejecutar el pipeline sobre cada una.
3. Asignar `photo` a esas 5 entradas en `lib/species.ts`.
4. Ajustar el offset de anclaje a ojo si hace falta.
5. Montar un ramo de 15 tallos mezclando las 5 especies-foto, enseñar el
   resultado — **la decisión "¿parece foto o collage?" la toma el
   usuario**, no se automatiza.
6. Si pasa: plan aparte para producir las 35. Si no: revertir `photo` en
   las 5 especies, cerrar el tema (regla de SPRINTS.md).
