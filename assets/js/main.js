/* Tall Taper — drawings and interactions.
   All drawings are in millimetres (1 SVG unit = 1 mm) so every candle,
   holder and table is to scale. */

const cart = new Cart();
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n, c = cart.currency) => Money.format(n, c);
const P = CONFIG.product;
const V = id => P.variants.find(v => v.id === id);

/* ============================================================
   Drawing primitives
   ============================================================ */

let flameSeed = 0;
function flame(x, y, { fh = 40, fw = 13, delay } = {}) {
  const d = delay ?? ((flameSeed++ * 0.37) % 2.4);
  const dur = 2.8 + ((flameSeed * 0.53) % 1.4);
  const outer = `M0 0 C${-fw * .56} ${-fh * .08} ${-fw * .5} ${-fh * .52} 0 ${-fh} C${fw * .5} ${-fh * .52} ${fw * .56} ${-fh * .08} 0 0Z`;
  const ch = fh * .56, cw = fw * .48;
  const core = `M0 ${-fh * .05} C${-cw * .56} ${-fh * .1} ${-cw * .5} ${-ch * .6} 0 ${-ch} C${cw * .5} ${-ch * .6} ${cw * .56} ${-fh * .1} 0 ${-fh * .05}Z`;
  return `<g transform="translate(${x} ${y})"><g class="ignite"><g class="flame-shape" style="--fd:${dur.toFixed(2)}s;--fdl:-${d.toFixed(2)}s">
    <path class="flame-outer" d="${outer}"/>
    <path class="flame-core" d="${core}"/>
    <ellipse class="flame-blue" cx="0" cy="${-fh * .07}" rx="${fw * .2}" ry="${fh * .07}"/>
  </g></g></g>`;
}

/* An upright candle. x = centre, y = base. */
function candle(x, y, o = {}) {
  const { h = 1000, w = 22, tw = 17, lit = true, fh = 40, fw = 13, glow = 160, wick = 1.4, rise = false } = o;
  const top = y - h;
  const body = `M${x - w / 2} ${y} L${x - tw / 2} ${top + 5} Q${x - tw / 2} ${top} ${x} ${top - 1} Q${x + tw / 2} ${top} ${x + tw / 2} ${top + 5} L${x + w / 2} ${y}Z`;
  const wl = Math.max(8, fh * .26);
  let s = '';
  if (lit && glow) s += `<g class="late"><circle class="glow" cx="${x}" cy="${top - fh * .45}" r="${glow}"/></g>`;
  s += `<path class="body${rise ? ' rise' : ''}" d="${body}"/>`;
  if (lit) s += flame(x + .4, top + 1.5, { fh, fw });
  s += `<path class="wick${rise ? ' late' : ''}" style="stroke-width:${wick}" d="M${x} ${top} q-.3 ${-wl * .5} ${wl * .1} ${-wl}"/>`;
  return s;
}

/* A candle lying down, base at x, pointing right. */
function candleFlat(x, y, { h = 1000, w = 22, tw = 17, wick = 1.4 } = {}) {
  const tip = x + h;
  const body = `M${x} ${y - w / 2} L${tip - 5} ${y - tw / 2} Q${tip} ${y - tw / 2} ${tip + 1} ${y} Q${tip} ${y + tw / 2} ${tip - 5} ${y + tw / 2} L${x} ${y + w / 2}Z`;
  return `<path class="body-h" d="${body}"/><path class="wick" style="stroke-width:${wick}" d="M${tip + 1} ${y} q4 -.3 9 .6"/>`;
}

const holder = (x, y, hh, hw = 70) => `<rect class="plaster" x="${x - hw / 2}" y="${y - hh}" width="${hw}" height="${hh}"/>`;
const hline = (x1, x2, y, cls = 'hair') => `<path class="${cls}" d="M${x1} ${y}H${x2}"/>`;
const vline = (x, y1, y2, cls = 'hair') => `<path class="${cls}" d="M${x} ${y1}V${y2}"/>`;
const text = (x, y, str, { size = 16, anchor = 'start', rotate = 0, cls = '' } = {}) =>
  `<text class="${cls}" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}"${rotate ? ` transform="rotate(${rotate} ${x} ${y})"` : ''}>${str}</text>`;

/* vertical dimension line with end ticks */
function dimV(x, y1, y2, label, { size = 16, tick = 8, side = -1 } = {}) {
  const mid = (y1 + y2) / 2;
  return vline(x, y1, y2) + hline(x - tick, x + tick, y1) + hline(x - tick, x + tick, y2) +
    text(x + side * size * .9, mid, label, { size, anchor: 'middle', rotate: -90 });
}
function dimH(x1, x2, y, label, { size = 16, tick = 8 } = {}) {
  return hline(x1, x2, y) + vline(x1, y - tick, y + tick) + vline(x2, y - tick, y + tick) +
    text((x1 + x2) / 2, y - size * .7, label, { size, anchor: 'middle' });
}

/* ============================================================
   Hero: scale drawing
   ============================================================ */
function drawHero() {
  const svg = $('#heroDrawing');
  const base = 1140;
  svg.innerHTML = `
    ${candle(150, base, { h: 250, w: 22, tw: 16, glow: 95, fh: 36, fw: 12 })}
    ${candle(390, base, { h: 1000, rise: true, glow: 180 })}
    <g class="late">
      ${hline(40, 520, base)}
      ${dimV(92, base - 250, base, '250 mm', { size: 17 })}
      ${dimV(332, base - 1000, base, '1000 mm  ·  39⅜ in', { size: 17 })}
      ${text(150, base + 34, 'DINNER TAPER', { size: 15, anchor: 'middle' })}
      ${text(390, base + 34, 'Nº 100', { size: 15, anchor: 'middle' })}
    </g>`;
  setHeroView();
}
const mqNarrow = window.matchMedia('(max-width: 860px)');
function setHeroView() {
  $('#heroDrawing').setAttribute('viewBox', mqNarrow.matches ? '300 -60 150 1250' : '20 -60 520 1250');
}
mqNarrow.addEventListener?.('change', setHeroView);

/* ============================================================
   Why: side elevation
   ============================================================ */
function drawElevation() {
  const floor = 2080, Y = mm => floor - mm;
  const T = 750, HOLD = 90;
  const chair = (x, dir) => {
    // bentwood chair, side view; dir = 1 faces right, -1 faces left
    const seatY = Y(460), backTop = Y(900);
    const sx = x, ex = x + dir * 420;
    const back = x - dir * 10;
    return `<path class="hair hair--soft" d="M${sx} ${seatY}H${ex}
      M${back} ${seatY} C${back - dir * 6} ${Y(640)} ${back - dir * 40} ${Y(820)} ${back - dir * 30} ${backTop}
      M${back - dir * 30} ${backTop} C${back - dir * 20} ${backTop - 40} ${back + dir * 30} ${backTop - 30} ${back + dir * 26} ${backTop + 20}
      M${sx + dir * 30} ${seatY} L${sx + dir * 10} ${floor}
      M${ex - dir * 30} ${seatY} L${ex - dir * 10} ${floor}
      M${sx + dir * 30} ${Y(160)} C${sx + dir * 140} ${Y(200)} ${ex - dir * 140} ${Y(200)} ${ex - dir * 30} ${Y(160)}"/>`;
  };
  const flameTop = Y(T + HOLD + 1000 + 15);
  $('#elevation').innerHTML += `
    <rect class="eye-band" x="-180" y="${Y(1250)}" width="1760" height="150"/>
    ${text(-170, Y(1250) - 22, 'SEATED EYE LINE  1.10–1.25 M', { size: 30 })}
    ${chair(-120, 1)}
    ${chair(1520, -1)}
    <rect class="plaster" x="160" y="${Y(T)}" width="1080" height="34"/>
    ${vline(230, Y(T) + 34, floor, 'hair hair--soft')}
    ${vline(1170, Y(T) + 34, floor, 'hair hair--soft')}
    ${hline(-180, 1580, floor)}
    ${holder(500, Y(T), HOLD)}
    ${candle(500, Y(T + HOLD), { h: 250, glow: 170, fh: 40, wick: 3 })}
    ${holder(860, Y(T), HOLD)}
    ${candle(860, Y(T + HOLD), { h: 1000, glow: 240, wick: 3 })}
    <path class="hair hair--soft hair--dash" d="M890 ${flameTop}H1310"/>
    <path class="hair hair--soft hair--dash" d="M1240 ${Y(T)}H1310"/>
    ${vline(1330, flameTop, floor)}
    ${hline(1316, 1344, flameTop)}${hline(1316, 1344, Y(T))}${hline(1316, 1344, floor)}
    ${text(1310, flameTop - 18, '≈ 1.85 M', { size: 30, anchor: 'end' })}
    ${text(1310, Y(T) - 18, '0.75 M', { size: 30, anchor: 'end' })}
    ${text(450, Y(T + HOLD + 250) - 70, 'DINNER TAPER', { size: 30, anchor: 'end' })}
    ${text(450, Y(T + HOLD + 250) - 30, 'flame at eye level', { size: 30, anchor: 'end' })}
    ${text(810, flameTop + 40, 'Nº 100', { size: 30, anchor: 'end' })}
    ${text(810, flameTop + 80, 'flame above it', { size: 30, anchor: 'end' })}`;
}

/* ============================================================
   Band: a long table, serial and calm
   ============================================================ */
function drawBand() {
  const W = 3000, top = 1300;
  const holds = [150, 60, 240, 60, 150, 240, 60, 150, 60, 240]; // three heights, one rhythm
  let s = `<rect x="0" y="${top}" width="${W}" height="400" class="cloth"/>` + hline(0, W, top);
  const n = holds.length, step = W / n;
  for (let i = 0; i < 6; i++) {
    const gx = 160 + i * 500 + (i % 2) * 60;
    s += `<path class="hair hair--soft" d="M${gx - 34} ${top - 205} Q${gx - 38} ${top - 112} ${gx} ${top - 104} Q${gx + 38} ${top - 112} ${gx + 34} ${top - 205}
      M${gx} ${top - 104}V${top - 4} M${gx - 34} ${top} Q${gx} ${top - 9} ${gx + 34} ${top}"/>
      <path class="hair hair--soft" d="M${gx + 80} ${top - 110}L${gx + 86} ${top} H${gx + 136} L${gx + 142} ${top - 110}"/>`;
  }
  holds.forEach((hh, i) => {
    const x = step * (i + .5) + ((i * 37) % 50) - 25;
    s += holder(x, top, hh, 64) + candle(x, top - hh, { glow: 260, fh: 42, fw: 14, wick: 2 });
  });
  const svg = $('#band');
  svg.setAttribute('viewBox', `0 -120 ${W} 1620`);
  svg.innerHTML = s;
}

/* ============================================================
   Shop: the box, top view
   ============================================================ */
const BOXES = {
  single: { L: 1080, W: 70, label: 'Single box · 108 × 7 × 7 cm · 0.5 kg packed' },
  dozen: { L: 1080, W: 190, label: 'Dozen box · 108 × 19 × 7 cm · two layers of six · 4 kg packed' },
};
function drawBox(id) {
  const b = BOXES[id], svg = $('#boxDrawing');
  const x0 = 60, cy = 250, y0 = cy - b.W / 2, wall = 6;
  let s = `<rect class="box-outer" x="${x0}" y="${y0}" width="${b.L}" height="${b.W}"/>
    <rect class="box-inner" x="${x0 + wall}" y="${y0 + wall}" width="${b.L - wall * 2}" height="${b.W - wall * 2}"/>`;
  const count = id === 'single' ? 1 : 6;
  const gap = id === 'single' ? 0 : (b.W - wall * 2 - 24) / (count - 1);
  for (let i = 0; i < count; i++) {
    const y = id === 'single' ? cy : y0 + wall + 12 + i * gap;
    s += candleFlat(x0 + 38, y);
  }
  // die-cut collars at each end
  [x0 + 70, x0 + b.L - 70].forEach(cx => {
    s += `<rect class="collar" x="${cx - 9}" y="${y0 + wall}" width="18" height="${b.W - wall * 2}"/>`;
  });
  s += dimH(x0, x0 + b.L, y0 - 34, `${b.L} mm`, { size: 17 });
  s += `${vline(x0 + b.L + 34, y0, y0 + b.W)}${hline(x0 + b.L + 26, x0 + b.L + 42, y0)}${hline(x0 + b.L + 26, x0 + b.L + 42, y0 + b.W)}`;
  s += text(x0 + b.L + 34, y0 + b.W + 36, `${b.W} mm`, { size: 17, anchor: 'middle' });
  svg.style.opacity = 0;
  setTimeout(() => {
    svg.innerHTML = `<title id="boxTitle">Top view of the ${id} box, lid off</title>` + s;
    svg.style.opacity = 1;
  }, svg.innerHTML.includes('box-outer') ? 180 : 0);
  $('#boxCaption').innerHTML = `<span>${b.label}</span><span>Top view, lid off</span>`;
}

/* ============================================================
   Product panel
   ============================================================ */
const state = { variant: 'dozen', qty: 1 };

function renderSpecs() {
  $('#specs').innerHTML = P.specs.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

function renderVariants() {
  const single = V('single'), c = cart.currency;
  $('#variantList').innerHTML = P.variants.map(v => {
    const each = v.price[c] / v.units;
    const save = v.units > 1 ? Math.round((1 - each / single.price[c]) * 100) : 0;
    return `<label class="variant">
      <input type="radio" name="variant" value="${v.id}" ${v.id === state.variant ? 'checked' : ''}>
      <span class="variant__box">
        <span class="variant__name">${v.title}</span>
        <span class="variant__price">${money(v.price[c])}</span>
        <span class="variant__sub">${v.sub}</span>
        <span class="variant__each">${v.units > 1 ? `${money(each)} each · <span class="variant__save">save ${save}%</span>` : 'per candle'}</span>
      </span>
    </label>`;
  }).join('');
  $$('#variantList input').forEach(r => r.addEventListener('change', e => {
    state.variant = e.target.value;
    drawBox(state.variant);
    renderBuy();
  }));
}

function renderBuy() {
  const v = V(state.variant), c = cart.currency;
  $('#qty').textContent = state.qty;
  $('#qtyLabel').textContent = v.units > 1 ? 'Boxes' : 'Candles';
  const candles = state.qty * v.units;
  $('#buySummary').textContent = `${candles} ${candles === 1 ? 'candle' : 'candles'} · ${money(v.price[c] * state.qty)}`;
  const items = { [v.id]: state.qty };
  const zone = CONFIG.shipping.zones.find(z => z.id === cart.zone);
  const ship = shippingQuote(items, cart.zone, c, v.price[c] * state.qty);
  $('#shipEst').innerHTML = `${ship === 0 ? 'Free delivery' : `Delivery ${money(ship)}`} <span class="muted">· ${zone.days}</span>`;
  $('[data-price-from]').textContent = money(V('dozen').price[c] / 12);
}

function initBuy() {
  $$('.buy .stepper button').forEach(b => b.addEventListener('click', () => {
    state.qty = Math.max(1, Math.min(99, state.qty + Number(b.dataset.step)));
    renderBuy();
  }));
  $('#addBtn').addEventListener('click', () => {
    cart.add(state.variant, state.qty);
    openBag();
  });
}

function fillZoneSelect(sel) {
  sel.innerHTML = CONFIG.shipping.zones.map(z => `<option value="${z.id}">${z.name}</option>`).join('');
  sel.value = cart.zone;
  sel.addEventListener('change', e => cart.setZone(e.target.value));
}

/* ============================================================
   Planner
   ============================================================ */
const plan = { guests: 80, density: 'classic' };

function renderDensity() {
  const fs = $('#density');
  fs.innerHTML = `<legend>Table feel</legend><div class="density__opts">${CONFIG.densities.map(d => `
    <label class="density__opt"><input type="radio" name="density" value="${d.id}" ${d.id === plan.density ? 'checked' : ''}><span>${d.name}</span></label>`).join('')}</div>
    <p class="density__note" id="densityNote"></p>`;
  $$('input', fs).forEach(r => r.addEventListener('change', e => { plan.density = e.target.value; renderPlan(); }));
}

function planNumbers() {
  const d = CONFIG.densities.find(x => x.id === plan.density);
  const need = Math.ceil(plan.guests * d.perGuest);
  const boxes = Math.ceil(need / 12);
  return { d, need, boxes, delivered: boxes * 12 };
}

function renderPlan() {
  const { d, need, boxes, delivered } = planNumbers();
  const c = cart.currency;
  $('#guestsOut').textContent = plan.guests;
  $('#densityNote').textContent = d.note + '.';
  $('#planCandles').textContent = need;
  const spare = delivered - need;
  $('#planDetail').textContent = `${boxes} ${boxes === 1 ? 'box' : 'boxes'} of twelve — ${delivered} candles, ${money(V('dozen').price[c] * boxes)}.` +
    (spare ? ` That leaves ${spare} spare${spare === 1 ? '' : 's'} for the bar or the aisle.` : '');
  $('#planAdd').textContent = `Add ${boxes} ${boxes === 1 ? 'box' : 'boxes'} to bag`;
  drawPlan(d);
}

function drawPlan(d) {
  const svg = $('#planDrawing');
  const L = 3000, Wt = 1000, x0 = 200, y0 = 400, cy = y0 + Wt / 2;
  const n = Math.round(10 * d.perGuest);
  let s = '';
  // chairs and plates, five a side
  for (let i = 0; i < 5; i++) {
    const x = x0 + 300 + i * 600;
    s += `<circle class="hair hair--soft" cx="${x}" cy="${y0 - 210}" r="170"/><path class="hair hair--soft" d="M${x - 150} ${y0 - 300} Q${x} ${y0 - 420} ${x + 150} ${y0 - 300}"/>`;
    s += `<circle class="hair hair--soft" cx="${x}" cy="${y0 + Wt + 210}" r="170"/><path class="hair hair--soft" d="M${x - 150} ${y0 + Wt + 300} Q${x} ${y0 + Wt + 420} ${x + 150} ${y0 + Wt + 300}"/>`;
    s += `<circle class="hair hair--soft" cx="${x}" cy="${y0 + 150}" r="120"/><circle class="hair hair--soft" cx="${x}" cy="${y0 + Wt - 150}" r="120"/>`;
  }
  s = `<rect class="table-top" x="${x0}" y="${y0}" width="${L}" height="${Wt}"/>` + s;
  const two = n > 8;
  for (let i = 0; i < n; i++) {
    const x = x0 + 180 + (L - 360) * (n === 1 ? .5 : i / (n - 1));
    const y = two ? cy + (i % 2 ? 70 : -70) : cy;
    s += `<circle class="glow glow--plan" cx="${x}" cy="${y}" r="150"/>
      <circle class="plaster" cx="${x}" cy="${y}" r="34"/><circle class="plan-candle" cx="${x}" cy="${y}" r="11"/>
      <circle class="plan-flame" cx="${x}" cy="${y}" r="4"/>`;
  }
  svg.setAttribute('viewBox', '0 -60 3400 1920');
  svg.innerHTML = `<title id="planFigTitle">Plan view of a table for ten with ${n} candles</title>` + s;
  $('#planFigCaption').textContent = `Plan view: a table for ten at ${d.name.toLowerCase()} — ${n} candles.`;
}

function initPlanner() {
  renderDensity();
  const g = $('#guests');
  g.addEventListener('input', () => { plan.guests = Number(g.value); renderPlan(); });
  $('#planAdd').addEventListener('click', () => {
    cart.add('dozen', planNumbers().boxes);
    openBag();
  });
  renderPlan();
}

/* ============================================================
   Shipping table
   ============================================================ */
function renderShipTable() {
  const c = cart.currency;
  $('#shipTable tbody').innerHTML = CONFIG.shipping.zones.map(z => `
    <tr><td>${z.name}</td><td>${money(z.first[c])}</td><td>${money(z.firstDozen[c])}</td><td>${z.days}</td></tr>`).join('');
  const free = CONFIG.shipping.zones.filter(z => z.freeOver).map(z => `${money(z.freeOver[c])} to ${z.id === 'FR' ? 'France' : 'the rest of the EU'}`);
  $('#shipNote').textContent = `Free delivery on orders over ${free.join(' and ')}. Prices include VAT for EU addresses; elsewhere, import duties may apply.`;
}

/* ============================================================
   Bag
   ============================================================ */
const miniCandles = units => {
  const n = units > 1 ? 3 : 1;
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 18 : 8 + i * 10;
    s += `<rect x="${x - 1.5}" y="14" width="3" height="58" fill="#E9DDC7" stroke="rgba(31,29,27,.3)" stroke-width=".6"/>
      <path d="M${x} 4 C${x - 2.6} 8.5 ${x - 2.4} 11.4 ${x} 13 C${x + 2.4} 11.4 ${x + 2.6} 8.5 ${x} 4Z" fill="#E39A46"/>`;
  }
  return `<svg class="bag-line__icon" viewBox="0 0 36 76" aria-hidden="true">${s}</svg>`;
};

function renderBag() {
  const lines = cart.lines(), c = cart.currency;
  const body = $('#bagBody'), foot = $('#bagFoot');
  const count = $('#bagCount');
  count.textContent = cart.count();
  count.classList.toggle('has', cart.count() > 0);

  if (!lines.length) {
    body.innerHTML = `<p class="bag__empty">Your bag is empty.</p>`;
    foot.innerHTML = `<a class="btn btn--line btn--block" href="#shop" data-close>Shop the candle</a>`;
    return;
  }
  body.innerHTML = lines.map(l => `
    <div class="bag-line">
      ${miniCandles(l.v.units)}
      <div>
        <p class="bag-line__name">${P.title} — ${l.v.title}</p>
        <p class="bag-line__sub">${P.colour} · ${l.qty * l.v.units} ${l.qty * l.v.units === 1 ? 'candle' : 'candles'}</p>
        <div class="stepper" role="group" aria-label="Quantity of ${l.v.title}">
          <button type="button" data-line="${l.v.id}" data-step="-1" aria-label="One fewer">−</button>
          <output>${l.qty}</output>
          <button type="button" data-line="${l.v.id}" data-step="1" aria-label="One more">+</button>
        </div>
      </div>
      <div>
        <p class="bag-line__price">${money(l.total)}</p>
        <button class="bag-line__remove" data-remove="${l.v.id}">Remove</button>
      </div>
    </div>`).join('');

  const ship = cart.shipping(), sub = cart.subtotal();
  foot.innerHTML = `
    <div class="bag__row"><span>Subtotal · ${cart.candles()} candles</span><span>${money(sub)}</span></div>
    <div class="bag__row"><label for="bagZone">Delivery to</label><select id="bagZone"></select></div>
    <div class="bag__row"><span>Delivery</span><span>${ship === 0 ? 'Free' : money(ship)}</span></div>
    <div class="bag__row bag__row--total"><span>Total</span><span>${money(sub + ship)}</span></div>
    <button class="btn btn--solid btn--block" id="checkoutBtn">Checkout</button>
    <p class="bag__note">Order four weeks before your date. Import duties outside the EU are shown at checkout.</p>`;
  fillZoneSelect($('#bagZone'));
  $('#checkoutBtn').addEventListener('click', checkout);
}

function initBag() {
  $('#bagBody').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.remove) cart.set(b.dataset.remove, 0);
    if (b.dataset.line) cart.set(b.dataset.line, (cart.items[b.dataset.line] || 0) + Number(b.dataset.step));
  });
  $('#bagFoot').addEventListener('click', e => { if (e.target.closest('[data-close]')) closeBag(); });
  $('#bagBtn').addEventListener('click', openBag);
  $('#bagClose').addEventListener('click', closeBag);
  $('#scrim').addEventListener('click', closeBag);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#bag').classList.contains('open')) closeBag(); });
}

let lastFocus;
function openBag() {
  lastFocus = document.activeElement;
  const scrim = $('#scrim');
  scrim.hidden = false;
  requestAnimationFrame(() => scrim.classList.add('open'));
  $('#bag').classList.add('open');
  $('#bag').setAttribute('aria-hidden', 'false');
  $('#bagClose').focus({ preventScroll: true });
  const count = $('#bagCount');
  count.classList.remove('bump'); void count.offsetWidth; count.classList.add('bump');
}
function closeBag() {
  $('#scrim').classList.remove('open');
  setTimeout(() => { $('#scrim').hidden = true; }, 350);
  $('#bag').classList.remove('open');
  $('#bag').setAttribute('aria-hidden', 'true');
  lastFocus?.focus?.({ preventScroll: true });
}

function checkout() {
  const url = cart.checkoutUrl();
  if (url) { window.location.href = url; return; }
  $('#previewDialog').showModal();
}

/* ============================================================
   Currency, footer, reveals
   ============================================================ */
function initCurrency() {
  const sel = $('#currency');
  sel.innerHTML = Object.entries(CONFIG.currencies).map(([k, c]) => `<option value="${k}">${c.label}</option>`).join('');
  sel.value = cart.currency;
  sel.addEventListener('change', e => cart.setCurrency(e.target.value));
}

function drawFooter() {
  $('.footer__candle').innerHTML = candle(20, 420, { h: 360, w: 10, tw: 8, fh: 34, fw: 12, glow: 70, wick: 1.2 });
}

function initReveals() {
  const targets = $$('.section h2, .figures, .specs, .ship-table, .story__quote, .faq__list, .trade__list, .planner__result, .why__figure, .box-figure');
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(entries => entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in-view'); io.unobserve(en.target); }
  }), { rootMargin: '0px 0px -8% 0px' });
  targets.forEach(t => { t.classList.add('in-view-target'); io.observe(t); });
}

function initForms() {
  $('#newsletter').addEventListener('submit', e => {
    e.preventDefault();
    $('#newsletterMsg').textContent = 'Thank you. This is a preview, so sign-ups open at launch.';
  });
  const trade = $('#tradeLink');
  if (CONFIG.email) trade.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent('Trade account enquiry')}`;
  else trade.addEventListener('click', e => { e.preventDefault(); $('#previewDialog').showModal(); });
}

/* ============================================================
   Boot
   ============================================================ */
function renderPrices() { renderVariants(); renderBuy(); renderShipTable(); renderPlan(); }

drawHero();
drawElevation();
drawBand();
drawFooter();
renderSpecs();
renderVariants();
drawBox(state.variant);
initBuy();
fillZoneSelect($('#zoneSelect'));
initPlanner();
renderShipTable();
initBag();
initCurrency();
initForms();
renderBuy();
renderBag();
initReveals();

let lastCurrency = cart.currency;
cart.onChange(() => {
  renderBag();
  $('#zoneSelect').value = cart.zone;
  if (cart.currency !== lastCurrency) { lastCurrency = cart.currency; renderPrices(); }
  else renderBuy();
});
