import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// ═══════════════════════════════════════════════════
// FONT
// ═══════════════════════════════════════════════════
;(function injectFont() {
  if (typeof document === "undefined" || document.getElementById("id-font")) return;
  const l = document.createElement("link");
  l.id = "id-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap";
  document.head.appendChild(l);
})();

// ═══════════════════════════════════════════════════
// STORAGE
// ═══════════════════════════════════════════════════
// Fecha simulada para probar la app: ?simular=AAAA-MM-DD en la dirección.
// Mientras se simula, el progreso se guarda aparte y lo que se envía
// (comentarios, encuesta) va a la base de datos de prueba, no a la real.
const FECHA_SIMULADA = (() => {
  try {
    const f = new URLSearchParams(window.location.search).get("simular");
    return f && /^\d{4}-\d{2}-\d{2}$/.test(f) ? f : null;
  } catch { return null; }
})();
const CLAVE_ESTADO = FECHA_SIMULADA ? "ingeniedia-estado-simulado" : "ingeniedia-estado";

// El progreso vive en el teléfono del estudiante. Nada sale del dispositivo.
async function storePersist(s) {
  try { window.localStorage.setItem(CLAVE_ESTADO, JSON.stringify(s)); } catch {}
}
async function storeHydrate(defaults) {
  try {
    const crudo = window.localStorage.getItem(CLAVE_ESTADO);
    return crudo ? { ...defaults, ...JSON.parse(crudo) } : defaults;
  } catch { return defaults; }
}

// ═══════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════
// Fecha real del dispositivo. Se recalcula al montar la app.
const hoyKey = () => {
  if (FECHA_SIMULADA) return FECHA_SIMULADA;
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const APP_VERSION = "0.5.0";
const CORREO_CONTACTO = "anbasther@gmail.com";

// Aviso que acompaña a cada artículo. El texto completo está en /terminos.
const AVISO_REFERENCIAL = "Guía referencial de carácter educativo. No reemplaza la normativa oficial vigente ni el criterio de un profesional habilitado. Ante cualquier diferencia, prevalece la norma oficial.";
// Texto de lectura: justificado, con guiones automáticos en español para que
// el justificado no deje espacios anchos en pantallas angostas. "pre-line"
// respeta los saltos de párrafo que traen los artículos (\n\n).
const JUSTIFICADO = { textAlign:"justify", hyphens:"auto", WebkitHyphens:"auto" };
const TEXTO_LARGO = { ...JUSTIFICADO, whiteSpace:"pre-line" };
const FONT        = "'IBM Plex Sans', system-ui, sans-serif";

// Subíndices y superíndices en el texto de los artículos:
// x_{CM} → x con CM abajo; m/s^{2} → m/s con 2 arriba.
// _{x} subíndice · ^{x} superíndice · *{x} mención a una fuente (cursiva)
const MARCA_INDICE = /([_^*])\{([^{}]*)\}/g;
function conIndices(texto) {
  if (typeof texto !== "string" || !/[_^*]\{/.test(texto)) return texto;
  const partes = []; let ultimo = 0, m, k = 0;
  MARCA_INDICE.lastIndex = 0;
  while ((m = MARCA_INDICE.exec(texto))) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    if (m[1] === "*") partes.push(<em key={k++} className="fuente">{m[2]}</em>);
    else {
      const Tag = m[1] === "_" ? "sub" : "sup";
      partes.push(<Tag key={k++} style={{ fontSize:"0.75em", lineHeight:0 }}>{m[2]}</Tag>);
    }
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}
// Para compartir como texto plano.
const sinMarcas = (t) => String(t || "").replace(MARCA_INDICE, "$2");
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

const fmtDate = (key) => {
  const [y,m,d] = key.split("-").map(Number);
  return `${DAYS[new Date(y,m-1,d).getDay()]} ${d} de ${MONTHS[m-1].toLowerCase()} ${y}`;
};
const toKey = (y,m,d) => `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
const getMonthYear = (key) => { const [y,m] = key.split("-").map(Number); return { yr:y, mo:m-1 }; };

// ═══════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════
// ═══════════════════════════════════════════════════
// CATEGORÍAS  ·  una por día de la semana
// Fuente única de color e ilustración. El contenido nunca los declara.
// ═══════════════════════════════════════════════════
const CATEGORIAS = {
  "Electricidad":   { color:"#facc15", dia:1 },  // lunes
  "Mecánica":       { color:"#fb923c", dia:2 },  // martes
  "Automatización": { color:"#4ade80", dia:3 },  // miércoles
  "Electrónica":    { color:"#a3e635", dia:4 },  // jueves
  "Informática":    { color:"#38bdf8", dia:5 },  // viernes
  "Energía":        { color:"#34d399", dia:6 },  // sábado
  "IA":             { color:"#a78bfa", dia:0 },  // domingo
};
const ORDEN_CATEGORIAS = Object.keys(CATEGORIAS);
const colorDe     = (cat) => CATEGORIAS[cat]?.color ?? "#94a3b8";
const categoriaDe = (fechaKey) => {
  const [y,m,d] = fechaKey.split("-").map(Number);
  const dia = new Date(y, m-1, d).getDay();
  return ORDEN_CATEGORIAS.find(c => CATEGORIAS[c].dia === dia) ?? null;
};

const CONTENIDO_DEMO = {
  "2026-05-19": {
    shortCategory:"Electricidad", title:"Protecciones eléctricas y selectividad",
    description:"Una revisión breve sobre cómo la coordinación entre protecciones permite mejorar la seguridad y continuidad operacional en instalaciones eléctricas.",
    context:"En una instalación eléctrica, las protecciones no solo deben interrumpir una falla, sino hacerlo de manera ordenada. La selectividad busca que opere primero la protección más cercana al punto de falla, evitando desconexiones innecesarias en otros sectores del sistema.",
    detail:"La coordinación entre interruptores, fusibles y diferenciales exige revisar corriente nominal, poder de corte, curvas de disparo, sensibilidad y tiempos de operación. Una mala selección puede generar disparos intempestivos o dejar zonas sin protección efectiva.",
    ai:"La IA puede apoyar el análisis de registros de disparo, detectar patrones de fallas repetitivas y sugerir ajustes en estrategias de mantenimiento, siempre bajo validación técnica profesional.",
    history:"La evolución de las protecciones eléctricas pasó desde dispositivos simples de interrupción hasta sistemas coordinados capaces de medir, comunicar y actuar con criterios cada vez más precisos.",
    keyConcepts:"La selectividad permite que una falla sea despejada por la protección más cercana, reduciendo desconexiones innecesarias y mejorando la continuidad operacional.",
    sources:["IEC 60898-1 · Interruptores automáticos.","IEC 60947-2 · Aparatos de baja tensión.","SEC Chile · Pliegos técnicos RIC."],
    readingMin:2,
  },
  "2026-05-18": {
    shortCategory:"Energía", title:"Armónicos eléctricos y calidad de energía",
    description:"Una mirada breve sobre distorsión armónica, cargas no lineales y sus efectos físicos en sistemas eléctricos modernos.",
    context:"Los armónicos aparecen cuando las cargas consumen corriente de forma no sinusoidal. Aunque su frecuencia sea distinta a la fundamental, siguen siendo corrientes que circulan por conductores, transformadores y protecciones.",
    detail:"Su presencia puede aumentar pérdidas, calentar equipos, afectar mediciones y deteriorar la calidad de energía. Por eso se analizan parámetros como THD, espectro armónico y compatibilidad entre cargas y red.",
    ai:"Los modelos de análisis de datos pueden identificar patrones armónicos asociados a equipos específicos y anticipar condiciones que podrían afectar la operación eléctrica.",
    history:"El problema creció con la masificación de electrónica de potencia, variadores de frecuencia, rectificadores, fuentes conmutadas y sistemas de conversión energética.",
    keyConcepts:"Los armónicos son corrientes o tensiones de frecuencia múltiplo de la fundamental que pueden provocar pérdidas, calentamiento, errores de medición y menor vida útil de equipos.",
    sources:["IEEE 519 · Control de armónicos.","IEC 61000 · Compatibilidad electromagnética.","CIGRÉ · Calidad de energía en sistemas eléctricos."],
    readingMin:2,
  },
  "2026-05-17": {
    shortCategory:"IA", title:"Mantenimiento predictivo con IA",
    description:"Cómo los datos operacionales pueden anticipar fallas y mejorar decisiones técnicas de mantenimiento.",
    context:"El mantenimiento predictivo busca anticipar fallas antes de que ocurran, utilizando datos históricos, mediciones en línea y señales de condición provenientes de equipos críticos.",
    detail:"Variables como vibración, temperatura, corriente, presión o ciclos de operación pueden revelar degradación progresiva. El desafío técnico está en distinguir ruido, operación normal y señales tempranas de falla.",
    ai:"La IA permite detectar anomalías, clasificar patrones y priorizar inspecciones. Su valor aumenta cuando los datos están bien medidos, contextualizados y validados por especialistas.",
    history:"Antes de la digitalización, el mantenimiento se basaba en experiencia, inspección periódica y fallas ocurridas. La sensorización cambió ese enfoque.",
    keyConcepts:"El mantenimiento predictivo se basa en observar la condición real de los equipos para anticipar fallas antes de que afecten la operación.",
    sources:["ISO 13374 · Monitoreo de condición.","ISO 17359 · Diagnóstico de máquinas.","NIST · IA aplicada a sistemas industriales."],
    readingMin:2,
  },
};

const CATEGORIES = ORDEN_CATEGORIAS.map(key => ({ key }));

// ═══════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════

// ═══════════════════════════════════════════════════
// CARGA DE CONTENIDO
// Un archivo JSON por mes en /public/contenido/AAAA-MM.json
// El código nunca contiene artículos: solo sabe cómo pedirlos.
// ═══════════════════════════════════════════════════
const ESQUEMA_VERSION = 1;
// Un artículo no necesita las siete secciones. Cuando la ficha no da
// material para una opcional, omitirla es la conducta correcta.
const CAMPOS_OBLIGATORIOS = ["shortCategory","title","description",
                             "detail","keyConcepts","sources","readingMin"];
const CAMPOS_OPCIONALES   = ["context","ai","history"];

function validarArticulo(fecha, art) {
  const faltan = CAMPOS_OBLIGATORIOS.filter(c => art[c] === undefined || art[c] === "" ||
                                    (Array.isArray(art[c]) && !art[c].length));
  if (faltan.length)                      return `${fecha}: faltan campos (${faltan.join(", ")})`;
  if (!CATEGORIAS[art.shortCategory])     return `${fecha}: categoría desconocida "${art.shortCategory}"`;
  if (!Array.isArray(art.sources))        return `${fecha}: "sources" debe ser una lista`;
  return null;
}

// Acepta el archivo del mes y devuelve solo los artículos válidos.
function normalizarMes(json) {
  const articulos = json?.articulos ?? json ?? {};
  const ok = {}, errores = [];
  for (const [fecha, art] of Object.entries(articulos)) {
    const e = validarArticulo(fecha, art);
    if (e) errores.push(e); else ok[fecha] = art;
  }
  return { articulos: ok, errores };
}

const mesDe = (fechaKey) => fechaKey.slice(0, 7);

// Un mes sin archivo publicado no tiene artículos. La muestra de ejemplo solo
// se usa al desarrollar en el computador, nunca en la app publicada.
async function cargarMes(mes) {
  const vacio = { articulos:{}, errores:[] };
  try {
    const r = await fetch(`/contenido/${mes}.json`, { cache:"no-cache" });
    if (r.status === 404) return vacio;
    if (!r.ok) throw new Error(r.status);
    return normalizarMes(await r.json());
  } catch {
    return import.meta.env.DEV ? normalizarMes({ articulos: CONTENIDO_DEMO }) : vacio;
  }
}

const DEFAULT_STATE = {
  tab:"today", selectedKey:hoyKey(), theme:"light", fontScale:1,
  liked:[], disliked:[], saved:[], read:[],
  notificationsOn:true, notifTime:"08:00",
  userName:"", userEmail:"",
  onboardingDone:false, streakCount:0, lastReadDate:"",
};

const toggleArr = (arr,val) => arr.includes(val) ? arr.filter(x=>x!==val) : [...arr,val];

const applyReaction = (state,key,dir) => {
  const hit = dir==="like"?"liked":"disliked";
  const miss = dir==="like"?"disliked":"liked";
  return { ...state, [hit]:toggleArr(state[hit],key), [miss]:state[miss].filter(x=>x!==key) };
};

function computeStreak(state) {
  const hoy = hoyKey();
  if (state.lastReadDate === hoy) return state;
  const [y,m,d] = hoy.split("-").map(Number);
  const dt = new Date(y,m-1,d); dt.setDate(dt.getDate()-1);
  const yesterday = toKey(dt.getFullYear(), dt.getMonth(), dt.getDate());
  const streak = state.lastReadDate === yesterday ? state.streakCount + 1 : 1;
  return { ...state, streakCount:streak, lastReadDate:hoy };
}

// ═══════════════════════════════════════════════════
// THEME
// ═══════════════════════════════════════════════════
const THEMES = {
  dark: {
    bg:"#0b0f1a", card:"#131c2e", border:"rgba(148,163,184,0.13)",
    accent:"#22d3ee", accentBg:"rgba(34,211,238,0.10)",
    text:"#f1f5f9", sub:"#94a3b8", muted:"#64748b",
    pill:"rgba(255,255,255,0.05)", navBg:"#0d1117", inputBg:"#1e293b",
    wallBg:"radial-gradient(ellipse at 50% 0%, #170e35 0%, #060812 70%)",
    danger:"#f87171",
  },
  light: {
    bg:"#f8fafc", card:"#ffffff", border:"rgba(0,0,0,0.07)",
    accent:"#0891b2", accentBg:"rgba(8,145,178,0.08)",
    text:"#0f172a", sub:"#475569", muted:"#64748b",
    pill:"rgba(0,0,0,0.04)", navBg:"#ffffff", inputBg:"#f1f5f9",
    wallBg:"radial-gradient(ellipse at 50% 0%, #dbeafe 0%, #e2e8f0 70%)",
    danger:"#dc2626",
  },
};

// ═══════════════════════════════════════════════════
// HERO ILLUSTRATIONS
// ═══════════════════════════════════════════════════
// Marco común de los fondos: 400×180, recortado al recuadro.
// Zona segura: x 30–370 (los bordes se recortan en teléfonos angostos);
// la esquina superior derecha la ocupa el botón de ampliar.
function HeroSvg({ fondo, children }) {
  return (
    <svg viewBox="0 0 400 180" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"
      style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}
      fontFamily="'IBM Plex Mono', ui-monospace, monospace">
      <rect width="400" height="180" fill={fondo}/>
      {children}
    </svg>
  );
}
const ROTULO = { fontSize:7.5, fill:"#94a3b8" };

function HeroAutomatizacion({ color }) {
  const L = 52, R = 348, y1 = 66, y2 = 114;
  const na = (x, y, label, nc=false) => (        // contacto: | | (NA) o |/| (NC)
    <g>
      <line x1={x} y1={y-9} x2={x} y2={y+9} stroke={color} strokeWidth="1.6"/>
      <line x1={x+10} y1={y-9} x2={x+10} y2={y+9} stroke={color} strokeWidth="1.6"/>
      {nc && <line x1={x-3} y1={y+9} x2={x+13} y2={y-9} stroke={color} strokeWidth="1.3"/>}
      <text x={x+5} y={y-14} textAnchor="middle" fontSize="8.5" fill="#cbd5e1">{label}</text>
    </g>
  );
  return (
    <HeroSvg fondo="#061a10">
      <line x1={L} y1="40" x2={L} y2="140" stroke={color} strokeWidth="2"/>
      <line x1={R} y1="40" x2={R} y2="140" stroke={color} strokeWidth="2"/>
      <text x={L} y="153" textAnchor="middle" {...ROTULO}>L1</text>
      <text x={R} y="153" textAnchor="middle" {...ROTULO}>N</text>
      {/* Rama principal: parada (NC) → marcha (NA) → bobina */}
      <line x1={L} y1={y1} x2="95" y2={y1} stroke={color} strokeWidth="1.3"/>
      {na(95, y1, "S0", true)}
      <line x1="105" y1={y1} x2="160" y2={y1} stroke={color} strokeWidth="1.3"/>
      {na(160, y1, "S1")}
      <line x1="170" y1={y1} x2="262" y2={y1} stroke={color} strokeWidth="1.3"/>
      <circle cx="274" cy={y1} r="12" fill={color} fillOpacity=".12" stroke={color} strokeWidth="1.6"/>
      <text x="274" y={y1+3} textAnchor="middle" fontSize="8.5" fill={color}>K1</text>
      <line x1="286" y1={y1} x2={R} y2={y1} stroke={color} strokeWidth="1.3"/>
      {/* Retención: K1 en paralelo con S1 */}
      <line x1="140" y1={y1} x2="140" y2={y2} stroke={color} strokeWidth="1.3"/>
      <line x1="140" y1={y2} x2="160" y2={y2} stroke={color} strokeWidth="1.3"/>
      {na(160, y2, "K1")}
      <line x1="170" y1={y2} x2="190" y2={y2} stroke={color} strokeWidth="1.3"/>
      <line x1="190" y1={y2} x2="190" y2={y1} stroke={color} strokeWidth="1.3"/>
      <circle cx="140" cy={y1} r="2.2" fill={color}/>
      <circle cx="190" cy={y1} r="2.2" fill={color}/>
      <path d="M 196 104 q 22 -2 30 -24" fill="none" stroke="#e2e8f0" strokeOpacity=".5" strokeWidth="1" strokeDasharray="3 2"/>
      <text x="206" y="124" fontSize="8" fill="#cbd5e1" opacity=".85">retención</text>
      <text x={L+16} y="172" {...ROTULO}>Autoenclavamiento · S0 parada · S1 marcha</text>
    </HeroSvg>
  );
}

function HeroInformatica({ color }) {
  const k = "#c084fc", f = color, n = "#fbbf24", t = "#e2e8f0", c = "#64748b";
  const lineas = [
    [[k,"def "],[f,"articulo_del_dia"],[t,"(fecha):"]],
    [[c,"    # un tema de ingeniería por día"]],
    [[t,"    area = AREAS["],[f,"fecha.weekday"],[t,"()]"]],
    [[k,"    if not "],[t,"area:"]],
    [[k,"        return "],[n,"None"]],
    [[k,"    return "],[f,"publicar"],[t,"(area, fecha)"]],
    [],
    [[f,"print"],[t,"(articulo_del_dia("],[f,"hoy"],[t,"()))"],[color,"▌"]],
  ];
  return (
    <HeroSvg fondo="#0a1520">
      <rect x="30" y="18" width="300" height="146" rx="6" fill="#0d1b2a" stroke="#fff" strokeOpacity=".06"/>
      {[0,1,2].map(i => <circle key={i} cx={42+i*10} cy="28" r="2.6" fill={["#f87171","#fbbf24","#4ade80"][i]} opacity=".6"/>)}
      <text x="80" y="31" {...ROTULO}>ingeniedia.py</text>
      {lineas.map((partes, i) => (
        <text key={i} x="40" y={52+i*14} fontSize="9.5" xmlSpace="preserve">
          <tspan fill="#334155">{String(i+1).padStart(2," ")}  </tspan>
          {partes.map(([col, txt], j) => <tspan key={j} fill={col}>{txt}</tspan>)}
        </text>
      ))}
    </HeroSvg>
  );
}

// Electricidad: esquema unilineal con símbolos IEC 60617 (los que usa el RIC):
// medidor de energía, interruptores automáticos (termomagnéticos) y diferenciales.
function HeroElectricidad({ color }) {
  const W = 1.4;
  const linea = (x1, y1, x2, y2) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={W}/>;
  // Interruptor automático (IEC 60617 07-13-05): contacto abierto con cruz en el contacto fijo.
  const automatico = (x, y, label) => (
    <g>
      {linea(x, y, x+8, y)}
      {linea(x+8, y, x+24, y-9)}
      {linea(x+21, y-3, x+27, y+3)}{linea(x+27, y-3, x+21, y+3)}
      {linea(x+24, y, x+34, y)}
      <text x={x+17} y={y+13} textAnchor="middle" {...ROTULO}>{label}</text>
    </g>
  );
  // Interruptor diferencial: contacto con mando mecánico (trazos) desde el transformador toroidal.
  const diferencial = (x, y) => (
    <g>
      <ellipse cx={x+5} cy={y} rx="3.5" ry="7" fill="none" stroke={color} strokeWidth="1.1"/>
      {linea(x-4, y, x+14, y)}
      {linea(x+14, y, x+30, y-9)}
      {linea(x+30, y, x+38, y)}
      <line x1={x+5} y1={y-7} x2={x+5} y2={y-13} stroke={color} strokeWidth="1" strokeDasharray="2 1.5"/>
      <line x1={x+5} y1={y-13} x2={x+22} y2={y-13} stroke={color} strokeWidth="1" strokeDasharray="2 1.5"/>
      <line x1={x+22} y1={y-13} x2={x+22} y2={y-5} stroke={color} strokeWidth="1" strokeDasharray="2 1.5"/>
      <text x={x+17} y={y+13} textAnchor="middle" {...ROTULO}>IΔn 30 mA</text>
    </g>
  );
  // Marca de número de conductores en unifilar: trazos oblicuos.
  const conductores = (x, y, n=2) => Array.from({ length:n }, (_, i) =>
    <line key={i} x1={x+i*4-3} y1={y+4} x2={x+i*4+3} y2={y-4} stroke={color} strokeWidth="1"/>);
  const circuitos = [
    { y:56,  tm:"C10", carga:"TG" },
    { y:98,  tm:"C16", carga:"TGAux" },
    { y:140, tm:"C20", carga:"TTA" },
  ];
  return (
    <HeroSvg fondo="#0a0f1e">
      <text x="34" y="38" {...ROTULO}>Empalme</text>
      {linea(44, 44, 44, 64)}
      {conductores(44, 54)}
      <rect x="32" y="64" width="24" height="18" fill="none" stroke={color} strokeWidth={W}/>
      <text x="44" y="76" textAnchor="middle" fontSize="7.5" fill={color}>kWh</text>
      {linea(44, 82, 44, 98)}{linea(44, 98, 62, 98)}
      {automatico(62, 98, "C25")}
      <text x="79" y="80" textAnchor="middle" {...ROTULO}>General</text>
      {linea(96, 98, 126, 98)}
      <rect x="126" y="46" width="4" height="104" fill={color} opacity=".9"/>
      {circuitos.map(c => (
        <g key={c.y}>
          {linea(130, c.y, 150, c.y)}
          {diferencial(154, c.y)}
          {linea(192, c.y, 204, c.y)}
          {automatico(204, c.y, c.tm)}
          {linea(238, c.y, 262, c.y)}
          {conductores(250, c.y)}
          <path d={`M262,${c.y-4} L270,${c.y} L262,${c.y+4} Z`} fill={color}/>
          <text x="276" y={c.y+3} fontSize="9" fill="#cbd5e1">{c.carga}</text>
        </g>
      ))}
      <text x="34" y="172" {...ROTULO}>Esquema unilineal · simbología IEC 60617</text>
    </HeroSvg>
  );
}

function HeroElectronica({ color }) {
  const W = 1.3;
  const ln = (x1, y1, x2, y2) => <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={W}/>;
  const top = 46, bot = 146;
  // Tiristor vertical: conduce hacia arriba (ánodo abajo, cátodo arriba), compuerta al costado.
  const scr = (x, y, n) => (
    <g>
      <path d={`M${x-7},${y+6} L${x+7},${y+6} L${x},${y-6} Z`} fill={color} fillOpacity=".25" stroke={color} strokeWidth={W}/>
      {ln(x-7, y-6, x+7, y-6)}
      <line x1={x+3} y1={y-3} x2={x+11} y2={y-9} stroke={color} strokeWidth="1"/>
      <text x={x-10} y={y+3} textAnchor="end" fontSize="6.5" fill="#94a3b8">{n}</text>
    </g>
  );
  const piernas = [124, 168, 212];
  return (
    <HeroSvg fondo="#0d1608">
      {/* Fases */}
      {["L1","L2","L3"].map((f, i) => {
        const y = 76 + i*20, x = piernas[i];
        return (
          <g key={f}>
            <circle cx="46" cy={y} r="6" fill="none" stroke={color} strokeWidth="1.1"/>
            <path d={`M42,${y} q2,-4 4,0 t4,0`} fill="none" stroke={color} strokeWidth="1"/>
            <text x="34" y={y+3} textAnchor="end" fontSize="7" fill="#cbd5e1">{f}</text>
            {ln(52, y, x, y)}
            <circle cx={x} cy={y} r="1.8" fill={color}/>
          </g>
        );
      })}
      {/* Puente */}
      {piernas.map((x, i) => (
        <g key={x}>
          {ln(x, top, x, bot)}
          {scr(x, 58, `T${2*i+1}`)}
          {scr(x, 134, `T${2*i+2}`)}
        </g>
      ))}
      {ln(124, top, 236, top)}{ln(124, bot, 330, bot)}
      {/* Filtro LC y carga */}
      {ln(236, top, 244, top)}
      <path d={`M244,${top} a5,5 0 0 1 10,0 a5,5 0 0 1 10,0 a5,5 0 0 1 10,0 a5,5 0 0 1 10,0`} fill="none" stroke={color} strokeWidth={W}/>
      <text x="264" y={top-10} textAnchor="middle" fontSize="8" fill="#cbd5e1">L</text>
      {ln(284, top, 330, top)}
      {ln(300, top, 300, 92)}{ln(290, 92, 310, 92)}{ln(290, 99, 310, 99)}{ln(300, 99, 300, bot)}
      <text x="314" y="99" fontSize="8" fill="#cbd5e1">C</text>
      {ln(330, top, 330, 72)}
      <polyline points={`330,72 336,76 324,82 336,88 324,94 336,100 324,106 330,110`} fill="none" stroke={color} strokeWidth={W} strokeLinejoin="round"/>
      {ln(330, 110, 330, bot)}
      <text x="340" y="94" fontSize="8" fill="#cbd5e1">R</text>
      <text x="344" y="60" fontSize="8" fill={color}>+</text>
      <text x="344" y="142" fontSize="8" fill={color}>−</text>
      <text x="34" y="172" {...ROTULO}>Rectificador trifásico controlado · filtro LC</text>
    </HeroSvg>
  );
}

// Energía: generación (eólica y solar), transmisión, almacenamiento y consumo.
function HeroEnergia({ color }) {
  const torre = x => (
    <g stroke={color} strokeWidth="1" fill="none" opacity=".85">
      <path d={`M${x-12},140 L${x},60 L${x+12},140`}/>
      <path d={`M${x-8},112 L${x+8},112 M${x-5},90 L${x+5},90 M${x-10},127 L${x+6},112 M${x+10},127 L${x-6},112`}/>
      <path d={`M${x-18},72 L${x+18},72 M${x-14},82 L${x+14},82`}/>
    </g>
  );
  return (
    <HeroSvg fondo="#04160f">
      {/* Aerogenerador */}
      <line x1="56" y1="140" x2="56" y2="64" stroke={color} strokeWidth="2"/>
      {[0,120,240].map(a => (
        <path key={a} d="M56,64 q4,-12 0,-28 q-4,14 0,28" fill={color} fillOpacity=".5" stroke={color} strokeWidth=".8"
          transform={`rotate(${a+20} 56 64)`}/>
      ))}
      <circle cx="56" cy="64" r="3" fill={color}/>
      {/* Panel solar y sol */}
      <circle cx="104" cy="58" r="7" fill="#fbbf24" opacity=".8"/>
      <g transform="translate(86 112) skewX(-20)">
        <rect width="34" height="20" fill={color} fillOpacity=".15" stroke={color} strokeWidth="1.1"/>
        <path d="M11 0 V20 M22 0 V20 M0 10 H34" stroke={color} strokeWidth=".7"/>
      </g>
      <line x1="100" y1="132" x2="100" y2="140" stroke={color} strokeWidth="1.2"/>
      {/* Líneas de transmisión */}
      {torre(170)}{torre(238)}
      {[72, 82].map(y => (
        <g key={y}>
          <path d={`M120,${y+30} Q140,${y+8} 152,${y}`} fill="none" stroke="#e2e8f0" strokeOpacity=".4" strokeWidth=".9"/>
          <path d={`M188,${y} Q204,${y+10} 220,${y}`} fill="none" stroke="#e2e8f0" strokeOpacity=".4" strokeWidth=".9"/>
          <path d={`M256,${y} Q276,${y+12} 296,${y+26}`} fill="none" stroke="#e2e8f0" strokeOpacity=".4" strokeWidth=".9"/>
        </g>
      ))}
      {/* Consumo */}
      <path d="M296,140 V112 L314,98 L332,112 V140 Z" fill={color} fillOpacity=".12" stroke={color} strokeWidth="1.2"/>
      <rect x="309" y="124" width="10" height="16" fill="none" stroke={color} strokeWidth="1"/>
      {/* Batería */}
      <rect x="340" y="104" width="22" height="36" rx="3" fill="none" stroke={color} strokeWidth="1.3"/>
      <rect x="346" y="100" width="10" height="4" rx="1" fill={color}/>
      {[0,1,2].map(i => <rect key={i} x="344" y={130-i*10} width="14" height="7" rx="1" fill={color} opacity={.9-i*.25}/>)}
      <line x1="30" y1="140" x2="370" y2="140" stroke="#fff" strokeOpacity=".15"/>
      <text x="34" y="160" {...ROTULO}>Generación</text>
      <text x="204" y="160" textAnchor="middle" {...ROTULO}>Transmisión</text>
      <text x="366" y="160" textAnchor="end" {...ROTULO}>Consumo y almacenamiento</text>
    </HeroSvg>
  );
}

// Mecánica: transmisión de potencia en una máquina de izaje:
// motor → piñón y corona (reductor) → tambor → carga.
function HeroMecanica({ color }) {
  const engrane = (cx, cy, r, dientes, giro=0) => {
    const pts = [];
    for (let i = 0; i < dientes*2; i++) {
      const a = giro + (i*Math.PI)/dientes, rr = i % 2 ? r : r + 4.5, da = Math.PI/dientes*0.35;
      pts.push(`${cx+Math.cos(a-da)*rr},${cy+Math.sin(a-da)*rr}`, `${cx+Math.cos(a+da)*rr},${cy+Math.sin(a+da)*rr}`);
    }
    return <polygon points={pts.join(" ")} fill={color} fillOpacity=".08" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>;
  };
  const giro = (cx, cy, r, a0, a1) => {               // flecha curva de rotación
    const p = a => [cx + r*Math.cos(a), cy + r*Math.sin(a)];
    const [x0, y0] = p(a0), [x1, y1] = p(a1);
    return (
      <g>
        <path d={`M${x0},${y0} A${r},${r} 0 0 1 ${x1},${y1}`} fill="none" stroke="#e2e8f0" strokeOpacity=".7" strokeWidth="1"/>
        <circle cx={x1} cy={y1} r="2" fill="#e2e8f0" opacity=".8"/>
      </g>
    );
  };
  const p = [112, 82], g = [164, 82];
  return (
    <HeroSvg fondo="#1a1206">
      {/* Motor */}
      <rect x="34" y="62" width="50" height="40" rx="4" fill={color} fillOpacity=".12" stroke={color} strokeWidth="1.3"/>
      {[44, 52, 60, 68, 76].map(x => <line key={x} x1={x} y1="66" x2={x} y2="98" stroke={color} strokeOpacity=".4"/>)}
      <rect x="42" y="102" width="34" height="6" fill={color} fillOpacity=".3"/>
      <text x="59" y="122" textAnchor="middle" {...ROTULO}>motor</text>
      <line x1="84" y1={p[1]} x2={p[0]} y2={p[1]} stroke={color} strokeWidth="3"/>
      {/* Reductor: piñón y corona */}
      {engrane(p[0], p[1], 13, 9, 0.2)}
      {engrane(g[0], g[1], 33, 23, 0)}
      <circle cx={p[0]} cy={p[1]} r="2.5" fill={color}/>
      {/* Tambor solidario a la corona */}
      <circle cx={g[0]} cy={g[1]} r="15" fill="#1a1206" stroke={color} strokeWidth="1.4"/>
      <circle cx={g[0]} cy={g[1]} r="2.5" fill={color}/>
      {giro(p[0], p[1], 22, -2.6, -1.2)}
      <text x={p[0]-6} y={p[1]-26} fontSize="8" fill="#cbd5e1">ω₁</text>
      {giro(g[0], g[1], 46, -1.9, -0.9)}
      <text x={g[0]+26} y={g[1]-40} fontSize="8" fill="#cbd5e1">ω₂</text>
      {/* Cable y carga */}
      <line x1={g[0]+15} y1={g[1]} x2={g[0]+15} y2="128" stroke="#e2e8f0" strokeOpacity=".75" strokeWidth="1.1"/>
      <rect x={g[0]+3} y="128" width="24" height="20" rx="2" fill={color} fillOpacity=".25" stroke={color} strokeWidth="1.3"/>
      <text x={g[0]+15} y="141" textAnchor="middle" fontSize="8" fill={color}>m</text>
      <line x1={g[0]+36} y1="132" x2={g[0]+36} y2="152" stroke={color} strokeWidth="1.2"/>
      <path d={`M${g[0]+33},152 L${g[0]+36},158 L${g[0]+39},152 Z`} fill={color}/>
      <text x={g[0]+42} y="148" fontSize="7.5" fill={color}>m·g</text>
      {/* Relaciones */}
      <g fontSize="9" fill="#cbd5e1">
        <text x="252" y="70">i = z₂ / z₁</text>
        <text x="252" y="92">P = τ · ω</text>
        <text x="252" y="114">v = ω₂ · r</text>
      </g>
      <line x1="242" y1="58" x2="242" y2="120" stroke={color} strokeOpacity=".4"/>
      <text x="34" y="172" {...ROTULO}>Transmisión de potencia · motor, reductor y tambor</text>
    </HeroSvg>
  );
}

// IA: robot móvil autónomo visto desde arriba. Percibe con un sensor láser,
// planifica una ruta entre obstáculos y llega a su objetivo.
function HeroIA({ color }) {
  const r = [74, 98];
  const rayos = Array.from({ length:9 }, (_, i) => -0.52 + i*0.13);
  const gris = { fill:"#94a3b8", fillOpacity:.12, stroke:"#94a3b8", strokeOpacity:.5 };
  return (
    <HeroSvg fondo="#0d0a1e">
      {[60, 100, 140, 180, 220, 260, 300, 340].map(x =>
        <line key={x} x1={x} y1="20" x2={x} y2="160" stroke="#fff" strokeOpacity=".03"/>)}
      {/* Obstáculos */}
      <rect x="160" y="36" width="30" height="46" rx="3" {...gris}/>
      <rect x="160" y="114" width="30" height="40" rx="3" {...gris}/>
      <rect x="250" y="56" width="32" height="52" rx="3" {...gris}/>
      {/* Barrido del sensor láser */}
      {rayos.map((a, i) => {
        const largo = Math.abs(a) > 0.25 ? (160 - r[0]) / Math.cos(a) : 82;
        return <line key={i} x1={r[0]} y1={r[1]} x2={r[0]+Math.cos(a)*largo} y2={r[1]+Math.sin(a)*largo}
          stroke={color} strokeOpacity=".3" strokeWidth="1"/>;
      })}
      {rayos.filter(a => Math.abs(a) > 0.25).map((a, i) =>
        <circle key={i} cx="160" cy={r[1]+Math.tan(a)*(160-r[0])} r="2.4" fill={color}/>)}
      {/* Ruta planificada */}
      <path d="M98,98 C128,98 150,98 175,98 S 220,140 262,136 S 316,112 330,98"
        fill="none" stroke={color} strokeWidth="1.6" strokeDasharray="5 3"/>
      {/* Objetivo */}
      <circle cx="336" cy="96" r="11" fill="none" stroke={color} strokeWidth="1.2" strokeOpacity=".6"/>
      <circle cx="336" cy="96" r="6" fill="none" stroke={color} strokeWidth="1.3"/>
      <circle cx="336" cy="96" r="2" fill={color}/>
      {/* Robot (vista superior) */}
      <rect x={r[0]-26} y={r[1]-21} width="10" height="7" rx="2" fill={color} opacity=".7"/>
      <rect x={r[0]-26} y={r[1]+14} width="10" height="7" rx="2" fill={color} opacity=".7"/>
      <rect x={r[0]-30} y={r[1]-15} width="36" height="30" rx="8" fill="#0d0a1e" stroke={color} strokeWidth="1.5"/>
      <circle cx={r[0]} cy={r[1]} r="6" fill={color} fillOpacity=".25" stroke={color} strokeWidth="1.3"/>
      <circle cx={r[0]} cy={r[1]} r="2" fill={color}/>
      <text x="34" y="34" fontSize="9" fill="#cbd5e1">percibe · planifica · actúa</text>
      <text x="34" y="172" {...ROTULO}>Robot móvil autónomo con sensor láser</text>
    </HeroSvg>
  );
}

const HERO_MAP = {
  "Electricidad":    HeroElectricidad,
  "Energía":         HeroEnergia,
  "IA":              HeroIA,
  "Informática":     HeroInformatica,
  "Mecánica":        HeroMecanica,
  "Automatización":  HeroAutomatizacion,
  "Electrónica":     HeroElectronica,
};

// ═══════════════════════════════════════════════════
// ICONS
// ═══════════════════════════════════════════════════
const SB = { viewBox:"0 0 24 24", fill:"none", stroke:"currentColor", strokeWidth:"2", strokeLinecap:"round", strokeLinejoin:"round" };

const CatIcon = {
  Electricidad:   ({c,s=16}) => <svg {...SB} style={{width:s,height:s}} stroke={c}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Energía:        ({c,s=16}) => <svg {...SB} style={{width:s,height:s}} stroke={c}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  IA:             ({c,s=16}) => <svg {...SB} style={{width:s,height:s}} stroke={c}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  Electrónica:    ({c,s=16}) => <svg {...SB} style={{width:s,height:s}} stroke={c}><polyline points="1 12 5 12 7 7 10 17 13 7 16 17 18 12 23 12"/></svg>,
  Informática:    ({c,s=16}) => <svg {...SB} style={{width:s,height:s}} stroke={c}><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
  Mecánica:       ({c,s=16}) => <svg {...SB} style={{width:s,height:s}} stroke={c}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
  Automatización: ({c,s=16}) => <svg {...SB} style={{width:s,height:s}} stroke={c}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

const Ic = {
  ZapFill:  ({s=24}) => <svg viewBox="0 0 24 24" fill="currentColor" style={{width:s,height:s}}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  Clock:    ({s=14}) => <svg {...SB} style={{width:s,height:s}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Info:     ({s=15}) => <svg {...SB} style={{width:s,height:s}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>,
  Star:     ({s=15}) => <svg {...SB} style={{width:s,height:s}}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Layers:   ({s=15}) => <svg {...SB} style={{width:s,height:s}}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Cpu:      ({s=15}) => <svg {...SB} style={{width:s,height:s}}><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></svg>,
  ClockH:   ({s=15}) => <svg {...SB} style={{width:s,height:s}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/><polyline points="3.05 11 1 17 6.5 14.5"/></svg>,
  ThumbUp:  ({s=17}) => <svg {...SB} style={{width:s,height:s}}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>,
  ThumbDn:  ({s=17}) => <svg {...SB} style={{width:s,height:s}}><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>,
  Bookmark: ({s=17,filled=false}) => <svg {...SB} style={{width:s,height:s}} fill={filled?"currentColor":"none"}><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
  Share:    ({s=17}) => <svg {...SB} style={{width:s,height:s}}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>,
  User:     ({s=17}) => <svg {...SB} style={{width:s,height:s}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Bell:     ({s=17}) => <svg {...SB} style={{width:s,height:s}}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  Moon:     ({s=17}) => <svg {...SB} style={{width:s,height:s}}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>,
  Sun:      ({s=17}) => <svg {...SB} style={{width:s,height:s}}><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  Calendar: ({s=13}) => <svg {...SB} style={{width:s,height:s}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  Mail:     ({s=14}) => <svg {...SB} style={{width:s,height:s}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  ChevL:    ({s=14}) => <svg {...SB} strokeWidth="2.5" style={{width:s,height:s}}><polyline points="15 18 9 12 15 6"/></svg>,
  ChevR:    ({s=14}) => <svg {...SB} strokeWidth="2.5" style={{width:s,height:s}}><polyline points="9 18 15 12 9 6"/></svg>,
  Check:    ({s=14}) => <svg {...SB} strokeWidth="2.5" style={{width:s,height:s}}><polyline points="20 6 9 17 4 12"/></svg>,
  Reset:    ({s=14}) => <svg {...SB} style={{width:s,height:s}}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.34"/></svg>,
  Search:   ({s=15}) => <svg {...SB} style={{width:s,height:s}}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
  Expand:   ({s=15}) => <svg {...SB} style={{width:s,height:s}}><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>,
  Shrink:   ({s=15}) => <svg {...SB} style={{width:s,height:s}}><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/></svg>,
};

// ═══════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════
function useToast() {
  const [msg, setMsg]   = useState("");
  const [vis, setVis]   = useState(false);
  const timer           = useRef(null);
  const show = useCallback((m) => {
    setMsg(m); setVis(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVis(false), 2200);
  }, []);
  return { msg, vis, show };
}

function usePressable() {
  const [pressed, setPressed] = useState(false);
  return {
    pressed,
    handlers: {
      onMouseDown:  () => setPressed(true),
      onMouseUp:    () => setPressed(false),
      onMouseLeave: () => setPressed(false),
      onTouchStart: () => setPressed(true),
      onTouchEnd:   () => setPressed(false),
    },
  };
}

// ═══════════════════════════════════════════════════
// PRIMITIVE COMPONENTS
// ═══════════════════════════════════════════════════
function PressBtn({ onClick, children, style:ex={}, disabled=false, label }) {
  const { pressed, handlers } = usePressable();
  return (
    <button aria-label={label} disabled={disabled} onClick={onClick} {...handlers}
      style={{ ...ex, transform: pressed && !disabled ? "scale(0.94)" : "scale(1)",
        transition: `transform .1s${ex.transition ? ", "+ex.transition : ""}` }}>
      {children}
    </button>
  );
}

function IBtn({ active, onClick, label, T, children }) {
  return (
    <PressBtn label={label} onClick={onClick} style={{
      width:38, height:38, borderRadius:12, flexShrink:0, cursor:"pointer",
      border: `1px solid ${active ? T.accent : T.border}`,
      background: active ? T.accentBg : "transparent",
      color: active ? T.accent : T.sub,
      display:"flex", alignItems:"center", justifyContent:"center",
    }}>
      {children}
    </PressBtn>
  );
}

function Toggle({ on, onChange, T }) {
  return (
    <button role="switch" aria-checked={on} onClick={() => onChange(!on)}
      style={{ width:42, height:23, borderRadius:12, flexShrink:0, cursor:"pointer",
        background: on ? T.accent : T.pill, border:`1px solid ${on ? T.accent : T.border}`,
        position:"relative", transition:"background .2s, border-color .2s" }}>
      <span style={{ position:"absolute", top:3, left: on ? 21 : 3,
        width:15, height:15, borderRadius:8, display:"block",
        background: on ? "#0f172a" : T.muted, transition:"left .2s" }}/>
    </button>
  );
}

function Card({ T, title, icon, children, style:ex }) {
  return (
    <div style={{ borderRadius:20, border:`1px solid ${T.border}`, background:T.card, padding:"15px 16px", ...ex }}>
      {(title || icon) && (
        <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12 }}>
          {icon && <span style={{ color:T.accent, display:"flex" }}>{icon}</span>}
          {title && <span style={{ fontSize:13, fontWeight:700, color:T.text }}>{title}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

function SectionBlock({ icon, title, children, T }) {
  return (
    <div style={{ borderBottom:`1px solid ${T.border}`, paddingBottom:14, marginBottom:14 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7 }}>
        <span style={{ width:28, height:28, borderRadius:9, flexShrink:0, background:T.pill,
          border:`1px solid ${T.border}`, display:"flex", alignItems:"center", justifyContent:"center", color:T.accent }}>
          {icon}
        </span>
        <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{title}</span>
      </div>
      <p style={{ ...TEXTO_LARGO, fontSize:12, color:T.sub, lineHeight:1.7, margin:0 }}>{conIndices(children)}</p>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════
function Toast({ message, visible }) {
  return (
    <div style={{ position:"absolute", bottom:68, left:"50%", transform:"translateX(-50%)",
      background:"rgba(15,23,42,0.96)", border:"1px solid rgba(34,211,238,0.3)",
      borderRadius:24, padding:"8px 18px", display:"flex", alignItems:"center", gap:7,
      fontSize:12, fontWeight:600, color:"#22d3ee", pointerEvents:"none", zIndex:500,
      opacity: visible ? 1 : 0, transition:"opacity .25s",
      boxShadow:"0 4px 24px rgba(0,0,0,0.4)", whiteSpace:"nowrap" }}>
      <Ic.Check s={13}/> {message}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// SKELETON LOADER
// ═══════════════════════════════════════════════════
function Skeleton({ T }) {
  const bar = (w, h=10, mt=0) =>
    <div style={{ width:w, height:h, borderRadius:6, background:T.pill, marginTop:mt }}/>;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <div style={{ borderRadius:20, overflow:"hidden", border:`1px solid ${T.border}`, background:T.card }}>
        <div style={{ height:180, background:T.pill }}/>
        <div style={{ padding:"12px 16px 16px" }}>
          {bar("60%")} {bar("90%",10,10)} {bar("75%",10,6)}
        </div>
      </div>
      <div style={{ borderRadius:20, border:`1px solid ${T.border}`, background:T.card, padding:16 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ marginBottom: i<2 ? 16 : 0 }}>
            <div style={{ display:"flex", gap:8, marginBottom:8 }}>
              <div style={{ width:28, height:28, borderRadius:9, background:T.pill }}/>
              {bar("40%", 10)}
            </div>
            {bar("100%")} {bar("85%",10,6)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AVISO REFERENCIAL (al pie de cada artículo)
// ═══════════════════════════════════════════════════
function AvisoReferencial({ T }) {
  return (
    <p style={{ ...JUSTIFICADO, fontSize:10.5, color:T.muted, lineHeight:1.55, margin:"0 0 14px" }}>
      {AVISO_REFERENCIAL}{" "}
      <a href="/terminos" target="_blank" rel="noopener"
        style={{ color:T.muted, textDecoration:"underline" }}>Términos de uso</a>
    </p>
  );
}

// ═══════════════════════════════════════════════════
// ONBOARDING
// ═══════════════════════════════════════════════════
const SLIDES = [
  { icon:"⚡", title:"Bienvenido a IngenieDía",
    body:"Un tema de ingeniería por día. Corto, técnico y relevante. Perfecto para mantenerte al día en minutos.", cta:"Siguiente" },
  { icon:"📅", title:"Un tema diario para todos",
    body:"Cada día publicamos un solo tema técnico para toda la comunidad. Explora publicaciones anteriores en el calendario.", cta:"Siguiente" },
  { icon:"🔖", title:"Guarda lo que te sirve",
    body:"Marca artículos, guárdalos en tu archivo, y mantén tu racha diaria de lectura activa.", cta:"Comenzar" },
];

function Onboarding({ onDone, T }) {
  const [slide, setSlide] = useState(0);
  const { icon, title, body, cta } = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;
  return (
    <div style={{ position:"absolute", inset:0, zIndex:300, background:T.bg,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 28px" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ display:"flex", gap:6, marginBottom:40 }}>
        {SLIDES.map((_,i) => (
          <span key={i} style={{ width: i===slide ? 20 : 6, height:6, borderRadius:3,
            background: i===slide ? T.accent : T.border, transition:"width .25s, background .25s" }}/>
        ))}
      </div>
      <div key={slide} style={{ fontSize:56, marginBottom:24, animation:"fadeUp .35s ease" }}>{icon}</div>
      <h2 style={{ fontSize:20, fontWeight:700, color:T.text, textAlign:"center", margin:"0 0 12px", lineHeight:1.3 }}>{title}</h2>
      <p style={{ ...JUSTIFICADO, textAlignLast:"center", fontSize:13, color:T.sub, lineHeight:1.7, margin:"0 0 40px" }}>{body}</p>
      <PressBtn onClick={() => isLast ? onDone() : setSlide(s => s+1)}
        style={{ width:"100%", padding:"14px 0", borderRadius:16, background:T.accent, border:"none",
          fontSize:14, fontWeight:700, color:"#0f172a", cursor:"pointer", letterSpacing:.2 }}>
        {cta}
      </PressBtn>
      {isLast && (
        <p style={{ ...JUSTIFICADO, textAlignLast:"center", marginTop:16, fontSize:11, color:T.muted, lineHeight:1.55 }}>
          IngenieDía es una guía referencial y no reemplaza la normativa oficial.
          Al comenzar aceptas los{" "}
          <a href="/terminos" target="_blank" rel="noopener" style={{ color:T.muted, textDecoration:"underline" }}>Términos de uso</a>
          {" "}y la{" "}
          <a href="/privacidad" target="_blank" rel="noopener" style={{ color:T.muted, textDecoration:"underline" }}>Política de privacidad</a>.
        </p>
      )}
      {!isLast && (
        <button onClick={onDone}
          style={{ marginTop:14, background:"none", border:"none", fontSize:12, color:T.muted, cursor:"pointer" }}>
          Omitir
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// HEADER CALENDAR
// ═══════════════════════════════════════════════════
function HeaderCalendar({ state, setState, T, articulos, onVerMes }) {
  const init = getMonthYear(state.selectedKey);
  const [open, setOpen] = useState(false);
  const [yr,   setYr]   = useState(init.yr);
  const [mo,   setMo]   = useState(init.mo);
  const ref = useRef(null);

  useEffect(() => {
    const { yr:y, mo:m } = getMonthYear(state.selectedKey);
    setYr(y); setMo(m);
  }, [state.selectedKey]);

  useEffect(() => {
    if (!open) return;
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown",  fn);
    document.addEventListener("touchstart", fn);
    return () => {
      document.removeEventListener("mousedown",  fn);
      document.removeEventListener("touchstart", fn);
    };
  }, [open]);

  // Al navegar a otro mes, se pide su archivo (solo meses pasados o el actual).
  useEffect(() => { onVerMes?.(`${yr}-${String(mo+1).padStart(2,"0")}`); }, [yr, mo]);

  const firstDay  = new Date(yr, mo, 1);
  const totalDays = new Date(yr, mo+1, 0).getDate();
  const offset    = (firstDay.getDay() + 6) % 7;
  const cells     = [...Array(offset).fill(null), ...Array.from({length:totalDays}, (_,i) => i+1)];
  const pm = () => mo===0  ? (setYr(y=>y-1), setMo(11)) : setMo(m=>m-1);
  const nm = () => mo===11 ? (setYr(y=>y+1), setMo(0))  : setMo(m=>m+1);

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-block" }}>
      <PressBtn onClick={() => setOpen(o => !o)}
        style={{ marginTop:5, display:"inline-flex", alignItems:"center", gap:5,
          background: open ? T.accentBg : T.pill, border:`1px solid ${open ? T.accent : T.border}`,
          borderRadius:20, padding:"3px 10px", cursor:"pointer", color: open ? T.accent : T.muted,
          fontSize:10, fontWeight:500 }}>
        <Ic.Calendar/> {fmtDate(state.selectedKey)}
      </PressBtn>

      {open && (
        <div style={{ position:"absolute", top:"calc(100% + 6px)", left:0, zIndex:100,
          background:T.card, border:`1px solid ${T.border}`, borderRadius:16, padding:12, width:226,
          boxShadow:"0 8px 32px rgba(0,0,0,0.4)" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <button onClick={pm} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.sub, cursor:"pointer", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center" }}><Ic.ChevL s={12}/></button>
            <span style={{ fontSize:12, fontWeight:700, color:T.text }}>{MONTHS[mo]} {yr}</span>
            <button onClick={nm} style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, color:T.sub, cursor:"pointer", width:26, height:26, display:"flex", alignItems:"center", justifyContent:"center" }}><Ic.ChevR s={12}/></button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:1, marginBottom:4 }}>
            {["L","M","M","J","V","S","D"].map((d,i) => (
              <div key={i} style={{ textAlign:"center", fontSize:9, color:T.muted, fontWeight:700 }}>{d}</div>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
            {cells.map((d, i) => {
              if (!d) return <div key={`_${i}`}/>;
              const k      = toKey(yr, mo, d);
              // Solo se habilitan días con artículo cuya fecha ya llegó. Los días
              // futuros se revisan en el modo revisión, no en la app del estudiante.
              const hasArt = !!articulos[k] && k <= hoyKey();
              const isSel  = state.selectedKey === k;
              const isTdy  = k === hoyKey();
              const isRead = (state.read || []).includes(k);
              return (
                <button key={k} disabled={!hasArt}
                  onClick={() => { if (!hasArt) return; setState(s=>({...s,selectedKey:k,tab:"today"})); setOpen(false); }}
                  style={{ aspectRatio:"1", borderRadius:7, padding:0, fontSize:11,
                    border: isSel ? `2px solid ${T.accent}` : isTdy ? `1px solid ${T.accent}55` : "1px solid transparent",
                    background: isSel ? T.accentBg : hasArt ? T.pill : "transparent",
                    color: isSel ? T.accent : hasArt ? T.text : T.muted,
                    fontWeight: hasArt ? 700 : 400, cursor: hasArt ? "pointer" : "default",
                    display:"flex", alignItems:"center", justifyContent:"center", position:"relative" }}>
                  {d}
                  {hasArt && !isSel && (
                    <span style={{ position:"absolute", bottom:1, left:"50%", transform:"translateX(-50%)",
                      width:3, height:3, borderRadius:2, background: isRead ? T.accent+"88" : T.accent }}/>
                  )}
                  {isRead && !isSel && (
                    <span style={{ position:"absolute", top:0, right:1, fontSize:5, color:T.accent }}>✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// READ MODE (fullscreen distraction-free)
// ═══════════════════════════════════════════════════
function ReadMode({ art, onClose, T }) {
  return (
    <div style={{ position:"absolute", inset:0, zIndex:200, background:T.bg,
      display:"flex", flexDirection:"column", overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"14px 18px", borderBottom:`1px solid ${T.border}`, flexShrink:0 }}>
        <span style={{ fontSize:13, fontWeight:700, color:T.text, flex:1, overflow:"hidden",
          textOverflow:"ellipsis", whiteSpace:"nowrap", marginRight:12 }}>
          {art.title}
        </span>
        <PressBtn onClick={onClose}
          style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:10, color:T.sub,
            cursor:"pointer", width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <Ic.Shrink s={14}/>
        </PressBtn>
      </div>
      <div style={{ flex:1, overflowY:"auto", padding:"20px 20px 32px", scrollbarWidth:"none" }}>
        <h1 style={{ fontSize:20, fontWeight:700, color:T.text, lineHeight:1.3, margin:"0 0 16px" }}>{art.title}</h1>
        <p style={{ ...TEXTO_LARGO, fontSize:14, color:T.sub, lineHeight:1.75, marginBottom:20 }}>{conIndices(art.description)}</p>
        {[
          { label:"Contexto técnico",  text:art.context },
          { label:"En detalle",        text:art.detail  },
          { label:"Aplicación con IA", text:art.ai      },
          { label:"Historia técnica",  text:art.history },
          { label:"Conceptos clave",   text:art.keyConcepts },
        ].filter(({text}) => text && String(text).trim()).map(({label,text}) => (
          <div key={label} style={{ marginBottom:20 }}>
            <p style={{ fontSize:11, fontWeight:700, color:T.accent, letterSpacing:1,
              marginBottom:6, textTransform:"uppercase" }}>{label}</p>
            <p style={{ ...TEXTO_LARGO, fontSize:14, color:T.sub, lineHeight:1.75, margin:0 }}>{conIndices(text)}</p>
          </div>
        ))}
        <div style={{ marginTop:24, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
          <p style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:8,
            textTransform:"uppercase", letterSpacing:1 }}>Fuentes</p>
          {art.sources.map(s => <p key={s} style={{ fontSize:12, color:T.muted, margin:"0 0 4px" }}>· {s}</p>)}
          <div style={{ marginTop:14 }}><AvisoReferencial T={T}/></div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// ETAPA DE PRUEBA · aviso, comentarios, encuesta y cierre
// Las fechas viven aquí. Para otra etapa, cambiar solo PRUEBA.
// ═══════════════════════════════════════════════════
const PRUEBA = {
  inicio:       "2026-10-05",  // aviso de prueba y comentarios desde este día
  fin:          "2026-10-18",  // último día del aviso
  encuesta:     "2026-10-19",  // encuesta de cierre desde este día
  cierreHasta:  "2026-10-31",  // último día de la encuesta y del mensaje de cierre
};
// Los comentarios siguen abiertos después de la prueba (piloto de noviembre).
const COMENTARIOS_DESDE = PRUEBA.inicio;
const MAX_COMENTARIO = 500;
const MAX_COMENTARIO_ENCUESTA = 300;

// "antes" | "prueba" | "encuesta" | "despues"
function faseDe(hoy) {
  if (hoy < PRUEBA.inicio)      return "antes";
  if (hoy <= PRUEBA.fin)        return "prueba";
  if (hoy <= PRUEBA.cierreHasta) return "encuesta";
  return "despues";
}

const ASPECTOS_ENCUESTA = [
  { key:"diseno",    titulo:"Diseño",            ayuda:"cómo se ve la app" },
  { key:"contenido", titulo:"Contenido",         ayuda:"utilidad de los artículos" },
  { key:"claridad",  titulo:"Claridad",          ayuda:"qué tan fácil de entender" },
  { key:"fluidez",   titulo:"Fluidez",           ayuda:"rapidez, que no se trabe" },
  { key:"facilidad", titulo:"Facilidad de uso",  ayuda:"encontrar lo que buscas" },
  { key:"aviso",     titulo:"Aviso diario",      ayuda:"notificación de cada mañana", noUso:true },
];
const NIVELES_ENCUESTA = [
  { key:"muy-malo",  label:"Muy malo" },
  { key:"malo",      label:"Malo" },
  { key:"bueno",     label:"Bueno" },
  { key:"muy-bueno", label:"Muy bueno" },
];

async function enviarOpinion(ruta, datos) {
  const r = await fetch(ruta, {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ ...datos, simulada: !!FECHA_SIMULADA, fecha: hoyKey() }),
  });
  if (!r.ok) {
    let msg = "No se pudo enviar. Intenta de nuevo.";
    try { const j = await r.json(); if (j?.error && r.status === 400) msg = j.error; } catch {}
    throw new Error(msg);
  }
}

// Franja visible solo al probar con ?simular.
function BannerSimulacion({ T }) {
  if (!FECHA_SIMULADA) return null;
  return (
    <div style={{ background:"#7c3aed", color:"#fff", fontSize:10.5, fontWeight:600,
      textAlign:"center", padding:"4px 8px", flexShrink:0 }}>
      Simulando el {FECHA_SIMULADA} · lo que envíes va a la base de prueba
    </div>
  );
}

function TarjetaPrueba({ T, titulo, children, icono="🧪" }) {
  return (
    <div style={{ borderRadius:20, border:`1px solid ${T.accent}55`, background:T.accentBg,
      padding:"13px 15px", display:"flex", gap:11, alignItems:"flex-start" }}>
      <span style={{ fontSize:20, lineHeight:1 }} aria-hidden>{icono}</span>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:13, fontWeight:700, color:T.text, margin:"0 0 4px" }}>{titulo}</p>
        {children}
      </div>
    </div>
  );
}

// Lo que se muestra arriba del artículo según la fase de la prueba.
function AvisoEtapa({ T, state, onAbrirEncuesta }) {
  const fase = faseDe(hoyKey());
  const p = { fontSize:12, color:T.sub, lineHeight:1.55, margin:"0 0 3px" };
  if (fase === "prueba") return (
    <TarjetaPrueba T={T} titulo="Estás en la etapa de prueba. ¡Gracias por ayudarnos!">
      <p style={p}>Al final de cada artículo puedes dejarnos un comentario.</p>
      <p style={{ ...p, margin:0 }}>El 19 de octubre te pediremos una breve encuesta de 1 minuto sobre tu experiencia.</p>
    </TarjetaPrueba>
  );
  if (fase === "encuesta" && !state.encuestaEnviada) return (
    <TarjetaPrueba T={T} titulo="Terminó la etapa de prueba" icono="📝">
      <p style={{ ...p, marginBottom:10 }}>¿Nos cuentas cómo te fue? Es una encuesta anónima de 1 minuto.</p>
      <PressBtn onClick={onAbrirEncuesta}
        style={{ background:T.accent, color:"#fff", border:"none", borderRadius:12, padding:"9px 14px",
          fontFamily:FONT, fontSize:12.5, fontWeight:700, cursor:"pointer" }}>
        Responder la encuesta
      </PressBtn>
    </TarjetaPrueba>
  );
  if (fase === "encuesta") return (
    <TarjetaPrueba T={T} titulo="Terminó el período de prueba. ¡Gracias por participar!" icono="🙌">
      <p style={{ ...p, margin:0 }}>Estamos haciendo ajustes con sus comentarios. Muy pronto IngenieDía estará disponible para todos.</p>
    </TarjetaPrueba>
  );
  return null;
}

// Al final del artículo del día. Anónimo, uno por día (lo controla el teléfono).
function Comentarios({ T, art, fecha, state, setState }) {
  const hoy = hoyKey();
  const [texto, setTexto]     = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError]     = useState("");
  if (fecha !== hoy || hoy < COMENTARIOS_DESDE) return null;
  const yaEnvio = state.comentarioDia === hoy;

  async function enviar() {
    const t = texto.trim();
    if (!t || enviando) return;
    setEnviando(true); setError("");
    try {
      await enviarOpinion("/api/comentarios", { texto:t, articulo:fecha, titulo:art.title });
      setState(s => ({ ...s, comentarioDia: hoy }));
      setTexto("");
    } catch (e) { setError(e.message); }
    setEnviando(false);
  }

  return (
    <Card T={T} title="Comentarios" icon={<Ic.Mail/>}>
      {yaEnvio ? (
        <p style={{ fontSize:12.5, color:T.sub, lineHeight:1.6, margin:0 }}>
          <strong style={{ color:T.text }}>¡Gracias! Recibimos tu comentario.</strong> Mañana puedes enviar otro.
        </p>
      ) : (
        <>
          <label htmlFor="comentario-dia" style={{ display:"block", fontSize:12, color:T.sub, lineHeight:1.55, marginBottom:8 }}>
            ¿Algún comentario sobre el artículo, o un tema sobre el que te gustaría leer?
          </label>
          <textarea id="comentario-dia" value={texto} maxLength={MAX_COMENTARIO} rows={4}
            onChange={e => setTexto(e.target.value)}
            style={{ width:"100%", boxSizing:"border-box", resize:"vertical", minHeight:84,
              background:T.inputBg, color:T.text, border:`1px solid ${T.border}`, borderRadius:12,
              padding:"10px 12px", fontFamily:FONT, fontSize:13, lineHeight:1.5, outline:"none" }}/>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", margin:"6px 0 10px" }}>
            <span style={{ fontSize:10.5, color:T.muted }}>Es anónimo: no guardamos tu nombre ni tu correo.</span>
            <span style={{ fontSize:10.5, color:T.muted, flexShrink:0, marginLeft:8 }}>{texto.length}/{MAX_COMENTARIO}</span>
          </div>
          {error && <p role="alert" style={{ fontSize:11.5, color:T.danger, margin:"0 0 8px" }}>{error}</p>}
          <PressBtn onClick={enviar} disabled={!texto.trim() || enviando}
            style={{ width:"100%", background: texto.trim() ? T.accent : T.pill,
              color: texto.trim() ? "#fff" : T.muted, border:"none", borderRadius:12, padding:"10px 14px",
              fontFamily:FONT, fontSize:13, fontWeight:700, cursor: texto.trim() ? "pointer" : "default" }}>
            {enviando ? "Enviando…" : "Enviar"}
          </PressBtn>
        </>
      )}
    </Card>
  );
}

// Encuesta de cierre: una sola pantalla, menos de 1 minuto. Se cierra con la X.
function EncuestaCierre({ T, onCerrar, onEnviada }) {
  const [resp, setResp]         = useState({});
  const [comentario, setComentario] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError]       = useState("");
  const completa = ASPECTOS_ENCUESTA.every(a => resp[a.key]);

  async function enviar() {
    if (!completa || enviando) return;
    setEnviando(true); setError("");
    try {
      await enviarOpinion("/api/encuesta", { respuestas:resp, comentario:comentario.trim() });
      onEnviada();
    } catch (e) { setError(e.message); setEnviando(false); }
  }

  const opcion = (aspecto, key, label) => {
    const sel = resp[aspecto] === key;
    return (
      <button key={key} onClick={() => setResp(r => ({ ...r, [aspecto]:key }))}
        aria-pressed={sel}
        style={{ flex:"1 1 0", minWidth:0, padding:"7px 2px", borderRadius:10, cursor:"pointer",
          fontFamily:FONT, fontSize:10.5, fontWeight: sel ? 700 : 500, lineHeight:1.2,
          border:`1px solid ${sel ? T.accent : T.border}`, background: sel ? T.accentBg : T.card,
          color: sel ? T.accent : T.sub }}>
        {label}
      </button>
    );
  };

  return (
    <div role="dialog" aria-modal="true" aria-label="Encuesta de cierre"
      style={{ position:"absolute", inset:0, zIndex:60, background:"rgba(2,6,23,0.55)",
        display:"flex", alignItems:"flex-end" }}>
      <div style={{ width:"100%", maxHeight:"92%", overflowY:"auto", background:T.bg,
        borderRadius:"22px 22px 0 0", padding:"16px 16px 20px", boxSizing:"border-box", fontFamily:FONT }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:10, marginBottom:4 }}>
          <p style={{ fontSize:16, fontWeight:700, color:T.text, margin:0 }}>¿Cómo te fue con IngenieDía?</p>
          <button onClick={onCerrar} aria-label="Cerrar"
            style={{ background:T.pill, border:`1px solid ${T.border}`, borderRadius:10, width:30, height:30,
              color:T.sub, cursor:"pointer", fontSize:16, lineHeight:1, flexShrink:0 }}>✕</button>
        </div>
        <p style={{ fontSize:11.5, color:T.muted, margin:"0 0 14px" }}>Anónima · menos de 1 minuto</p>

        {ASPECTOS_ENCUESTA.map(a => (
          <div key={a.key} style={{ marginBottom:12 }}>
            <p style={{ fontSize:12.5, color:T.text, fontWeight:600, margin:"0 0 6px" }}>
              {a.titulo} <span style={{ fontWeight:400, color:T.muted }}>· {a.ayuda}</span>
            </p>
            <div style={{ display:"flex", gap:5 }}>
              {NIVELES_ENCUESTA.map(n => opcion(a.key, n.key, n.label))}
              {a.noUso && opcion(a.key, "no-lo-use", "No lo usé")}
            </div>
          </div>
        ))}

        <label htmlFor="encuesta-comentario" style={{ display:"block", fontSize:12.5, color:T.text, fontWeight:600, margin:"4px 0 6px" }}>
          ¿Algo más que quieras contarnos? <span style={{ fontWeight:400, color:T.muted }}>(opcional)</span>
        </label>
        <textarea id="encuesta-comentario" value={comentario} maxLength={MAX_COMENTARIO_ENCUESTA} rows={3}
          onChange={e => setComentario(e.target.value)}
          style={{ width:"100%", boxSizing:"border-box", resize:"vertical", background:T.inputBg, color:T.text,
            border:`1px solid ${T.border}`, borderRadius:12, padding:"9px 11px", fontFamily:FONT, fontSize:13, outline:"none" }}/>
        <p style={{ fontSize:10.5, color:T.muted, textAlign:"right", margin:"4px 0 10px" }}>
          {comentario.length}/{MAX_COMENTARIO_ENCUESTA}
        </p>

        {error && <p role="alert" style={{ fontSize:11.5, color:T.danger, margin:"0 0 8px" }}>{error}</p>}
        <PressBtn onClick={enviar} disabled={!completa || enviando}
          style={{ width:"100%", background: completa ? T.accent : T.pill, color: completa ? "#fff" : T.muted,
            border:"none", borderRadius:12, padding:"11px 14px", fontFamily:FONT, fontSize:13.5, fontWeight:700,
            cursor: completa ? "pointer" : "default" }}>
          {enviando ? "Enviando…" : completa ? "Enviar respuestas" : "Responde los 6 aspectos para enviar"}
        </PressBtn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TODAY VIEW
// ═══════════════════════════════════════════════════
function TodayView({ state, setState, T, showToast, scrollRef, articulos }) {
  const key      = state.selectedKey;
  const art      = articulos[key];
  const saved    = state.saved.includes(key);
  const liked    = state.liked.includes(key);
  const disliked = state.disliked.includes(key);
  const isRead   = (state.read || []).includes(key);
  const [visible,  setVisible]  = useState(false);
  const [readMode, setReadMode] = useState(false);

  // Fade-in on article change
  useEffect(() => {
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, [key]);

  // Mark as read at 80% scroll depth + update streak for today
  useEffect(() => {
    if (isRead || !scrollRef?.current) return;
    const el = scrollRef.current;
    const check = () => {
      if ((el.scrollTop + el.clientHeight) / el.scrollHeight >= 0.8) {
        setState(s => {
          const withRead = { ...s, read: [...new Set([...(s.read||[]), key])] };
          return key === hoyKey() ? computeStreak(withRead) : withRead;
        });
        showToast("Artículo completado ✓");
        el.removeEventListener("scroll", check);
      }
    };
    el.addEventListener("scroll", check, { passive:true });
    return () => el.removeEventListener("scroll", check);
  }, [key, isRead]);

  async function handleShare() {
    const text = sinMarcas(`${art.title}\n\n${art.description}\n\n${art.keyConcepts}`);
    try {
      if (navigator?.share)          { await navigator.share({ title:art.title, text }); showToast("¡Compartido!"); }
      else if (navigator?.clipboard) { await navigator.clipboard.writeText(text); showToast("Copiado al portapapeles"); }
      else                           { showToast("Compartir no disponible"); }
    } catch {}
  }

  if (!art) return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:40, gap:12 }}>
      <span style={{ fontSize:48 }}>📅</span>
      <p style={{ color:T.muted, fontSize:13, textAlign:"center" }}>Sin artículo para esta fecha.</p>
    </div>
  );

  const HeroIllu  = HERO_MAP[art.shortCategory] ?? null;
  const CatIcComp = CatIcon[art.shortCategory] ?? null;

  return (
    <>
      {readMode && <ReadMode art={art} onClose={() => setReadMode(false)} T={T}/>}
      <div style={{ display:"flex", flexDirection:"column", gap:12,
        opacity: visible ? 1 : 0, transition:"opacity .3s ease" }}>

        {/* Hero card */}
        <div style={{ borderRadius:20, overflow:"hidden", border:`1px solid ${T.border}`, background:T.card }}>
          <div style={{ height:180, position:"relative", overflow:"hidden", background:"#0a0f1e" }}>
            {HeroIllu
              ? <HeroIllu color={colorDe(art.shortCategory)}/>
              : <span style={{ position:"absolute", top:"50%", left:"50%",
                  transform:"translate(-50%,-50%)", fontSize:64, opacity:.4 }}>?</span>
            }
            {/* Read-mode expand button */}
            <button onClick={() => setReadMode(true)}
              style={{ position:"absolute", top:10, right:10,
                background:"rgba(0,0,0,0.45)", border:"1px solid rgba(255,255,255,0.15)",
                borderRadius:8, color:"rgba(255,255,255,0.8)", cursor:"pointer",
                width:30, height:30, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Ic.Expand s={13}/>
            </button>
            {/* "Leído" badge */}
            {isRead && (
              <span style={{ position:"absolute", top:10, left:10,
                background:"rgba(34,211,238,0.15)", border:"1px solid rgba(34,211,238,0.3)",
                borderRadius:8, padding:"2px 8px", fontSize:9, fontWeight:700, color:T.accent }}>
                ✓ Leído
              </span>
            )}
          </div>

          <div style={{ padding:"12px 16px" }}>
            {/* Título bajo la imagen, para que no la tape */}
            <p style={{ fontSize:10, color:T.accent, fontWeight:700, letterSpacing:1, margin:"0 0 3px" }}>
              HOY EN INGENIEDÍA
            </p>
            <h2 style={{ fontSize:17, fontWeight:700, color:T.text, lineHeight:1.3, margin:"0 0 10px" }}>
              {art.title}
            </h2>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
              <span style={{ fontSize:11, color:T.muted, display:"flex", alignItems:"center", gap:4 }}>
                <Ic.Clock/> {art.readingMin} min de lectura
              </span>
              <span style={{ fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:5,
                background:T.accentBg, border:`1px solid ${T.border}`, borderRadius:20, padding:"3px 10px", color:T.accent }}>
                {CatIcComp && <CatIcComp c={T.accent} s={14}/>}
                {art.shortCategory}
              </span>
            </div>
            <p style={{ ...TEXTO_LARGO, fontSize:12, color:T.sub, lineHeight:1.7, marginBottom:12 }}>{conIndices(art.description)}</p>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ display:"flex", gap:7 }}>
                <IBtn active={liked}    label="Me gusta"    T={T} onClick={() => setState(s => applyReaction(s,key,"like"))}><Ic.ThumbUp/></IBtn>
                <IBtn active={disliked} label="No me gusta" T={T} onClick={() => setState(s => applyReaction(s,key,"dislike"))}><Ic.ThumbDn/></IBtn>
              </div>
              <div style={{ display:"flex", gap:7 }}>
                <IBtn active={saved} label="Guardar" T={T}
                  onClick={() => { setState(s=>({...s,saved:toggleArr(s.saved,key)})); showToast(saved?"Eliminado del archivo":"Guardado ✓"); }}>
                  <Ic.Bookmark filled={saved}/>
                </IBtn>
                <IBtn active={false} label="Compartir" T={T} onClick={handleShare}><Ic.Share/></IBtn>
              </div>
            </div>
          </div>
        </div>

        {/* Content sections */}
        <div style={{ borderRadius:20, border:`1px solid ${T.border}`, background:T.card, padding:"16px 16px 4px" }}>
          {art.context     && <SectionBlock icon={<Ic.Info/>}   title="Contexto técnico"  T={T}>{art.context}</SectionBlock>}
          {art.detail      && <SectionBlock icon={<Ic.Layers/>} title="En detalle"        T={T}>{art.detail}</SectionBlock>}
          {art.ai          && <SectionBlock icon={<Ic.Cpu/>}    title="Aplicación con IA" T={T}>{art.ai}</SectionBlock>}
          {art.history     && <SectionBlock icon={<Ic.ClockH/>} title="Historia técnica"  T={T}>{art.history}</SectionBlock>}
          {art.keyConcepts && <SectionBlock icon={<Ic.Star/>}   title="Conceptos clave"   T={T}>{art.keyConcepts}</SectionBlock>}
          <div style={{ background:T.pill, border:`1px solid ${T.border}`, borderRadius:14, padding:"11px 13px", marginBottom:12 }}>
            <p style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>Fuentes</p>
            {art.sources.map(src => (
              <div key={src} style={{ display:"flex", gap:8, marginBottom:5, alignItems:"flex-start" }}>
                <span style={{ width:5, height:5, borderRadius:3, background:T.accent, marginTop:5, flexShrink:0 }}/>
                <span style={{ fontSize:11, color:T.muted }}>{src}</span>
              </div>
            ))}
          </div>
          <AvisoReferencial T={T}/>
        </div>

        <Comentarios T={T} art={art} fecha={key} state={state} setState={setState}/>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════
// ARCHIVE VIEW
// ═══════════════════════════════════════════════════
function ArchiveView({ state, setState, T, articulos }) {
  const [query, setQuery] = useState("");

  const savedArts = useMemo(
    () => state.saved.map(k => ({ k, art:articulos[k] })).filter(x => x.art),
    [state.saved, articulos]
  );
  const byCat = useMemo(
    () => CATEGORIES.map(cat => ({ ...cat, items: savedArts.filter(({art}) => art.shortCategory===cat.key) })),
    [savedArts]
  );
  const totalSaved = useMemo(() => byCat.reduce((n,c) => n+c.items.length, 0), [byCat]);
  const maxV       = useMemo(() => Math.max(1, ...byCat.map(c => c.items.length)), [byCat]);

  const searchResults = useMemo(() =>
    query ? savedArts.filter(({art}) =>
      art.title.toLowerCase().includes(query.toLowerCase()) ||
      art.shortCategory.toLowerCase().includes(query.toLowerCase())
    ) : [],
    [query, savedArts]
  );

  const SZ=180, CX=90;
  const radarPoly = byCat.map((c,i) => {
    const a = -Math.PI/2 + (i*2*Math.PI)/byCat.length;
    const r = c.items.length===0 ? 0 : 18+(c.items.length/maxV)*62;
    return `${CX+Math.cos(a)*r},${CX+Math.sin(a)*r}`;
  }).join(" ");

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Card T={T}>
        <h2 style={{ fontSize:18, fontWeight:700, color:T.text, margin:"0 0 4px" }}>Archivo</h2>
        <p style={{ fontSize:12, color:T.muted, margin:0 }}>
          {totalSaved===0 ? "Aún no has guardado ningún artículo."
            : `${totalSaved} artículo${totalSaved!==1?"s":""} guardado${totalSaved!==1?"s":""}.`}
        </p>
      </Card>

      {/* Search bar */}
      {totalSaved > 0 && (
        <div style={{ position:"relative" }}>
          <span style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:T.muted, display:"flex" }}>
            <Ic.Search s={14}/>
          </span>
          <input value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por título o categoría…"
            style={{ width:"100%", background:T.card, border:`1px solid ${T.border}`, borderRadius:14,
              padding:"9px 12px 9px 34px", color:T.text, fontSize:12, outline:"none", boxSizing:"border-box" }}/>
        </div>
      )}

      {/* Search results */}
      {query && (
        <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
          {searchResults.length === 0
            ? <p style={{ fontSize:12, color:T.muted, textAlign:"center", padding:"12px 0" }}>Sin resultados para "{query}"</p>
            : searchResults.map(({k, art}) => {
                const CI = CatIcon[art.shortCategory];
                return (
                  <PressBtn key={k} onClick={() => setState(s=>({...s,selectedKey:k,tab:"today"}))}
                    style={{ width:"100%", borderRadius:16, border:`1px solid ${T.border}`, background:T.card,
                      padding:"11px 13px", cursor:"pointer", textAlign:"left",
                      display:"flex", alignItems:"center", gap:11 }}>
                    <span style={{ width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center",
                      borderRadius:10, background:T.accentBg, border:`1px solid ${T.border}`, flexShrink:0 }}>
                      {CI && <CI c={T.accent} s={18}/>}
                    </span>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontSize:12, fontWeight:700, color:T.text, margin:0,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{art.title}</p>
                      <p style={{ fontSize:10, color:T.muted, margin:"2px 0 0" }}>
                        {art.shortCategory} · {fmtDate(k)}
                      </p>
                    </div>
                  </PressBtn>
                );
              })
          }
        </div>
      )}

      {/* Category rows */}
      {!query && (
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {byCat.map(cat => {
            const CI = CatIcon[cat.key];
            return (
              <div key={cat.key} style={{ borderRadius:18, border:`1px solid ${T.border}`, background:T.card, padding:"11px 13px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <span style={{ width:38, height:38, display:"flex", alignItems:"center", justifyContent:"center",
                      borderRadius:11, background:T.accentBg, border:`1px solid ${T.border}`, flexShrink:0 }}>
                      {CI && <CI c={T.accent} s={20}/>}
                    </span>
                    <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{cat.key}</span>
                  </div>
                  <span style={{ fontSize:10, border:`1px solid ${T.border}`, borderRadius:12, padding:"2px 9px", color:T.muted }}>
                    {cat.items.length} guardado{cat.items.length!==1?"s":""}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Radar — only when data exists */}
      {!query && totalSaved > 0 && (
        <Card T={T}>
          <p style={{ fontSize:13, fontWeight:700, color:T.text, marginBottom:3 }}>Mapa de temas guardados</p>
          <p style={{ fontSize:11, color:T.muted, marginBottom:12 }}>Cada punta refleja la cantidad guardada por categoría.</p>
          <svg viewBox={`0 0 ${SZ} ${SZ}`} style={{ width:"100%", maxWidth:SZ, display:"block", margin:"0 auto" }}>
            <polygon points={radarPoly} fill={`${T.accent}20`} stroke={T.accent} strokeWidth="1.5"/>
            {byCat.map((c,i) => {
              const a  = -Math.PI/2 + (i*2*Math.PI)/byCat.length;
              const lr = 82;
              const lx = CX + Math.cos(a)*lr;
              const ly = CX + Math.sin(a)*lr;
              const pr = c.items.length===0 ? 0 : 18+(c.items.length/maxV)*62;
              return (
                <g key={c.key}>
                  <line x1={CX} y1={CX} x2={lx} y2={ly} stroke={T.border} strokeWidth="1"/>
                  {c.items.length>0 && <circle cx={CX+Math.cos(a)*pr} cy={CX+Math.sin(a)*pr} r="4" fill={T.accent}/>}
                  <text x={lx} y={ly-4} textAnchor="middle" fontSize="9" fontWeight="600" fill={T.sub}>
                    {c.key.slice(0,4).toUpperCase()}
                  </text>
                  <text x={lx} y={ly+8} textAnchor="middle" fontSize="8" fill={T.muted}>{c.items.length}</text>
                </g>
              );
            })}
          </svg>
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PROFILE VIEW
// ═══════════════════════════════════════════════════
function EditField({ value, onChange, T }) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const [saved,   setSaved]   = useState(false);

  function commit() {
    if (!draft.trim()) return;
    onChange(draft.trim());
    setEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (editing) return (
    <div style={{ display:"flex", gap:6 }}>
      <input autoFocus value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => e.key==="Enter" && commit()}
        style={{ flex:1, background:T.inputBg, border:`1px solid ${T.accent}`,
          borderRadius:8, padding:"5px 10px", color:T.text, fontSize:12, outline:"none" }}/>
      <button onClick={commit}
        style={{ background:T.accent, border:"none", borderRadius:8, padding:"5px 10px", color:"#0f172a", fontWeight:700, fontSize:11, cursor:"pointer" }}>✓</button>
      <button onClick={() => setEditing(false)}
        style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8, padding:"5px 10px",
          color:T.muted, fontSize:11, cursor:"pointer" }}>✕</button>
    </div>
  );

  return (
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
      <div style={{ display:"flex", alignItems:"center", gap:7 }}>
        <span style={{ fontSize:13, fontWeight:600, color:T.text }}>{value}</span>
        {saved && <span style={{ fontSize:10, color:T.accent, display:"flex", alignItems:"center", gap:3 }}>
          <Ic.Check s={11}/> Guardado
        </span>}
      </div>
      <button onClick={() => { setDraft(value); setEditing(true); }}
        style={{ background:"none", border:`1px solid ${T.border}`, borderRadius:8,
          padding:"3px 9px", color:T.muted, fontSize:11, cursor:"pointer" }}>Editar</button>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// AVISO DIARIO (notificaciones push)
// El estado real se lee del teléfono (permiso y suscripción), no se guarda
// aparte: así el interruptor nunca muestra algo distinto de lo que pasa.
// ═══════════════════════════════════════════════════
function claveABytes(b64) {
  const pad = "=".repeat((4 - b64.length % 4) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, c => c.charCodeAt(0));
}

async function registroSW() {
  if (!("serviceWorker" in navigator)) return null;
  return (await navigator.serviceWorker.getRegistration()) || null;
}

function AvisoDiario({ T, showToast }) {
  // "cargando" | "no-soporta" | "bloqueado" | "activo" | "inactivo"
  const [estado, setEstado] = useState("cargando");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    (async () => {
      const soporta = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      const reg = soporta ? await registroSW() : null;
      if (!reg) return setEstado("no-soporta");
      if (Notification.permission === "denied") return setEstado("bloqueado");
      const sub = await reg.pushManager.getSubscription();
      setEstado(sub ? "activo" : "inactivo");
    })().catch(() => setEstado("no-soporta"));
  }, []);

  // Cada paso tiene su propio mensaje de error, para saber qué revisar.
  async function activar() {
    setOcupado(true); setError("");
    let paso = "permiso";
    try {
      const permiso = await Notification.requestPermission();
      if (permiso !== "granted") { setEstado(permiso === "denied" ? "bloqueado" : "inactivo"); return; }

      paso = "clave";
      const reg = await registroSW();
      const rc = await fetch("/api/clave");
      const { clave, error:errClave } = await rc.json().catch(() => ({}));
      if (!clave) throw new Error(errClave || `el servidor respondió ${rc.status}`);

      paso = "suscripcion";
      const sub = await reg.pushManager.subscribe({ userVisibleOnly:true, applicationServerKey: claveABytes(clave) });

      paso = "guardar";
      const r = await fetch("/api/suscripciones", { method:"POST",
        headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ suscripcion: sub.toJSON() }) });
      if (!r.ok) {
        const { error:errSrv } = await r.json().catch(() => ({}));
        await sub.unsubscribe();
        throw new Error(errSrv || `el servidor respondió ${r.status}`);
      }
      setEstado("activo"); showToast("Aviso diario activado");
    } catch (e) {
      const detalle = e && e.message ? ` (${e.message})` : "";
      const sinRed = !navigator.onLine;
      setError(sinRed ? "No hay conexión a internet. Conéctate y vuelve a intentarlo." : {
        permiso:     "El teléfono no pudo pedir el permiso de notificaciones." + detalle,
        clave:       "No se pudo obtener la clave de avisos del servidor. Revisa en Vercel la variable VAPID_PUBLIC_KEY." + detalle,
        suscripcion: "El teléfono rechazó la suscripción. Suele deberse a una clave VAPID_PUBLIC_KEY incompleta o cambiada en Vercel." + detalle,
        guardar:     "El teléfono se suscribió, pero el servidor no pudo guardarlo. Revisa en Vercel la conexión con la base de datos." + detalle,
      }[paso]);
      showToast("No se pudo activar el aviso");
    } finally { setOcupado(false); }
  }

  async function desactivar() {
    setOcupado(true);
    try {
      const reg = await registroSW();
      const sub = reg && await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/suscripciones", { method:"DELETE",
          headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => {});
        await sub.unsubscribe();
      }
      setEstado("inactivo"); showToast("Aviso diario desactivado");
    } finally { setOcupado(false); }
  }

  const mensaje = {
    "cargando":   "Revisando el estado del aviso…",
    "no-soporta": "Para recibir el aviso diario, instala la app en tu teléfono Android desde Chrome (menú ⋮ → Instalar app).",
    "bloqueado":  "Las notificaciones están bloqueadas para IngenieDía. Actívalas en los ajustes del teléfono (Ajustes → Apps → IngenieDía → Notificaciones) y vuelve aquí.",
    "activo":     "Recibirás un aviso cada mañana, alrededor de las 8:00, los días que haya artículo nuevo.",
    "inactivo":   "Activa el aviso para que te llegue el artículo del día cada mañana, alrededor de las 8:00.",
  }[estado];

  return (
    <Card T={T} title="Notificaciones" icon={<Ic.Bell/>}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        background:T.pill, border:`1px solid ${T.border}`, borderRadius:12, padding:"11px 13px", marginBottom:8,
        opacity: (estado === "activo" || estado === "inactivo") ? 1 : 0.55 }}>
        <span style={{ fontSize:12, color:T.sub }}>Aviso diario</span>
        <Toggle on={estado === "activo"} T={T}
          onChange={v => {
            if (ocupado || !(estado === "activo" || estado === "inactivo")) return;
            v ? activar() : desactivar();
          }}/>
      </div>
      <div style={{ background:`${T.accent}08`, border:`1px solid ${T.accent}25`, borderRadius:12, padding:"9px 13px" }}>
        <p style={{ ...JUSTIFICADO, fontSize:11, color:T.muted, margin:0, lineHeight:1.5 }}>
          {ocupado ? "Un momento…" : mensaje}
        </p>
        {error && !ocupado && (
          <p style={{ ...JUSTIFICADO, fontSize:11, color:T.danger, margin:"8px 0 0", lineHeight:1.5 }}>
            {error} Si el problema sigue, escribe a {CORREO_CONTACTO}.
          </p>
        )}
      </div>
    </Card>
  );
}

function ProfileView({ state, setState, T, showToast, articulos }) {
  const favCat = useMemo(() => {
    const counts = {};
    state.saved.forEach(k => { const a = articulos[k]; if(a) counts[a.shortCategory]=(counts[a.shortCategory]||0)+1; });
    return Object.entries(counts).sort(([,a],[,b]) => b-a)[0]?.[0] ?? null;
  }, [state.saved]);

  const stats = [
    { label:"Racha",    value: state.streakCount || 0, unit:"días", icon:"🔥" },
    { label:"Leídos",   value: (state.read||[]).length, unit:"",    icon:"📖" },
    { label:"Guardados",value: state.saved.length,      unit:"",    icon:"🔖" },
  ];

  function handleReset() {
    setState(s => ({ ...s, liked:[], disliked:[], saved:[], read:[], streakCount:0, lastReadDate:"" }));
    showToast("Progreso restablecido");
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      <Card T={T}>
        <h2 style={{ fontSize:18, fontWeight:700, color:T.text, margin:"0 0 4px" }}>Perfil</h2>
        <p style={{ fontSize:12, color:T.muted, margin:0 }}>Preferencias de la aplicación.</p>
      </Card>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
        {stats.map(({ label, value, unit, icon }) => (
          <div key={label} style={{ borderRadius:16, border:`1px solid ${T.border}`, background:T.card, padding:"12px 8px", textAlign:"center" }}>
            <div style={{ fontSize:18, marginBottom:2 }}>{icon}</div>
            <div style={{ fontSize:20, fontWeight:700, color:T.accent, lineHeight:1 }}>
              {value}{unit && <span style={{ fontSize:9, marginLeft:2 }}>{unit}</span>}
            </div>
            <div style={{ fontSize:10, color:T.muted, marginTop:3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Favourite category */}
      {favCat && (() => {
        const CI = CatIcon[favCat];
        return (
          <div style={{ borderRadius:14, border:`1px solid ${T.border}`, background:T.card,
            padding:"10px 14px", display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:11, color:T.muted }}>Categoría favorita</span>
            <span style={{ fontSize:12, fontWeight:700, color:T.accent, marginLeft:"auto",
              display:"flex", alignItems:"center", gap:5 }}>
              {CI && <CI c={T.accent} s={13}/>} {favCat}
            </span>
          </div>
        );
      })()}

      {/* Reporte del piloto */}
      <Card T={T} title="Reporte del piloto" icon={<Ic.Star/>}>
        <p style={{ ...JUSTIFICADO, fontSize:11, color:T.muted, lineHeight:1.6, marginBottom:10 }}>
          Copia este código y entrégalo al cierre de cada semana. Resume tu uso
          y no contiene datos personales.
        </p>
        <div style={{ background:T.pill, border:`1px solid ${T.border}`, borderRadius:12,
          padding:"11px 13px", marginBottom:9 }}>
          <code style={{ fontFamily:"'IBM Plex Mono', ui-monospace, monospace",
            fontSize:11, color:T.accent, wordBreak:"break-all", lineHeight:1.6 }}>
            {codigoResumen(state, articulos)}
          </code>
        </div>
        <PressBtn
          onClick={async () => {
            const c = codigoResumen(state, articulos);
            try {
              if (navigator?.clipboard) { await navigator.clipboard.writeText(c); showToast("Código copiado ✓"); }
              else                      { showToast("Copia el código a mano"); }
            } catch { showToast("Copia el código a mano"); }
          }}
          style={{ width:"100%", padding:"10px", borderRadius:11, cursor:"pointer",
            background:T.accentBg, border:`1px solid ${T.accent}55`, color:T.accent,
            fontFamily:FONT, fontSize:12, fontWeight:600 }}>
          Copiar código
        </PressBtn>
      </Card>

      {/* Notifications */}
      <AvisoDiario T={T} showToast={showToast}/>

      {/* Font */}
      <Card T={T} title="Tamaño de texto">
        <div style={{ background:T.pill, border:`1px solid ${T.border}`, borderRadius:12, padding:"11px 13px" }}>
          <p style={{ ...JUSTIFICADO, fontSize:11, color:T.muted, margin:"0 0 8px", lineHeight:1.5 }}>
            Ajusta el tamaño del texto de toda la app. El cambio se ve al instante.
          </p>
          <input type="range" min="0.85" max="1.3" step="0.05" value={state.fontScale || 1}
            onChange={e => setState(s=>({...s,fontScale:parseFloat(e.target.value)}))}
            style={{ width:"100%", accentColor:T.accent }}/>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:10, color:T.muted, marginTop:4 }}>
            <span>Compacto</span><span>Normal</span><span>Grande</span>
          </div>
        </div>
      </Card>

      {/* Theme */}
      <Card T={T} title="Tema">
        <div style={{ background:T.pill, border:`1px solid ${T.border}`, borderRadius:12, padding:5, display:"flex", gap:5 }}>
          {[{val:"dark",label:"Oscuro",Ico:Ic.Moon},{val:"light",label:"Claro",Ico:Ic.Sun}].map(({val,label,Ico}) => (
            <PressBtn key={val} onClick={() => setState(s=>({...s,theme:val}))}
              style={{ flex:1, borderRadius:9, padding:"8px 0", border:"none",
                background: state.theme===val ? T.accent : "transparent",
                color:      state.theme===val ? "#0f172a" : T.muted,
                fontWeight: state.theme===val ? 700 : 400,
                fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", gap:6, cursor:"pointer" }}>
              <Ico/> {label}
            </PressBtn>
          ))}
        </div>
      </Card>

      {/* Reset */}
      <Card T={T} title="Datos">
        <div style={{ background:T.pill, border:`1px solid ${T.border}`, borderRadius:12, padding:"11px 13px" }}>
          <p style={{ fontSize:12, color:T.sub, margin:"0 0 10px" }}>
            Borra likes, guardados, leídos y racha. No se puede deshacer.
          </p>
          <PressBtn onClick={handleReset}
            style={{ width:"100%", padding:"9px 0", borderRadius:10, background:"transparent",
              border:`1px solid ${T.danger}`, color:T.danger, fontWeight:600, fontSize:12,
              display:"flex", alignItems:"center", justifyContent:"center", gap:6, cursor:"pointer" }}>
            <Ic.Reset s={14}/> Restablecer progreso
          </PressBtn>
        </div>
      </Card>

      <p style={{ textAlign:"center", fontSize:11, color:T.muted, margin:"18px 0 6px" }}>
        <a href="/privacidad" target="_blank" rel="noopener"
          style={{ color:T.muted, textDecoration:"underline" }}>Política de privacidad</a>
        {"  ·  "}
        <a href="/terminos" target="_blank" rel="noopener"
          style={{ color:T.muted, textDecoration:"underline" }}>Términos de uso</a>
        {"  ·  "}v{APP_VERSION}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// NAV TABS (static constant)
// ═══════════════════════════════════════════════════
const NAV_TABS = [
  { key:"today",   label:"Hoy",    AIcon:()=><Ic.ZapFill s={20}/>,               IIcon:()=><Ic.ZapFill s={17}/> },
  { key:"archive", label:"Archivo",AIcon:()=><Ic.Bookmark filled={false} s={20}/>,IIcon:()=><Ic.Bookmark filled={false} s={17}/> },
  { key:"profile", label:"Perfil", AIcon:()=><Ic.User s={20}/>,                  IIcon:()=><Ic.User s={17}/> },
];

// ═══════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════


// En un teléfono la app ocupa toda la pantalla. El marco de teléfono
// solo tiene sentido como vista previa en un computador.
function useEsMovil() {
  const [esMovil, setEsMovil] = useState(
    typeof window !== "undefined" && window.matchMedia("(max-width: 560px)").matches);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 560px)");
    const cambio = (e) => setEsMovil(e.matches);
    mq.addEventListener ? mq.addEventListener("change", cambio) : mq.addListener(cambio);
    return () => mq.removeEventListener ? mq.removeEventListener("change", cambio) : mq.removeListener(cambio);
  }, []);
  return esMovil;
}

// ═══════════════════════════════════════════════════
// CÓDIGO DE RESUMEN  ·  métricas del piloto
// El estudiante lo copia y lo entrega. Nada se envía solo.
// Formato: ING1-AAMMDD-R#G#L#D#K#-CATn...-XX
// ═══════════════════════════════════════════════════
const ABREV = {
  "Electricidad":"ELE", "Mecánica":"MEC", "Automatización":"AUT",
  "Electrónica":"ETR",  "Informática":"INF", "Energía":"ENE", "IA":"IIA",
};

function codigoResumen(state, articulos) {
  const porCat = {};
  (state.read || []).forEach(k => {
    const a = articulos[k];
    if (a) porCat[a.shortCategory] = (porCat[a.shortCategory] || 0) + 1;
  });
  const cats = ORDEN_CATEGORIAS.filter(c => porCat[c])
                               .map(c => `${ABREV[c]}${porCat[c]}`).join("");
  const cuerpo = [
    hoyKey().replace(/-/g,"").slice(2),
    `R${(state.read||[]).length}`,
    `G${(state.saved||[]).length}`,
    `L${(state.liked||[]).length}`,
    `D${(state.disliked||[]).length}`,
    `K${state.streakCount || 0}`,
    cats || "SIN",
  ].join("-");
  // Dígito verificador: detecta errores al transcribir a mano.
  let suma = 0;
  for (const ch of cuerpo) suma = (suma * 31 + ch.charCodeAt(0)) % 1296;
  return `ING1-${cuerpo}-${suma.toString(36).toUpperCase().padStart(2,"0")}`;
}

// ═══════════════════════════════════════════════════
// MODO REVISIÓN  ·  mesa de verificación docente
// Fuera del alcance del estudiante. Se abre con #revision.
// Ningún artículo llega a publicarse sin pasar por aquí.
// ═══════════════════════════════════════════════════
const MONO = "'IBM Plex Mono', ui-monospace, monospace";
const R = {
  fondo:"#14120f", panel:"#1c1915", linea:"#332e26",
  tinta:"#f2ece1", suave:"#a89e8f", tenue:"#6d6558",
  pendiente:"#d9a441", aprobado:"#5f9e6e", rechazado:"#c2614f", corregir:"#7a8fb8",
};
const VEREDICTOS = [
  { id:"aprobado",  etiqueta:"Aprobar",   color:R.aprobado  },
  { id:"regenerar", etiqueta:"Regenerar", color:R.corregir  },
  { id:"rechazado", etiqueta:"Rechazar",  color:R.rechazado },
];
const colorEstado = (e) => R[e] ?? R.pendiente;

// Campos de texto largo, en el orden en que se leen.
const SECCIONES = [
  ["context",     "Contexto técnico"],
  ["detail",      "En detalle"],
  ["ai",          "Aplicación con IA"],
  ["history",     "Historia técnica"],
  ["keyConcepts", "Conceptos clave"],
];

// Un campo se muestra como texto, o como campo editable si la revisión
// está en modo edición. La tipografía es la misma en ambos casos.
function Campo({ valor, editable, onCambio, estilo, unaLinea }) {
  if (!editable) return <p style={estilo}>{valor}</p>;
  const base = { ...estilo, width:"100%", boxSizing:"border-box",
    background:"rgba(217,164,65,.07)", border:`1px solid ${R.pendiente}55`,
    borderRadius:6, padding:"5px 7px", fontFamily:"inherit", outline:"none" };
  if (unaLinea)
    return <input value={valor} onChange={e => onCambio(e.target.value)} style={base}/>;
  const filas = Math.max(2, Math.ceil(valor.length / 42));
  return <textarea value={valor} rows={filas} onChange={e => onCambio(e.target.value)}
    style={{ ...base, resize:"vertical", lineHeight:estilo.lineHeight ?? 1.7 }}/>;
}

// Vista fiel de lo que verá el estudiante, al ancho real del teléfono.
function VistaArticulo({ art, fecha, editable, onCampo }) {
  const Illu = HERO_MAP[art.shortCategory] ?? null;
  const col  = colorDe(art.shortCategory);
  const parrafo = { ...TEXTO_LARGO, fontSize:12.5, lineHeight:1.75, color:"#cbd5e1", margin:0 };
  const rotulo  = { margin:"0 0 5px", fontSize:10, fontWeight:700, letterSpacing:1,
                    textTransform:"uppercase", color:col };
  return (
    <div style={{ width:390, flexShrink:0, background:"#0f1117", borderRadius:26,
      border:`1px solid ${editable ? R.pendiente+"66" : R.linea}`, overflow:"hidden", fontFamily:FONT }}>
      <div style={{ height:180, position:"relative", background:"#0a0f1e" }}>
        {Illu && <Illu color={col}/>}
        <div style={{ position:"absolute", inset:"auto 0 0 0", padding:"12px 16px",
          background:"linear-gradient(to top, rgba(0,0,0,.92), transparent)" }}>
          <p style={{ margin:0, fontSize:10, fontWeight:700, letterSpacing:1, color:col }}>
            {art.shortCategory.toUpperCase()}
          </p>
          <Campo valor={art.title} editable={editable} unaLinea
            onCambio={v => onCampo("title", v)}
            estilo={{ margin:"3px 0 0", fontSize:17, fontWeight:700, color:"#fff", lineHeight:1.3 }}/>
        </div>
      </div>
      <div style={{ padding:"14px 16px 20px" }}>
        <p style={{ margin:"0 0 8px", fontFamily:MONO, fontSize:10, color:R.tenue }}>
          {fecha} · {art.readingMin} min
        </p>
        <div style={{ marginBottom:16 }}>
          <Campo valor={art.description} editable={editable}
            onCambio={v => onCampo("description", v)} estilo={parrafo}/>
        </div>
        {SECCIONES.filter(([campo]) => editable || art[campo]).map(([campo, titulo]) => (
          <div key={campo} style={{ marginBottom:15 }}>
            <p style={rotulo}>{titulo}
              {!art[campo] && <span style={{ color:R.tenue }}> · vacía</span>}
            </p>
            <Campo valor={art[campo] ?? ""} editable={editable}
              onCambio={v => onCampo(campo, v)} estilo={parrafo}/>
          </div>
        ))}
        <div style={{ borderTop:"1px solid #24304a", paddingTop:12 }}>
          <p style={{ margin:"0 0 6px", fontFamily:MONO, fontSize:10, letterSpacing:1, color:R.tenue }}>
            FUENTES
          </p>
          {editable
            ? <Campo valor={art.sources.join("\n")} editable
                onCambio={v => onCampo("sources", v.split("\n"))}
                estilo={{ fontSize:11, color:"#94a3b8", lineHeight:1.7, margin:0 }}/>
            : art.sources.map((s,n) => (
                <p key={n} style={{ margin:"0 0 4px", fontSize:11, color:"#94a3b8" }}>· {s}</p>
              ))}
          {editable && (
            <p style={{ margin:"5px 0 0", fontFamily:MONO, fontSize:9.5, color:R.tenue }}>
              una fuente por línea
            </p>
          )}
          <p style={{ ...JUSTIFICADO, margin:"12px 0 0", fontSize:10.5, lineHeight:1.55, color:"#64748b" }}>
            {AVISO_REFERENCIAL}
          </p>
        </div>
      </div>
    </div>
  );
}

// Meses publicados que el modo revisión abre solo: el actual y los seis siguientes.
const MESES_PUBLICADOS_A_REVISAR = 7;

function mesesDesdeHoy(n) {
  const [y, m] = hoyKey().split("-").map(Number);
  return Array.from({ length:n }, (_, k) => {
    const d = new Date(y, m - 1 + k, 1);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
  });
}

// Devuelve los artículos de un mes publicado, o null si el archivo no existe.
async function leerMesPublicado(mes) {
  try {
    const r = await fetch(`/contenido/${mes}.json`, { cache:"no-cache" });
    if (!r.ok) return null;
    return normalizarMes(await r.json());
  } catch { return null; }
}

// origen: "cargando" | "publicado" (solo lectura) | "borrador" (se revisa y decide)
//         | "ejemplos" (no hay nada publicado aún)
function RevisionView({ onSalir }) {
  const [borrador, setBorrador]     = useState({ articulos:{}, errores:[] });
  const [origen, setOrigen]         = useState("cargando");
  const sePegoBorrador              = useRef(false);
  const [pegado, setPegado]         = useState("");
  const [abrirPegar, setAbrirPegar] = useState(false);
  const [decisiones, setDecisiones] = useState({});
  const [ediciones, setEdiciones]   = useState({});
  const [editando, setEditando]     = useState(false);
  const [i, setI]                   = useState(0);
  const [nota, setNota]             = useState("");
  const [salida, setSalida]         = useState(null);

  const soloLectura = origen === "publicado";
  const hoy         = hoyKey();

  // Al abrir, se cargan los meses ya publicados, incluidos los días futuros.
  // Si mientras tanto se pegó un borrador, este tiene prioridad.
  useEffect(() => {
    let vigente = true;
    Promise.all(mesesDesdeHoy(MESES_PUBLICADOS_A_REVISAR).map(leerMesPublicado)).then(meses => {
      if (!vigente) return;
      const articulos = {}, errores = [];
      meses.filter(Boolean).forEach(r => { Object.assign(articulos, r.articulos); errores.push(...r.errores); });
      if (sePegoBorrador.current) return;
      const hay = Object.keys(articulos).length > 0;
      const primero = Object.keys(articulos).sort().findIndex(f => f >= hoy);
      setBorrador(hay ? { articulos, errores } : normalizarMes({ articulos: CONTENIDO_DEMO }));
      setI(hay && primero > 0 ? primero : 0);
      setOrigen(hay ? "publicado" : "ejemplos");
    });
    return () => { vigente = false; };
  }, []);

  const fechas   = useMemo(() => Object.keys(borrador.articulos).sort(), [borrador]);
  const fecha    = fechas[i];
  const original = borrador.articulos[fecha];
  const editado  = ediciones[fecha];
  const art      = editado ? { ...original, ...editado } : original;
  const actual   = decisiones[fecha];

  useEffect(() => { setNota(actual?.nota ?? ""); setEditando(false); }, [fecha]);

  const total     = fechas.length;
  const resueltos = fechas.filter(f => decisiones[f]).length;
  const cuenta    = (e) => fechas.filter(f => decisiones[f]?.estado === e).length;

  function cambiarCampo(campo, valor) {
    setEdiciones(prev => ({ ...prev, [fecha]: { ...(prev[fecha] || {}), [campo]: valor } }));
  }
  function descartarEdicion() {
    setEdiciones(prev => { const c = { ...prev }; delete c[fecha]; return c; });
    setEditando(false);
  }
  function decidir(estado) {
    setDecisiones(d => ({ ...d, [fecha]: { estado, nota: nota.trim(), editado: !!ediciones[fecha] } }));
    setEditando(false);
    if (i < total - 1) setI(i + 1);
  }
  function cargarPegado() {
    try {
      const res = normalizarMes(JSON.parse(pegado));
      if (!Object.keys(res.articulos).length) { alert("El archivo no trae artículos válidos."); return; }
      sePegoBorrador.current = true; setBorrador(res); setOrigen("borrador"); setDecisiones({}); setEdiciones({}); setI(0);
      setAbrirPegar(false); setPegado("");
    } catch { alert("No se pudo leer el JSON. Revisa que esté completo."); }
  }
  function exportar() {
    const aprobados = {};
    fechas.forEach(f => {
      if (decisiones[f]?.estado === "aprobado")
        aprobados[f] = { ...borrador.articulos[f], ...(ediciones[f] || {}) };
    });
    const paraRegenerar = {};
    fechas.forEach(f => {
      if (decisiones[f]?.estado === "regenerar")
        paraRegenerar[f] = { categoria: borrador.articulos[f].shortCategory,
                             titulo: borrador.articulos[f].title,
                             instruccion: decisiones[f].nota };
    });
    const doc = {
      version: ESQUEMA_VERSION,
      revisadoEn: new Date().toISOString(),
      resumen: { total, aprobados: cuenta("aprobado"), regenerar: cuenta("regenerar"),
                 rechazados: cuenta("rechazado"), editados: Object.keys(ediciones).length },
      decisiones, regenerar: paraRegenerar, articulos: aprobados,
    };
    const txt = JSON.stringify(doc, null, 2);
    setSalida(txt);
    navigator?.clipboard?.writeText(txt).catch(() => {});
  }

  const btn = { fontFamily:FONT, fontSize:12, fontWeight:600, cursor:"pointer",
    borderRadius:9, padding:"7px 12px", background:"none", color:R.suave,
    border:`1px solid ${R.linea}` };

  return (
    <div style={{ minHeight:"100vh", background:R.fondo, color:R.tinta,
      fontFamily:FONT, padding:"20px 18px 40px", boxSizing:"border-box" }}>

      <div style={{ display:"flex", flexWrap:"wrap", gap:12, alignItems:"baseline",
        justifyContent:"space-between", borderBottom:`1px solid ${R.linea}`,
        paddingBottom:14, marginBottom:18 }}>
        <div>
          <h1 style={{ margin:0, fontSize:17, fontWeight:600, letterSpacing:.2 }}>
            Verificación de contenido
          </h1>
          <p style={{ margin:"3px 0 0", fontFamily:MONO, fontSize:11, color:R.tenue }}>
            IngenieDía · {{
              cargando:  "buscando artículos publicados…",
              publicado: "publicado · solo lectura",
              borrador:  "borrador · nada se publica sin aprobación",
              ejemplos:  "sin artículos publicados · se muestran ejemplos",
            }[origen]}
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={btn} onClick={() => setAbrirPegar(v => !v)}>Cargar borrador</button>
          <button style={btn} onClick={onSalir}>Salir</button>
        </div>
      </div>

      {abrirPegar && (
        <div style={{ marginBottom:18, background:R.panel, border:`1px solid ${R.linea}`,
          borderRadius:12, padding:14 }}>
          <p style={{ margin:"0 0 8px", fontSize:12, color:R.suave }}>
            Pega aquí el JSON del mes generado por el script.
          </p>
          <textarea value={pegado} onChange={e => setPegado(e.target.value)}
            placeholder='{ "mes": "2026-11", "articulos": { ... } }'
            style={{ width:"100%", height:120, background:R.fondo, color:R.tinta, fontFamily:MONO,
              fontSize:11, border:`1px solid ${R.linea}`, borderRadius:8, padding:10,
              boxSizing:"border-box", resize:"vertical" }}/>
          <button onClick={cargarPegado}
            style={{ ...btn, marginTop:8, borderColor:R.pendiente, color:R.pendiente }}>
            Cargar
          </button>
        </div>
      )}

      {soloLectura && (
        <div style={{ marginBottom:16, border:`1px solid ${R.aprobado}55`, borderRadius:10,
          background:`${R.aprobado}10`, padding:"10px 13px" }}>
          <p style={{ ...JUSTIFICADO, margin:0, fontSize:12, color:R.suave, lineHeight:1.6 }}>
            Estos son los artículos que ya están en <span style={{ fontFamily:MONO }}>public/contenido</span>,
            incluidos los de días que los estudiantes todavía no pueden abrir. Se muestran solo para
            consulta. Para revisar contenido nuevo, usa «Cargar borrador».
          </p>
        </div>
      )}

      {borrador.errores.length > 0 && (
        <div style={{ marginBottom:16, border:`1px solid ${R.rechazado}55`, borderRadius:10,
          background:`${R.rechazado}12`, padding:"10px 13px" }}>
          <p style={{ margin:"0 0 5px", fontSize:12, fontWeight:600, color:R.rechazado }}>
            {borrador.errores.length} artículo(s) descartados por el validador
          </p>
          {borrador.errores.map(e => (
            <p key={e} style={{ margin:"0 0 2px", fontFamily:MONO, fontSize:11, color:R.suave }}>{e}</p>
          ))}
        </div>
      )}

      <div style={{ display:"flex", gap:22, alignItems:"flex-start", flexWrap:"wrap" }}>

        <div style={{ width:62, flexShrink:0 }}>
          <p style={{ margin:"0 0 8px", fontFamily:MONO, fontSize:10, color:R.tenue, letterSpacing:1 }}>
            {soloLectura ? `${total} publ.` : `${resueltos}/${total}`}
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {fechas.map((f, n) => {
              const est = decisiones[f]?.estado;
              const sel = n === i;
              return (
                <button key={f} onClick={() => setI(n)} title={f}
                  style={{ display:"flex", alignItems:"center", gap:5, cursor:"pointer",
                    background: sel ? R.panel : "none", border:"none", borderRadius:5,
                    padding:"3px 4px", textAlign:"left" }}>
                  <span style={{ width:3, height:15, borderRadius:2, flexShrink:0,
                    background: soloLectura ? (f <= hoy ? R.aprobado : R.pendiente)
                              : est ? colorEstado(est) : R.linea }}/>
                  <span style={{ fontFamily:MONO, fontSize:10.5,
                    color: sel ? R.tinta : R.tenue }}>
                    {soloLectura ? `${f.slice(8,10)}/${f.slice(5,7)}` : String(n+1).padStart(2,"0")}
                  </span>
                  {ediciones[f] && <span style={{ fontFamily:MONO, fontSize:9, color:R.pendiente }}>·</span>}
                </button>
              );
            })}
          </div>
        </div>

        {origen === "cargando"
          ? <p style={{ color:R.suave, fontSize:13 }}>Cargando artículos publicados…</p>
          : art
          ? <VistaArticulo art={art} fecha={fecha} editable={editando} onCampo={cambiarCampo}/>
          : <p style={{ color:R.suave }}>No hay artículos en el borrador.</p>}

        {art && soloLectura && (
          <div style={{ flex:1, minWidth:280, maxWidth:400 }}>
            <p style={{ margin:0, fontFamily:MONO, fontSize:11, color:R.tenue, letterSpacing:1 }}>
              ARTÍCULO {String(i+1).padStart(2,"0")} DE {String(total).padStart(2,"0")} · PUBLICADO
            </p>
            <p style={{ margin:"6px 0 10px", fontSize:14, lineHeight:1.5 }}>{art.title}</p>
            <p style={{ margin:"0 0 18px", fontSize:12, lineHeight:1.6,
              color: fecha <= hoy ? R.aprobado : R.pendiente }}>
              {fecha <= hoy
                ? `Visible para los estudiantes desde el ${fmtDate(fecha)}.`
                : `Oculto para los estudiantes hasta el ${fmtDate(fecha)}.`}
            </p>
            <div style={{ display:"flex", gap:7 }}>
              <button style={{ ...btn, flex:1 }} disabled={i === 0}
                onClick={() => setI(n => Math.max(0, n-1))}>← Anterior</button>
              <button style={{ ...btn, flex:1 }} disabled={i >= total-1}
                onClick={() => setI(n => Math.min(total-1, n+1))}>Siguiente →</button>
            </div>
          </div>
        )}

        {art && !soloLectura && origen !== "cargando" && (
          <div style={{ flex:1, minWidth:280, maxWidth:400 }}>
            <p style={{ margin:0, fontFamily:MONO, fontSize:11, color:R.tenue, letterSpacing:1 }}>
              ARTÍCULO {String(i+1).padStart(2,"0")} DE {String(total).padStart(2,"0")}
              {editado && <span style={{ color:R.pendiente }}> · EDITADO</span>}
            </p>
            <p style={{ margin:"6px 0 14px", fontSize:14, lineHeight:1.5 }}>{art.title}</p>

            <div style={{ display:"flex", gap:7, marginBottom:16 }}>
              <button onClick={() => setEditando(v => !v)}
                style={{ ...btn, flex:1,
                  background: editando ? R.pendiente : "none",
                  color:      editando ? R.fondo : R.pendiente,
                  borderColor: R.pendiente + (editando ? "" : "66") }}>
                {editando ? "Terminar edición" : "Editar texto"}
              </button>
              {editado && (
                <button onClick={descartarEdicion} style={{ ...btn, flex:1 }}>
                  Descartar cambios
                </button>
              )}
            </div>

            {editando ? (
              <p style={{ ...JUSTIFICADO, margin:"0 0 16px", fontSize:12, lineHeight:1.7, color:R.suave }}>
                Escribe directamente sobre el artículo. Los cambios se guardan solos y
                son los que se publican. No pasan por el generador.
              </p>
            ) : (
              <>
                <p style={{ margin:"0 0 8px", fontFamily:MONO, fontSize:10.5,
                  color:R.tenue, letterSpacing:1 }}>QUÉ ESTÁS VERIFICANDO</p>
                <ol style={{ margin:"0 0 16px", paddingLeft:17, fontSize:12,
                  lineHeight:1.85, color:R.suave }}>
                  <li>Que las normas citadas existan y digan esto.</li>
                  <li>Que el nivel calce con tus estudiantes.</li>
                  <li>Que la sección de IA aporte algo real.</li>
                  <li>Que se lea bien en pantalla de teléfono.</li>
                </ol>
              </>
            )}

            <textarea value={nota} onChange={e => setNota(e.target.value)}
              placeholder="Solo para Regenerar o Rechazar: qué está mal."
              style={{ width:"100%", height:64, background:R.panel, color:R.tinta, fontFamily:FONT,
                fontSize:12, border:`1px solid ${R.linea}`, borderRadius:9, padding:10,
                boxSizing:"border-box", resize:"vertical", marginBottom:10 }}/>

            <div style={{ display:"flex", gap:7, marginBottom:14 }}>
              {VEREDICTOS.map(v => {
                const activo = actual?.estado === v.id;
                return (
                  <button key={v.id} onClick={() => decidir(v.id)}
                    style={{ flex:1, cursor:"pointer", borderRadius:9, padding:"9px 6px",
                      fontFamily:FONT, fontSize:12, fontWeight:600,
                      background: activo ? v.color : "none",
                      color:      activo ? R.fondo : v.color,
                      border:`1px solid ${v.color}${activo ? "" : "66"}` }}>
                    {v.etiqueta}
                  </button>
                );
              })}
            </div>

            <div style={{ display:"flex", gap:7, marginBottom:20 }}>
              <button style={{ ...btn, flex:1 }} disabled={i === 0}
                onClick={() => setI(n => Math.max(0, n-1))}>← Anterior</button>
              <button style={{ ...btn, flex:1 }} disabled={i >= total-1}
                onClick={() => setI(n => Math.min(total-1, n+1))}>Siguiente →</button>
            </div>

            <div style={{ borderTop:`1px solid ${R.linea}`, paddingTop:14 }}>
              {VEREDICTOS.map(v => (
                <div key={v.id} style={{ display:"flex", justifyContent:"space-between",
                  fontFamily:MONO, fontSize:11, color:R.suave, marginBottom:4 }}>
                  <span>{v.etiqueta.toLowerCase()}</span>
                  <span style={{ color:v.color }}>{String(cuenta(v.id)).padStart(2,"0")}</span>
                </div>
              ))}
              <div style={{ display:"flex", justifyContent:"space-between",
                fontFamily:MONO, fontSize:11, color:R.suave }}>
                <span>editados</span>
                <span style={{ color:R.pendiente }}>
                  {String(Object.keys(ediciones).length).padStart(2,"0")}
                </span>
              </div>
              <button onClick={exportar} disabled={!resueltos}
                style={{ ...btn, width:"100%", marginTop:12, padding:"10px",
                  borderColor: resueltos ? R.pendiente : R.linea,
                  color:       resueltos ? R.pendiente : R.tenue,
                  cursor:      resueltos ? "pointer" : "default" }}>
                Exportar decisiones{resueltos < total ? ` (${resueltos} de ${total})` : ""}
              </button>
              {salida && (
                <>
                  <p style={{ margin:"10px 0 6px", fontSize:11, color:R.aprobado }}>
                    Copiado al portapapeles.
                  </p>
                  <textarea readOnly value={salida}
                    style={{ width:"100%", height:110, background:R.panel, color:R.suave,
                      fontFamily:MONO, fontSize:10, border:`1px solid ${R.linea}`,
                      borderRadius:8, padding:9, boxSizing:"border-box" }}/>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [state, setStateRaw] = useState(DEFAULT_STATE);
  const [ready, setReady]    = useState(false);
  const [articulos, setArticulos] = useState({});
  const [avisos,    setAvisos]    = useState([]);
  const [revision,  setRevision]  = useState(
    typeof window !== "undefined" && window.location.hash === "#revision");
  const [encuestaAbierta, setEncuestaAbierta] = useState(false);
  const encuestaMostrada     = useRef(false);
  const esMovil              = useEsMovil();
  const scrollRef            = useRef(null);
  const toast                = useToast();
  const T                    = THEMES[state.theme] ?? THEMES.dark;

  // Carga de meses. Se pide cada mes una sola vez y nunca un mes futuro:
  // lo que aún no se publica para el estudiante no llega al teléfono desde la app.
  const mesesCargados = useRef(new Set());
  const verMes = useCallback(mes => {
    if (mes > mesDe(hoyKey()) || mesesCargados.current.has(mes)) return;
    mesesCargados.current.add(mes);
    cargarMes(mes).then(({ articulos:arts, errores }) => {
      setArticulos(prev => ({ ...prev, ...arts }));
      if (errores.length) setAvisos(prev => [...prev, ...errores]);
    });
  }, []);

  // El mes de la fecha elegida.
  const mesActual = mesDe(state.selectedKey || hoyKey());
  useEffect(() => { verMes(mesActual); }, [mesActual, verMes]);

  // Los meses de lo guardado y leído, para que el Archivo los muestre.
  useEffect(() => {
    if (!ready) return;
    new Set([...(state.saved||[]), ...(state.read||[])].map(mesDe)).forEach(verMes);
  }, [ready, state.saved, state.read, verMes]);

  useEffect(() => {
    storeHydrate(DEFAULT_STATE).then(s => { setStateRaw({ ...s, selectedKey: hoyKey() }); setReady(true); });
  }, []);

  // Encuesta de cierre: aparece sola una vez por apertura de la app,
  // mientras no se haya respondido. Se puede cerrar con la X.
  useEffect(() => {
    if (!ready || !state.onboardingDone || encuestaMostrada.current) return;
    if (faseDe(hoyKey()) === "encuesta" && !state.encuestaEnviada) {
      encuestaMostrada.current = true;
      setEncuestaAbierta(true);
    }
  }, [ready, state.onboardingDone, state.encuestaEnviada]);

  // Fondo de la página y barra del teléfono con el color del tema,
  // para que no quede un marco de otro color alrededor de la app.
  useEffect(() => {
    const fondo = esMovil ? T.bg : T.wallBg;
    document.documentElement.style.background = esMovil ? T.bg : "";
    document.body.style.background = fondo;
    document.body.style.margin = "0";
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", T.bg);
  }, [T, esMovil]);

  const setState = useCallback(fn => {
    setStateRaw(prev => {
      const next = typeof fn==="function" ? fn(prev) : fn;
      storePersist(next);
      return next;
    });
  }, []);

  const setTab = useCallback(t => {
    setState(s => ({ ...s, tab:t }));
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [setState]);

  function renderView() {
    const props = { state, setState, T, showToast:toast.show, articulos };
    switch (state.tab) {
      case "archive": return <ArchiveView {...props}/>;
      case "profile": return <ProfileView {...props}/>;
      default: {
        const aviso = <AvisoEtapa T={T} state={state} onAbrirEncuesta={() => setEncuestaAbierta(true)}/>;
        return (
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {aviso}
            <TodayView {...props} scrollRef={scrollRef}/>
          </div>
        );
      }
    }
  }

  if (revision) return <RevisionView onSalir={() => {
    if (typeof window !== "undefined") window.location.hash = "";
    setRevision(false);
  }}/>;

  return (
    <div style={{ minHeight:"100dvh", width:"100%",
      background: esMovil ? T.bg : T.wallBg,
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start",
      padding: esMovil ? 0 : "20px 12px 32px", boxSizing:"border-box", fontFamily:FONT }}>

      {/* Top label — solo en computador */}
      {!esMovil && <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
        <span style={{ fontSize:20, fontWeight:700, color:T.text, letterSpacing:.3 }}>IngenieDía</span>
        <span style={{ fontSize:10, color:T.muted, border:`1px solid ${T.border}`, borderRadius:7, padding:"2px 7px" }}>
          v{APP_VERSION}
        </span>
      </div>}

      {/* Cuerpo de la app */}
      <div style={{ width:"100%", background:T.bg,
        maxWidth:     esMovil ? "none" : 390,
        borderRadius: esMovil ? 0 : 36,
        border:       esMovil ? "none" : `1.5px solid ${T.border}`,
        height:       esMovil ? "100dvh" : "min(780px, calc(100vh - 100px))",
        overflow:"hidden", display:"flex", flexDirection:"column", position:"relative" }}>

        {/* Onboarding */}
        {ready && !state.onboardingDone &&
          <Onboarding onDone={() => setState(s=>({...s,onboardingDone:true}))} T={T}/>}

        {/* Encuesta de cierre de la etapa de prueba */}
        {encuestaAbierta && (
          <EncuestaCierre T={T} onCerrar={() => setEncuestaAbierta(false)}
            onEnviada={() => {
              setState(s => ({ ...s, encuestaEnviada:true }));
              setEncuestaAbierta(false);
              toast.show("¡Gracias por responder!");
            }}/>
        )}

        {/* Toast */}
        <Toast message={toast.msg} visible={toast.vis}/>

        <BannerSimulacion T={T}/>

        {/* Barra superior. En móvil no se simula hora ni batería:
            el teléfono ya tiene las suyas. Solo se conserva la racha. */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          padding: esMovil ? "8px 16px 2px" : "10px 20px 4px", flexShrink:0, background:T.bg }}>
          <div style={{ display:"flex", alignItems:"center", gap:7 }}>
            {!esMovil && <span style={{ fontSize:11, fontWeight:700, color:T.text }}>9:41</span>}
            {(state.streakCount||0) > 0 && (
              <span style={{ fontSize:10, color:"#f97316", display:"flex", alignItems:"center", gap:2,
                background:"rgba(249,115,22,0.1)", borderRadius:10, padding:"1px 6px" }}>
                🔥 {state.streakCount}
              </span>
            )}
          </div>
          {!esMovil && (
            <div style={{ display:"flex", alignItems:"center", gap:4, color:T.muted }}>
              <Ic.ZapFill s={11}/><span style={{ fontSize:10 }}>100%</span>
            </div>
          )}
        </div>

        {/* App header */}
        <div style={{ padding:"6px 16px 10px", flexShrink:0, borderBottom:`1px solid ${T.border}`, background:T.bg }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:19, fontWeight:700, color:T.text, letterSpacing:.2 }}>IngenieDía</div>
              <div style={{ fontSize:10, color:T.muted }}>Tu dosis diaria de ingeniería</div>
              <HeaderCalendar state={state} setState={setState} T={T} articulos={articulos} onVerMes={verMes}/>
            </div>
            <div style={{ width:40, height:40, borderRadius:13, flexShrink:0,
              border:`1px solid ${T.accent}44`, background:`${T.accent}10`,
              display:"flex", alignItems:"center", justifyContent:"center", color:"#facc15" }}>
              <Ic.ZapFill s={22}/>
            </div>
          </div>
        </div>

        {/* Scroll area */}
        <div ref={scrollRef} style={{ flex:1, overflowY:"auto", overflowX:"hidden",
          zoom: state.fontScale || 1,
          padding:"12px 12px 16px", scrollbarWidth:"none", msOverflowStyle:"none" }}>
          {ready ? renderView() : <Skeleton T={T}/>}
        </div>

        {/* Bottom nav */}
        <nav style={{ display:"flex", height:58, flexShrink:0,
          background:T.navBg, borderTop:`1px solid ${T.border}`, zIndex:10,
          paddingBottom:"env(safe-area-inset-bottom, 0px)",
          boxSizing:"content-box" }}>
          {NAV_TABS.map(({ key, label, AIcon, IIcon }) => {
            const active = state.tab === key;
            return (
              <PressBtn key={key} onClick={() => setTab(key)}
                style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center",
                  justifyContent:"center", gap:2, border:"none", background:"none",
                  cursor:"pointer", padding:0, color: active ? T.accent : T.muted,
                  fontSize:9, fontWeight: active ? 700 : 400 }}>
                <span style={{ color: active ? T.accent : T.muted, display:"flex" }}>
                  {active ? <AIcon/> : <IIcon/>}
                </span>
                {label}
              </PressBtn>
            );
          })}
        </nav>
      </div>

      {!esMovil && (
        <>
          <p style={{ marginTop:10, fontSize:10, color:T.muted, textAlign:"center" }}>
            Estado guardado automáticamente · {Object.keys(articulos).length} artículos disponibles
            {avisos.length > 0 && ` · ${avisos.length} descartados`}
          </p>
          <button onClick={() => setRevision(true)}
            style={{ marginTop:6, background:"none", border:"none", cursor:"pointer",
              fontFamily:FONT, fontSize:10, color:T.muted, textDecoration:"underline",
              textUnderlineOffset:3, opacity:.65 }}>
            Modo revisión
          </button>
        </>
      )}
    </div>
  );
}
