/* Tall Taper — store configuration and cart.
   Everything a merchant would change lives in CONFIG. The shape mirrors a
   Shopify product (one product, two variants) so the move to Shopify is a
   matter of pasting variant IDs into `shopifyVariantId` and setting
   `shopify.domain`: checkout then hands off to Shopify's own checkout via a
   cart permalink (https://{domain}/cart/{variantId}:{qty},...). */

const CONFIG = {
  brand: 'Tall Taper',
  email: null, // set to 'hello@talltapercandles.com' once the mailbox exists

  shopify: {
    domain: null, // e.g. 'talltapercandles.myshopify.com' once the store exists
  },

  currencies: {
    EUR: { label: 'EUR €', locale: 'en-IE' },
    USD: { label: 'USD $', locale: 'en-US' },
    GBP: { label: 'GBP £', locale: 'en-GB' },
  },
  defaultCurrency: 'EUR',

  product: {
    handle: 'no-100-one-metre-taper',
    code: 'Nº 100',
    title: 'The One-Metre Taper',
    colour: 'Silk Ivory',
    specs: [
      ['Height', '100 cm · 39⅜ in'],
      ['Base', '2.2 cm · fits standard taper holders'],
      ['Wax', 'Stearin–paraffin blend, made to stand tall'],
      ['Colour', 'Silk ivory, dyed through'],
      ['Wick', 'Braided cotton'],
      ['Burn time', 'About 30 hours'],
      ['Scent', 'None'],
    ],
    variants: [
      {
        id: 'single',
        title: 'Single',
        sub: 'One candle in its own box',
        units: 1,
        sku: 'TT-100-SIV-01',
        shopifyVariantId: null,
        price: { EUR: 45, USD: 52, GBP: 39 },
      },
      {
        id: 'dozen',
        title: 'Dozen',
        sub: 'Twelve candles, one box',
        units: 12,
        sku: 'TT-100-SIV-12',
        shopifyVariantId: null,
        price: { EUR: 395, USD: 449, GBP: 339 },
      },
    ],
  },

  /* Shipping: one parcel per dozen box, up to six singles per parcel.
     price = first + extra * (parcels - 1); free above `freeOver`. */
  shipping: {
    zones: [
      { id: 'FR', name: 'France', days: '2–3 days', first: { EUR: 14.9, USD: 16.9, GBP: 12.9 }, firstDozen: { EUR: 19.9, USD: 22.5, GBP: 16.9 }, extra: { EUR: 12, USD: 13.5, GBP: 10 }, freeOver: { EUR: 395, USD: 449, GBP: 339 } },
      { id: 'EU', name: 'European Union', days: '3–5 days', first: { EUR: 24.9, USD: 27.9, GBP: 21.5 }, firstDozen: { EUR: 34.9, USD: 39, GBP: 29.9 }, extra: { EUR: 22, USD: 25, GBP: 19 }, freeOver: { EUR: 790, USD: 898, GBP: 678 } },
      { id: 'UK', name: 'United Kingdom', days: '3–6 days', first: { EUR: 29.9, USD: 33.5, GBP: 25.5 }, firstDozen: { EUR: 39.9, USD: 45, GBP: 34 }, extra: { EUR: 28, USD: 31, GBP: 24 }, freeOver: null },
      { id: 'NA', name: 'United States, Canada', days: '5–8 days', first: { EUR: 69, USD: 77, GBP: 59 }, firstDozen: { EUR: 139, USD: 156, GBP: 119 }, extra: { EUR: 99, USD: 111, GBP: 84 }, freeOver: null },
      { id: 'ROW', name: 'Rest of world', days: '5–10 days', first: { EUR: 79, USD: 89, GBP: 68 }, firstDozen: { EUR: 159, USD: 178, GBP: 135 }, extra: { EUR: 119, USD: 134, GBP: 101 }, freeOver: null },
    ],
    singlesPerParcel: 6,
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
function shippingQuote(items, zoneId, currency, subtotal) {
  const z = CONFIG.shipping.zones.find(x => x.id === zoneId);
  const singles = items.single || 0;
  const dozens = items.dozen || 0;
  const parcels = dozens + Math.ceil(singles / CONFIG.shipping.singlesPerParcel);
  if (!parcels) return 0;
  if (z.freeOver && subtotal >= z.freeOver[currency]) return 0;
  const first = dozens ? z.firstDozen[currency] : z.first[currency];
  return first + z.extra[currency] * (parcels - 1);
}

/* ---------- cart ---------- */
class Cart {
  constructor() {
    this.items = Store.get('tt.cart', {}); // { variantId: qty }
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
    return Object.entries(this.items).map(([id, qty]) => {
      const v = this.variant(id);
      return { v, qty, total: v.price[this.currency] * qty };
    }).filter(l => l.v);
  }
  count() { return this.lines().reduce((n, l) => n + l.qty, 0); }
  candles() { return this.lines().reduce((n, l) => n + l.qty * l.v.units, 0); }
  subtotal() { return this.lines().reduce((s, l) => s + l.total, 0); }
  shipping(zoneId = this.zone) { return shippingQuote(this.items, zoneId, this.currency, this.subtotal()); }
  checkoutUrl() {
    const d = CONFIG.shopify.domain;
    const ready = d && this.lines().every(l => l.v.shopifyVariantId);
    if (!ready) return null;
    const parts = this.lines().map(l => `${l.v.shopifyVariantId}:${l.qty}`).join(',');
    return `https://${d}/cart/${parts}`;
  }
}
