// POST /api/encuesta  { respuestas: { diseno, contenido, claridad, fluidez, facilidad, aviso }, comentario?, simulada?, fecha? }
// Encuesta de cierre de la etapa de prueba. Anónima: sin nombre, correo ni identificador.
// v0.7.1: con { tipo: "piloto", respuestas: {...} } recibe la encuesta del piloto (23–29 nov).
const { baseDeDatos, hoyEnChile, CLAVES_OPINION, FECHA_VALIDA, cuerpo, agregar } = require("./_comun");

const NIVELES = ["muy-malo", "malo", "bueno", "muy-bueno"];
const ASPECTOS = {
  diseno: NIVELES, contenido: NIVELES, claridad: NIVELES,
  fluidez: NIVELES, facilidad: NIVELES, aviso: [...NIVELES, "no-lo-use"],
};

// Encuesta del piloto: las claves coinciden con BLOQUES_PILOTO en src/App.jsx.
const ACUERDO  = ["muy-desacuerdo", "desacuerdo", "acuerdo", "muy-acuerdo"];
const UTILIDAD = ["nada", "poco", "util", "muy", "no-lo-use"];
const IDEA     = ["si", "tal-vez", "no"];
const PILOTO = {
  dias: ["1-2", "3-4", "5-6", "todos"],
  momento: ["manana", "mediodia", "tarde", "noche"],
  aprendi: ACUERDO, asignaturas: ACUERDO, formulas: ACUERDO,
  nivel: ["basico", "adecuado", "avanzado"],
  aviso: UTILIDAD, racha: UTILIDAD, archivo: UTILIDAD, quiz: UTILIDAD,
  ligas: IDEA, recuperar: IDEA,
  recomendar: ["si", "tal-vez", "no"],
};
const AREAS = ["electricidad", "mecanica", "automatizacion", "electronica", "informatica", "energia", "ia"];
const MAX_COMENTARIO = 300;

function validar(r, esquema) {
  const respuestas = {};
  for (const [pregunta, validos] of Object.entries(esquema)) {
    if (!validos.includes(r[pregunta])) return { error: `Falta responder: ${pregunta}.` };
    respuestas[pregunta] = r[pregunta];
  }
  return { respuestas };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  try {
    const b = cuerpo(req);
    const r = b.respuestas || {};
    const esPiloto = b.tipo === "piloto";
    const v = validar(r, esPiloto ? PILOTO : ASPECTOS);
    if (v.error) return res.status(400).json({ error: v.error });
    const respuestas = v.respuestas;
    if (esPiloto) {
      const areas = Array.isArray(r.areas) ? [...new Set(r.areas.filter(a => AREAS.includes(a)))] : [];
      if (!areas.length) return res.status(400).json({ error: "Falta responder: areas." });
      respuestas.areas = areas;
    }
    const comentario = typeof b.comentario === "string" ? b.comentario.trim() : "";
    if (comentario.length > MAX_COMENTARIO)
      return res.status(400).json({ error: `Máximo ${MAX_COMENTARIO} caracteres.` });

    const simulada = b.simulada === true;
    const fecha = simulada && FECHA_VALIDA.test(b.fecha || "") ? b.fecha : hoyEnChile();
    const db = baseDeDatos();
    const clave = CLAVES_OPINION[esPiloto ? "piloto" : "encuesta"][simulada ? "simulada" : "real"];
    const ok = await agregar(db, clave, { fecha, respuestas, comentario, recibido: new Date().toISOString() });
    if (!ok) return res.status(429).json({ error: "No se pueden recibir más respuestas por ahora." });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
