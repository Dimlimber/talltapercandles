/* Tall Taper — drawings and interactions.
   All drawings are in millimetres (1 SVG unit = 1 mm) so every candle,
   holder and table is to scale. */

const cart = new Cart();
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = (n, c = cart.currency) => Money.format(n, c);
const P = CONFIG.product;
const V = id => P.variants.find(v => v.id === id);
const H = id => P.heights.find(h => h.id === id);

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
    ${candle(120, base, { h: 250, w: 22, tw: 16, glow: 90, fh: 36, fw: 12 })}
    ${candle(290, base, { h: 750, rise: true, glow: 150, fh: 38 })}
    ${candle(460, base, { h: 1000, rise: true, glow: 180 })}
    <g class="late">
      ${hline(30, 560, base)}
      ${dimV(70, base - 250, base, '250 mm', { size: 17 })}
      ${dimV(240, base - 750, base, '750 mm  ·  29½ in', { size: 17 })}
      ${dimV(410, base - 1000, base, '1000 mm  ·  39⅜ in', { size: 17 })}
      ${text(120, base + 34, 'DINNER TAPER', { size: 15, anchor: 'middle' })}
      ${text(290, base + 34, 'Nº 75', { size: 15, anchor: 'middle' })}
      ${text(460, base + 34, 'Nº 100', { size: 15, anchor: 'middle' })}
    </g>`;
  setHeroView();
}
const mqNarrow = window.matchMedia('(max-width: 860px)');
function setHeroView() {
  $('#heroDrawing').setAttribute('viewBox', mqNarrow.matches ? '205 -60 290 1250' : '0 -60 580 1250');
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
  const flame75 = Y(T + HOLD + 750 + 15);
  $('#elevation').innerHTML += `
    <rect class="eye-band" x="-180" y="${Y(1250)}" width="1760" height="150"/>
    ${text(-170, Y(1250) - 22, 'SEATED EYE LINE  1.10–1.25 M', { size: 30 })}
    ${chair(-120, 1)}
    ${chair(1520, -1)}
    <rect class="plaster" x="160" y="${Y(T)}" width="1080" height="34"/>
    ${vline(230, Y(T) + 34, floor, 'hair hair--soft')}
    ${vline(1170, Y(T) + 34, floor, 'hair hair--soft')}
    ${hline(-180, 1580, floor)}
    ${holder(420, Y(T), HOLD)}
    ${candle(420, Y(T + HOLD), { h: 250, glow: 170, fh: 40, wick: 3 })}
    ${holder(660, Y(T), HOLD)}
    ${candle(660, Y(T + HOLD), { h: 750, glow: 220, wick: 3 })}
    ${holder(900, Y(T), HOLD)}
    ${candle(900, Y(T + HOLD), { h: 1000, glow: 240, wick: 3 })}
    <path class="hair hair--soft hair--dash" d="M930 ${flameTop}H1310"/>
    <path class="hair hair--soft hair--dash" d="M690 ${flame75}H1310"/>
    <path class="hair hair--soft hair--dash" d="M1240 ${Y(T)}H1310"/>
    ${vline(1330, flameTop, floor)}
    ${hline(1316, 1344, flameTop)}${hline(1316, 1344, flame75)}${hline(1316, 1344, Y(T))}${hline(1316, 1344, floor)}
    ${text(1310, flame75 - 18, '≈ 1.6 M', { size: 30, anchor: 'end' })}
    ${text(1310, flameTop - 18, '≈ 1.85 M', { size: 30, anchor: 'end' })}
    ${text(1310, Y(T) - 18, '0.75 M', { size: 30, anchor: 'end' })}
    ${text(370, Y(T + HOLD + 250) - 70, 'DINNER TAPER', { size: 30, anchor: 'end' })}
    ${text(370, Y(T + HOLD + 250) - 30, 'flame at eye level', { size: 30, anchor: 'end' })}
    ${text(615, flame75 + 40, 'Nº 75', { size: 30, anchor: 'end' })}
    ${text(855, flameTop + 40, 'Nº 100', { size: 30, anchor: 'end' })}
    ${text(855, flameTop + 80, 'both flames above it', { size: 30, anchor: 'end' })}`;
}

/* ============================================================
   Band: a long table, serial and calm
   ============================================================ */
function drawBand() {
  const W = 3000, top = 1300;
  const holds = [150, 60, 240, 60, 150, 240, 60, 150, 60, 240]; // three holder heights, one rhythm
  const tall = [1000, 750, 1000, 750, 1000, 1000, 750, 1000, 750, 1000]; // Nº 100 and Nº 75
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
    s += holder(x, top, hh, 64) + candle(x, top - hh, { h: tall[i], glow: 260, fh: 42, fw: 14, wick: 2 });
  });
  const svg = $('#band');
  svg.setAttribute('viewBox', `0 -120 ${W} 1620`);
  svg.innerHTML = s;
}

/* ============================================================
   Shop: the box, top view
   ============================================================ */
const BOXES = {
  single: { W: 75, cols: 1, size: '7.5 × 7.5', note: { 100: '0.7 kg packed', 75: '0.5 kg packed' } },
  dozen: { W: 170, cols: 4, size: '17 × 14', note: { 100: 'twelve cells, four across, three deep · about 5 kg', 75: 'twelve cells, four across, three deep · about 4 kg' } },
};
function drawBox(heightId, format) {
  const b = BOXES[format], h = H(heightId), svg = $('#boxDrawing');
  const L = h.cm * 10 + 70, x0 = (1200 - L) / 2, cy = 250, y0 = cy - b.W / 2, wall = 6;
  let s = `<rect class="box-outer" x="${x0}" y="${y0}" width="${L}" height="${b.W}"/>
    <rect class="box-inner" x="${x0 + wall}" y="${y0 + wall}" width="${L - wall * 2}" height="${b.W - wall * 2}"/>`;
  // full-length paper cradle: a cell per candle, cross-members every 250 mm
  const inner = b.W - wall * 2, cell = inner / b.cols;
  for (let i = 1; i < b.cols; i++) s += hline(x0 + wall, x0 + L - wall, y0 + wall + i * cell, 'hair hair--soft');
  for (let cx = x0 + 30; cx < x0 + L - 20; cx += 250) {
    s += `<rect class="collar" x="${cx}" y="${y0 + wall}" width="10" height="${inner}"/>`;
  }
  for (let i = 0; i < b.cols; i++) s += candleFlat(x0 + 24, y0 + wall + cell * (i + .5), { h: h.cm * 10 });
  s += dimH(x0, x0 + L, y0 - 34, `${L} mm`, { size: 17 });
  s += `${vline(x0 + L + 34, y0, y0 + b.W)}${hline(x0 + L + 26, x0 + L + 42, y0)}${hline(x0 + L + 26, x0 + L + 42, y0 + b.W)}`;
  s += text(x0 + L + 34, y0 + b.W + 36, `${b.W} mm`, { size: 17, anchor: 'middle' });
  svg.style.opacity = 0;
  setTimeout(() => {
    svg.innerHTML = `<title id="boxTitle">Top view of the ${h.code} ${format} box, lid off</title>` + s;
    svg.style.opacity = 1;
  }, svg.innerHTML.includes('box-outer') ? 180 : 0);
  const label = `${format === 'single' ? 'Single' : 'Dozen'} box · ${(L / 10).toString()} × ${b.size} cm · ${b.note[heightId]}`;
  $('#boxCaption').innerHTML = `<span>${label}</span><span>Top view, lid off</span>`;
}

/* ============================================================
   Product panel
   ============================================================ */
const state = { height: '100', format: 'dozen', qty: 1 };
const vid = () => `${state.height}-${state.format}`;

function renderHeights() {
  $('#heightList').innerHTML = P.heights.map(h => `
    <label class="seg__opt"><input type="radio" name="height" value="${h.id}" ${h.id === state.height ? 'checked' : ''}><span><b>${h.code}</b> ${h.cm} cm</span></label>`).join('');
  $$('#heightList input').forEach(r => r.addEventListener('change', e => {
    state.height = e.target.value;
    renderProduct();
  }));
}

function renderSpecs() {
  const h = H(state.height);
  const rows = [['Height', `${h.cm} cm · ${h.inches} in`], ...P.specs.slice(0, 4), ['Burn time', h.burn], ...P.specs.slice(4)];
  $('#specs').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
}

function renderVariants() {
  const c = cart.currency;
  const single = V(`${state.height}-single`);
  $('#variantList').innerHTML = P.variants.filter(v => v.height === state.height).map(v => {
    const each = v.price[c] / v.units;
    const save = v.format === 'dozen' ? Math.round((1 - each / single.price[c]) * 100) : 0;
    return `<label class="variant">
      <input type="radio" name="variant" value="${v.format}" ${v.format === state.format ? 'checked' : ''}>
      <span class="variant__box">
        <span class="variant__name">${v.title}</span>
        <span class="variant__price">${money(v.price[c])}</span>
        <span class="variant__sub">${v.sub}</span>
        <span class="variant__each">${save ? `${money(Math.round(each * 100) / 100)} each · <span class="variant__save">save ${save}%</span>` : 'per candle'}</span>
      </span>
    </label>`;
  }).join('');
  $$('#variantList input').forEach(r => r.addEventListener('change', e => {
    state.format = e.target.value;
    drawBox(state.height, state.format);
    renderBuy();
  }));
}

function renderProduct() {
  const h = H(state.height);
  $('#buyCode').textContent = h.code;
  $('#shopTitle').textContent = h.name;
  $('#buySub').textContent = `Silk ivory · unscented · ${h.cm} cm`;
  renderSpecs();
  renderVariants();
  drawBox(state.height, state.format);
  renderBuy();
}

function renderBuy() {
  const v = V(vid()), c = cart.currency;
  $('#qty').textContent = state.qty;
  $('#qtyLabel').textContent = v.format === 'single' ? 'Candles' : 'Boxes';
  const candles = state.qty * v.units;
  $('#buySummary').textContent = `${candles} ${candles === 1 ? 'candle' : 'candles'} · ${money(v.price[c] * state.qty)}`;
  const zone = CONFIG.shipping.zones.find(z => z.id === cart.zone);
  const ship = shippingQuote({ [v.id]: state.qty }, cart.zone, c);
  $('#shipEst').innerHTML = `Delivery ${money(ship)} <span class="muted">· ${zone.days}</span>`;
  const cheapest = Math.min(...P.variants.filter(x => x.format === 'dozen').map(x => x.price[c] / x.units));
  $('[data-price-from]').textContent = `from ${money(Math.round(cheapest))}`;
}

function initBuy() {
  $$('.buy .stepper button').forEach(b => b.addEventListener('click', () => {
    state.qty = Math.max(1, Math.min(99, state.qty + Number(b.dataset.step)));
    renderBuy();
  }));
  $('#addBtn').addEventListener('click', () => {
    cart.add(vid(), state.qty);
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
const plan = { guests: 80, density: 'classic', mix: 50 }; // mix = % of candles that are Nº 100

function renderDensity() {
  const fs = $('#density');
  fs.innerHTML = `<legend>Table feel</legend><div class="density__opts">${CONFIG.densities.map(d => `
    <label class="density__opt"><input type="radio" name="density" value="${d.id}" ${d.id === plan.density ? 'checked' : ''}><span>${d.name}</span></label>`).join('')}</div>
    <p class="density__note" id="densityNote"></p>`;
  $$('input', fs).forEach(r => r.addEventListener('change', e => { plan.density = e.target.value; renderPlan(); }));
}

/* cover `need` candles of one height with dozens and singles, as cheaply as possible */
function coverWith(heightId, need) {
  const c = cart.currency, single = V(`${heightId}-single`), dozen = V(`${heightId}-dozen`);
  let dozens = Math.floor(need / 12), singles = need - dozens * 12;
  if (singles * single.price[c] >= dozen.price[c]) { dozens += 1; singles = 0; }
  return { heightId, need, dozens, singles, delivered: dozens * 12 + singles, price: dozens * dozen.price[c] + singles * single.price[c] };
}

function planNumbers() {
  const d = CONFIG.densities.find(x => x.id === plan.density);
  const need = Math.ceil(plan.guests * d.perGuest);
  const n100 = Math.round(need * plan.mix / 100);
  const parts = [coverWith('100', n100), coverWith('75', need - n100)];
  return {
    d, need, parts,
    delivered: parts.reduce((n, p) => n + p.delivered, 0),
    price: parts.reduce((n, p) => n + p.price, 0),
  };
}

function orderWords({ dozens, singles }) {
  const bits = [];
  if (dozens) bits.push(`${dozens} dozen`);
  if (singles) bits.push(`${singles} ${singles === 1 ? 'single' : 'singles'}`);
  return bits.join(' + ') || '–';
}

function renderPlan() {
  const { d, need, parts, delivered, price } = planNumbers();
  $('#densityNote').textContent = d.note + '.';
  $('#mixOut').textContent = plan.mix === 100 ? 'All Nº 100' : plan.mix === 0 ? 'All Nº 75' : `Nº 100 ${plan.mix}% · Nº 75 ${100 - plan.mix}%`;
  $('#planCandles').textContent = need;
  $('#planTable tbody').innerHTML = parts.map(p => `
    <tr class="${p.need ? '' : 'muted-row'}"><td>${H(p.heightId).code}</td><td class="num">${p.need}</td><td>${orderWords(p)}</td><td class="num">${p.need ? money(p.price) : '–'}</td></tr>`).join('');
  $('#planTable tfoot').innerHTML = `<tr><td>Total</td><td class="num">${delivered}</td><td></td><td class="num">${money(price)}</td></tr>`;
  const spare = delivered - need;
  $('#planDetail').textContent = spare ? `Rounding up to whole dozens leaves ${spare} spare${spare === 1 ? '' : 's'}, for the bar or the aisle.` : 'Before delivery, which is added at checkout.';
  $('#planAdd').disabled = !need;
  drawPlan(d);
}

function drawPlan(d) {
  const svg = $('#planDrawing');
  const L = 3000, Wt = 1000, x0 = 200, y0 = 400, cy = y0 + Wt / 2;
  const n = Math.max(1, Math.round(10 * d.perGuest));
  const n100 = Math.round(n * plan.mix / 100);
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
    // spread the Nº 100s evenly among the Nº 75s
    const is100 = Math.floor((i + 1) * n100 / n) > Math.floor(i * n100 / n);
    const x = x0 + 180 + (L - 360) * (n === 1 ? .5 : i / (n - 1));
    const y = two ? cy + (i % 2 ? 70 : -70) : cy;
    s += `<circle class="glow glow--plan" cx="${x}" cy="${y}" r="${is100 ? 160 : 105}"/>
      <circle class="plaster" cx="${x}" cy="${y}" r="34"/><circle class="${is100 ? 'plan-candle' : 'plan-candle plan-candle--75'}" cx="${x}" cy="${y}" r="${is100 ? 11 : 9}"/>
      <circle class="plan-flame" cx="${x}" cy="${y}" r="${is100 ? 4 : 3}"/>`;
  }
  svg.setAttribute('viewBox', '0 -60 3400 1920');
  svg.innerHTML = `<title id="planFigTitle">Plan view of a table for ten with ${n100} Nº 100 and ${n - n100} Nº 75 candles</title>` + s;
  const mixWords = [n100 ? `${n100} Nº 100` : '', n - n100 ? `${n - n100} Nº 75` : ''].filter(Boolean).join(' and ');
  $('#planFigCaption').textContent = `Plan view: a table for ten at ${d.name.toLowerCase()}, ${mixWords}. The larger glow is the Nº 100.`;
}

function initPlanner() {
  renderDensity();
  const num = $('#guestsNum'), slider = $('#guests'), mix = $('#mix');
  num.addEventListener('input', () => {
    const v = parseInt(num.value, 10);
    if (!Number.isFinite(v) || v < 1) return;
    plan.guests = Math.min(v, 5000);
    slider.value = Math.max(10, Math.min(300, plan.guests));
    renderPlan();
  });
  num.addEventListener('blur', () => { num.value = plan.guests; });
  slider.addEventListener('input', () => { plan.guests = Number(slider.value); num.value = plan.guests; renderPlan(); });
  mix.addEventListener('input', () => { plan.mix = Number(mix.value); renderPlan(); });
  $('#planAdd').addEventListener('click', () => {
    planNumbers().parts.forEach(p => {
      if (p.dozens) cart.add(`${p.heightId}-dozen`, p.dozens);
      if (p.singles) cart.add(`${p.heightId}-single`, p.singles);
    });
    openBag();
  });
  renderPlan();
}

/* ============================================================
   Shipping table
   ============================================================ */
function renderShipTable() {
  const c = cart.currency, m = eur => money(Money.convert(eur, c));
  $('#shipTable tbody').innerHTML = CONFIG.shipping.zones.map(z => `
    <tr><td>${z.name}</td><td>${m(z.rates[100].single)}</td><td>${m(z.rates[100].dozen)}</td><td>${m(z.rates[75].single)}</td><td>${m(z.rates[75].dozen)}</td><td>${z.days}</td></tr>`).join('');
  $('#shipNote').textContent = `Prices are per parcel: each dozen box is one parcel, and up to six singles share one. In France, pick up from a Mondial Relay point or have it brought to your door. Duties and taxes are paid at checkout, so nothing is due on delivery.`;
}

/* ============================================================
   Bag
   ============================================================ */
const miniCandles = (units, heightId) => {
  const n = units > 1 ? 3 : 1, len = heightId === '75' ? 44 : 58, top = 72 - len;
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = n === 1 ? 18 : 8 + i * 10;
    s += `<rect x="${x - 1.5}" y="${top}" width="3" height="${len}" fill="#E9DDC7" stroke="rgba(31,29,27,.3)" stroke-width=".6"/>
      <path d="M${x} ${top - 10} C${x - 2.6} ${top - 5.5} ${x - 2.4} ${top - 2.6} ${x} ${top - 1} C${x + 2.4} ${top - 2.6} ${x + 2.6} ${top - 5.5} ${x} ${top - 10}Z" fill="#E39A46"/>`;
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
      ${miniCandles(l.v.units, l.v.height)}
      <div>
        <p class="bag-line__name">${H(l.v.height).code} — ${l.v.title}</p>
        <p class="bag-line__sub">${P.colour} · ${H(l.v.height).cm} cm · ${l.qty * l.v.units} ${l.qty * l.v.units === 1 ? 'candle' : 'candles'}</p>
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
    <div class="bag__row"><span>Delivery</span><span>${money(ship)}</span></div>
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
function renderPrices() { renderVariants(); renderBuy(); renderShipTable(); renderPlan(); renderBag(); }

drawHero();
drawElevation();
drawBand();
drawFooter();
renderHeights();
renderProduct();
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
