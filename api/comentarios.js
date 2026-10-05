// POST /api/comentarios  { texto, articulo, titulo, simulada?, fecha? }
// Comentario anónimo desde el final del artículo del día.
// Se guarda solo el texto, la fecha y el artículo: nada que identifique a la persona.
// El límite de un comentario por día lo lleva el teléfono.
const { baseDeDatos, hoyEnChile, CLAVES_OPINION, FECHA_VALIDA, cuerpo, agregar } = require("./_comun");

const MAX_TEXTO = 500;

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método no permitido." });
  }
  try {
    const b = cuerpo(req);
    const texto = typeof b.texto === "string" ? b.texto.trim() : "";
    if (!texto)                    return res.status(400).json({ error: "El comentario está vacío." });
    if (texto.length > MAX_TEXTO)  return res.status(400).json({ error: `Máximo ${MAX_TEXTO} caracteres.` });

    const simulada = b.simulada === true;
    // La fecha la pone el servidor; solo en simulación se acepta la fecha simulada.
    const fecha = simulada && FECHA_VALIDA.test(b.fecha || "") ? b.fecha : hoyEnChile();
    const articulo = FECHA_VALIDA.test(b.articulo || "") ? b.articulo : null;
    const titulo = typeof b.titulo === "string" ? b.titulo.slice(0, 200) : "";

    const db = baseDeDatos();
    const clave = CLAVES_OPINION.comentarios[simulada ? "simulada" : "real"];
    const ok = await agregar(db, clave, { fecha, articulo, titulo, texto, recibido: new Date().toISOString() });
    if (!ok) return res.status(429).json({ error: "No se pueden recibir más comentarios por ahora." });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
