// GET    /api/resultados[?simulada=1]  → encuesta (conteos y comentarios) y comentarios diarios
// DELETE /api/resultados?simulada=1    → borra solo los datos simulados (pruebas del docente)
// Solo para el docente: exige la cabecera "x-clave" igual a CLAVE_DOCENTE (variable de Vercel).
const crypto = require("crypto");
const { baseDeDatos, CLAVES_OPINION } = require("./_comun");

function claveCorrecta(dada) {
  const real = process.env.CLAVE_DOCENTE || "";
  if (!real || typeof dada !== "string") return false;
  const a = crypto.createHash("sha256").update(dada).digest();
  const b = crypto.createHash("sha256").update(real).digest();
  return crypto.timingSafeEqual(a, b);
}

const leer = x => { try { return typeof x === "string" ? JSON.parse(x) : x; } catch { return null; } };

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  if (!process.env.CLAVE_DOCENTE)
    return res.status(500).json({ error: "Falta crear CLAVE_DOCENTE en Vercel." });
  if (!claveCorrecta(req.headers["x-clave"]))
    return res.status(401).json({ error: "Clave incorrecta." });

  const simulada = String((req.query && req.query.simulada) || "") === "1";
  const tipo = simulada ? "simulada" : "real";
  try {
    const db = baseDeDatos();

    if (req.method === "DELETE") {
      if (!simulada) return res.status(400).json({ error: "Solo se pueden borrar los datos simulados." });
      await db.del(CLAVES_OPINION.comentarios.simulada, CLAVES_OPINION.encuesta.simulada);
      return res.status(200).json({ ok: true });
    }
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET, DELETE");
      return res.status(405).json({ error: "Método no permitido." });
    }

    const [com, enc] = await Promise.all([
      db.lrange(CLAVES_OPINION.comentarios[tipo], 0, -1),
      db.lrange(CLAVES_OPINION.encuesta[tipo], 0, -1),
    ]);
    const comentarios = (com || []).map(leer).filter(Boolean).reverse(); // más recientes primero
    const respuestas  = (enc || []).map(leer).filter(Boolean);

    const conteos = {};
    for (const r of respuestas)
      for (const [aspecto, nivel] of Object.entries(r.respuestas || {})) {
        conteos[aspecto] = conteos[aspecto] || {};
        conteos[aspecto][nivel] = (conteos[aspecto][nivel] || 0) + 1;
      }
    const comentariosEncuesta = respuestas.filter(r => r.comentario)
      .map(r => ({ fecha: r.fecha, texto: r.comentario })).reverse();

    return res.status(200).json({
      simulada,
      encuesta: { total: respuestas.length, conteos, comentarios: comentariosEncuesta },
      comentarios,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
