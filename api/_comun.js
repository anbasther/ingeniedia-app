// Funciones compartidas por las rutas de /api. El guion bajo del nombre
// hace que Vercel no lo publique como ruta.
const { Redis } = require("@upstash/redis");

// Todas las suscripciones viven en un solo hash: endpoint → suscripción (JSON).
const CLAVE_SUSCRIPCIONES = "ingeniedia:suscripciones";
const MAX_SUSCRIPCIONES = 500; // tope de seguridad; el piloto usa menos de 100

function baseDeDatos() {
  // Acepta los nombres de variables que crea la integración de Upstash en Vercel.
  const url   = process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("Falta conectar la base de datos (Upstash) en Vercel.");
  return new Redis({ url, token });
}

// Fecha de hoy en Chile, AAAA-MM-DD, sin importar la zona del servidor.
function hoyEnChile(fecha = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(fecha);
}

// Opiniones de la etapa de prueba. Son anónimas: solo texto, fecha y artículo.
// Lo enviado desde la app con ?simular (pruebas del docente) va a claves aparte,
// para no mezclarlo con lo que envían los probadores.
const CLAVES_OPINION = {
  comentarios: { real: "ingeniedia:comentarios", simulada: "ingeniedia:comentarios-simulados" },
  encuesta:    { real: "ingeniedia:encuesta",    simulada: "ingeniedia:encuesta-simulada" },
};
const MAX_REGISTROS = 5000; // tope de seguridad por lista

const FECHA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

// Cuerpo de la petición como objeto, venga como texto o ya interpretado.
function cuerpo(req) {
  if (typeof req.body === "string") { try { return JSON.parse(req.body || "{}"); } catch { return {}; } }
  return req.body || {};
}

// Agrega un registro al final de una lista, respetando el tope.
async function agregar(db, clave, registro) {
  if ((await db.llen(clave)) >= MAX_REGISTROS) return false;
  await db.rpush(clave, JSON.stringify(registro));
  return true;
}

module.exports = { baseDeDatos, hoyEnChile, CLAVE_SUSCRIPCIONES, MAX_SUSCRIPCIONES,
                   CLAVES_OPINION, FECHA_VALIDA, cuerpo, agregar };
