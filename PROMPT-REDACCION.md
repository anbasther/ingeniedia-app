# Prompt de redacción · IngenieDía

Convierte una ficha verificada en un artículo. Es el prompt que usará el script generador, y también sirve para probar a mano: pega el tema, la ficha y luego esto.

**Estado: calibrado** el 10 de septiembre de 2026, con la ficha de conductores en paralelo (ruta B, cuaderno de pliegos SEC) contrastada con el correo de referencia del docente.

---

## El prompt

```
Escribe un artículo técnico breve sobre el TEMA indicado, a partir
ÚNICAMENTE de la ficha de referencia entregada. No agregues información
de tu conocimiento general.

LECTOR
Estudiantes de ingeniería eléctrica de nivel técnico superior en Chile,
y profesionales de terreno. Conocen la teoría base: no expliques qué es
la impedancia ni qué es una fase. Sí explica lo que la norma exige y
por qué lo exige.

REGISTRO
Escribe como un colega que resume una consulta a su equipo, no como un
manual. Directo, sin adornos. Español de Chile, terminología SEC.
Prosa continua. Dos minutos de lectura en un teléfono.

ALCANCE
Trata solo el TEMA indicado. La ficha puede traer material que comparte
el nombre pero es otro concepto (por ejemplo, paralelismo de líneas o
de generación frente a conductores en paralelo): descártalo.
Si trae un subtema que da para un artículo propio, déjalo fuera.

CIFRAS
Incluye los valores normativos concretos: secciones, distancias,
corrientes, umbrales. Son el contenido del artículo, no un adorno.
REGLA ABSOLUTA: toda cifra debe aparecer textualmente en la ficha.
Si un valor no está en la ficha, no lo escribas ni lo estimes.
Si la ficha declara ese dato como vacío, dilo en el artículo.

CITAS
Cita el pliego dentro del texto, junto a la exigencia que introduce,
no solo al final. Usa el identificador exacto de la ficha.
Puedes citar normas secundarias (UL, IEC, ANSI, NCh) solo si la ficha
las registra y dice qué pliego las invoca.

SECCIONES
Entrega solo las secciones que tengan contenido real en la ficha.

Obligatorias:
  TITULO       máximo 70 caracteres, sin dos puntos
  DESCRIPCION  2 frases: qué es y por qué importa
  DETALLE      el desarrollo técnico con sus exigencias y cifras
  CONCEPTOS    2 frases: la idea que debe quedar
  FUENTES      2 a 4, una por línea, identificador exacto de la ficha
  MINUTOS      número entre 1 y 5

Opcionales, inclúyelas solo si aportan:
  CONTEXTO     por qué el tema aparece en terreno y qué pasa si se ignora
  IA           aplicación real y concreta de IA a este tema
  HISTORIA     cómo evolucionó la exigencia normativa

Omitir una sección opcional es la conducta correcta cuando no hay
material. NO escribas "sin aplicación documentada" ni equivalentes:
simplemente no incluyas esa sección.

VACÍOS
Si la ficha declara que algo no está regulado y es relevante para el
tema, menciónalo. Que la norma no lo cubra es información útil.
No conviertas un vacío en prohibición ni en autorización: si la ficha
interpreta el silencio de la norma, no lo presentes como exigencia.
```

---

## Qué cambió y por qué

**Las cifras vuelven.** El enfoque anterior pedía principios sin valores, para reducir el riesgo de invención. Estaba mal calibrado: en normativa eléctrica el umbral de 50 mm² *es* el contenido. Un técnico que lee sobre paralelismo necesita el número.

El riesgo se controla de otra forma: toda cifra debe estar textualmente en la ficha, que a su vez salió de los pliegos. La trazabilidad reemplaza a la omisión.

**Las citas van dentro del texto.** Como en el correo de referencia: "Pliego Técnico RIC-N04" encabezando la exigencia, no una lista al pie que nadie conecta con lo que leyó.

**Las secciones opcionales se omiten, no se rellenan.** Antes el prompt permitía escribir "sin aplicación documentada". Es honesto pero se lee mal, y tres de esas en un artículo lo arruinan. Ahora la ausencia es la respuesta.

**El lector sabe lo básico.** El correo de referencia no explica qué es una impedancia: la nombra y sigue. Explicar de más es tan malo como explicar de menos.

**Regla de alcance (calibración).** La ficha de conductores en paralelo traía paralelismo de líneas de alta tensión (RPTD N° 11), operación en paralelo de generación (RIC N° 09) y sistemas BESS (RGR-N 06). Los dos primeros son otros conceptos con el mismo nombre; el tercero da para su propio artículo. Sin esta regla, el artículo mezcla temas.

**Vacíos sin interpretación (calibración).** La ficha declaró una "prohibición implícita" bajo 50 mm². Eso es inferencia de NotebookLM, no texto de la norma. El artículo solo debe decir que la autorización parte en 50 mm².

---

## Implicancias en el resto del sistema

Que las secciones sean opcionales obliga a tres ajustes:

**El esquema** pasa a distinguir campos obligatorios de opcionales. Hoy son diez obligatorios.

**El validador** deja de exigir `context`, `ai` e `history`. Sigue exigiendo los otros siete.

**La app** debe omitir el bloque completo de una sección ausente, no dejar un rótulo con espacio vacío debajo. Aplica tanto a la vista del estudiante como al modo revisión.

Y dos reglas para el script generador:

**El tema viaja junto con la ficha.** La regla de alcance necesita saber cuál es el tema, así que el generador debe pasarlo explícitamente.

**Ficha sin exigencias, sin artículo.** Si la sección 1 de la ficha (exigencias por pliego) viene vacía, no se genera nada: el tema se marca para revisión. Suele indicar que NotebookLM leyó fuentes equivocadas, no que la norma no regule el tema.

---

## Límites que no resuelve el prompt

El prompt es fiel a la ficha, no a la norma. Si la ficha omite algo, el artículo también lo omite. En la prueba faltaron las transposiciones sobre 50 metros y las barras de cobre del RIC N° 02, que sí están en el correo de referencia. NotebookLM varía entre corridas, así que la revisión docente de la ficha sigue siendo el control principal.
