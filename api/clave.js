// GET /api/clave → clave pública con que el teléfono se suscribe a los avisos.
module.exports = (req, res) => {
  const clave = process.env.VAPID_PUBLIC_KEY;
  if (!clave) return res.status(500).json({ error: "Falta VAPID_PUBLIC_KEY en Vercel." });
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ clave });
};
