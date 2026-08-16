# Cuestionario de validación técnica — florista profesional

Pendiente de administrar a un profesional real. Preguntas listas para esa sesión.
`BIND_RATIO`, `MAX_TILT_DEG` y `HANDLE_CM` (en `lib/assembly.ts`) son
estimaciones de ingeniería sin validar hasta responder esto.

## Punto de atado y manejo

1. ¿Qué proporción del largo total del tallo sueles dejar como "mango"
   por debajo del atado, en un ramo de mano en espiral? (la app usa 22%
   del largo total como estimación, con un mínimo de 8cm)
2. ¿8cm es un mínimo razonable de mango para sujetar el ramo con una
   mano, o necesitas más margen?

## Ángulo e inclinación

3. La app calcula, para cada tallo, un ángulo aproximado de inclinación
   respecto a la vertical (comparando cuánto se abre hacia fuera en la
   silueta contra su propio largo) y lo marca si supera 45°. ¿Es 45° un
   techo razonable antes de que un tallo se vea forzado o corra riesgo de
   partirse?
4. ¿Ese ángulo depende del tipo de tallo (leñoso vs. herbáceo) más de lo
   que la app asume con un valor único?

## Orden de montaje

5. ¿El orden de inserción en espiral — focales primero, luego
   secundarias, relleno, verde al final — coincide con tu técnica, o
   inviertes el orden en algún punto?

## Validación general

6. Con un ramo real montado a partir de los datos de la app (largo,
   ángulo, orden), ¿el resultado es técnicamente correcto o señalarías
   errores concretos?
