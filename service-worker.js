const CACHE_NAME = "finance-mangmt-v42";
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/styles.css?v=26",
  "/translations.js?v=1",
  "/app.js?v=41",
  "/manifest.webmanifest",
  "/assets/logo-white.png",
  "/assets/logo-green-dark.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const oldKeys = keys.filter((key) => key !== CACHE_NAME);
      await Promise.all(oldKeys.map((key) => caches.delete(key)));
      await self.clients.claim();

      if (oldKeys.length) {
        const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
        await Promise.all(clients.map((client) => {
          client.postMessage({ type: "APP_UPDATED", cacheName: CACHE_NAME });
          return "navigate" in client ? client.navigate(client.url).catch(() => null) : Promise.resolve();
        }));
      }
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.startsWith("/api/")) return;

  if (event.request.mode === "navigate" || isNetworkFirstRequest(requestUrl)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (event.request.method === "GET" && response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isNetworkFirstRequest(url) {
  return url.pathname === "/"
    || url.pathname.endsWith(".html")
    || url.pathname.endsWith(".js")
    || url.pathname.endsWith(".css")
    || url.pathname.endsWith(".webmanifest");
}

async function networkFirst(request) {
  const fallback = request.mode === "navigate" ? await caches.match("/index.html") : await caches.match(request);
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return fallback || caches.match("/index.html");
  }
}
