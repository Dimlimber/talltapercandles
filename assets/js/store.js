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
        price: { EUR: 19, USD: 22, GBP: 17 },
      },
      {
        id: 'dozen',
        title: 'Dozen',
        sub: 'Twelve candles, one box',
        units: 12,
        sku: 'TT-100-SIV-12',
        shopifyVariantId: null,
        price: { EUR: 180, USD: 204, GBP: 156 },
      },
    ],
  },

  /* Shipping: one parcel per dozen box, up to six singles per parcel.
     price = first + extra * (parcels - 1); free above `freeOver`. */
  shipping: {
    zones: [
      { id: 'FR', name: 'France', days: '2–3 days', first: { EUR: 9, USD: 10, GBP: 8 }, firstDozen: { EUR: 14, USD: 16, GBP: 12 }, extra: { EUR: 9, USD: 10, GBP: 8 }, freeOver: { EUR: 300, USD: 340, GBP: 260 } },
      { id: 'EU', name: 'European Union', days: '3–5 days', first: { EUR: 15, USD: 17, GBP: 13 }, firstDozen: { EUR: 24, USD: 27, GBP: 21 }, extra: { EUR: 16, USD: 18, GBP: 14 }, freeOver: { EUR: 450, USD: 510, GBP: 390 } },
      { id: 'UK', name: 'UK, Switzerland, Norway', days: '3–6 days', first: { EUR: 22, USD: 25, GBP: 19 }, firstDozen: { EUR: 36, USD: 41, GBP: 31 }, extra: { EUR: 24, USD: 27, GBP: 21 }, freeOver: null },
      { id: 'NA', name: 'United States, Canada', days: '4–7 days', first: { EUR: 28, USD: 32, GBP: 24 }, firstDozen: { EUR: 48, USD: 54, GBP: 42 }, extra: { EUR: 34, USD: 38, GBP: 29 }, freeOver: null },
      { id: 'ROW', name: 'Rest of world', days: '5–10 days', first: { EUR: 38, USD: 43, GBP: 33 }, firstDozen: { EUR: 65, USD: 74, GBP: 56 }, extra: { EUR: 45, USD: 51, GBP: 39 }, freeOver: null },
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
