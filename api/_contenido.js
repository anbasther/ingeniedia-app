// Lee los artículos de un mes para los avisos programados.
// Primero desde los archivos incluidos en la función (ver "includeFiles" en
// vercel.json). Si no están, los pide al dominio de producción. No usa el
// dominio de la petición, porque cuando el reloj de Vercel llama a la función,
// ese dominio puede estar protegido y devolver un error en vez del contenido.
const fs = require("fs");
const path = require("path");

async function articulosDelMes(mes) {
  try {
    const ruta = path.join(process.cwd(), "public", "contenido", `${mes}.json`);
    return JSON.parse(fs.readFileSync(ruta, "utf8")).articulos || {};
  } catch { /* sigue con la red */ }
  const dominio = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!dominio) return null;
  try {
    const r = await fetch(`https://${dominio}/contenido/${mes}.json`, { cache: "no-store" });
    if (!r.ok) return null;
    return (await r.json()).articulos || {};
  } catch { return null; }
}

module.exports = { articulosDelMes };
