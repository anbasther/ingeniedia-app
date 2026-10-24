// POST /api/lectura  { endpoint, fecha, racha }
// La app lo llama cuando el artículo de hoy suma a la racha, solo si el aviso
// diario está activo. Se guarda junto a la suscripción la fecha de esa lectura
// y el número de días de racha, para que el recordatorio de las 20:00
// (/api/aviso-racha) avise solo a quien aún no lee el artículo del día.
// No se guarda ningún dato personal; se borra junto con la suscripción.
const { baseDeDatos, hoyEnChile, CLAVE_SUSCRIPCIONES, FECHA_VALIDA, cuerpo } = require("./_comun");

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).json({ error: "Método no permitido." }); }
  try {
    const { endpoint, fecha, racha, simulada } = cuerpo(req);
    // Las pruebas con ?simular usan fechas inventadas: no se guardan.
    if (simulada) return res.status(200).json({ ok: true, guardado: false, motivo: "simulación" });
    const n = Number(racha);
    if (typeof endpoint !== "string" || !FECHA_VALIDA.test(fecha || "") || !Number.isInteger(n) || n < 1 || n > 10000)
      return res.status(400).json({ error: "Datos inválidos." });
    // Solo se acepta la lectura de hoy (con un día de margen por la zona horaria).
    const hoy = hoyEnChile(), ayer = hoyEnChile(new Date(Date.now() - 864e5));
    if (fecha !== hoy && fecha !== ayer) return res.status(400).json({ error: "Fecha fuera de rango." });

    const db = baseDeDatos();
    const valor = await db.hget(CLAVE_SUSCRIPCIONES, endpoint);
    if (!valor) return res.status(200).json({ ok: true, guardado: false, motivo: "sin aviso activo" });
    const s = typeof valor === "string" ? JSON.parse(valor) : valor;
    await db.hset(CLAVE_SUSCRIPCIONES, { [endpoint]: JSON.stringify({ ...s, lectura: { fecha, racha: n } }) });
    return res.status(200).json({ ok: true, guardado: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
