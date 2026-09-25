// POST   /api/suscripciones  { suscripcion }  → activa el aviso diario en este teléfono
// DELETE /api/suscripciones  { endpoint }     → lo desactiva
// Solo se guarda la dirección técnica de envío del teléfono: ningún dato personal.
const { baseDeDatos, CLAVE_SUSCRIPCIONES, MAX_SUSCRIPCIONES } = require("./_comun");

function valida(s) {
  return s && typeof s.endpoint === "string" && s.endpoint.startsWith("https://")
    && s.endpoint.length < 1000 && s.keys && typeof s.keys.p256dh === "string"
    && typeof s.keys.auth === "string";
}

module.exports = async (req, res) => {
  try {
    const db = baseDeDatos();
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    if (req.method === "POST") {
      const s = body.suscripcion;
      if (!valida(s)) return res.status(400).json({ error: "Suscripción inválida." });
      const existe = await db.hexists(CLAVE_SUSCRIPCIONES, s.endpoint);
      if (!existe && (await db.hlen(CLAVE_SUSCRIPCIONES)) >= MAX_SUSCRIPCIONES)
        return res.status(429).json({ error: "Se alcanzó el máximo de suscripciones." });
      await db.hset(CLAVE_SUSCRIPCIONES, {
        [s.endpoint]: JSON.stringify({ endpoint: s.endpoint, keys: s.keys }),
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      if (typeof body.endpoint !== "string") return res.status(400).json({ error: "Falta endpoint." });
      await db.hdel(CLAVE_SUSCRIPCIONES, body.endpoint);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "POST, DELETE");
    return res.status(405).json({ error: "Método no permitido." });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
