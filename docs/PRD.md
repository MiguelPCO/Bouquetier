# TALLO — PRD

> Nombre de trabajo. Pendiente de validación de dominio y marca antes de cualquier inversión en identidad.

**Versión** 0.1 · Fase de definición
**Estado** Prototipo de motor validado · Assets sin resolver

---

## 1. Problema

Comprar un ramo en floristería cuesta entre 40 y 80 € en Madrid. Los mismos tallos comprados sueltos cuestan la mitad, pero quien lo intenta se encuentra con tres barreras:

1. **No sabe qué comprar.** Cuántos tallos, de qué tipo, en qué proporción.
2. **No sabe cuánto va a costar** hasta que está en la floristería.
3. **No sabe montarlo.** La técnica en espiral no es evidente y el resultado casero se nota.

No existe herramienta que resuelva las tres a la vez. Los configuradores actuales pertenecen a floristerías y terminan en un carrito: su objetivo es venderte el ramo montado, no enseñarte a montarlo.

## 2. Propuesta

Una herramienta web donde compones un ramo visualmente, y al terminar obtienes **lista de la compra** con precio estimado y **diagrama de montaje** con medidas reales.

No vende flores. No tiene checkout. No tiene inventario.

## 3. Usuario

**Primario — quien regala.** Quiere algo más personal que un ramo de gasolinera, tiene presupuesto ajustado y una tarde libre. No sabe nada de flores.

**Secundario — quien organiza.** Boda o evento pequeño, necesita estimar coste y replicar el mismo ramo varias veces.

**Terciario — quien aprende.** Interés en floristería, usa la herramienta como campo de pruebas.

El diseño se optimiza para el primario. Los otros dos no requieren funcionalidad distinta, solo tolerancia a más tallos.

## 4. Alcance v1

### Dentro

| | |
|---|---|
| Catálogo | 35 especies con medidas, temporada y precio reales |
| Composición | Colocación automática en espiral, sin drag & drop |
| Vista | 2.5D con rotación, profundidad e inclinación |
| Perfiles | Compacto · Cúpula · Silvestre |
| Precio | Rango estimado por mes y zona de Madrid |
| Salida | Lista de la compra con sustitutos de temporada |
| Salida | Diagrama de montaje con cortes, ángulos y punto de atado |
| Validación | Avisos de proporción por rol, número de tallos y armonía cromática |
| Compartir | Estado en URL · exportar imagen |

### Fuera de v1

Cuentas de usuario · guardado en servidor · venta o checkout · integración con floristerías · centros de mesa o coronas (solo ramo de mano) · app nativa · flores secas y cuidados (v2).

## 5. Decisiones tomadas

**2.5D en vez de 3D.** El coste real del 3D no es el motor, son los assets: 35 especies serían 35 modelos. Con sprites en dos planos y proyección con `tilt` se obtiene rotación, profundidad y oclusión a coste de PNG. Validado en prototipo.

**Colocación algorítmica en vez de drag & drop.** La espiral de Vogel (θ = n · 137,5°, r = c · √n) es exactamente la geometría que produce un florista al montar en espiral. El usuario elige qué añadir; el sistema decide dónde. Cero fricción y el resultado nunca queda mal.

**El precio se muestra como rango.** Una cifra exacta que falla destruye la confianza en todo lo demás. El rango es honesto respecto a la precisión real del modelo.

**Sin checkout.** Convierte el producto en herramienta y elimina inventario, logística y responsabilidad sobre producto perecedero.

## 6. Decisiones abiertas

| Decisión | Recomendación | Bloquea |
|---|---|---|
| ~~Origen de los PNGs~~ | Resuelto 2026-09-10: prueba de 5 especies falló (collage), se vuelve a SVG — ver `docs/photo-pipeline.md` | — |
| Nombre definitivo | Verificar dominio y marca antes de identidad | Branding |
| Validación de la técnica | Cuestionario a florista profesional | Credibilidad del diagrama |
| Calibración del margen | Muestreo de 8–10 floristerías | Precisión del precio |

## 7. Riesgos

**Assets — alto.** Es el riesgo que puede matar el proyecto y no es técnico. Mezclar fuentes de stock produce iluminaciones, ángulos y escalas distintas: el ramo se ve como un collage. Mitigación: pipeline de normalización definido antes de producir volumen, y prueba con 5 especies. **Materializado (2026-09-10):** la prueba de 5 especies confirmó el riesgo — escala de encuadre inconsistente entre fotos produjo collage — se descartó el modo foto, ver `docs/photo-pipeline.md`.

**Precio inventado — medio.** Sin calibración real el rango es una hipótesis presentada como dato. Mitigación: muestreo de campo y lenguaje explícitamente estimativo en la interfaz.

**Técnica no verificada — medio.** El punto de atado al 42%, los 38° de inclinación y el orden de mano son plausibles pero no validados. Mitigación: cuestionario a profesional, igual que el proceso seguido en Sunnyvet con el veterinario.

**Expansión de alcance — alto.** Centros de mesa, coronas, cuidados, secado, comunidad. Todo tentador, todo fuera de v1. Mitigación: este documento.

## 8. Éxito

v1 se considera cumplida si un usuario sin conocimiento de floristería compone un ramo, va a comprar con la lista, y monta algo reconocible siguiendo el diagrama.

Métrica proxy: proporción de sesiones que llegan a la pestaña de montaje. Si compone pero no mira el montaje, el producto es un juguete y hay que replantearlo.
