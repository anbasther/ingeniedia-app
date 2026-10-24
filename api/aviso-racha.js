// GET /api/aviso-racha
// Lo llama Vercel cada día a las 20:00 de Chile (ver vercel.json). Avisa solo a
// los teléfonos con racha activa que todavía no leen el artículo de hoy: su
// última lectura registrada (/api/lectura) fue ayer. Si hoy no hay artículo
// publicado, no envía nada.
//
// Prueba manual: /api/aviso-racha?prueba=1&clave=<CRON_SECRET>
// envía el recordatorio de ejemplo a todos los suscritos.
const webpush = require("web-push");
const { baseDeDatos, hoyEnChile, CLAVE_SUSCRIPCIONES } = require("./_comun");

function autorizado(req) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  return req.headers.authorization === `Bearer ${secreto}` || req.query.clave === secreto;
}

async function hayArticuloHoy(req, hoy) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const r = await fetch(`${proto}://${req.headers.host}/contenido/${hoy.slice(0,7)}.json`, { cache: "no-store" });
  if (!r.ok) return false;
  const mes = await r.json();
  return !!(mes.articulos || {})[hoy];
}

const mensaje = n => ({
  title: `🔥 ¡Tu racha de ${n} ${n === 1 ? "día" : "días"} está en peligro!`,
  body: "Lee el artículo de hoy antes de medianoche para no perderla.",
  url: "/",
  tag: "racha",
});

module.exports = async (req, res) => {
  if (!autorizado(req)) return res.status(401).json({ error: "No autorizado." });
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY)
    return res.status(500).json({ error: "Faltan las claves VAPID en Vercel." });
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:contacto@ingeniedia.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  try {
    const hoy = hoyEnChile();
    const ayer = hoyEnChile(new Date(new Date(`${hoy}T12:00:00Z`).getTime() - 864e5));
    const prueba = req.query.prueba === "1";
    if (!prueba && !(await hayArticuloHoy(req, hoy)))
      return res.status(200).json({ hoy, enviados: 0, motivo: "No hay artículo publicado para hoy." });

    const db = baseDeDatos();
    const todas = (await db.hgetall(CLAVE_SUSCRIPCIONES)) || {};
    let enviados = 0, omitidos = 0, eliminados = 0, fallidos = 0;
    await Promise.all(Object.entries(todas).map(async ([endpoint, valor]) => {
      const s = typeof valor === "string" ? JSON.parse(valor) : valor;
      const l = s.lectura;
      const enPeligro = l && l.fecha === ayer && l.racha >= 1;
      if (!prueba && !enPeligro) { omitidos++; return; }
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys },
          JSON.stringify(mensaje(prueba ? 5 : l.racha)), { TTL: 4 * 3600 });
        enviados++;
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) {
          await db.hdel(CLAVE_SUSCRIPCIONES, endpoint); eliminados++;
        } else fallidos++;
      }
    }));
    return res.status(200).json({ hoy, ayer, prueba, enviados, omitidos, eliminados, fallidos });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
