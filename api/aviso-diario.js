// GET /api/aviso-diario
// Lo llama Vercel una vez al día (ver vercel.json). Si hay artículo publicado
// para hoy, envía el aviso a todos los teléfonos suscritos. Si no hay artículo,
// no envía nada.
//
// Prueba manual: /api/aviso-diario?prueba=1&clave=<CRON_SECRET>
// envía un aviso de prueba aunque hoy no haya artículo.
const webpush = require("web-push");
const { baseDeDatos, hoyEnChile, CLAVE_SUSCRIPCIONES } = require("./_comun");

// Igual que CATEGORIAS en App.jsx: índice 0 = domingo.
const CATEGORIA_POR_DIA = ["IA","Electricidad","Mecánica","Automatización","Electrónica","Informática","Energía"];

function autorizado(req) {
  const secreto = process.env.CRON_SECRET;
  if (!secreto) return false;
  return req.headers.authorization === `Bearer ${secreto}` || req.query.clave === secreto;
}

async function articuloDeHoy(req, hoy) {
  const proto = req.headers["x-forwarded-proto"] || "https";
  const r = await fetch(`${proto}://${req.headers.host}/contenido/${hoy.slice(0,7)}.json`, { cache: "no-store" });
  if (!r.ok) return null;
  const mes = await r.json();
  return (mes.articulos || {})[hoy] || null;
}

module.exports = async (req, res) => {
  if (!autorizado(req)) return res.status(401).json({ error: "No autorizado." });
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY)
    return res.status(500).json({ error: "Faltan las claves VAPID en Vercel." });
  webpush.setVapidDetails(VAPID_SUBJECT || "mailto:contacto@ingeniedia.app", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

  try {
    const hoy = hoyEnChile();
    const prueba = req.query.prueba === "1";
    let aviso;
    if (prueba) {
      aviso = { title: "IngenieDía · prueba", body: "Si ves esto, los avisos diarios funcionan.", url: "/" };
    } else {
      const art = await articuloDeHoy(req, hoy);
      if (!art) return res.status(200).json({ hoy, enviados: 0, motivo: "No hay artículo publicado para hoy." });
      const dia = new Date(`${hoy}T12:00:00Z`).getUTCDay();
      aviso = { title: `IngenieDía · ${art.shortCategory || CATEGORIA_POR_DIA[dia]}`, body: art.title, url: "/" };
    }

    const db = baseDeDatos();
    const todas = (await db.hgetall(CLAVE_SUSCRIPCIONES)) || {};
    let enviados = 0, eliminados = 0, fallidos = 0;
    await Promise.all(Object.entries(todas).map(async ([endpoint, valor]) => {
      const s = typeof valor === "string" ? JSON.parse(valor) : valor;
      try {
        await webpush.sendNotification(s, JSON.stringify(aviso), { TTL: 12 * 3600 });
        enviados++;
      } catch (e) {
        // 404/410: el teléfono desinstaló la app o revocó el permiso.
        if (e.statusCode === 404 || e.statusCode === 410) {
          await db.hdel(CLAVE_SUSCRIPCIONES, endpoint); eliminados++;
        } else fallidos++;
      }
    }));
    return res.status(200).json({ hoy, prueba, enviados, eliminados, fallidos });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
