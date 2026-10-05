// POST /api/encuesta  { respuestas: { diseno, contenido, claridad, fluidez, facilidad, aviso }, comentario?, simulada?, fecha? }
// Encuesta de cierre de la etapa de prueba. Anónima: sin nombre, correo ni identificador.
const { baseDeDatos, hoyEnChile, CLAVES_OPINION, FECHA_VALIDA, cuerpo, agregar } = require("./_comun");

const NIVELES = ["muy-malo", "malo", "bueno", "muy-bueno"];
const ASPECTOS = {
  diseno: NIVELES, contenido: NIVELES, claridad: NIVELES,
  fluidez: NIVELES, facilidad: NIVELES, aviso: [...NIVELES, "no-lo-use"],
};
const MAX_COMENTARIO = 300;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  try {
    const b = cuerpo(req);
    const r = b.respuestas || {};
    const respuestas = {};
    for (const [aspecto, validos] of Object.entries(ASPECTOS)) {
      if (!validos.includes(r[aspecto])) return res.status(400).json({ error: `Falta responder: ${aspecto}.` });
      respuestas[aspecto] = r[aspecto];
    }
    const comentario = typeof b.comentario === "string" ? b.comentario.trim() : "";
    if (comentario.length > MAX_COMENTARIO)
      return res.status(400).json({ error: `Máximo ${MAX_COMENTARIO} caracteres.` });

    const simulada = b.simulada === true;
    const fecha = simulada && FECHA_VALIDA.test(b.fecha || "") ? b.fecha : hoyEnChile();
    const db = baseDeDatos();
    const clave = CLAVES_OPINION.encuesta[simulada ? "simulada" : "real"];
    const ok = await agregar(db, clave, { fecha, respuestas, comentario, recibido: new Date().toISOString() });
    if (!ok) return res.status(429).json({ error: "No se pueden recibir más respuestas por ahora." });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
