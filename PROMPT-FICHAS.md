# Prompt de fichas · IngenieDía

Genera, en NotebookLM, la **ficha de referencia** de un tema: lo que dicen las fuentes, con su origen exacto, y lo que no dicen. La ficha es el único material del que sale el artículo (ver `PROMPT-REDACCION.md`).

**Estado:** versión general para las siete áreas, 27 de septiembre de 2026. Deriva de la ruta B calibrada con Electricidad (ficha de conductores en paralelo, pliegos SEC).

---

## Antes de correrlo

1. **Un cuaderno por área.** No mezclar áreas en el mismo cuaderno. La primera ficha de conductores en paralelo falló porque NotebookLM leyó documentos de otro tema que estaban en el mismo cuaderno.
2. **Fuentes marcadas.** NotebookLM solo usa las fuentes con la casilla activada. Marca solo las que corresponden al tema.
3. **Reemplaza los dos campos** entre corchetes: `[ÁREA]` y `[TEMA]`.
4. **Guarda la ficha como texto** apenas salga (en Drive o en `Fichas/` del repositorio). Si se pierde, hay que regenerarla y NotebookLM no siempre entrega lo mismo.

---

## El prompt

```
ÁREA: [ÁREA]
TEMA: [TEMA]

Extrae de las fuentes marcadas en este cuaderno todo lo que establecen
sobre el TEMA indicado.

No escribas un artículo. Entrega una ficha de referencia interna.

ESTRUCTURA

1. QUÉ ESTABLECEN LAS FUENTES
   Qué dice cada documento sobre el tema, con el punto, sección,
   tabla o página exacta. Agrupa por documento.
   Marca cada afirmación con su carácter:
     [OBLIGATORIO]  exigencia de una ley, reglamento o norma de
                    cumplimiento obligatorio
     [RECOMENDADO]  recomendación de una norma voluntaria, guía,
                    buena práctica o fabricante
     [DESCRIPTIVO]  explicación técnica, sin carácter de exigencia

2. VALORES Y DATOS
   Cifras concretas: magnitudes, límites, distancias, tiempos,
   tolerancias, clases, niveles. Cada una con su unidad y su origen.
   Copia el valor tal como aparece en la fuente.

3. DEFINICIONES
   Textuales, entre comillas, con su origen.
   Si el término no está definido en las fuentes, dilo.

4. CRITERIOS DE APLICACIÓN
   Qué se hace en la práctica y por qué, según las fuentes.

5. REFERENCIAS SECUNDARIAS
   Otras normas, leyes o documentos que las fuentes invocan.
   Indica qué documento las menciona y para qué.

6. VACÍOS
   Qué no está regulado, no está definido o no aparece en las fuentes.
   Es la sección más importante: marca lo que no se puede afirmar.
   No interpretes el silencio de una fuente como prohibición ni
   como autorización: solo declara que no lo trata.

7. TEMAS DERIVABLES
   Qué artículos distintos se podrían escribir con este material.
   Un título y una línea cada uno.

REGLAS
- Cada afirmación debe poder rastrearse a un documento del cuaderno.
- No completes con conocimiento general. Si algo no está en las
  fuentes, decláralo como vacío.
- Si una fuente trata un concepto distinto que comparte el nombre
  del tema, sepáralo al final bajo "OTROS SENTIDOS DEL TÉRMINO".
- Si las fuentes se contradicen, muestra ambas versiones con su origen.
```

---

## Cómo saber si la ficha sirve

| Señal | Qué significa | Qué hacer |
|---|---|---|
| La sección 1 cita documentos del área con puntos exactos | Ficha útil | Guardar y enviar |
| La sección 1 está vacía o casi todo es vacío | NotebookLM leyó fuentes equivocadas, o faltan fuentes del tema | Revisar el cuaderno y las casillas; no se escribe artículo |
| Cita documentos de otra área | Fuentes mezcladas | Desmarcar lo que no corresponde y repetir |
| Todo sale como [DESCRIPTIVO] | El tema no tiene exigencias en esas fuentes | Sirve igual; el artículo será explicativo, no normativo |

---

## Fuentes por área

No todas las áreas tienen el mismo tipo de respaldo. Donde no hay reglamento, la ficha se apoya en normas voluntarias, guías y literatura técnica, y el artículo lo dice así. Las fuentes son amplias y de distinta naturaleza, entre otras, según aplique a cada tema.

| Área | Día | Tipo de fuentes que suelen aplicar |
|---|---|---|
| Electricidad | Lunes | Pliegos técnicos y reglamentos del organismo fiscalizador; normas IEC; catálogos de fabricantes |
| Mecánica | Martes | Normas técnicas (ISO, NCh, ASME, entre otras); reglamentos de seguridad laboral; manuales de fabricante; textos de mantenimiento |
| Automatización | Miércoles | Normas IEC e ISA; manuales de fabricantes de controladores e instrumentación; guías de seguridad funcional |
| Electrónica | Jueves | Normas IEC e IEEE; hojas de datos (datasheets); notas de aplicación de fabricantes |
| Informática | Viernes | Leyes y reglamentos de ciberseguridad y datos; normas ISO/IEC; guías de organismos técnicos |
| Energía | Sábado | Normativa del sector energético; leyes de eficiencia energética; normas IEC e IEEE; informes técnicos |
| IA | Domingo | Normas ISO/IEC; marcos de gestión de riesgo; regulación y guías publicadas; artículos técnicos revisados |

**Mínimo por cuaderno:** 3 fuentes. **Óptimo:** 4 a 5, en el mismo idioma y en PDF con texto seleccionable (no escaneado).

---

## Calendario de la prueba y el piloto

Los artículos se publican en la prueba cerrada y se reutilizan cuatro semanas después en el piloto. El día de la semana, y por lo tanto la categoría, coincide.

| Prueba | Piloto | Día | Área | Tema | Ficha |
|---|---|---|---|---|---|
| 5 oct | 2 nov | Lun | Electricidad | Conductores en paralelo | ✅ |
| 6 oct | 3 nov | Mar | Mecánica | | |
| 7 oct | 4 nov | Mié | Automatización | | |
| 8 oct | 5 nov | Jue | Electrónica | | |
| 9 oct | 6 nov | Vie | Informática | | |
| 10 oct | 7 nov | Sáb | Energía | | |
| 11 oct | 8 nov | Dom | IA | | |
| 12 oct | 9 nov | Lun | Electricidad | | |
| 13 oct | 10 nov | Mar | Mecánica | | |
| 14 oct | 11 nov | Mié | Automatización | | |
| 15 oct | 12 nov | Jue | Electrónica | | |
| 16 oct | 13 nov | Vie | Informática | | |
| 17 oct | 14 nov | Sáb | Energía | | |
| 18 oct | 15 nov | Dom | IA | | |
| 19 oct | 16 nov | Lun | Electricidad | | |

Una ficha puede rendir más de un artículo (sección 7, temas derivables), así que no hace falta una ficha por día.
