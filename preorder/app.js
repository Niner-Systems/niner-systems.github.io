/*
 * 9er Systems pre-order form — booth-friendly PWA.
 *
 * Architecture:
 *   1. User picks SKUs and a tier, fills out contact info, submits.
 *   2. The submission is written to IndexedDB FIRST with a UUID
 *      (`clientSubmissionId`) as the idempotency key — so we never lose data
 *      to flaky booth wifi.
 *   3. A drain loop tries to POST each queued submission to the backend.
 *      The backend dedupes by clientSubmissionId, so retries are safe.
 *   4. The sync badge shows pending count; turns green when queue is empty.
 *
 * Kiosk mode: append ?kiosk=1 to the URL. Hides nav, auto-resets after submit.
 */
(function () {
	'use strict';

	const API_BASE = 'https://api.9ersystems.com';
	const DB_NAME = '9er-preorder';
	const DB_VERSION = 1;
	const STORE = 'pending_submissions';
	const SUBMIT_URL = API_BASE + '/v1/preorders';

	// Keep in sync with backend/lambda/preorders/catalog.ts
	const CATALOG = [
		{ sku: 'GA2DSUB-1', productLine: 'GA2DSub',    packSize: 1, label: 'GA2DSub',    sub: '1-pack', unitPriceCents: 4995 },
		{ sku: 'GA2DSUB-2', productLine: 'GA2DSub',    packSize: 2, label: 'GA2DSub',    sub: '2-pack', unitPriceCents: 8995 },
		{ sku: 'GA2DSUB-4', productLine: 'GA2DSub',    packSize: 4, label: 'GA2DSub',    sub: '4-pack', unitPriceCents: 16995 },
		{ sku: 'GA2PIG-1',  productLine: 'GA2Pigtail', packSize: 1, label: 'GA2Pigtail', sub: '1-pack', unitPriceCents: 6995 },
		{ sku: 'GA2PIG-2',  productLine: 'GA2Pigtail', packSize: 2, label: 'GA2Pigtail', sub: '2-pack', unitPriceCents: 12995 },
		{ sku: 'GA2PIG-4',  productLine: 'GA2Pigtail', packSize: 4, label: 'GA2Pigtail', sub: '4-pack', unitPriceCents: 23995 },
	];

	// ---- State ----
	const cart = new Map(); // sku -> qty
	let selectedTier = null;
	const isKiosk = new URLSearchParams(location.search).get('kiosk') === '1';

	// ---- Utility ----
	function formatUSD(cents) {
		return '$' + (cents / 100).toFixed(2);
	}

	function uuid() {
		if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
		// Fallback (RFC4122 v4)
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

	function $(id) { return document.getElementById(id); }

	// ---- IndexedDB queue ----
	let dbPromise = null;
	function openDb() {
		if (dbPromise) return dbPromise;
		dbPromise = new Promise((resolve, reject) => {
			const req = indexedDB.open(DB_NAME, DB_VERSION);
			req.onupgradeneeded = () => {
				const db = req.result;
				if (!db.objectStoreNames.contains(STORE)) {
					db.createObjectStore(STORE, { keyPath: 'clientSubmissionId' });
				}
			};
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(req.error);
		});
		return dbPromise;
	}

	async function enqueue(submission) {
		const db = await openDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).put({ ...submission, queuedAt: Date.now() });
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	async function listQueue() {
		const db = await openDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, 'readonly');
			const req = tx.objectStore(STORE).getAll();
			req.onsuccess = () => resolve(req.result || []);
			req.onerror = () => reject(req.error);
		});
	}

	async function removeFromQueue(clientSubmissionId) {
		const db = await openDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).delete(clientSubmissionId);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	// ---- Rendering: SKU tiles ----
	function renderTiles() {
		const grid = $('sku-grid');
		grid.innerHTML = '';
		CATALOG.forEach((item) => {
			const tile = document.createElement('div');
			tile.className = 'sku-tile';
			tile.dataset.sku = item.sku;
			tile.innerHTML = `
				<div class="sku-tile-header">
					<div class="sku-tile-label">${item.label}</div>
					<div class="sku-tile-pack">${item.sub}</div>
				</div>
				<div class="sku-tile-price">${formatUSD(item.unitPriceCents)}</div>
				<div class="sku-tile-qty">
					<button type="button" class="qty-btn" data-act="dec" aria-label="Decrease quantity">−</button>
					<span class="qty-value" data-sku="${item.sku}">0</span>
					<button type="button" class="qty-btn" data-act="inc" aria-label="Increase quantity">+</button>
				</div>
			`;
			grid.appendChild(tile);
		});

		grid.addEventListener('click', (e) => {
			const btn = e.target.closest('.qty-btn');
			if (!btn) return;
			const tile = btn.closest('.sku-tile');
			const sku = tile.dataset.sku;
			const current = cart.get(sku) || 0;
			const delta = btn.dataset.act === 'inc' ? 1 : -1;
			const next = Math.max(0, Math.min(99, current + delta));
			if (next === 0) cart.delete(sku); else cart.set(sku, next);
			updateCart();
		});
	}

	function updateCart() {
		let subtotalCents = 0;
		CATALOG.forEach((item) => {
			const qty = cart.get(item.sku) || 0;
			subtotalCents += qty * item.unitPriceCents;
			const valueEl = document.querySelector(`.qty-value[data-sku="${item.sku}"]`);
			if (valueEl) valueEl.textContent = String(qty);
			const tile = document.querySelector(`.sku-tile[data-sku="${item.sku}"]`);
			if (tile) tile.classList.toggle('selected', qty > 0);
		});

		$('cart-subtotal').textContent = formatUSD(subtotalCents);
		$('cart-deposit').textContent = formatUSD(Math.round(subtotalCents * 0.2));
		$('cart-summary').hidden = subtotalCents === 0;

		updateSubmitState();
	}

	// ---- Tier selection ----
	function bindTiers() {
		const grid = $('tier-grid');
		grid.addEventListener('click', (e) => {
			const card = e.target.closest('.tier-card');
			if (!card) return;
			selectedTier = card.dataset.tier;
			Array.from(grid.querySelectorAll('.tier-card')).forEach((c) => {
				c.classList.toggle('selected', c === card);
			});
			$('ship-fieldset').hidden = selectedTier === 'interest';
			updateSubmitState();
		});
	}

	// ---- Submit gating ----
	function updateSubmitState() {
		const hasItems = Array.from(cart.values()).some((q) => q > 0);
		const canSubmit = hasItems && selectedTier !== null;
		const btn = $('submit-btn');
		btn.disabled = !canSubmit;
		const hint = $('form-hint');
		if (!hasItems) {
			hint.textContent = 'Pick at least one product above.';
		} else if (!selectedTier) {
			hint.textContent = 'Choose a commitment level.';
		} else {
			hint.textContent = selectedTier === 'pay_now'
				? 'Submit — then tap card on the Square Terminal.'
				: selectedTier === 'invoice'
					? 'Submit — we\'ll email a Square invoice with the 20% deposit.'
					: 'Submit — we\'ll add you to the list and email when ready.';
		}
	}

	// ---- Build submission from form ----
	function buildSubmission() {
		const items = [];
		CATALOG.forEach((item) => {
			const qty = cart.get(item.sku) || 0;
			if (qty > 0) items.push({ sku: item.sku, qty });
		});

		const shipNeeded = selectedTier === 'invoice' || selectedTier === 'pay_now';
		const submission = {
			clientSubmissionId: uuid(),
			tier: selectedTier,
			items,
			customerName: $('customerName').value.trim(),
			email: $('email').value.trim(),
			phone: $('phone').value.trim() || undefined,
			notes: $('notes').value.trim() || undefined,
			source: isKiosk ? 'kiosk' : 'web',
		};
		if (shipNeeded) {
			submission.shipAddress = {
				line1: $('ship-line1').value.trim(),
				line2: $('ship-line2').value.trim() || undefined,
				city: $('ship-city').value.trim(),
				state: $('ship-state').value.trim().toUpperCase(),
				zip: $('ship-zip').value.trim(),
			};
		}
		return submission;
	}

	function validateForm(submission) {
		if (!submission.customerName) return 'Name is required';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email)) return 'Valid email is required';
		if (submission.shipAddress) {
			const s = submission.shipAddress;
			if (!s.line1 || !s.city || !s.state || !s.zip) return 'Complete shipping address is required';
			if (s.state.length !== 2) return 'State must be the 2-letter code';
		}
		return null;
	}

	// ---- Toast + UI feedback ----
	let toastTimer = null;
	function showToast(message, kind) {
		const t = $('toast');
		t.textContent = message;
		t.dataset.kind = kind || 'success';
		t.hidden = false;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => { t.hidden = true; }, 4500);
	}

	function resetForm() {
		cart.clear();
		selectedTier = null;
		document.querySelectorAll('.tier-card').forEach((c) => c.classList.remove('selected'));
		$('preorder-form').reset();
		$('ship-fieldset').hidden = true;
		updateCart();
	}

	// ---- Sync queue to backend ----
	let draining = false;
	async function drainQueue() {
		if (draining) return;
		if (!navigator.onLine) { updateBadge(); return; }
		draining = true;
		try {
			const items = await listQueue();
			for (const item of items) {
				const { queuedAt, ...payload } = item;
				try {
					const resp = await fetch(SUBMIT_URL, {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify(payload),
					});
					if (resp.ok) {
						await removeFromQueue(payload.clientSubmissionId);
					} else if (resp.status >= 400 && resp.status < 500) {
						// Permanent failure (validation, etc) — drop it so we don't retry forever.
						await removeFromQueue(payload.clientSubmissionId);
						console.warn('Dropped invalid submission', payload.clientSubmissionId, resp.status);
					} else {
						break; // 5xx — stop draining, try again later
					}
				} catch (err) {
					console.warn('Network error draining queue', err);
					break;
				}
			}
		} finally {
			draining = false;
			updateBadge();
		}
	}

	async function updateBadge() {
		const items = await listQueue();
		const badge = $('sync-badge');
		const count = items.length;
		if (count === 0 && navigator.onLine) {
			badge.dataset.state = 'synced';
			badge.querySelector('.sync-label').textContent = 'Synced';
		} else if (count === 0 && !navigator.onLine) {
			badge.dataset.state = 'offline';
			badge.querySelector('.sync-label').textContent = 'Offline';
		} else {
			badge.dataset.state = 'pending';
			badge.querySelector('.sync-label').textContent = count + ' pending';
		}
		badge.hidden = false;
	}

	// ---- Submit handler ----
	async function onSubmit(e) {
		e.preventDefault();
		const submission = buildSubmission();
		const err = validateForm(submission);
		if (err) {
			showToast(err, 'error');
			return;
		}

		const btn = $('submit-btn');
		btn.disabled = true;

		// Always queue locally first — durability across reloads + offline.
		try {
			await enqueue(submission);
		} catch (qErr) {
			console.error('Failed to enqueue', qErr);
			showToast('Could not save locally — please try again', 'error');
			btn.disabled = false;
			return;
		}

		// Show success immediately (even if we're offline — sync happens later).
		const tierMsg = {
			interest: 'Thanks! We\'ll be in touch.',
			invoice: 'Thanks! Watch your email for the Square invoice.',
			pay_now: 'Submitted — tap your card on the Square Terminal.',
		}[submission.tier];
		showToast(tierMsg + (navigator.onLine ? '' : ' (will sync when online)'), 'success');

		resetForm();

		// Try to drain right away.
		drainQueue();

		// In kiosk mode, briefly disable the form, then auto-reset for next person.
		if (isKiosk) {
			setTimeout(() => { $('customerName').focus(); }, 800);
		}
	}

	// ---- Service worker registration (only for /preorder/) ----
	function registerSw() {
		if (!('serviceWorker' in navigator)) return;
		navigator.serviceWorker.register('/sw.js').catch((err) => {
			console.warn('SW registration failed', err);
		});
	}

	// ---- Kiosk mode ----
	function applyKiosk() {
		if (!isKiosk) return;
		document.body.classList.add('kiosk-mode');
	}

	// ---- Init ----
	document.addEventListener('DOMContentLoaded', () => {
		applyKiosk();
		renderTiles();
		bindTiers();
		updateCart();
		$('preorder-form').addEventListener('submit', onSubmit);
		registerSw();
		updateBadge();
		// Try to drain the queue on load, online, and visibility return.
		drainQueue();
		window.addEventListener('online', () => { drainQueue(); });
		window.addEventListener('offline', () => { updateBadge(); });
		document.addEventListener('visibilitychange', () => {
			if (!document.hidden) drainQueue();
		});
		// Belt-and-suspenders periodic drain (every 30s while page is open).
		setInterval(() => { drainQueue(); }, 30000);
	});
})();
