// Service worker de IngenieDía.
// Inicio instantáneo (v0.6.1): la página de la app, la letra y los íconos se
// abren desde lo guardado en el teléfono, sin esperar a internet, y se
// actualizan por detrás para la próxima vez. Los artículos (/contenido) y los
// datos (/api) siempre van primero a la red. Al cambiar la app, subir VERSION.
const VERSION = "v9";
const CACHE = `ingeniedia-${VERSION}`;
const BASE = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png",
              "/fonts/ibm-plex-sans-500.woff2", "/fonts/ibm-plex-sans-700.woff2"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k.startsWith("ingeniedia-") && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Red primero; si no hay conexión, lo último guardado.
async function redPrimero(req, respaldo) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(respaldo || req, res.clone());
    return res;
  } catch {
    return (await cache.match(respaldo || req)) || Response.error();
  }
}

// Archivos con huella en el nombre (/assets/…): nunca cambian, se sirven del teléfono.
async function guardadoPrimero(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

// Guardado primero y actualización por detrás: abre al instante y la próxima
// vez ya trae la versión nueva. Sin nada guardado, espera a la red.
async function guardadoYActualiza(e, req, clave) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(clave || req);
  const red = fetch(req).then(res => {
    if (res.ok) cache.put(clave || req, res.clone());
    return res;
  });
  if (hit) { e.waitUntil(red.catch(() => {})); return hit; }
  return red;
}

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  // Navegación: cada página se guarda con su propia dirección (la app en "/",
  // la política en "/privacidad"). Sin conexión, si no está guardada, abre la app.
  // La app ("/") abre desde el teléfono; las demás páginas (privacidad,
  // términos, resultados) siguen yendo primero a la red.
  if (req.mode === "navigate" && url.pathname === "/") return e.respondWith(
    guardadoYActualiza(e, req, "/").catch(() => caches.match("/").then(a => a || Response.error()))
  );
  if (req.mode === "navigate") return e.respondWith(
    redPrimero(req).then(r => r.type === "error" ? caches.match("/").then(a => a || r) : r)
  );
  if (url.pathname.startsWith("/assets/")) return e.respondWith(guardadoPrimero(req));
  if (url.pathname.startsWith("/fonts/") || url.pathname.startsWith("/icons/"))
    return e.respondWith(guardadoYActualiza(e, req));
  e.respondWith(redPrimero(req));
});

// Avisos: el del artículo llega desde /api/aviso-diario (12:00) y el
// recordatorio de racha desde /api/aviso-racha (20:00).
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "IngenieDía", {
    body: d.body || "Ya está el artículo de hoy.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: d.tag || "articulo-del-dia",   // un aviso nuevo del mismo tipo reemplaza al anterior
    data: { url: d.url || "/" },
  }));
});

// Al tocar el aviso: abre la app (o la trae al frente si ya estaba abierta).
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(ws => {
    const w = ws.find(c => new URL(c.url).origin === location.origin);
    return w ? w.focus() : self.clients.openWindow(url);
  }));
});
