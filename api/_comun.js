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

module.exports = { baseDeDatos, hoyEnChile, CLAVE_SUSCRIPCIONES, MAX_SUSCRIPCIONES };
