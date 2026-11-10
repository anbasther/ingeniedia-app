// GET    /api/resultados[?simulada=1]  → encuesta de cierre y del piloto (conteos y comentarios), comentarios diarios, preguntas rápidas
//                                         y lecturas y reacciones por artículo
// DELETE /api/resultados?simulada=1    → borra solo los datos simulados (pruebas del docente)
// Solo para el docente: exige la cabecera "x-clave" igual a CLAVE_DOCENTE (variable de Vercel).
const crypto = require("crypto");
const { baseDeDatos, CLAVES_OPINION, CLAVES_INTERACCIONES } = require("./_comun");

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
      await db.del(CLAVES_OPINION.comentarios.simulada, CLAVES_OPINION.encuesta.simulada, CLAVES_OPINION.sondeo.simulada,
                   CLAVES_OPINION.piloto.simulada, CLAVES_INTERACCIONES.simulada);
      return res.status(200).json({ ok: true });
    }
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET, DELETE");
      return res.status(405).json({ error: "Método no permitido." });
    }

    const [com, enc, son, inter, pil] = await Promise.all([
      db.lrange(CLAVES_OPINION.comentarios[tipo], 0, -1),
      db.lrange(CLAVES_OPINION.encuesta[tipo], 0, -1),
      db.lrange(CLAVES_OPINION.sondeo[tipo], 0, -1),
      db.hgetall(CLAVES_INTERACCIONES[tipo]),
      db.lrange(CLAVES_OPINION.piloto[tipo], 0, -1),
    ]);
    // Lecturas, reacciones y mini quiz: { "AAAA-MM-DD": { lectura, "me-gusta", "no-me-gusta", "quiz-correcta", "quiz-incorrecta" } }
    const interacciones = {};
    for (const [campo, valor] of Object.entries(inter || {})) {
      const [fecha, t] = campo.split(":");
      if (!fecha || !t) continue;
      interacciones[fecha] = interacciones[fecha] || { "lectura": 0, "me-gusta": 0, "no-me-gusta": 0, "quiz-correcta": 0, "quiz-incorrecta": 0 };
      interacciones[fecha][t] = Math.max(0, Number(valor) || 0);
    }
    // Preguntas rápidas: conteo por pregunta y respuesta.
    const sondeo = {};
    for (const v of (son || []).map(leer).filter(Boolean)) {
      sondeo[v.pregunta] = sondeo[v.pregunta] || {};
      sondeo[v.pregunta][v.respuesta] = (sondeo[v.pregunta][v.respuesta] || 0) + 1;
    }
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

    // Encuesta del piloto (v0.7.1): conteo por pregunta y opción; «areas» admite varias.
    const pilotoResp = (pil || []).map(leer).filter(Boolean);
    const pilotoConteos = {};
    for (const r of pilotoResp)
      for (const [pregunta, valor] of Object.entries(r.respuestas || {})) {
        pilotoConteos[pregunta] = pilotoConteos[pregunta] || {};
        for (const v of (Array.isArray(valor) ? valor : [valor]))
          pilotoConteos[pregunta][v] = (pilotoConteos[pregunta][v] || 0) + 1;
      }
    const comentariosPiloto = pilotoResp.filter(r => r.comentario)
      .map(r => ({ fecha: r.fecha, texto: r.comentario })).reverse();

    return res.status(200).json({
      simulada,
      piloto: { total: pilotoResp.length, conteos: pilotoConteos, comentarios: comentariosPiloto },
      encuesta: { total: respuestas.length, conteos, comentarios: comentariosEncuesta },
      comentarios,
      sondeo,
      interacciones,
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
