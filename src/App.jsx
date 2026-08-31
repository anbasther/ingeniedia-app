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
const CLAVE_ESTADO = "ingeniedia-estado";

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
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
};
const APP_VERSION = "0.2.0";
const FONT        = "'IBM Plex Sans', system-ui, sans-serif";
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
const CAMPOS = ["shortCategory","title","description","context",
                "detail","ai","history","keyConcepts","sources","readingMin"];

function validarArticulo(fecha, art) {
  const faltan = CAMPOS.filter(c => art[c] === undefined || art[c] === "" ||
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

async function cargarMes(mes) {
  try {
    const r = await fetch(`/contenido/${mes}.json`, { cache:"no-cache" });
    if (!r.ok) throw new Error(r.status);
    return normalizarMes(await r.json());
  } catch {
    // Sin servidor de contenido (vista previa): se usa la muestra incluida.
    return normalizarMes({ articulos: CONTENIDO_DEMO });
  }
}

const DEFAULT_STATE = {
  tab:"today", selectedKey:hoyKey(), theme:"dark", fontScale:1,
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
function HeroElectricidad({ color }) {
  return (
    <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg"
      style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
      <rect width="400" height="180" fill="#0a0f1e"/>
      {[40,80,120,160,200,240,280,320,360].map(x =>
        <line key={x} x1={x} y1="0" x2={x} y2="180" stroke="#fff" strokeOpacity=".03" strokeWidth="1"/>)}
      {[30,60,90,120,150].map(y =>
        <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#fff" strokeOpacity=".03" strokeWidth="1"/>)}
      <rect x="30" y="30" width="340" height="8" rx="2" fill={color} opacity=".9"/>
      <rect x="30" y="142" width="340" height="8" rx="2" fill={color} opacity=".5"/>
      {[60,120,180,240,300].map((x,i) => (
        <g key={x}>
          <line x1={x} y1="38" x2={x} y2="142" stroke="#fff" strokeOpacity=".18" strokeWidth="1" strokeDasharray="4 3"/>
          <rect x={x-14} y="65" width="28" height="50" rx="4" fill="#1e293b"
            stroke={i===2?color:"#334155"} strokeWidth={i===2?2:1}/>
          <rect x={x-7} y="72" width="14" height="8" rx="2" fill={i===2?color:"#475569"} opacity=".9"/>
          <line x1={x} y1="80" x2={x} y2="108" stroke={i===2?color:"#64748b"} strokeWidth="2"/>
          <circle cx={x} cy="112" r="4" fill={i===2?color:"#475569"}/>
          <text x={x} y="126" textAnchor="middle" fontSize="7" fill="#64748b">{`Q${i+1}`}</text>
        </g>
      ))}
      <defs>
        <marker id="arr1" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={color}/>
        </marker>
      </defs>
      <line x1="180" y1="48" x2="180" y2="63" stroke={color} strokeWidth="1.5" markerEnd="url(#arr1)"/>
      <text x="196" y="57" fontSize="8" fill={color} opacity=".8">falla</text>
      <ellipse cx="180" cy="90" rx="60" ry="40" fill={color} opacity=".04"/>
    </svg>
  );
}

function HeroEnergia({ color }) {
  const pts = (amp, freq) =>
    Array.from({length:200}, (_,i) => `${i*2},${90-amp*Math.sin(i*freq*Math.PI/80)}`).join(" ");
  const comp = Array.from({length:200}, (_,i) =>
    `${i*2},${90-50*Math.sin(i*2*Math.PI/80)-22*Math.sin(i*6*Math.PI/80)-14*Math.sin(i*10*Math.PI/80)}`).join(" ");
  return (
    <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg"
      style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
      <rect width="400" height="180" fill="#061a10"/>
      <line x1="0" y1="90" x2="400" y2="90" stroke="#fff" strokeOpacity=".08" strokeWidth="1"/>
      <polyline points={pts(50,2)}  fill="none" stroke={color}   strokeWidth="2.5" opacity=".9"/>
      <polyline points={pts(22,6)}  fill="none" stroke="#facc15" strokeWidth="1.5" opacity=".6"/>
      <polyline points={pts(14,10)} fill="none" stroke="#f87171" strokeWidth="1"   opacity=".5"/>
      <polyline points={comp}       fill="none" stroke="#fff"    strokeWidth="1"   opacity=".2" strokeDasharray="3 2"/>
      <rect x="12" y="12" width="8" height="3" rx="1" fill={color}/>
      <text x="24" y="16" fontSize="8" fill={color}>Fundamental</text>
      <rect x="12" y="24" width="8" height="3" rx="1" fill="#facc15"/>
      <text x="24" y="28" fontSize="8" fill="#facc15">3° armónico</text>
      <rect x="12" y="36" width="8" height="3" rx="1" fill="#f87171"/>
      <text x="24" y="40" fontSize="8" fill="#f87171">5° armónico</text>
    </svg>
  );
}

function HeroIA({ color }) {
  const nodes = [[60,50],[120,44],[200,48],[270,42]];
  const signal = Array.from({length:160}, (_,i) => {
    const n = Math.sin(i*.8)*8 + Math.sin(i*2.1)*4 + Math.sin(i*5)*2;
    return `${40+i*2},${100-(i>100 ? n+(i-100)*.4 : n)}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg"
      style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
      <rect width="400" height="180" fill="#0d0a1e"/>
      <line x1="40" y1="140" x2="370" y2="140" stroke="#fff" strokeOpacity=".12" strokeWidth="1"/>
      {nodes.map(([x,y],i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="3" fill={color} opacity=".6"/>
          {i < nodes.length-1 &&
            <line x1={x+3} y1={y} x2={nodes[i+1][0]-3} y2={nodes[i+1][1]}
              stroke={color} strokeWidth=".8" opacity=".3"/>}
        </g>
      ))}
      <polyline points={signal} fill="none" stroke={color} strokeWidth="1.5" opacity=".85"/>
      <line x1="40" y1="68" x2="370" y2="68" stroke="#f87171" strokeWidth="1" strokeDasharray="6 3" opacity=".7"/>
      <text x="374" y="71" fontSize="8" fill="#f87171">umbral</text>
      <rect x="240" y="68" width="130" height="72" fill="#f87171" fillOpacity=".03" rx="2"/>
      <circle cx="310" cy="104" r="12" fill="#f87171" fillOpacity=".1" stroke="#f87171" strokeWidth="1"/>
      <text x="310" y="108" textAnchor="middle" fontSize="11" fill="#f87171">!</text>
      <text x="40" y="30" fontSize="9" fill={color} opacity=".7">Señal de condición</text>
      <text x="40" y="42" fontSize="8" fill="#64748b">Vibración (mm/s)</text>
    </svg>
  );
}

function HeroInformatica({ color }) {
  const nodes = [[80,60],[200,45],[320,62],[140,125],[265,120]];
  const links = [[0,1],[1,2],[0,3],[3,4],[4,2],[1,4]];
  return (
    <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg"
      style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
      <rect width="400" height="180" fill="#0a1520"/>
      {links.map(([a,b],i) => (
        <line key={i} x1={nodes[a][0]} y1={nodes[a][1]} x2={nodes[b][0]} y2={nodes[b][1]}
          stroke={color} strokeWidth=".8" opacity=".28"/>
      ))}
      {nodes.map(([x,y],i) => (
        <g key={i}>
          <rect x={x-11} y={y-8} width="22" height="16" rx="3"
            fill="#0a1520" stroke={color} strokeWidth="1" opacity=".8"/>
          <circle cx={x} cy={y} r="2" fill={color} opacity=".9"/>
        </g>
      ))}
      <rect x="186" y="28" width="28" height="6" rx="2" fill={color} opacity=".35"/>
      <text x="40" y="30" fontSize="9" fill={color} opacity=".7">Red industrial</text>
      <text x="40" y="42" fontSize="8" fill="#64748b">Nodos y protocolos</text>
      <text x="330" y="160" fontSize="8" fill="#64748b">OPC UA</text>
    </svg>
  );
}

function HeroMecanica({ color }) {
  const wave = Array.from({length:150}, (_,i) => {
    const n = Math.sin(i*.55)*10 + Math.sin(i*1.9)*5 + Math.sin(i*4.3)*2.5;
    return `${60+i*2},${125-n}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg"
      style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
      <rect width="400" height="180" fill="#1a1206"/>
      <circle cx="130" cy="70" r="30" fill="none" stroke={color} strokeWidth="1.2" opacity=".75"/>
      <circle cx="130" cy="70" r="19" fill="none" stroke={color} strokeWidth="1" opacity=".45"/>
      <circle cx="130" cy="70" r="5" fill={color} opacity=".8"/>
      {Array.from({length:8}).map((_,i) => {
        const a = (i*Math.PI)/4;
        return <circle key={i} cx={130+Math.cos(a)*24.5} cy={70+Math.sin(a)*24.5} r="3.2"
          fill="none" stroke={color} strokeWidth=".9" opacity=".55"/>;
      })}
      <line x1="130" y1="70" x2="330" y2="70" stroke="#fff" strokeOpacity=".14" strokeWidth="2"/>
      <line x1="60" y1="125" x2="360" y2="125" stroke="#fff" strokeOpacity=".1" strokeWidth="1"/>
      <polyline points={wave} fill="none" stroke={color} strokeWidth="1.5" opacity=".85"/>
      <text x="40" y="30" fontSize="9" fill={color} opacity=".7">Análisis de vibraciones</text>
      <text x="40" y="42" fontSize="8" fill="#64748b">Espectro de rodamiento</text>
    </svg>
  );
}

function HeroAutomatizacion({ color }) {
  const rungs = [50, 85, 120];
  return (
    <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg"
      style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
      <rect width="400" height="180" fill="#04160f"/>
      <line x1="70" y1="38" x2="70" y2="140" stroke={color} strokeWidth="1.4" opacity=".7"/>
      <line x1="340" y1="38" x2="340" y2="140" stroke={color} strokeWidth="1.4" opacity=".7"/>
      {rungs.map((y,i) => (
        <g key={i}>
          <line x1="70" y1={y} x2="150" y2={y} stroke={color} strokeWidth="1" opacity=".55"/>
          <line x1="150" y1={y-9} x2="150" y2={y+9} stroke={color} strokeWidth="1.4" opacity=".85"/>
          <line x1="163" y1={y-9} x2="163" y2={y+9} stroke={color} strokeWidth="1.4" opacity=".85"/>
          <line x1="163" y1={y} x2="270" y2={y} stroke={color} strokeWidth="1" opacity=".55"/>
          <circle cx="285" cy={y} r="9" fill="none" stroke={color} strokeWidth="1.3" opacity=".8"/>
          <line x1="294" y1={y} x2="340" y2={y} stroke={color} strokeWidth="1" opacity=".55"/>
        </g>
      ))}
      <text x="40" y="30" fontSize="9" fill={color} opacity=".7">Lógica de control</text>
      <text x="40" y="163" fontSize="8" fill="#64748b">IEC 61131-3 · Ladder</text>
    </svg>
  );
}

function HeroElectronica({ color }) {
  const pads = [[95,55],[160,55],[225,55],[290,55],[95,130],[160,130],[225,130],[290,130]];
  return (
    <svg viewBox="0 0 400 180" xmlns="http://www.w3.org/2000/svg"
      style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
      <rect width="400" height="180" fill="#0d1608"/>
      <path d="M95 55 L95 92 L160 92 L160 130" fill="none" stroke={color} strokeWidth="1.1" opacity=".5"/>
      <path d="M225 55 L225 92 L290 92 L290 130" fill="none" stroke={color} strokeWidth="1.1" opacity=".5"/>
      <path d="M160 55 L225 55" fill="none" stroke={color} strokeWidth="1.1" opacity=".5"/>
      <path d="M95 130 L225 130" fill="none" stroke={color} strokeWidth="1.1" opacity=".5"/>
      <line x1="60" y1="92" x2="95" y2="92" stroke={color} strokeWidth="1.1" opacity=".5"/>
      <line x1="290" y1="92" x2="345" y2="92" stroke={color} strokeWidth="1.1" opacity=".5"/>
      {pads.map(([x,y],i) => (
        <circle key={i} cx={x} cy={y} r="4.5" fill="#0d1608" stroke={color} strokeWidth="1.2" opacity=".9"/>
      ))}
      <rect x="176" y="78" width="48" height="30" rx="3" fill="#0d1608" stroke={color} strokeWidth="1.2" opacity=".85"/>
      <text x="200" y="97" textAnchor="middle" fontSize="8" fill={color} opacity=".8">IC</text>
      <text x="40" y="30" fontSize="9" fill={color} opacity=".7">Circuito de instrumentación</text>
      <text x="300" y="163" fontSize="8" fill="#64748b">4–20 mA</text>
    </svg>
  );
}

// Ilustración por categoría: cada artículo nuevo hereda la de su área.
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
      <p style={{ fontSize:12, color:T.sub, lineHeight:1.7, margin:0 }}>{children}</p>
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
      <p style={{ fontSize:13, color:T.sub, textAlign:"center", lineHeight:1.7, margin:"0 0 40px" }}>{body}</p>
      <PressBtn onClick={() => isLast ? onDone() : setSlide(s => s+1)}
        style={{ width:"100%", padding:"14px 0", borderRadius:16, background:T.accent, border:"none",
          fontSize:14, fontWeight:700, color:"#0f172a", cursor:"pointer", letterSpacing:.2 }}>
        {cta}
      </PressBtn>
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
function HeaderCalendar({ state, setState, T, articulos }) {
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
              const hasArt = !!articulos[k];
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
        <p style={{ fontSize:14, color:T.sub, lineHeight:1.75, marginBottom:20 }}>{art.description}</p>
        {[
          { label:"Contexto técnico",  text:art.context },
          { label:"En detalle",        text:art.detail  },
          { label:"Aplicación con IA", text:art.ai      },
          { label:"Historia técnica",  text:art.history },
          { label:"Conceptos clave",   text:art.keyConcepts },
        ].map(({label,text}) => (
          <div key={label} style={{ marginBottom:20 }}>
            <p style={{ fontSize:11, fontWeight:700, color:T.accent, letterSpacing:1,
              marginBottom:6, textTransform:"uppercase" }}>{label}</p>
            <p style={{ fontSize:14, color:T.sub, lineHeight:1.75, margin:0 }}>{text}</p>
          </div>
        ))}
        <div style={{ marginTop:24, paddingTop:16, borderTop:`1px solid ${T.border}` }}>
          <p style={{ fontSize:11, fontWeight:700, color:T.muted, marginBottom:8,
            textTransform:"uppercase", letterSpacing:1 }}>Fuentes</p>
          {art.sources.map(s => <p key={s} style={{ fontSize:12, color:T.muted, margin:"0 0 4px" }}>· {s}</p>)}
        </div>
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
    const text = `${art.title}\n\n${art.description}\n\n${art.keyConcepts}`;
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
            {/* Gradient overlay */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0,
              background:"linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)",
              padding:"12px 16px" }}>
              <p style={{ fontSize:10, color:T.accent, fontWeight:700, letterSpacing:1, marginBottom:3 }}>
                HOY EN INGENIEDÍA
              </p>
              <h2 style={{ fontSize:17, fontWeight:700, color:"#fff", lineHeight:1.3, margin:0 }}>
                {art.title}
              </h2>
            </div>
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
            <p style={{ fontSize:12, color:T.sub, lineHeight:1.7, marginBottom:12 }}>{art.description}</p>
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
          <SectionBlock icon={<Ic.Info/>}   title="Contexto técnico"  T={T}>{art.context}</SectionBlock>
          <SectionBlock icon={<Ic.Layers/>} title="En detalle"        T={T}>{art.detail}</SectionBlock>
          <SectionBlock icon={<Ic.Cpu/>}    title="Aplicación con IA" T={T}>{art.ai}</SectionBlock>
          <SectionBlock icon={<Ic.ClockH/>} title="Historia técnica"  T={T}>{art.history}</SectionBlock>
          <SectionBlock icon={<Ic.Star/>}   title="Conceptos clave"   T={T}>{art.keyConcepts}</SectionBlock>
          <div style={{ background:T.pill, border:`1px solid ${T.border}`, borderRadius:14, padding:"11px 13px", marginBottom:12 }}>
            <p style={{ fontSize:12, fontWeight:700, color:T.text, marginBottom:8 }}>Fuentes</p>
            {art.sources.map(src => (
              <div key={src} style={{ display:"flex", gap:8, marginBottom:5, alignItems:"flex-start" }}>
                <span style={{ width:5, height:5, borderRadius:3, background:T.accent, marginTop:5, flexShrink:0 }}/>
                <span style={{ fontSize:11, color:T.muted }}>{src}</span>
              </div>
            ))}
          </div>
        </div>
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
    [state.saved]
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
        <p style={{ fontSize:11, color:T.muted, lineHeight:1.6, marginBottom:10 }}>
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

      {/* Account */}
      <Card T={T} title="Cuenta" icon={<Ic.User/>}>
        <div style={{ background:T.pill, border:`1px solid ${T.border}`, borderRadius:12, padding:"11px 13px" }}>
          <EditField value={state.userName} onChange={v => setState(s=>({...s,userName:v}))} T={T}/>
          <div style={{ height:1, background:T.border, margin:"8px 0" }}/>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <Ic.Mail/> <span style={{ fontSize:11, color:T.muted }}>{state.userEmail || "Sin correo registrado"}</span>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card T={T} title="Notificaciones" icon={<Ic.Bell/>}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
          background:T.pill, border:`1px solid ${T.border}`, borderRadius:12, padding:"11px 13px", marginBottom:8 }}>
          <span style={{ fontSize:12, color:T.sub }}>Notificación diaria</span>
          <Toggle on={state.notificationsOn} T={T} onChange={v => setState(s=>({...s,notificationsOn:v}))}/>
        </div>
        {state.notificationsOn && (
          <div style={{ background:T.pill, border:`1px solid ${T.border}`, borderRadius:12, padding:"11px 13px", marginBottom:8 }}>
            <span style={{ fontSize:11, color:T.muted, display:"block", marginBottom:6 }}>Hora de notificación</span>
            <input type="time" value={state.notifTime}
              onChange={e => setState(s=>({...s,notifTime:e.target.value}))}
              style={{ width:"100%", background:T.inputBg, border:`1px solid ${T.border}`,
                borderRadius:9, padding:"7px 11px", color:T.text, fontSize:12, outline:"none" }}/>
          </div>
        )}
        <div style={{ background:`${T.accent}08`, border:`1px solid ${T.accent}25`, borderRadius:12, padding:"9px 13px" }}>
          <p style={{ fontSize:11, color:T.muted, margin:0, lineHeight:1.5 }}>
            Las notificaciones se activarán cuando la app esté disponible como PWA instalada.
          </p>
        </div>
      </Card>

      {/* Font */}
      <Card T={T} title="Tamaño de texto">
        <div style={{ background:T.pill, border:`1px solid ${T.border}`, borderRadius:12, padding:"11px 13px" }}>
          <input type="range" min="0.85" max="1.2" step="0.05" value={state.fontScale}
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
  { id:"aprobado",  etiqueta:"Aprobar",  tecla:"A", color:R.aprobado  },
  { id:"corregir",  etiqueta:"Corregir", tecla:"C", color:R.corregir  },
  { id:"rechazado", etiqueta:"Rechazar", tecla:"R", color:R.rechazado },
];
const colorEstado = (e) => R[e] ?? R.pendiente;

// Vista fiel de lo que verá el estudiante, al ancho real del teléfono.
function VistaArticulo({ art, fecha }) {
  const Illu = HERO_MAP[art.shortCategory] ?? null;
  const col  = colorDe(art.shortCategory);
  const secciones = [
    ["Contexto técnico",  art.context],
    ["En detalle",        art.detail],
    ["Aplicación con IA", art.ai],
    ["Historia técnica",  art.history],
    ["Conceptos clave",   art.keyConcepts],
  ];
  return (
    <div style={{ width:390, flexShrink:0, background:"#0f1117", borderRadius:26,
      border:`1px solid ${R.linea}`, overflow:"hidden", fontFamily:FONT }}>
      <div style={{ height:180, position:"relative", background:"#0a0f1e" }}>
        {Illu && <Illu color={col}/>}
        <div style={{ position:"absolute", inset:"auto 0 0 0", padding:"12px 16px",
          background:"linear-gradient(to top, rgba(0,0,0,.9), transparent)" }}>
          <p style={{ margin:0, fontSize:10, fontWeight:700, letterSpacing:1, color:col }}>
            {art.shortCategory.toUpperCase()}
          </p>
          <h2 style={{ margin:"3px 0 0", fontSize:17, fontWeight:700, color:"#fff", lineHeight:1.3 }}>
            {art.title}
          </h2>
        </div>
      </div>
      <div style={{ padding:"14px 16px 20px" }}>
        <p style={{ margin:"0 0 4px", fontFamily:MONO, fontSize:10, color:R.tenue }}>
          {fecha} · {art.readingMin} min
        </p>
        <p style={{ fontSize:12, lineHeight:1.7, color:"#cbd5e1", margin:"8px 0 16px" }}>
          {art.description}
        </p>
        {secciones.map(([t, texto]) => (
          <div key={t} style={{ marginBottom:15 }}>
            <p style={{ margin:"0 0 5px", fontSize:10, fontWeight:700, letterSpacing:1,
              textTransform:"uppercase", color:col }}>{t}</p>
            <p style={{ margin:0, fontSize:12.5, lineHeight:1.75, color:"#cbd5e1" }}>{texto}</p>
          </div>
        ))}
        <div style={{ borderTop:`1px solid #24304a`, paddingTop:12 }}>
          <p style={{ margin:"0 0 6px", fontFamily:MONO, fontSize:10, letterSpacing:1, color:R.tenue }}>FUENTES</p>
          {art.sources.map(s => (
            <p key={s} style={{ margin:"0 0 4px", fontSize:11, color:"#94a3b8" }}>· {s}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function RevisionView({ onSalir }) {
  const [borrador, setBorrador] = useState(() => normalizarMes({ articulos: CONTENIDO_DEMO }));
  const [pegado,   setPegado]   = useState("");
  const [abrirPegar, setAbrirPegar] = useState(false);
  const [decisiones, setDecisiones] = useState({});
  const [i, setI] = useState(0);
  const [nota, setNota] = useState("");
  const [salida, setSalida] = useState(null);

  const fechas = useMemo(() => Object.keys(borrador.articulos).sort(), [borrador]);
  const fecha  = fechas[i];
  const art    = borrador.articulos[fecha];
  const actual = decisiones[fecha];

  useEffect(() => { setNota(actual?.nota ?? ""); }, [fecha]);

  const total     = fechas.length;
  const resueltos = fechas.filter(f => decisiones[f]).length;
  const cuenta    = (e) => fechas.filter(f => decisiones[f]?.estado === e).length;

  function decidir(estado) {
    setDecisiones(d => ({ ...d, [fecha]: { estado, nota: nota.trim() } }));
    if (i < total - 1) setI(i + 1);
  }

  function cargarPegado() {
    try {
      const res = normalizarMes(JSON.parse(pegado));
      if (!Object.keys(res.articulos).length) { alert("El archivo no trae artículos válidos."); return; }
      setBorrador(res); setDecisiones({}); setI(0); setAbrirPegar(false); setPegado("");
    } catch { alert("No se pudo leer el JSON. Revisa que esté completo."); }
  }

  function exportar() {
    const aprobados = {};
    fechas.forEach(f => { if (decisiones[f]?.estado === "aprobado") aprobados[f] = borrador.articulos[f]; });
    const doc = {
      version: ESQUEMA_VERSION,
      revisadoEn: new Date().toISOString(),
      resumen: { total, aprobados: cuenta("aprobado"), corregir: cuenta("corregir"), rechazados: cuenta("rechazado") },
      decisiones,
      articulos: aprobados,
    };
    const txt = JSON.stringify(doc, null, 2);
    setSalida(txt);
    navigator?.clipboard?.writeText(txt).catch(()=>{});
  }

  const btn = {
    fontFamily:FONT, fontSize:12, fontWeight:600, cursor:"pointer",
    borderRadius:9, padding:"7px 12px", background:"none", color:R.suave,
    border:`1px solid ${R.linea}`,
  };

  return (
    <div style={{ minHeight:"100vh", background:R.fondo, color:R.tinta,
      fontFamily:FONT, padding:"20px 18px 40px", boxSizing:"border-box" }}>

      {/* Encabezado */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:12, alignItems:"baseline",
        justifyContent:"space-between", borderBottom:`1px solid ${R.linea}`, paddingBottom:14, marginBottom:18 }}>
        <div>
          <h1 style={{ margin:0, fontSize:17, fontWeight:600, letterSpacing:.2 }}>
            Verificación de contenido
          </h1>
          <p style={{ margin:"3px 0 0", fontFamily:MONO, fontSize:11, color:R.tenue }}>
            IngenieDía · borrador · nada se publica sin aprobación
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button style={btn} onClick={() => setAbrirPegar(v=>!v)}>Cargar borrador</button>
          <button style={btn} onClick={onSalir}>Salir</button>
        </div>
      </div>

      {abrirPegar && (
        <div style={{ marginBottom:18, background:R.panel, border:`1px solid ${R.linea}`,
          borderRadius:12, padding:14 }}>
          <p style={{ margin:"0 0 8px", fontSize:12, color:R.suave }}>
            Pega aquí el JSON del mes generado por el script.
          </p>
          <textarea value={pegado} onChange={e=>setPegado(e.target.value)}
            placeholder='{ "mes": "2026-10", "articulos": { ... } }'
            style={{ width:"100%", height:120, background:R.fondo, color:R.tinta, fontFamily:MONO,
              fontSize:11, border:`1px solid ${R.linea}`, borderRadius:8, padding:10,
              boxSizing:"border-box", resize:"vertical" }}/>
          <button onClick={cargarPegado}
            style={{ ...btn, marginTop:8, borderColor:R.pendiente, color:R.pendiente }}>
            Cargar
          </button>
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

        {/* Pliego: estado de todos los artículos de un vistazo */}
        <div style={{ width:62, flexShrink:0 }}>
          <p style={{ margin:"0 0 8px", fontFamily:MONO, fontSize:10, color:R.tenue, letterSpacing:1 }}>
            {resueltos}/{total}
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
                    background: est ? colorEstado(est) : R.linea }}/>
                  <span style={{ fontFamily:MONO, fontSize:10.5,
                    color: sel ? R.tinta : R.tenue }}>{String(n+1).padStart(2,"0")}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lo que verá el estudiante */}
        {art
          ? <VistaArticulo art={art} fecha={fecha}/>
          : <p style={{ color:R.suave }}>No hay artículos en el borrador.</p>}

        {/* Panel de veredicto */}
        {art && (
          <div style={{ flex:1, minWidth:270, maxWidth:400 }}>
            <p style={{ margin:0, fontFamily:MONO, fontSize:11, color:R.tenue, letterSpacing:1 }}>
              ARTÍCULO {String(i+1).padStart(2,"0")} DE {String(total).padStart(2,"0")}
            </p>
            <p style={{ margin:"6px 0 16px", fontSize:14, lineHeight:1.5 }}>{art.title}</p>

            <p style={{ margin:"0 0 8px", fontFamily:MONO, fontSize:10.5, color:R.tenue, letterSpacing:1 }}>
              QUÉ ESTÁS VERIFICANDO
            </p>
            <ol style={{ margin:"0 0 18px", paddingLeft:17, fontSize:12, lineHeight:1.85, color:R.suave }}>
              <li>Que las normas citadas existan y digan esto.</li>
              <li>Que el nivel calce con tus estudiantes.</li>
              <li>Que la sección de IA aporte algo real.</li>
              <li>Que se lea bien en pantalla de teléfono.</li>
            </ol>

            <textarea value={nota} onChange={e => setNota(e.target.value)}
              placeholder="Motivo o corrección. Vuelve al generador como instrucción."
              style={{ width:"100%", height:70, background:R.panel, color:R.tinta, fontFamily:FONT,
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
                      color: activo ? R.fondo : v.color,
                      border:`1px solid ${v.color}${activo ? "" : "66"}` }}>
                    {v.etiqueta}
                  </button>
                );
              })}
            </div>

            <div style={{ display:"flex", gap:7, marginBottom:20 }}>
              <button style={{ ...btn, flex:1 }} disabled={i===0}
                onClick={() => setI(n => Math.max(0, n-1))}>← Anterior</button>
              <button style={{ ...btn, flex:1 }} disabled={i>=total-1}
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
              <button onClick={exportar} disabled={!resueltos}
                style={{ ...btn, width:"100%", marginTop:12, padding:"10px",
                  borderColor: resueltos ? R.pendiente : R.linea,
                  color: resueltos ? R.pendiente : R.tenue,
                  cursor: resueltos ? "pointer" : "default" }}>
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
  const esMovil              = useEsMovil();
  const scrollRef            = useRef(null);
  const toast                = useToast();
  const T                    = THEMES[state.theme] ?? THEMES.dark;

  // El mes se deduce de la fecha elegida: cambiar de mes carga otro archivo.
  const mesActual = mesDe(state.selectedKey || hoyKey());
  useEffect(() => {
    let vigente = true;
    cargarMes(mesActual).then(({ articulos:arts, errores }) => {
      if (!vigente) return;
      setArticulos(prev => ({ ...prev, ...arts }));
      setAvisos(errores);
    });
    return () => { vigente = false; };
  }, [mesActual]);

  useEffect(() => {
    storeHydrate(DEFAULT_STATE).then(s => { setStateRaw({ ...s, selectedKey: hoyKey() }); setReady(true); });
  }, []);

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
      default:        return <TodayView   {...props} scrollRef={scrollRef}/>;
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
        overflow:"hidden", display:"flex", flexDirection:"column",
        fontSize:`${state.fontScale}rem`, position:"relative" }}>

        {/* Onboarding */}
        {ready && !state.onboardingDone &&
          <Onboarding onDone={() => setState(s=>({...s,onboardingDone:true}))} T={T}/>}

        {/* Toast */}
        <Toast message={toast.msg} visible={toast.vis}/>

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
              <HeaderCalendar state={state} setState={setState} T={T} articulos={articulos}/>
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
