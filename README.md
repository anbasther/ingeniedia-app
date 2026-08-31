# IngenieDía

Aplicación de divulgación diaria de ingeniería. Publica un artículo técnico por día, con una categoría fija para cada día de la semana.

Aplicación web (PWA) empaquetada para Android. En producción: [ingeniedia-app.vercel.app](https://ingeniedia-app.vercel.app)

---

## Estructura

| Elemento | Qué hace |
|---|---|
| `public/contenido/` | Los artículos publicados, un JSON por mes. **Lo único que ven los estudiantes** |
| `src/App.jsx` | La app completa: vistas, componentes, ilustraciones y modo revisión |
| `src/main.jsx` | Punto de arranque que monta la app en la página |
| `index.html` | La página que carga la app en el navegador |
| `package.json` | Declara las dependencias y los comandos de construcción |
| `vite.config.js` | Configura cómo Vite construye la app para publicarla |
| `.gitignore` | Lista de lo que Git no debe subir nunca, como claves de API |

---

## Regla central

**El código no contiene artículos.** La app pide `/contenido/AAAA-MM.json` al abrirse y carga solo el mes que necesita.

Publicar contenido nuevo es reemplazar un archivo JSON. El código solo cambia cuando cambia la aplicación misma.

---

## Categorías

Una por día de la semana. El color y la ilustración se derivan de la categoría, así que el contenido nunca los declara.

| Día | Categoría |
|---|---|
| Lunes | Electricidad |
| Martes | Mecánica |
| Miércoles | Automatización |
| Jueves | Electrónica |
| Viernes | Informática |
| Sábado | Energía |
| Domingo | IA |

---

## Modo revisión

Ningún artículo se publica sin verificación docente. La mesa de revisión se abre en:

```
ingeniedia-app.vercel.app/#revision
```

Muestra cada artículo al ancho real del teléfono y permite aprobarlo, editarlo directamente, marcarlo para regenerar o rechazarlo. Al terminar exporta un archivo con solo lo aprobado.

Está pensada para pantalla ancha y no es accesible desde la app del estudiante.

---

## Publicar un mes

1. Generar los borradores del mes
2. Revisarlos uno por uno en el modo revisión
3. Exportar las decisiones
4. Copiar el bloque `articulos` a `public/contenido/AAAA-MM.json`
5. Commit — Vercel redespliega solo

---

## Documentación

- `ESQUEMA-CONTENIDO.md` — formato de los archivos de contenido y de los once campos
- `GLOSARIO.md` — términos técnicos del proyecto

---

## Desarrollo local

```bash
npm install
npm run dev
```

## Estado

MVP 0.2.0 · piloto previsto para noviembre de 2026
