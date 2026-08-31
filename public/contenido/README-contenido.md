# Contenido publicado

Los artículos que ven los estudiantes. Un archivo JSON por mes, con nombre `AAAA-MM.json`.

**Todo lo que está en esta carpeta es público y está en producción.** La app lo pide directamente al abrirse. No hay paso intermedio ni revisión posterior: lo que se sube aquí, se publica.

Los borradores sin aprobar no van aquí.

---

## Formato

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

La clave de cada artículo es su fecha de publicación en formato `AAAA-MM-DD`. La categoría debe corresponder al día de la semana de esa fecha.

Cada artículo lleva diez campos obligatorios: `shortCategory`, `title`, `description`, `context`, `detail`, `ai`, `history`, `keyConcepts`, `sources` y `readingMin`.

El color y la ilustración no se declaran: se derivan de la categoría.

La especificación completa está en `ESQUEMA-CONTENIDO.md`, en la raíz del repositorio.

---

## Validación

La app valida cada artículo al cargarlo. Si a uno le falta un campo o declara una categoría inexistente, se descarta ese artículo y los demás siguen funcionando.

Una fecha sin artículo muestra un estado vacío. No es un error.
