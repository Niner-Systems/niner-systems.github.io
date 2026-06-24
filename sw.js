/*
 * Service worker for the /preorder/ PWA.
 *
 * Strategy:
 *   - Pre-cache the /preorder/ shell so the iPad can load it with no network.
 *   - Cache-first for the shell assets; network-first for everything else.
 *   - Skip caching for API requests entirely — the form's IndexedDB queue
 *     handles offline submission on its own.
 *
 * We register at root scope so the SW can claim /preorder/ and any future
 * sibling routes. Other pages on the site continue to load normally; this
 * SW deliberately stays out of their way (only intercepts /preorder/ scope).
 */
const CACHE_VERSION = 'preorder-shell-v1';
const SHELL_ASSETS = [
	'/preorder/',
	'/preorder/index.html',
	'/preorder/app.js',
	'/css/screen.css',
	'/images/logo-aviation-audio-horizontal-white.svg',
	'/favicon.svg',
	'/site.webmanifest',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_VERSION).then((cache) =>
			cache.addAll(SHELL_ASSETS).catch((err) => {
				// Don't fail install if a single asset 404s — the page still works.
				console.warn('SW pre-cache partial failure', err);
			})
		)
	);
	self.skipWaiting();
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
		)
	);
	self.clients.claim();
});

self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Don't touch API calls — let the form's queue handle them.
	if (url.hostname === 'api.9ersystems.com') return;

	// Only intercept GET; never cache POST/PUT/DELETE.
	if (event.request.method !== 'GET') return;

	// Only intercept same-origin requests.
	if (url.origin !== self.location.origin) return;

	// Scope guard: only run our caching logic for the preorder shell + its assets.
	const isShellAsset = SHELL_ASSETS.some((p) => url.pathname === p || url.pathname.startsWith('/preorder/'));
	const isStyleOrLogo = url.pathname === '/css/screen.css'
		|| url.pathname === '/images/logo-aviation-audio-horizontal-white.svg'
		|| url.pathname === '/favicon.svg'
		|| url.pathname === '/site.webmanifest';

	if (!isShellAsset && !isStyleOrLogo) return;

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) {
				// Refresh in background so the next load gets the latest.
				fetch(event.request).then((fresh) => {
					if (fresh && fresh.ok) {
						caches.open(CACHE_VERSION).then((c) => c.put(event.request, fresh.clone()));
					}
				}).catch(() => undefined);
				return cached;
			}
			return fetch(event.request).then((fresh) => {
				if (fresh && fresh.ok) {
					const copy = fresh.clone();
					caches.open(CACHE_VERSION).then((c) => c.put(event.request, copy));
				}
				return fresh;
			});
		})
	);
});
