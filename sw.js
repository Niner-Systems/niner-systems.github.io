/*
 * Service worker for the /order/ PWA.
 *
 * Strategy:
 *   - Pre-cache the /order/ shell so the page can load with no network.
 *   - Cache-first for the shell assets; network-first for everything else.
 *   - Skip caching for API requests entirely — the form's IndexedDB queue
 *     handles offline submission on its own.
 *
 * We register at root scope so the SW can claim /order/ and any future
 * sibling routes. Other pages on the site continue to load normally; this
 * SW deliberately stays out of their way (only intercepts /order/ scope).
 */
const CACHE_VERSION = 'order-shell-v2';
const SHELL_ASSETS = [
	'/order/',
	'/order/index.html',
	'/order/app.js',
	'/css/screen.css',
	'/images/logo-aviation-audio-horizontal-white.svg',
	'/favicon.svg',
	'/site.webmanifest',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_VERSION).then((cache) =>
			cache.addAll(SHELL_ASSETS).catch((err) => {
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

	if (url.hostname === 'api.9ersystems.com') return;
	if (event.request.method !== 'GET') return;
	if (url.origin !== self.location.origin) return;

	const isShellAsset = SHELL_ASSETS.some((p) => url.pathname === p || url.pathname.startsWith('/order/'));
	const isStyleOrLogo = url.pathname === '/css/screen.css'
		|| url.pathname === '/images/logo-aviation-audio-horizontal-white.svg'
		|| url.pathname === '/favicon.svg'
		|| url.pathname === '/site.webmanifest';

	if (!isShellAsset && !isStyleOrLogo) return;

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) {
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
