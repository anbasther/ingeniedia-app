// Service worker de IngenieDía.
// Guarda la app en el teléfono para que abra sin conexión, pero siempre
// intenta primero la red: así cada artículo nuevo y cada versión nueva de la
// app llegan en cuanto hay internet. Al cambiar la app, subir VERSION.
const VERSION = "v2";
const CACHE = `ingeniedia-${VERSION}`;
const BASE = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

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

self.addEventListener("fetch", e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate")            return e.respondWith(redPrimero(req, "/"));
  if (url.pathname.startsWith("/assets/")) return e.respondWith(guardadoPrimero(req));
  e.respondWith(redPrimero(req));
});

// Aviso diario: llega desde /api/aviso-diario.
self.addEventListener("push", e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch { d = { body: e.data && e.data.text() }; }
  e.waitUntil(self.registration.showNotification(d.title || "IngenieDía", {
    body: d.body || "Ya está el artículo de hoy.",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: "articulo-del-dia",   // un aviso nuevo reemplaza al anterior
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
