(function () {
	'use strict';

	const API_BASE = 'https://api.9ersystems.com';
	const SUBMIT_URL = API_BASE + '/v1/preorders';
	const CATALOG_URL = API_BASE + '/v1/preorders/catalog';
	const DB_NAME = '9er-order';
	const DB_VERSION = 1;
	const STORE = 'pending_submissions';

	const FALLBACK_CATALOG = {
		products: [
			{ productLine: 'GA2DSub',    displayName: 'GA2DSub',    blurb: 'GA dual-plug to DSub PCB converter', preorderable: true },
			{ productLine: 'USB2GA',     displayName: 'USB2GA',     blurb: 'USB-A to GA dual-plug headset adapter', preorderable: true, retailerOnly: true },
			{ productLine: 'USB2Lemo',   displayName: 'USB2Lemo',   blurb: 'USB-A to 6-pin Lemo (panel-powered) headset adapter', preorderable: true, retailerOnly: true },
		],
		items: [
			{ sku: 'GA2DSUB-1', productLine: 'GA2DSub', packSize: 1, label: 'GA2DSub (1-pack)',  priceCents: 4995,  pricingTbd: false },
			{ sku: 'GA2DSUB-2', productLine: 'GA2DSub', packSize: 2, label: 'GA2DSub (2-pack)',  priceCents: 8995,  pricingTbd: false },
			{ sku: 'GA2DSUB-4', productLine: 'GA2DSub', packSize: 4, label: 'GA2DSub (4-pack)',  priceCents: 16995, pricingTbd: false },
			{ sku: '216591J',   productLine: 'USB2GA',  packSize: 1, label: 'USB2GA',            priceCents: 8999,  pricingTbd: false, retailerOnly: true },
			{ sku: 'USB2LEMO-1',productLine: 'USB2Lemo',packSize: 1, label: 'USB2Lemo',          priceCents: 12999, pricingTbd: false, retailerOnly: true },
		],
	};

	// Product lines to show on this order page
	const ALLOWED_PRODUCT_LINES = new Set(['GA2DSub', 'USB2GA', 'USB2Lemo']);

	let catalog = FALLBACK_CATALOG;
	const cart = new Map();

	function $(id) { return document.getElementById(id); }
	function formatUSD(cents) { return '$' + (cents / 100).toFixed(2); }
	function uuid() {
		if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
		return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
			const r = (Math.random() * 16) | 0;
			const v = c === 'x' ? r : (r & 0x3) | 0x8;
			return v.toString(16);
		});
	}

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

	async function removeFromQueue(id) {
		const db = await openDb();
		return new Promise((resolve, reject) => {
			const tx = db.transaction(STORE, 'readwrite');
			tx.objectStore(STORE).delete(id);
			tx.oncomplete = () => resolve();
			tx.onerror = () => reject(tx.error);
		});
	}

	// ---- Catalog loading ----
	async function loadCatalog() {
		try {
			const resp = await fetch(CATALOG_URL, { cache: 'no-store' });
			if (resp.ok) {
				const body = await resp.json();
				if (body?.data?.items?.length) catalog = body.data;
			}
		} catch (err) {
			console.warn('Catalog fetch failed, using fallback', err);
		}
	}

	// ---- Render product rows ----
	function renderProductRows() {
		const container = $('product-rows');
		container.innerHTML = '';
		container.removeAttribute('aria-busy');
		const products = catalog.products.filter(p => p.preorderable && ALLOWED_PRODUCT_LINES.has(p.productLine));
		products.forEach((p) => {
			const variants = catalog.items
				.filter(i => i.productLine === p.productLine)
				.sort((a, b) => a.packSize - b.packSize);

			const row = document.createElement('div');
			row.className = 'product-row';
			row.dataset.productLine = p.productLine;
			row.innerHTML = `
				<div class="product-row-header">
					${p.imageUrl ? `<img class="product-row-image" src="${escapeHtml(p.imageUrl)}" alt="${escapeHtml(p.displayName)}" loading="lazy">` : ''}
					<div class="product-row-header-text">
						<h3 class="product-row-name">${escapeHtml(p.displayName)}</h3>
						<p class="product-row-blurb">${escapeHtml(p.blurb)}</p>
					</div>
				</div>
				<div class="product-row-variants">
					${variants.map(v => renderSkuTile(v)).join('')}
				</div>
			`;
			container.appendChild(row);
		});

		container.addEventListener('click', (e) => {
			const btn = e.target.closest('.qty-btn');
			if (!btn) return;
			const tile = btn.closest('.sku-tile');
			const input = tile.querySelector('.qty-value');
			const current = parseInt(input.value, 10) || 0;
			const delta = btn.dataset.act === 'inc' ? 1 : -1;
			const next = clampQty(current + delta);
			input.value = String(next);
			syncFromInput(tile.dataset.sku, next);
		});

		container.addEventListener('input', (e) => {
			const input = e.target.closest('.qty-value');
			if (!input) return;
			const cleaned = input.value.replace(/\D/g, '').slice(0, 4);
			if (cleaned !== input.value) input.value = cleaned;
			const value = clampQty(parseInt(cleaned, 10) || 0);
			if (cleaned !== '' && String(value) !== cleaned) input.value = String(value);
			syncFromInput(input.dataset.sku, value);
		});

		container.addEventListener('focusin', (e) => {
			const input = e.target.closest('.qty-value');
			if (input) input.select();
		});

		container.addEventListener('focusout', (e) => {
			const input = e.target.closest('.qty-value');
			if (!input) return;
			if (input.value === '' || isNaN(parseInt(input.value, 10))) {
				input.value = '0';
				syncFromInput(input.dataset.sku, 0);
			}
		});
	}

	function renderSkuTile(v) {
		return `
			<div class="sku-tile" data-sku="${v.sku}">
				<div class="sku-tile-pack">${v.packSize > 1 ? v.packSize + '-pack' : ''}</div>
				<div class="sku-tile-price">${formatUSD(v.priceCents)}</div>
				<div class="sku-tile-qty">
					<button type="button" class="qty-btn" data-act="dec" aria-label="Decrease quantity">−</button>
					<input type="number" class="qty-value" data-sku="${v.sku}" value="0" min="0" max="9999" step="1" inputmode="numeric" pattern="[0-9]*" aria-label="Quantity for ${escapeHtml(v.label)}">
					<button type="button" class="qty-btn" data-act="inc" aria-label="Increase quantity">+</button>
				</div>
			</div>
		`;
	}

	function clampQty(n) {
		if (!Number.isFinite(n)) return 0;
		return Math.max(0, Math.min(9999, Math.floor(n)));
	}

	function syncFromInput(sku, qty) {
		if (qty <= 0) cart.delete(sku); else cart.set(sku, qty);
		recalcCartTotals();
	}

	function recalcCartTotals() {
		let subtotalCents = 0;
		catalog.items.forEach((v) => {
			const qty = cart.get(v.sku) || 0;
			subtotalCents += qty * v.priceCents;
			const tile = document.querySelector(`#product-rows .sku-tile[data-sku="${v.sku}"]`);
			if (tile) tile.classList.toggle('selected', qty > 0);
		});
		$('cart-total').textContent = formatUSD(subtotalCents);
		$('cart-summary').hidden = subtotalCents === 0;
		updateSubmitState();
	}

	// ---- Submit gating ----
	function updateSubmitState() {
		const has = Array.from(cart.values()).some((q) => q > 0);
		$('cu-submit').disabled = !has;
		$('cu-hint').textContent = has
			? 'Submit — we\'ll email you a secure Square invoice to complete your order.'
			: 'Pick at least one product above.';
	}

	// ---- Build submission ----
	function buildSubmission() {
		const items = [];
		catalog.items.forEach((v) => {
			const qty = cart.get(v.sku) || 0;
			if (qty > 0) items.push({ sku: v.sku, qty });
		});
		return {
			clientSubmissionId: uuid(),
			tier: 'direct_pay_now',
			items,
			customerName: $('cu-name').value.trim(),
			email: $('cu-email').value.trim(),
			notes: $('cu-notes').value.trim() || undefined,
			source: 'web',
			shipAddress: {
				line1: $('cu-ship-line1').value.trim(),
				line2: $('cu-ship-line2').value.trim() || undefined,
				city: $('cu-ship-city').value.trim(),
				state: $('cu-ship-state').value.trim().toUpperCase(),
				zip: $('cu-ship-zip').value.trim(),
			},
		};
	}

	function validate(sub) {
		if (!sub.customerName) return 'Name is required';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sub.email)) return 'Valid email is required';
		const s = sub.shipAddress;
		if (!s.line1 || !s.city || !s.state || !s.zip) return 'Complete shipping address is required';
		if (s.state.length !== 2) return 'State must be the 2-letter code';
		return null;
	}

	// ---- UI feedback ----
	let toastTimer = null;
	function showToast(message, kind) {
		const t = $('toast');
		t.textContent = message;
		t.dataset.kind = kind || 'success';
		t.hidden = false;
		clearTimeout(toastTimer);
		toastTimer = setTimeout(() => { t.hidden = true; }, 4500);
	}

	function resetAll() {
		cart.clear();
		document.querySelectorAll('.sku-tile.selected').forEach((c) => c.classList.remove('selected'));
		document.querySelectorAll('.qty-value').forEach((input) => { input.value = '0'; });
		$('order-form').reset();
		$('cart-summary').hidden = true;
		updateSubmitState();
	}

	// ---- Thank-you modal ----
	const THANKS_AUTOCLOSE_MS = 30000;
	let thanksAutocloseTimer = null;
	let thanksCountdownTimer = null;

	function openThanksModal() {
		const modal = $('thanks-modal');
		if (!modal) return;
		modal.hidden = false;
		document.body.classList.add('thanks-modal-open');
		const closeBtn = $('thanks-modal-close');
		if (closeBtn) closeBtn.focus();

		let remaining = Math.round(THANKS_AUTOCLOSE_MS / 1000);
		const note = $('thanks-modal-autoclose');
		const renderNote = () => {
			if (note) note.textContent = `Closing in ${remaining}s…`;
		};
		renderNote();

		clearTimeout(thanksAutocloseTimer);
		clearInterval(thanksCountdownTimer);
		thanksCountdownTimer = setInterval(() => {
			remaining -= 1;
			if (remaining <= 0) {
				clearInterval(thanksCountdownTimer);
				return;
			}
			renderNote();
		}, 1000);
		thanksAutocloseTimer = setTimeout(closeThanksModal, THANKS_AUTOCLOSE_MS);
	}

	function closeThanksModal() {
		const modal = $('thanks-modal');
		if (!modal) return;
		clearTimeout(thanksAutocloseTimer);
		clearInterval(thanksCountdownTimer);
		thanksAutocloseTimer = null;
		thanksCountdownTimer = null;
		modal.hidden = true;
		document.body.classList.remove('thanks-modal-open');
	}

	function bindThanksModal() {
		const modal = $('thanks-modal');
		if (!modal) return;
		modal.addEventListener('click', (e) => {
			if (e.target.closest('[data-thanks-close]')) closeThanksModal();
		});
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape' && !modal.hidden) closeThanksModal();
		});
	}

	// ---- Submit handler ----
	async function onSubmit(e) {
		e.preventDefault();
		const submission = buildSubmission();
		const err = validate(submission);
		if (err) { showToast(err, 'error'); return; }
		try {
			await enqueue(submission);
		} catch (qErr) {
			console.error('enqueue failed', qErr);
			showToast('Could not save locally — please try again', 'error');
			return;
		}
		resetAll();
		openThanksModal();
		drainQueue();
	}

	// ---- Sync queue ----
	let draining = false;
	async function drainQueue() {
		if (draining || !navigator.onLine) { updateBadge(); return; }
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
						await removeFromQueue(payload.clientSubmissionId);
						console.warn('Dropped invalid submission', payload.clientSubmissionId, resp.status);
					} else {
						break;
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
		const label = badge.querySelector('.sync-label');
		if (count === 0 && navigator.onLine) {
			badge.dataset.state = 'synced'; label.textContent = 'Synced';
		} else if (count === 0 && !navigator.onLine) {
			badge.dataset.state = 'offline'; label.textContent = 'Offline';
		} else {
			badge.dataset.state = 'pending'; label.textContent = count + ' pending';
		}
		badge.hidden = false;
	}

	function escapeHtml(s) {
		return String(s)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	// ---- Init ----
	document.addEventListener('DOMContentLoaded', async () => {
		await loadCatalog();
		renderProductRows();
		bindThanksModal();
		$('order-form').addEventListener('submit', onSubmit);
		updateBadge();
		drainQueue();
		window.addEventListener('online', () => drainQueue());
		window.addEventListener('offline', () => updateBadge());
		document.addEventListener('visibilitychange', () => {
			if (!document.hidden) drainQueue();
		});
		setInterval(() => drainQueue(), 30000);
	});
})();
