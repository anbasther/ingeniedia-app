// POST /api/sondeo  { pregunta, respuesta, simulada?, fecha? }
// Preguntas rápidas a los probadores dentro de la app (por ejemplo, si quieren
// un mini quiz). Anónimo: solo la pregunta, la respuesta y la fecha.
const { baseDeDatos, hoyEnChile, CLAVES_OPINION, FECHA_VALIDA, cuerpo, agregar } = require("./_comun");

// Preguntas abiertas y sus respuestas válidas. Debe coincidir con SONDEO en App.jsx.
const PREGUNTAS = { quiz: ["si", "no", "igual"] };

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Método no permitido." }); }
  try {
    const b = cuerpo(req);
    const validas = PREGUNTAS[b.pregunta];
    if (!validas || !validas.includes(b.respuesta)) return res.status(400).json({ error: "Respuesta inválida." });
    const simulada = b.simulada === true;
    const fecha = simulada && FECHA_VALIDA.test(b.fecha || "") ? b.fecha : hoyEnChile();
    const db = baseDeDatos();
    const ok = await agregar(db, CLAVES_OPINION.sondeo[simulada ? "simulada" : "real"],
      { fecha, pregunta: b.pregunta, respuesta: b.respuesta, recibido: new Date().toISOString() });
    if (!ok) return res.status(429).json({ error: "No se pueden recibir más respuestas por ahora." });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
