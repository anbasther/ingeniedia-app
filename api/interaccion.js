// POST /api/interaccion  { fecha, tipo, delta?, simulada? }
// Conteo anónimo por artículo (v0.6.3): cuántas veces se terminó de leer y cuántos
// «Me gusta» / «No me gusta» tiene. No guarda nada del teléfono ni de la persona:
// solo suma o resta 1 al número de ese artículo.
//   tipo "lectura": solo suma (+1).
//   tipo "me-gusta" | "no-me-gusta": +1 al marcar, −1 al desmarcar (nunca baja de 0).
// Lo enviado desde la app con ?simular va a una clave aparte.
const { baseDeDatos, CLAVES_INTERACCIONES, TIPOS_INTERACCION, FECHA_VALIDA, cuerpo } = require("./_comun");

const MAX_CAMPOS = 3000; // tope de seguridad (≈ 3 tipos × 1000 artículos)

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Método no permitido." }); }
  try {
    const b = cuerpo(req);
    if (!FECHA_VALIDA.test(b.fecha || "")) return res.status(400).json({ error: "Fecha inválida." });
    if (!TIPOS_INTERACCION.includes(b.tipo)) return res.status(400).json({ error: "Tipo inválido." });
    const delta = b.tipo === "lectura" ? 1 : (Number(b.delta) === -1 ? -1 : 1);
    const clave = CLAVES_INTERACCIONES[b.simulada === true ? "simulada" : "real"];
    const campo = `${b.fecha}:${b.tipo}`;
    const db = baseDeDatos();
    if (delta > 0 && (await db.hlen(clave)) >= MAX_CAMPOS && !(await db.hexists(clave, campo)))
      return res.status(429).json({ error: "No se pueden recibir más conteos por ahora." });
    const valor = await db.hincrby(clave, campo, delta);
    if (valor < 0) await db.hset(clave, { [campo]: 0 });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
