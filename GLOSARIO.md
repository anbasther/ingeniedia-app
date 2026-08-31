# Glosario técnico · IngenieDía

Términos técnicos del proyecto, definidos y aterrizados a IngenieDía.

Actualizado el 31 de agosto de 2026.

---

## 1. Cómo está construida la app

**Frontend** — La parte que corre en el teléfono del estudiante: lo que ve y toca. Todo IngenieDía es frontend hoy.

**Backend** — La parte que corre en un servidor, fuera del dispositivo. Guarda datos centralizados y responde consultas. Tu app **no tiene backend**, y por eso no hay forma de saber qué leyó cada estudiante. Es el problema del que hablamos en el punto de métricas.

**React** — La biblioteca con la que está escrita la app. Su idea central: describes cómo se ve la pantalla para un estado dado, y React se encarga de redibujarla cuando el estado cambia. Tú no ordenas "pinta el ícono de guardado"; declaras "si está guardado, el ícono va relleno", y React lo aplica.

**Componente** — Una pieza reutilizable de interfaz, con su apariencia y su comportamiento juntos. `HeaderCalendar` es el calendario del encabezado; `TodayView` es la pantalla de hoy. Se combinan como bloques.

**JSX** — La sintaxis que permite escribir marcado parecido a HTML dentro del código JavaScript. Es lo que le da la extensión al archivo `App.jsx`. Esta línea es JSX:

```jsx
<span style={{ color: T.accent }}>{art.title}</span>
```

**Estado (*state*)** — Los datos que cambian mientras la app corre y que, al cambiar, obligan a redibujar. En tu app el estado incluye la racha, los artículos leídos, los guardados y el tema visual.

**Hook** — Una función de React que da acceso a capacidades del framework. `useState` declara un dato que cambia; `useEffect` ejecuta algo cuando ocurre un cambio; `useMemo` evita recalcular lo que no varió. Todos empiezan con `use`.

**Propiedad (*prop*)** — Un dato que un componente le pasa a otro. Hoy le agregué la propiedad `articulos` a cuatro vistas para que reciban el contenido en vez de tenerlo escrito adentro.

**Vite** — La herramienta que toma tu código fuente y lo convierte en archivos que un navegador entiende. También levanta el servidor local mientras desarrollas.

**SVG** — Formato de imagen definido por instrucciones geométricas en vez de píxeles: "una línea de aquí a allá", "un círculo de radio 30". Se ve nítido a cualquier tamaño y pesa poco. Las siete ilustraciones de categoría son SVG escritos a mano.

**`viewBox`** — El sistema de coordenadas interno de un SVG. `viewBox="0 0 400 180"` significa que el dibujo se describe en una grilla de 400 por 180, sin importar el tamaño real en pantalla.

**Hero** — La imagen o bloque destacado en la cabecera de un contenido. En tu app es la ilustración de 180 píxeles de alto sobre el título del artículo.

**Onboarding** — Las pantallas de bienvenida que ve alguien la primera vez que abre la app.

**Mockup** — Una maqueta visual sin funcionamiento real. Sirve para acordar cómo se ve algo antes de programarlo.

---

## 2. Archivos, datos y formatos

**JSON** — Formato de texto para representar datos estructurados. Es lo que elegimos para el contenido. Se ve así:

```json
{ "titulo": "Selectividad", "minutos": 2, "fuentes": ["IEC 60898-1"] }
```

Legible para una persona y directamente interpretable por la app.

**Objeto y lista** — Las dos formas de agrupar datos. Un **objeto** guarda pares nombre-valor (`{ "minutos": 2 }`); una **lista** guarda elementos en orden (`["IEC 60898-1", "IEC 60947-2"]`). Tus `sources` son una lista; cada artículo es un objeto.

**Clave** — El nombre con que se busca un valor. En tu contenido la clave de cada artículo es su fecha: `"2026-10-05"`. Buscar el artículo de hoy es buscar por esa clave, sin recorrer nada.

**Esquema** — La definición formal de qué campos debe tener un dato, de qué tipo y con qué restricciones. Es el documento `ESQUEMA-CONTENIDO.md`.

**Validación** — Comprobar que un dato cumple el esquema antes de aceptarlo. La función `validarArticulo` rechaza cualquier artículo al que le falte un campo o que declare una categoría inexistente.

**CSV** — Formato de tabla en texto plano, con valores separados por comas. Es lo que exporta una planilla. Lo mencioné como la vía por la que una hoja de Google Sheets podría alimentar la app.

**Markdown** — Formato de texto con marcas simples para dar formato (`**negrita**`, `# título`). Este glosario está escrito en Markdown.

---

## 3. Repositorio y versiones

**Repositorio** — La carpeta del proyecto con todo su historial de cambios. El tuyo es `anbasther/ingeniedia-app`.

**Git** — El sistema que registra ese historial. Guarda cada versión y permite volver atrás.

**GitHub** — El servicio donde vive tu repositorio en línea. Git es la herramienta; GitHub es el lugar.

**Commit** — Un cambio registrado, con fecha, autor y descripción. Publicar un mes de contenido será un commit.

**Versionado** — Que exista ese historial completo. Es la razón principal por la que recomendé el JSON en el repositorio: si un artículo sale con un error, vuelves a la versión anterior sin tocar nada más.

**Revertir** — Deshacer un commit y volver al estado previo.

**Diff** — La vista que muestra exactamente qué líneas cambiaron entre dos versiones. Lo mencioné al explicar por qué revisar prosa técnica en un diff es incómodo: ves texto cambiado, pero no ves cómo queda en pantalla.

**GitHub Action** — Una tarea automática que corre en los servidores de GitHub. Puede dispararse sola o con un botón. Es lo que usaremos para generar y publicar contenido sin que tengas que escribir comandos.

---

## 4. Publicación e infraestructura

**Despliegue (*deploy*)** — Publicar una versión nueva para que los usuarios la reciban.

**Vercel** — El servicio donde está publicada tu app. Está conectado al repositorio: cada commit dispara un despliegue automático.

**CDN** — Red de servidores repartidos geográficamente que entregan archivos desde el punto más cercano al usuario. Vercel usa uno. Es la razón por la que un archivo JSON estático aguanta 30 estudiantes o 3.000 sin diferencia: nadie está consultando una base de datos, solo se descarga un archivo ya preparado.

**`fetch`** — La instrucción con que la app pide un archivo o consulta un servicio. La app ahora hace `fetch("/contenido/2026-10.json")` al abrirse.

**API** — El conjunto de operaciones que un servicio expone para que otros programas lo usen sin intervención humana. **La razón por la que descarté NotebookLM es que no tiene API**: solo se opera a mano en el navegador.

**API REST** — El estilo más común de API sobre la web: cada dato tiene una dirección y se opera con verbos estándar (pedir, crear, modificar, borrar).

**Endpoint** — Una dirección concreta dentro de una API.

**Latencia** — El tiempo entre pedir algo y recibirlo.

**Límite de tasa (*rate limit*)** — El tope de consultas que un servicio acepta por unidad de tiempo. Importa si generas 35 artículos en paralelo.

**Concurrencia** — Que varias tareas avancen a la vez en vez de una tras otra. Generar 35 artículos en paralelo tarda lo que el más lento, no la suma de los 35. Es tu punto de simultaneidad en la generación.

**Offline** — Que la app funcione sin conexión. Como el archivo del mes se descarga completo y queda en caché, el estudiante puede leer sin datos después de la primera apertura.

**PWA** — *Progressive Web App*. Una app web que el usuario instala en su teléfono y que se comporta como aplicación nativa: ícono propio, pantalla completa, funcionamiento sin conexión y **notificaciones**. Es lo que le falta a IngenieDía para que el recordatorio diario funcione de verdad.

**TWA** — *Trusted Web Activity*. El mecanismo de Google que envuelve una PWA en un contenedor Android publicable en Play Store. Por dentro sigue siendo la misma web, así que el contenido mensual se publica igual y no exige actualizar la ficha de la tienda.

**`.aab`** — El formato de archivo que Play Store acepta. Es lo que produce el empaquetado TWA.

**Prueba cerrada** — El requisito de Google para cuentas de desarrollador nuevas: 12 probadores usando la app durante 14 días seguidos antes de poder publicarla abiertamente.

**Service worker** — El componente que hace posible lo anterior: un programa que corre en segundo plano, incluso con la app cerrada, y que gestiona la caché y las notificaciones.

---

## 5. Almacenamiento

**`localStorage`** — Un espacio de guardado en el navegador del usuario, propio de cada dispositivo y que sobrevive al cierre de la app. Ahí se guarda el progreso. **No es un servidor**: lo que está en el teléfono de un estudiante es invisible para ti.

**`window.storage`** — La variante equivalente del entorno de vista previa de Claude. La app la usó durante el desarrollo y ya fue traducida a `localStorage` para producción.

**Persistencia** — Que un dato sobreviva al cierre de la aplicación.

**Base de datos** — Un almacén centralizado y consultable de información estructurada.

**Postgres** — Una de las bases de datos relacionales más sólidas y usadas. Guarda la información en tablas con esquema definido.

**Supabase** — Un servicio que te entrega una base Postgres ya montada, con panel de administración y API automática. Fue la opción 3 que te propuse.

**Headless CMS** — Un gestor de contenidos sin sitio web propio: solo administra el contenido y lo entrega por API para que cualquier aplicación lo consuma.

---

## 6. Inteligencia artificial

**LLM** — *Large Language Model*, modelo grande de lenguaje. Sistema entrenado con enormes cantidades de texto que genera lenguaje prediciendo qué continúa a partir de lo que recibe.

**Prompt** — Las instrucciones que le das al modelo. El **prompt maestro** es la plantilla que produce un artículo completo con los diez campos del esquema.

**NotebookLM** — Herramienta de Google que responde apoyándose únicamente en documentos que tú subes, citando de vuelta a la fuente. Su fortaleza es la trazabilidad; su límite es que no tiene API. Por eso pasa de motor de generación a herramienta de verificación.

**Alucinación** — Cuando un modelo afirma algo falso con total seguridad. En contenido normativo es el riesgo principal: **puede inventar un número de norma que suena perfectamente plausible**. Es la razón de fondo por la que tu verificación no es opcional.

**Lote (*batch*)** — Un grupo de tareas procesadas juntas. Los 35 artículos de un mes se generan en un lote.

**Token** — La unidad en que los modelos miden el texto, algo menor que una palabra. El costo de la API se cobra por token.

---

**Código de resumen** — La cadena que la app genera en Perfil para las métricas del piloto, del tipo `ING1-260831-R0-G0-L0-D0-K0-SIN-VK`. Codifica fecha, leídos, guardados, valoraciones, racha y desglose por categoría. El estudiante la copia y la entrega: **nada se envía solo**.

**Dígito verificador** — Las dos letras finales del código. Se calculan a partir del resto, así que si alguien transcribe mal un carácter deja de cuadrar y el error se detecta.

---

## 7. Términos del proyecto

**MVP** — *Minimum Viable Product*, producto mínimo viable. La versión más simple que ya permite comprobar si la idea funciona. La 0.2.0 es tu MVP.

**Prototipo** — Versión de prueba destinada a validar un concepto, no a durar.

**Marcha blanca** — Período de operación real con alcance reducido, para detectar fallas antes del lanzamiento formal. La tuya es del 7 al 11 de septiembre.

**Racha (*streak*)** — Días consecutivos de lectura. Es el mecanismo central de hábito de la app y lo calcula `computeStreak`.

**Desacoplar** — Separar dos partes para que cada una pueda cambiar sin obligar a la otra. Es lo que hicimos hoy: el contenido salió del código.

---

## 8. Nombres propios del código

| Nombre | Qué es |
|---|---|
| `App.jsx` | El archivo donde vive casi toda la app |
| `hoyKey()` | Calcula la fecha real del dispositivo. Reemplazó a `TODAY_KEY`, que estaba congelada en el 19 de mayo |
| `CATEGORIAS` | La tabla con las siete categorías, su color y su día de la semana |
| `CONTENIDO_DEMO` | Los tres artículos de muestra, usados solo cuando no hay archivo del mes |
| `cargarMes()` | Pide el archivo JSON del mes correspondiente |
| `validarArticulo()` | Comprueba que un artículo cumpla el esquema |
| `shortCategory` | El campo que indica a qué categoría pertenece un artículo |
| `HERO_MAP` | La tabla que asocia cada categoría con su ilustración |
| `computeStreak()` | Calcula los días consecutivos de lectura |
| `RevisionView` | El modo revisión: verificación, edición directa y veredictos |
| `codigoResumen()` | Genera el código de métricas del piloto |
| `useEsMovil()` | Detecta pantalla angosta para quitar el marco de teléfono |
| `normalizarMes()` | Valida el archivo del mes y descarta lo que no cumple el esquema |
