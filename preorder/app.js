/*
 * 9er Systems pre-order / contact form — booth-friendly PWA.
 *
 * Top-level tier: Customer vs Retailer.
 *   Customer:
 *     - "Pre-Order Now"            → tier='direct_pay_now' (Terminal, FULL amount)
 *     - "Notify Me When Available" → tier='contact_me'     (product checkboxes)
 *   Retailer:                       → tier='retailer_quote' (cart at MSRP, no order)
 *
 * Catalog is fetched live from /v1/preorders/catalog with a hardcoded
 * fallback. Submissions always go to IndexedDB first, then drain to the
 * backend — so flaky booth wifi never loses data.
 */
(function () {
	'use strict';

	const API_BASE = 'https://api.9ersystems.com';
	const SUBMIT_URL = API_BASE + '/v1/preorders';
	const CATALOG_URL = API_BASE + '/v1/preorders/catalog';
	const DB_NAME = '9er-preorder';
	const DB_VERSION = 1;
	const STORE = 'pending_submissions';

	// ---------------------------------------------------------------------
	// Hardcoded fallback catalog. Mirrors backend/lambda/preorders/catalog.ts
	// so the page works on first load if the API is unreachable.
	// ---------------------------------------------------------------------
	const FALLBACK_CATALOG = {
		products: [
			{ productLine: 'GA2DSub',          displayName: 'GA2DSub',           blurb: 'GA dual-plug to DSub PCB converter', preorderable: true },
			{ productLine: 'GA2Pigtail',       displayName: 'GA2Pigtail',        blurb: 'GA dual-plug to bare pigtail wires', preorderable: true },
			{ productLine: 'JackSolderHolder', displayName: 'Jack Solder Holder',blurb: 'Solder holder for aviation jack assembly', preorderable: true },
			{ productLine: 'USB2GA',           displayName: 'USB2GA',            blurb: 'USB-A to GA dual-plug headset adapter', preorderable: true, retailerOnly: true },
			{ productLine: 'USB2Lemo',         displayName: 'USB2Lemo',          blurb: 'USB-A to 6-pin Lemo (panel-powered) headset adapter', preorderable: true, retailerOnly: true },
			{ productLine: 'SoftwareToolbar',  displayName: 'Software Toolbar',  blurb: 'USB2x Toolbar app for desktop', preorderable: false },
		],
		items: [
			{ sku: 'GA2DSUB-1', productLine: 'GA2DSub',          packSize: 1, label: 'GA2DSub (1-pack)',           priceCents: 4995,  pricingTbd: false },
			{ sku: 'GA2DSUB-2', productLine: 'GA2DSub',          packSize: 2, label: 'GA2DSub (2-pack)',           priceCents: 8995,  pricingTbd: false },
			{ sku: 'GA2DSUB-4', productLine: 'GA2DSub',          packSize: 4, label: 'GA2DSub (4-pack)',           priceCents: 16995, pricingTbd: false },
			{ sku: 'GA2PIG-1',  productLine: 'GA2Pigtail',       packSize: 1, label: 'GA2Pigtail (1-pack)',        priceCents: 6995,  pricingTbd: false },
			{ sku: 'GA2PIG-2',  productLine: 'GA2Pigtail',       packSize: 2, label: 'GA2Pigtail (2-pack)',        priceCents: 12995, pricingTbd: false },
			{ sku: 'GA2PIG-4',  productLine: 'GA2Pigtail',       packSize: 4, label: 'GA2Pigtail (4-pack)',        priceCents: 23995, pricingTbd: false },
			{ sku: 'JSH-1',     productLine: 'JackSolderHolder', packSize: 1, label: 'Jack Solder Holder (1-pack)',priceCents: 1495,  pricingTbd: false },
			{ sku: 'JSH-2',     productLine: 'JackSolderHolder', packSize: 2, label: 'Jack Solder Holder (2-pack)',priceCents: 2495,  pricingTbd: false },
			{ sku: 'JSH-4',     productLine: 'JackSolderHolder', packSize: 4, label: 'Jack Solder Holder (4-pack)',priceCents: 3995,  pricingTbd: false },
			{ sku: '216591J',   productLine: 'USB2GA',           packSize: 1, label: 'USB2GA',                     priceCents: 8999,  pricingTbd: false, retailerOnly: true },
			{ sku: 'USB2LEMO-1',productLine: 'USB2Lemo',         packSize: 1, label: 'USB2Lemo',                   priceCents: 12999, pricingTbd: false, retailerOnly: true },
		],
	};

	// ---- State ----
	let catalog = FALLBACK_CATALOG;
	// Separate carts for Customer Pre-Order vs Retailer so switching between
	// the top-level tiers doesn't accidentally carry quantities across.
	const customerCart = new Map();
	const retailerCart = new Map();
	const interestedIn = new Set();
	let tierGroup = null;        // 'customer' | 'retailer'
	let customerIntent = null;   // 'pre_order_now' | 'notify_me'
	const isKiosk = new URLSearchParams(location.search).get('kiosk') === '1';

	// ---- Utility ----
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

	// ---- Tier selection ----
	function bindTierSelectors() {
		$('tier-grid').addEventListener('click', (e) => {
			const card = e.target.closest('.tier-card');
			if (!card) return;
			tierGroup = card.dataset.tierGroup;
			Array.from(document.querySelectorAll('#tier-grid .tier-card')).forEach((c) => {
				c.classList.toggle('selected', c === card);
			});
			$('branch-customer').hidden = tierGroup !== 'customer';
			$('branch-retailer').hidden = tierGroup !== 'retailer';
			// Reset customer intent when switching tiers.
			if (tierGroup !== 'customer') {
				customerIntent = null;
				$('sub-branch-pre-order').hidden = true;
				$('sub-branch-notify').hidden = true;
				Array.from(document.querySelectorAll('#customer-subtier-grid .tier-card')).forEach((c) => c.classList.remove('selected'));
			}
			updateAllSubmitStates();
		});

		$('customer-subtier-grid').addEventListener('click', (e) => {
			const card = e.target.closest('.tier-card');
			if (!card) return;
			customerIntent = card.dataset.customerIntent;
			Array.from(document.querySelectorAll('#customer-subtier-grid .tier-card')).forEach((c) => {
				c.classList.toggle('selected', c === card);
			});
			$('sub-branch-pre-order').hidden = customerIntent !== 'pre_order_now';
			$('sub-branch-notify').hidden = customerIntent !== 'notify_me';
			updateAllSubmitStates();
		});
	}

	// ---- Render product checkboxes (Notify Me) ----
	function renderProductCheckboxes() {
		const container = $('product-checkbox-list');
		container.innerHTML = '';
		catalog.products.forEach((p) => {
			const id = `pc-${p.productLine}`;
			const wrapper = document.createElement('label');
			wrapper.className = 'product-checkbox';
			wrapper.htmlFor = id;
			wrapper.innerHTML = `
				<input type="checkbox" id="${id}" value="${p.productLine}">
				<div class="product-checkbox-text">
					<div class="product-checkbox-name">${escapeHtml(p.displayName)}</div>
					<div class="product-checkbox-blurb">${escapeHtml(p.blurb)}</div>
				</div>
				<div class="product-checkbox-mark"></div>
			`;
			container.appendChild(wrapper);
		});
		container.addEventListener('change', (e) => {
			const target = e.target;
			if (target.type !== 'checkbox') return;
			if (target.checked) interestedIn.add(target.value); else interestedIn.delete(target.value);
			target.closest('.product-checkbox').classList.toggle('selected', target.checked);
			updateNotifyMeSubmitState();
		});
	}

	// ---- Render pre-order product rows (one row per product) ----
	// applyDiscount=true → render MSRP strike-through + discounted price.
	// Used for Customer "Pre-Order Now" only; Retailer view shows MSRP only.
	// includeRetailerOnly=true → also include products/SKUs flagged retailerOnly
	// (e.g. USB2GA, which retailers can quote-request but customers buy
	// elsewhere). False (default) hides them from the Customer cart.
	function renderProductRows(containerId, cart, applyDiscount, includeRetailerOnly) {
		const container = $(containerId);
		container.innerHTML = '';
		const discountPct = (applyDiscount && catalog.customerDiscountPct) ? catalog.customerDiscountPct : 0;
		const preorderableProducts = catalog.products.filter(p => p.preorderable && (includeRetailerOnly || !p.retailerOnly));
		preorderableProducts.forEach((p) => {
			const variants = catalog.items
				.filter(i => i.productLine === p.productLine && (includeRetailerOnly || !i.retailerOnly))
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
						${p.pricingTbd ? '<span class="badge tbd">Pricing provisional</span>' : ''}
					</div>
				</div>
				<div class="product-row-variants">
					${variants.map(v => renderSkuTile(v, discountPct)).join('')}
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
			syncFromInput(cart, tile.dataset.sku, next, containerId);
		});

		container.addEventListener('input', (e) => {
			const input = e.target.closest('.qty-value');
			if (!input) return;
			const cleaned = input.value.replace(/\D/g, '').slice(0, 4);
			if (cleaned !== input.value) input.value = cleaned;
			const value = clampQty(parseInt(cleaned, 10) || 0);
			if (cleaned !== '' && String(value) !== cleaned) input.value = String(value);
			syncFromInput(cart, input.dataset.sku, value, containerId);
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
				syncFromInput(cart, input.dataset.sku, 0, containerId);
			}
		});
	}

	function renderSkuTile(v, discountPct) {
		const tbdMark = v.pricingTbd ? '<small> TBD</small>' : '';
		let priceMarkup;
		if (discountPct > 0 && !v.pricingTbd) {
			const discounted = Math.round(v.priceCents * (1 - discountPct));
			priceMarkup = `
				<div class="sku-tile-price has-discount">
					<span class="msrp">${formatUSD(v.priceCents)}</span>
					<span class="discounted">${formatUSD(discounted)}</span>
				</div>
			`;
		} else {
			priceMarkup = `<div class="sku-tile-price">${formatUSD(v.priceCents)}${tbdMark}</div>`;
		}
		return `
			<div class="sku-tile ${v.pricingTbd ? 'pricing-tbd' : ''}" data-sku="${v.sku}">
				<div class="sku-tile-pack">${v.packSize}-pack</div>
				${priceMarkup}
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

	function syncFromInput(cart, sku, qty, containerId) {
		if (qty <= 0) cart.delete(sku); else cart.set(sku, qty);
		recalcCartTotals(cart, containerId);
	}

	function recalcCartTotals(cart, containerId) {
		let subtotalCents = 0;
		catalog.items.forEach((v) => {
			const qty = cart.get(v.sku) || 0;
			subtotalCents += qty * v.priceCents;
			// Update tile selected styling — scope to the matching container.
			const tile = document.querySelector(`#${containerId} .sku-tile[data-sku="${v.sku}"]`);
			if (tile) tile.classList.toggle('selected', qty > 0);
		});

		if (containerId === 'product-rows-customer') {
			const discountPct = catalog.customerDiscountPct ?? 0;
			const chargeCents = discountPct > 0 ? Math.round(subtotalCents * (1 - discountPct)) : subtotalCents;
			$('cart-total-customer').textContent = formatUSD(chargeCents);
			$('cart-summary-customer').hidden = subtotalCents === 0;
			// Optional: show MSRP-then-strike on cart summary when discount applies.
			const msrpEl = $('cart-msrp-customer');
			const msrpAmt = $('cart-msrp-amount');
			if (msrpEl && msrpAmt) {
				if (discountPct > 0 && subtotalCents > 0) {
					msrpAmt.textContent = formatUSD(subtotalCents);
					msrpEl.hidden = false;
				} else {
					msrpEl.hidden = true;
				}
			}
			updatePreOrderSubmitState();
		} else if (containerId === 'product-rows-retailer') {
			$('cart-total-retailer').textContent = formatUSD(subtotalCents);
			$('cart-summary-retailer').hidden = subtotalCents === 0;
			updateRetailerSubmitState();
		}
	}

	// ---- Submit gating ----
	function updateNotifyMeSubmitState() {
		const has = interestedIn.size > 0;
		$('nm-submit').disabled = !has;
		$('nm-hint').textContent = has
			? 'We\'ll respond from Pete@9erSystems.com.'
			: 'Pick at least one product above.';
	}

	function updatePreOrderSubmitState() {
		const has = Array.from(customerCart.values()).some((q) => q > 0);
		$('cu-submit').disabled = !has;
		$('cu-hint').textContent = has
			? 'Submit — then tap your card on the Square Terminal.'
			: 'Pick at least one product above.';
	}

	function updateRetailerSubmitState() {
		const has = Array.from(retailerCart.values()).some((q) => q > 0);
		$('re-submit').disabled = !has;
		$('re-hint').textContent = has
			? 'Submit — Pete will email a retailer quote.'
			: 'Pick at least one product above.';
	}

	function updateAllSubmitStates() {
		updateNotifyMeSubmitState();
		updatePreOrderSubmitState();
		updateRetailerSubmitState();
	}

	// ---- Build submissions ----
	function buildNotifyMeSubmission() {
		return {
			clientSubmissionId: uuid(),
			tier: 'contact_me',
			interestedIn: Array.from(interestedIn),
			customerName: $('nm-name').value.trim(),
			email: $('nm-email').value.trim(),
			company: $('nm-company').value.trim() || undefined,
			notes: $('nm-notes').value.trim() || undefined,
			source: isKiosk ? 'kiosk' : 'web',
		};
	}

	function buildCustomerPreOrderSubmission() {
		const items = [];
		catalog.items.forEach((v) => {
			const qty = customerCart.get(v.sku) || 0;
			if (qty > 0) items.push({ sku: v.sku, qty });
		});
		return {
			clientSubmissionId: uuid(),
			tier: 'direct_pay_now',
			items,
			customerName: $('cu-name').value.trim(),
			email: $('cu-email').value.trim(),
			notes: $('cu-notes').value.trim() || undefined,
			source: isKiosk ? 'kiosk' : 'web',
			shipAddress: {
				line1: $('cu-ship-line1').value.trim(),
				line2: $('cu-ship-line2').value.trim() || undefined,
				city: $('cu-ship-city').value.trim(),
				state: $('cu-ship-state').value.trim().toUpperCase(),
				zip: $('cu-ship-zip').value.trim(),
			},
		};
	}

	function buildRetailerSubmission() {
		const items = [];
		catalog.items.forEach((v) => {
			const qty = retailerCart.get(v.sku) || 0;
			if (qty > 0) items.push({ sku: v.sku, qty });
		});
		return {
			clientSubmissionId: uuid(),
			tier: 'retailer_quote',
			items,
			customerName: $('re-name').value.trim(),
			email: $('re-email').value.trim(),
			company: $('re-company').value.trim(),
			notes: $('re-notes').value.trim() || undefined,
			source: isKiosk ? 'kiosk' : 'web',
			shipAddress: {
				line1: $('re-ship-line1').value.trim(),
				line2: $('re-ship-line2').value.trim() || undefined,
				city: $('re-ship-city').value.trim(),
				state: $('re-ship-state').value.trim().toUpperCase(),
				zip: $('re-ship-zip').value.trim(),
			},
		};
	}

	function validateNotifyMe(sub) {
		if (!sub.customerName) return 'Name is required';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sub.email)) return 'Valid email is required';
		if (!sub.interestedIn || sub.interestedIn.length === 0) return 'Pick at least one product';
		return null;
	}

	function validateCustomerPreOrder(sub) {
		if (!sub.customerName) return 'Name is required';
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(sub.email)) return 'Valid email is required';
		const s = sub.shipAddress;
		if (!s.line1 || !s.city || !s.state || !s.zip) return 'Complete shipping address is required';
		if (s.state.length !== 2) return 'State must be the 2-letter code';
		return null;
	}

	function validateRetailer(sub) {
		if (!sub.company) return 'Company is required';
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
		customerCart.clear();
		retailerCart.clear();
		interestedIn.clear();
		tierGroup = null;
		customerIntent = null;
		document.querySelectorAll('.tier-card.selected').forEach((c) => c.classList.remove('selected'));
		document.querySelectorAll('.product-checkbox.selected').forEach((c) => c.classList.remove('selected'));
		document.querySelectorAll('.product-checkbox input[type=checkbox]').forEach((cb) => { cb.checked = false; });
		document.querySelectorAll('.sku-tile.selected').forEach((c) => c.classList.remove('selected'));
		document.querySelectorAll('.qty-value').forEach((input) => { input.value = '0'; });
		$('notify-form').reset();
		$('customer-form').reset();
		$('retailer-form').reset();
		$('branch-customer').hidden = true;
		$('branch-retailer').hidden = true;
		$('sub-branch-pre-order').hidden = true;
		$('sub-branch-notify').hidden = true;
		$('cart-summary-customer').hidden = true;
		$('cart-summary-retailer').hidden = true;
		updateAllSubmitStates();
	}

	// ---- Submit handlers ----
	async function onNotifyMeSubmit(e) {
		e.preventDefault();
		const submission = buildNotifyMeSubmission();
		const err = validateNotifyMe(submission);
		if (err) { showToast(err, 'error'); return; }
		await submitWithQueue(submission, 'Thanks — we\'ll let you know.');
	}

	async function onCustomerPreOrderSubmit(e) {
		e.preventDefault();
		const submission = buildCustomerPreOrderSubmission();
		const err = validateCustomerPreOrder(submission);
		if (err) { showToast(err, 'error'); return; }
		await submitWithQueue(submission, 'Submitted — tap your card on the Square Terminal.');
	}

	async function onRetailerSubmit(e) {
		e.preventDefault();
		const submission = buildRetailerSubmission();
		const err = validateRetailer(submission);
		if (err) { showToast(err, 'error'); return; }
		await submitWithQueue(submission, 'Got it — Pete will follow up with a quote.');
	}

	async function submitWithQueue(submission, successMessage) {
		try {
			await enqueue(submission);
		} catch (qErr) {
			console.error('enqueue failed', qErr);
			showToast('Could not save locally — please try again', 'error');
			return;
		}
		showToast(successMessage + (navigator.onLine ? '' : ' (will sync when online)'), 'success');
		resetAll();
		drainQueue();
		if (isKiosk) setTimeout(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, 200);
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

	// ---- Service worker ----
	function registerSw() {
		if (!('serviceWorker' in navigator)) return;
		navigator.serviceWorker.register('/sw.js').catch((err) => console.warn('SW registration failed', err));
	}

	function applyKiosk() {
		if (isKiosk) document.body.classList.add('kiosk-mode');
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
		applyKiosk();
		await loadCatalog();
		renderProductCheckboxes();
		renderProductRows('product-rows-customer', customerCart, true,  false);
		renderProductRows('product-rows-retailer', retailerCart, false, true);
		bindTierSelectors();
		$('notify-form').addEventListener('submit', onNotifyMeSubmit);
		$('customer-form').addEventListener('submit', onCustomerPreOrderSubmit);
		$('retailer-form').addEventListener('submit', onRetailerSubmit);
		registerSw();
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
