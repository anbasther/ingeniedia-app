# Esquema de contenido · IngenieDía

Versión 1 · 31 de agosto de 2026

Este documento define el formato de los archivos de contenido. Es el contrato entre tres piezas que a partir de ahora son independientes: el **generador** que produce artículos, el **modo revisión** donde tú los apruebas, y la **app** que los muestra.

Mientras el contrato se respete, cualquiera de las tres puede cambiar sin romper a las otras.

---

## 1. Dónde vive cada cosa

```
ingeniedia-app/
├── src/App.jsx                        CÓDIGO. Fijo. No contiene artículos.
├── contenido/
│   ├── temas/2026-11.json             los temas que apruebas antes de generar
│   ├── fuentes/electricidad.md        normas de referencia por categoría
│   └── borradores/2026-11.json        salida del generador · SIN PUBLICAR
└── public/contenido/2026-11.json      PUBLICADO. Lo que leen los estudiantes.
```

La única forma de que un artículo pase de `borradores/` a `public/contenido/` es que lo apruebes en el modo revisión. No hay atajo.

**Un archivo por mes.** La app pide solo el mes que necesita. A tres años son 36 archivos ordenados por fecha, no cuatrocientos sueltos.

---

## 2. Estructura del archivo del mes

```json
{
  "version": 1,
  "mes": "2026-11",
  "generado": "2026-10-05T14:22:00Z",
  "articulos": {
    "2026-11-02": { ... },
    "2026-11-03": { ... }
  }
}
```

La clave de cada artículo es su fecha de publicación en formato `AAAA-MM-DD`. Es lo que permite que la app busque el día de hoy sin recorrer nada.

---

## 3. Los campos del artículo

Diez campos generados. Todos obligatorios: el validador rechaza el artículo si falta cualquiera.

| Campo | Tipo | Extensión | Qué contiene |
|---|---|---|---|
| `shortCategory` | texto | — | Una de las siete categorías, escrita exactamente igual |
| `title` | texto | ≤ 70 car. | Título del artículo |
| `description` | texto | 180–320 car. | Resumen de una frase o dos. Es lo que se ve bajo la portada |
| `context` | texto | 300–600 car. | Por qué el tema importa en terreno |
| `detail` | texto | 300–600 car. | El desarrollo técnico |
| `ai` | texto | 250–500 car. | Aplicación real de IA al tema. No relleno genérico |
| `history` | texto | 250–500 car. | Cómo evolucionó la técnica |
| `keyConcepts` | texto | 150–350 car. | La idea que debe quedar |
| `sources` | lista | 2–4 | Normas y referencias, una por elemento |
| `readingMin` | entero | 1–5 | Minutos de lectura |

### Por qué ya no son once

El campo `color` desapareció. Antes cada artículo declaraba su color, lo que permitía que dos artículos de Mecánica salieran de colores distintos por un error de tipeo.

Ahora el color se deriva de la categoría, igual que la ilustración. **El contenido declara a qué categoría pertenece y nada más.** Todo lo visual sale de una tabla única en el código.

### Los nombres están en inglés a propósito

Coinciden con los que ya usa el código. Traducirlos obligaría a reescribir las cuatro vistas de la app sin ganar nada. El código se mantiene fijo; el contenido es lo móvil.

---

## 4. Las siete categorías

Cada una tiene su día de la semana, su color y su ilustración. Están fijas en el código.

| Día | Categoría | Color |
|---|---|---|
| Lunes | `Electricidad` | `#facc15` |
| Martes | `Mecánica` | `#fb923c` |
| Miércoles | `Automatización` | `#4ade80` |
| Jueves | `Electrónica` | `#a3e635` |
| Viernes | `Informática` | `#38bdf8` |
| Sábado | `Energía` | `#34d399` |
| Domingo | `IA` | `#a78bfa` |

Como la categoría se deduce del día, el generador no necesita un calendario con fechas asignadas. Le basta una bolsa de temas por categoría y la regla del día de la semana.

---

## 5. Un artículo completo

```json
"2026-11-02": {
  "shortCategory": "Electricidad",
  "title": "Protecciones eléctricas y selectividad",
  "description": "Una revisión breve sobre cómo la coordinación entre protecciones permite mejorar la seguridad y continuidad operacional en instalaciones eléctricas.",
  "context": "En una instalación eléctrica, las protecciones no solo deben interrumpir una falla, sino hacerlo de manera ordenada. La selectividad busca que opere primero la protección más cercana al punto de falla, evitando desconexiones innecesarias en otros sectores del sistema.",
  "detail": "La coordinación entre interruptores, fusibles y diferenciales exige revisar corriente nominal, poder de corte, curvas de disparo, sensibilidad y tiempos de operación. Una mala selección puede generar disparos intempestivos o dejar zonas sin protección efectiva.",
  "ai": "La IA puede apoyar el análisis de registros de disparo, detectar patrones de fallas repetitivas y sugerir ajustes en estrategias de mantenimiento, siempre bajo validación técnica profesional.",
  "history": "La evolución de las protecciones eléctricas pasó desde dispositivos simples de interrupción hasta sistemas coordinados capaces de medir, comunicar y actuar con criterios cada vez más precisos.",
  "keyConcepts": "La selectividad permite que una falla sea despejada por la protección más cercana, reduciendo desconexiones innecesarias y mejorando la continuidad operacional.",
  "sources": [
    "IEC 60898-1 · Interruptores automáticos.",
    "IEC 60947-2 · Aparatos de baja tensión.",
    "SEC Chile · Pliegos técnicos RIC."
  ],
  "readingMin": 2
}
```

---

## 6. Los dos caminos de corrección

Al revisar, un artículo con problemas puede seguir dos rutas distintas. La diferencia importa porque una cuesta segundos y la otra una llamada al modelo.

**Editar** — para erratas, un número mal citado, una frase que suena rara. El texto se corrige directamente en el modo revisión, campo por campo, y esa versión editada es la que se publica. No pasa por el generador.

**Regenerar** — para problemas de fondo: el nivel no calza con los estudiantes, la sección de IA quedó en relleno genérico. Se escribe el motivo y el artículo vuelve al modelo con esa instrucción.

La distinción evita el riesgo de regenerar un artículo entero por una coma: el modelo reescribiría también las partes que ya estaban bien.

---

## 7. El archivo de decisiones

Al terminar la revisión, el modo revisión entrega esto:

```json
{
  "version": 1,
  "revisadoEn": "2026-10-09T18:40:00Z",
  "resumen": {
    "total": 35, "aprobados": 29, "regenerar": 4,
    "rechazados": 2, "editados": 7
  },
  "decisiones": {
    "2026-11-02": { "estado": "aprobado", "nota": "", "editado": true }
  },
  "regenerar": {
    "2026-11-03": {
      "categoria": "Mecánica",
      "titulo": "Análisis de vibraciones",
      "instruccion": "El nivel está muy por encima del curso."
    }
  },
  "articulos": { }
}
```

`articulos` trae únicamente los aprobados, **con las ediciones ya aplicadas**, listos para copiar a `public/contenido/`.

`regenerar` es la lista que alimenta la segunda pasada del generador. Lo que escribiste como motivo es lo que corrige el modelo: no hay que redactar nada dos veces.

---

## 8. Validación

Antes de que un artículo entre a revisión, el validador comprueba que estén los diez campos, que ninguno venga vacío, que la categoría exista en la tabla y que `sources` sea una lista con contenido.

Un artículo que falla se descarta y se registra el motivo. **Falla ese artículo, no el lote.** Los otros 34 siguen su curso.

Esto es lo que hace que el esquema se sostenga en el tiempo: no depende de que alguien recuerde el formato, sino de que el validador lo exija en cada corrida.
