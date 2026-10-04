/* Tall Taper — store configuration and cart.
   Everything a merchant would change lives in CONFIG. The shape mirrors a
   Shopify product with two options (Height, Format) and four variants, so
   the move to Shopify is a matter of pasting variant IDs into
   `shopifyVariantId` and setting `shopify.domain`: checkout then hands off
   to Shopify's own checkout via a cart permalink
   (https://{domain}/cart/{variantId}:{qty},...). */

const CONFIG = {
  brand: 'Tall Taper',
  email: null, // set to 'hello@talltapercandles.com' once the mailbox exists

  shopify: {
    domain: null, // e.g. 'talltapercandles.myshopify.com' once the store exists
  },

  currencies: {
    EUR: { label: 'EUR €', locale: 'en-IE', fx: 1 },
    USD: { label: 'USD $', locale: 'en-US', fx: 1.12 },
    GBP: { label: 'GBP £', locale: 'en-GB', fx: 0.86 },
  },
  defaultCurrency: 'EUR',

  product: {
    handle: 'tall-taper',
    colour: 'Silk Ivory',
    tradeDiscount: 0.2, // dozens only
    heights: [
      { id: '100', code: 'Nº 100', name: 'The One-Metre Taper', cm: 100, inches: '39⅜', burn: 'About 30 hours', flame: 'about 1.85 m' },
      { id: '75', code: 'Nº 75', name: 'The Three-Quarter Taper', cm: 75, inches: '29½', burn: 'About 22 hours', flame: 'about 1.6 m' },
    ],
    specs: [
      ['Base', '2.2 cm · fits standard taper holders'],
      ['Wax', 'Stearin–paraffin blend, made to stand tall'],
      ['Colour', 'Silk ivory, dyed through'],
      ['Wick', 'Braided cotton'],
      ['Scent', 'None'],
    ],
    // a dozen costs the same as ten singles
    variants: [
      { id: '100-single', height: '100', format: 'single', title: 'Single', sub: 'One candle in its own box', units: 1, sku: 'TT-100-SIV-01', shopifyVariantId: null, price: { EUR: 25, USD: 28, GBP: 22 } },
      { id: '100-dozen', height: '100', format: 'dozen', title: 'Dozen', sub: 'Twelve candles for the price of ten', units: 12, sku: 'TT-100-SIV-12', shopifyVariantId: null, price: { EUR: 250, USD: 280, GBP: 220 } },
      { id: '75-single', height: '75', format: 'single', title: 'Single', sub: 'One candle in its own box', units: 1, sku: 'TT-075-SIV-01', shopifyVariantId: null, price: { EUR: 20, USD: 22, GBP: 17 } },
      { id: '75-dozen', height: '75', format: 'dozen', title: 'Dozen', sub: 'Twelve candles for the price of ten', units: 12, sku: 'TT-075-SIV-12', shopifyVariantId: null, price: { EUR: 200, USD: 220, GBP: 170 } },
    ],
  },

  /* Shipping, in EUR (other currencies converted at `fx`), charged on top of
     the candles at roughly what the carrier charges us.
     One parcel per dozen box; up to six singles of one height share a parcel.
     The most expensive parcel pays its full rate; each further parcel pays
     its height's `extra`. The Nº 75 box is under a metre, so no oversize fees. */
  shipping: {
    singlesPerParcel: 6,
    zones: [
      { id: 'FR', name: 'France', days: '2–3 days', rates: { 100: { single: 15.9, dozen: 23.9, extra: 15 }, 75: { single: 9.9, dozen: 16.9, extra: 9 } } },
      { id: 'EU', name: 'European Union', days: '3–5 days', rates: { 100: { single: 24.9, dozen: 34.9, extra: 25 }, 75: { single: 19.9, dozen: 29.9, extra: 18 } } },
      { id: 'UK', name: 'United Kingdom', days: '3–6 days', rates: { 100: { single: 29.9, dozen: 44.9, extra: 30 }, 75: { single: 24.9, dozen: 34.9, extra: 24 } } },
      { id: 'NA', name: 'United States, Canada', days: '5–8 days', rates: { 100: { single: 69, dozen: 149, extra: 110 }, 75: { single: 49, dozen: 99, extra: 80 } } },
      { id: 'ROW', name: 'Rest of world', days: '5–10 days', rates: { 100: { single: 79, dozen: 159, extra: 119 }, 75: { single: 59, dozen: 119, extra: 90 } } },
    ],
  },

  /* Planner: candles per guest at each density */
  densities: [
    { id: 'airy', name: 'Airy', perGuest: 0.5, note: 'A candle for every two guests' },
    { id: 'classic', name: 'Classic', perGuest: 0.75, note: 'Three candles for every four guests' },
    { id: 'lush', name: 'Lush', perGuest: 1.25, note: 'A candle for every guest, and then some' },
  ],
};

/* ---------- money ---------- */
const Money = {
  format(amount, currency) {
    const c = CONFIG.currencies[currency];
    const whole = Number.isInteger(amount);
    return new Intl.NumberFormat(c.locale, {
      style: 'currency', currency,
      minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2,
    }).format(amount);
  },
  // EUR shipping amounts shown in another currency, rounded to the half unit
  convert(eur, currency) {
    if (currency === 'EUR') return eur;
    return Math.round(eur * CONFIG.currencies[currency].fx * 2) / 2;
  },
};

/* ---------- safe storage ---------- */
const Store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* private mode */ }
  },
};

/* ---------- shipping ---------- */
function shippingQuote(items, zoneId, currency) {
  const z = CONFIG.shipping.zones.find(x => x.id === zoneId);
  const parcels = [];
  CONFIG.product.heights.forEach(h => {
    const singles = items[`${h.id}-single`] || 0;
    const dozens = items[`${h.id}-dozen`] || 0;
    for (let i = 0; i < dozens; i++) parcels.push({ h: h.id, full: z.rates[h.id].dozen });
    for (let i = 0; i < Math.ceil(singles / CONFIG.shipping.singlesPerParcel); i++) parcels.push({ h: h.id, full: z.rates[h.id].single });
  });
  if (!parcels.length) return 0;
  parcels.sort((a, b) => b.full - a.full);
  const eur = parcels.reduce((sum, p, i) => sum + (i === 0 ? p.full : z.rates[p.h].extra), 0);
  return Money.convert(Math.round(eur * 100) / 100, currency);
}

/* ---------- cart ---------- */
// carts saved by earlier versions of the preview
const LEGACY = { single: ['100-single', 1], dozen: ['100-dozen', 1], pair: ['100-single', 2] };

class Cart {
  constructor() {
    const saved = Store.get('tt.cart', {}); // { variantId: qty }
    this.items = {};
    Object.entries(saved).forEach(([id, qty]) => {
      const [to, mult] = LEGACY[id] || [id, 1];
      if (this.variant(to)) this.items[to] = (this.items[to] || 0) + qty * mult;
    });
    this.currency = Store.get('tt.currency', CONFIG.defaultCurrency);
    this.zone = Store.get('tt.zone', 'FR');
    this.listeners = [];
  }
  onChange(fn) { this.listeners.push(fn); }
  emit() {
    Store.set('tt.cart', this.items);
    Store.set('tt.currency', this.currency);
    Store.set('tt.zone', this.zone);
    this.listeners.forEach(fn => fn(this));
  }
  variant(id) { return CONFIG.product.variants.find(v => v.id === id); }
  add(id, qty = 1) { this.items[id] = (this.items[id] || 0) + qty; this.emit(); }
  set(id, qty) { if (qty <= 0) delete this.items[id]; else this.items[id] = qty; this.emit(); }
  setCurrency(c) { this.currency = c; this.emit(); }
  setZone(z) { this.zone = z; this.emit(); }
  lines() {
    return Object.entries(this.items)
      .map(([id, qty]) => ({ v: this.variant(id), qty }))
      .filter(l => l.v)
      .map(l => ({ ...l, total: l.v.price[this.currency] * l.qty }));
  }
  count() { return this.lines().reduce((n, l) => n + l.qty, 0); }
  candles() { return this.lines().reduce((n, l) => n + l.qty * l.v.units, 0); }
  subtotal() { return this.lines().reduce((s, l) => s + l.total, 0); }
  shipping(zoneId = this.zone) { return shippingQuote(this.items, zoneId, this.currency); }
  checkoutUrl() {
    const d = CONFIG.shopify.domain;
    const ready = d && this.lines().every(l => l.v.shopifyVariantId);
    if (!ready) return null;
    const parts = this.lines().map(l => `${l.v.shopifyVariantId}:${l.qty}`).join(',');
    return `https://${d}/cart/${parts}`;
  }
}
