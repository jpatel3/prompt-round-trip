/* Prompt Round Trip · shared stage engine
   Isometric SVG primitives, token streams, an approximate tokenizer, and the
   scroll-driven scene machinery used by index.html and agent.html.
   Exposes one global, PRT. No build step. */
(function(){
'use strict';
const NS = 'http://www.w3.org/2000/svg';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let FS = 1; // diagram text multiplier, user-selectable

const C = {
  ink:'#0B0F0C', ink2:'#3F4A43', muted:'#7C877F', grid:'#D9D9D9', rule:'#C9D1CB', ground:'#F5F8F4', paper:'#FFFFFF',
  green:'#19E76E', greenInk:'#049A52', greenTint:'#D1FAE2',
  pink:'#FFA9FD', pinkInk:'#B0389F', pinkTint:'#FFE3FE',
  top:'#FFFFFF', left:'#EDF2EE', right:'#DCE3DE', floor:'#EEF3EF'
};

/* ---------------- primitives ---------------- */
function el(tag, attrs, parent){
  const e = document.createElementNS(NS, tag);
  if (attrs) for (const k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) e.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(e);
  return e;
}
function text(parent, x, y, str, o){
  o = o || {};
  const t = el('text', {
    x: x, y: y, 'text-anchor': o.anchor || 'start', 'font-size': ((o.size || 11) * FS).toFixed(2),
    fill: o.fill || C.ink, 'font-weight': o.weight || 400, 'letter-spacing': o.ls || 0,
    opacity: o.opacity, class: (o.sans ? 'sans' : 'mono') + (o.cls ? ' ' + o.cls : '')
  }, parent);
  t.textContent = str;
  return t;
}
function label(parent, x, y, str, o){
  o = o || {};
  return text(parent, x, y, String(str).toUpperCase(), Object.assign({size:9.5, fill:C.muted, ls:0.7}, o));
}
function lines(parent, x, y, arr, o){
  o = o || {};
  const lh = (o.lh || 13) * FS;
  arr.forEach((s, i) => text(parent, x, y + i*lh, s, o));
  return y + arr.length*lh;
}
function wrap(str, max){
  const words = String(str).split(/\s+/).filter(Boolean), out = [];
  let cur = '';
  for (const w of words){
    if ((cur + ' ' + w).trim().length > max && cur){ out.push(cur); cur = w; }
    else cur = cur ? cur + ' ' + w : w;
  }
  if (cur) out.push(cur);
  return out;
}
const fmt = n => Math.round(n).toLocaleString('en-US');

/* isometric projection: x runs right-down, y runs left-down, z up */
function P(ox, oy, x, y, z){ return [ox + (x - y)*0.866, oy + (x + y)*0.5 - z]; }
function poly(parent, pts, attrs){
  return el('polygon', Object.assign({points: pts.map(p => p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ')}, attrs), parent);
}
function cube(parent, ox, oy, x, y, z, w, d, h, o){
  o = o || {};
  const g = el('g', {class:'cube'}, parent);
  const q = (a,b,c) => P(ox, oy, a, b, c);
  const stroke = o.stroke || C.ink, sw = o.sw || 1;
  const base = {stroke: stroke, 'stroke-width': sw, 'stroke-linejoin':'round'};
  if (h > 0){
    poly(g, [q(x,y+d,z), q(x+w,y+d,z), q(x+w,y+d,z+h), q(x,y+d,z+h)], Object.assign({fill:o.left||C.left}, base));
    poly(g, [q(x+w,y,z), q(x+w,y+d,z), q(x+w,y+d,z+h), q(x+w,y,z+h)], Object.assign({fill:o.right||C.right}, base));
  }
  poly(g, [q(x,y,z+h), q(x+w,y,z+h), q(x+w,y+d,z+h), q(x,y+d,z+h)], Object.assign({fill:o.top||C.top}, base));
  g.topCenter = q(x + w/2, y + d/2, z + h);
  return g;
}
/* a standing plane in x-z (like a screen); returns a group whose coordinates are plane coordinates */
function screenPlane(parent, ox, oy, x, y, z, w, h, o){
  o = o || {};
  const q = (a,b,c) => P(ox, oy, a, b, c);
  poly(parent, [q(x,y,z), q(x+w,y,z), q(x+w,y,z+h), q(x,y,z+h)], {fill:o.fill||C.paper, stroke:o.stroke||C.ink, 'stroke-width':1, 'stroke-linejoin':'round'});
  const O = q(x, y, z + h);
  return el('g', {transform: 'matrix(0.866 0.5 0 1 ' + O[0].toFixed(2) + ' ' + O[1].toFixed(2) + ')'}, parent);
}
function wire(parent, d, o){
  o = o || {};
  return el('path', {d: d, fill:'none', stroke:o.stroke||C.ink, 'stroke-width':o.sw||1, 'stroke-dasharray':o.dash||null,
    'stroke-linejoin':'round', 'stroke-linecap':'round', 'marker-end': o.arrow ? 'url(#' + o.arrow + ')' : null}, parent);
}
function pathThrough(pts){
  return pts.map((p,i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
}
function frameTitle(s, num, title, caption, plainCaption){
  el('rect', {x:36, y:38, width:22, height:8, fill: s.accent || (s.i === 7 ? C.pink : C.green)}, s.g);
  text(s.g, 66, 46, num + ' · ' + title.toUpperCase(), {size:10.5, ls:1, fill:C.ink, weight:500});
  if (caption){
    // wrap by available width: the frame is 728px wide, sans at 11.5px is about 5.6px per char
    const ls = wrap(caption, Math.floor(126 / FS / 1.4)).slice(0, 4);
    const lh = 14;
    lines(el('g', {class:'plain-hide'}, s.g), 36, 592 - (ls.length-1)*lh*FS, ls, {size:11.5, fill:C.ink2, sans:true, lh:lh});
  }
  if (plainCaption){
    const pg = el('g', {class:'plain-only'}, s.g);
    const ls = wrap(plainCaption, Math.floor(104 / FS));
    const lh = 16;
    el('rect', {x:36, y:594 - ls.length*lh*FS - 4, width:760 - 56, height:ls.length*lh*FS + 14, fill:C.ground}, pg);
    lines(pg, 36, 594 - (ls.length-1)*lh*FS, ls, {size:13, fill:C.ink, sans:true, weight:500, lh:lh});
  }
  // details group: fades out in Plain; re-appended last so it paints above card fills
  s.d = el('g', {class:'plain-hide'}, s.g);
}
/* a simple chat bubble in plane or screen coordinates */
function bubble(parent, x, y, w, content, o){
  o = o || {};
  const lh = o.lh || 11, size = o.size || 8, pad = o.pad || 8;
  // a string is wrapped to the bubble's width at the current text size; an array is used as given
  let arr = Array.isArray(content) ? content : wrap(content, Math.max(8, Math.floor((w - pad*2) / (size * FS * 0.53))));
  if (o.maxLines && arr.length > o.maxLines){ arr = arr.slice(0, o.maxLines); arr[arr.length-1] = arr[arr.length-1].replace(/\s*\S*$/, '') + '…'; }
  const h = pad*2 + arr.length*lh*FS - 3;
  el('rect', {x:x, y:y, width:w, height:h, rx:o.rx == null ? 4 : o.rx, fill:o.fill||C.paper, stroke:o.stroke||C.grid, 'stroke-width':o.sw||0.8}, parent);
  lines(parent, x + pad, y + pad + size*FS, arr, {size:size, sans:true, lh:lh, fill:o.color||C.ink});
  return {x:x, y:y, w:w, h:h, bottom:y + h, lines:arr, lastLine:arr[arr.length-1] || ''};
}
/* a small padlock glyph */
function lock(parent, x, y, o){
  o = o || {};
  const g = el('g', {}, parent);
  const c = o.color || C.greenInk, s = o.scale || 1;
  el('rect', {x:x - 5*s, y:y - 1*s, width:10*s, height:8*s, rx:1.2*s, fill:c}, g);
  el('path', {d:'M' + (x - 3*s) + ' ' + (y - 1*s) + ' v' + (-3*s) + ' a' + (3*s) + ' ' + (3*s) + ' 0 0 1 ' + (6*s) + ' 0 v' + (3*s), fill:'none', stroke:c, 'stroke-width':1.6*s}, g);
  return g;
}

/* characters riding a wire */
class Stream {
  constructor(parent, path, chars, o){
    o = o || {};
    this.path = path; this.chars = chars.length ? chars : ['·'];
    this.len = Math.max(1, path.getTotalLength());
    this.n = o.n || Math.max(4, Math.min(22, Math.floor(this.len / 26)));
    this.speed = o.speed || 55; this.gap = this.len / this.n; this.offset = 0;
    this.g = el('g', {class:'stream'}, parent); this.nodes = [];
    for (let i = 0; i < this.n; i++){
      const t = text(this.g, 0, 0, this.chars[i % this.chars.length], {size:o.size||10.5, fill:o.fill||C.greenInk, anchor:'middle', weight:500});
      t.setAttribute('dominant-baseline', 'middle');
      this.nodes.push(t);
    }
    this.tick(0);
  }
  tick(dt){
    this.offset = (this.offset + this.speed*dt) % this.gap;
    for (let i = 0; i < this.n; i++){
      const s = (i*this.gap + this.offset) % this.len;
      const p = this.path.getPointAtLength(s);
      this.nodes[i].setAttribute('x', p.x.toFixed(1));
      this.nodes[i].setAttribute('y', p.y.toFixed(1));
    }
  }
}

/* ---------------- tokenizer (approximate) ---------------- */
function tokenize(str){
  const out = [];
  const re = /\s*[A-Za-z]+|\s*\d+|\s*[^\sA-Za-z\d]+/g;
  let m;
  while ((m = re.exec(str))){
    const t = m[0];
    const lead = t.match(/^\s*/)[0];
    const w = t.slice(lead.length);
    if (/^[A-Za-z]+$/.test(w) && w.length > 7){
      const cut = Math.ceil(w.length * 0.55);
      out.push(lead + w.slice(0, cut)); out.push(w.slice(cut));
    } else out.push(t);
  }
  return out;
}
function tokId(t){
  let h = 2166136261;
  for (let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return 1000 + (h % 98000);
}
function charsOf(tokens){
  const s = tokens.join('').replace(/\s+/g, ' ');
  return s.split('').filter(c => c !== ' ');
}
const disp = t => t.replace(/^ /, '·');
function chipWidth(t){ return disp(t).length * 6.1 * FS + 12; }
function chip(parent, x, y, tok, o){
  o = o || {};
  const w = chipWidth(tok);
  const g = el('g', {}, parent);
  const r = el('rect', {x:x, y:y, width:w, height:18, rx:2, fill:o.fill||C.paper, stroke:o.stroke||C.ink, 'stroke-width':1}, g);
  text(g, x + w/2, y + 12.5, disp(tok), {anchor:'middle', size:10, fill:o.color||C.ink});
  if (o.id !== false) text(g, x + w/2, y + 29, String(tokId(tok)), {anchor:'middle', size:8, fill:C.muted, cls:'plain-hide'});
  return {g:g, rect:r, w:w, cx:x + w/2, x:x, y:y};
}
function chipRow(parent, x0, y0, tokens, maxX, o){
  o = o || {};
  let x = x0, y = y0; const out = [];
  const rowH = o.id === false ? 26 : 40;
  tokens.forEach((t, i) => {
    const w = chipWidth(t);
    if (x + w > maxX && x > x0){ x = x0; y += rowH; }
    const opts = Object.assign({}, o);
    if (o.fillFn) opts.fill = o.fillFn(i);
    const c = chip(parent, x, y, t, opts);
    out.push(c); x += w + 6;
  });
  return {chips: out, bottom: y + (o.id === false ? 20 : 34), rows: (y - y0)/rowH + 1};
}

/* ---------------- scene machinery ---------------- */
const scenes = [];
let BUILDERS = [], onRebuild = null, STEPS = 8;
let scenesRoot = null, navLinks = [], stepPill = null, steps = [];
let active = 0, tActive = 0;

function makeScene(i, builder){
  const g = el('g', {class:'scene', 'data-scene': i}, scenesRoot);
  const s = {g: g, streams: [], anims: [], i: i};
  builder(s);
  if (s.d) g.appendChild(s.d);
  scenes.push(s);
  return s;
}
function buildAll(){
  if (!scenesRoot) return;
  while (scenesRoot.firstChild) scenesRoot.removeChild(scenesRoot.firstChild);
  scenes.length = 0;
  BUILDERS.forEach((b, i) => makeScene(i, b));
  applyActive();
  if (onRebuild) onRebuild();
}
function applyActive(){
  scenes.forEach((s, i) => s.g.classList.toggle('active', i === active));
  navLinks.forEach((a, i) => { if (i === active) a.setAttribute('aria-current', 'step'); else a.removeAttribute('aria-current'); });
  if (stepPill && navLinks[active]) stepPill.textContent = (active + 1) + ' / ' + STEPS + ' · ' + navLinks[active].textContent;
  if (reduce){ const s = scenes[active]; if (s){ s.streams.forEach(st => st.tick(0)); s.anims.forEach(a => a(7.3, 0)); } }
}
function setActive(i){
  if (i === active) return;
  active = i; tActive = 0; applyActive();
}
let last = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now - last) / 1000); last = now; tActive += dt;
  const s = scenes[active];
  if (s && !reduce){ s.streams.forEach(st => st.tick(dt)); s.anims.forEach(a => a(tActive, dt)); }
  requestAnimationFrame(loop);
}
let ticking = false;
function onScroll(){
  if (ticking) return; ticking = true;
  requestAnimationFrame(() => {
    ticking = false;
    const vh = window.innerHeight;
    const wrapEl = document.getElementById('stage-wrap');
    const stageBox = wrapEl ? wrapEl.getBoundingClientRect() : {bottom: vh * 0.5};
    const pivot = window.innerWidth <= 900 ? Math.min(vh * 0.62, stageBox.bottom + 70) : vh * 0.5;
    let idx = 0;
    steps.forEach((st, i) => { if (st.getBoundingClientRect().top <= pivot) idx = i; });
    setActive(idx);
  });
}

/* depth toggle */
function setDepth(d){
  document.body.dataset.depth = d;
  document.querySelectorAll('.depth button[data-depth]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.depth === d)));
  try { localStorage.setItem('prt-depth', d); } catch(e){}
}
/* diagram text size */
function applyFSClass(){
  // at the largest size the stage shows fewer labels so the ones left stay legible; the cards keep everything
  document.body.dataset.fs = FS >= 1.4 ? 'xl' : FS > 1.1 ? 'l' : 'm';
}
function setFS(v, rebuild){
  FS = v;
  document.querySelectorAll('.textsize button').forEach(b => b.setAttribute('aria-pressed', String(parseFloat(b.dataset.fs) === v)));
  try { localStorage.setItem('prt-fs', String(v)); } catch(e){}
  applyFSClass();
  if (rebuild !== false) buildAll();
}

function init(opts){
  BUILDERS = opts.builders || [];
  onRebuild = opts.onRebuild || null;
  STEPS = opts.stepCount || BUILDERS.length;
  scenesRoot = document.getElementById('scenes');
  navLinks = Array.from(document.querySelectorAll('#depth-nav a[data-step]'));
  stepPill = document.getElementById('step-pill');
  steps = Array.from(document.querySelectorAll('.step'));

  document.querySelectorAll('.depth button[data-depth]').forEach(b => b.addEventListener('click', () => setDepth(b.dataset.depth)));
  try { const saved = localStorage.getItem('prt-depth'); if (saved === 'nerd' || saved === 'simple' || saved === 'plain') setDepth(saved); } catch(e){}

  document.querySelectorAll('.textsize button').forEach(b => b.addEventListener('click', () => setFS(parseFloat(b.dataset.fs))));
  try {
    const sv = parseFloat(localStorage.getItem('prt-fs'));
    if (sv === 1.25 || sv === 1.5 || sv === 1) FS = sv;
    else if (matchMedia('(max-width: 700px)').matches) FS = 1.25;
    document.querySelectorAll('.textsize button').forEach(b => b.setAttribute('aria-pressed', String(parseFloat(b.dataset.fs) === FS)));
  } catch(e){}
  applyFSClass();

  window.addEventListener('scroll', onScroll, {passive:true});
  window.addEventListener('resize', onScroll);
  window.addEventListener('keydown', e => {
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    let target = null;
    if (e.key === 'ArrowDown' || e.key === 'j' || e.key === 'J') target = Math.min(steps.length - 1, active + 1);
    else if (e.key === 'ArrowUp' || e.key === 'k' || e.key === 'K') target = Math.max(0, active - 1);
    else if (/^[1-9]$/.test(e.key) && parseInt(e.key, 10) <= steps.length) target = parseInt(e.key, 10) - 1;
    if (target === null || !steps[target]) return;
    e.preventDefault();
    steps[target].scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
  });

  // after-journey nav: sticks once reached (CSS) and highlights the section in view
  const afterNav = document.getElementById('after-nav');
  if (afterNav){
    const links = Array.from(afterNav.querySelectorAll('a[href^="#"]'));
    const targets = links.map(a => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    const mark = () => {
      const navH = afterNav.getBoundingClientRect().height + 8;
      let cur = null;
      targets.forEach(t => { if (t.getBoundingClientRect().top <= navH + 40) cur = t; });
      links.forEach(a => { if (cur && a.getAttribute('href') === '#' + cur.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    };
    window.addEventListener('scroll', mark, {passive:true});
    mark();
  }

  buildAll();
  onScroll();
  requestAnimationFrame(loop);
}

window.PRT = {
  el, text, label, lines, wrap, fmt, P, poly, cube, screenPlane, wire, pathThrough, frameTitle, bubble, lock, Stream,
  tokenize, tokId, charsOf, disp, chipWidth, chip, chipRow, C, reduce,
  init, rebuild: buildAll, setDepth, setFS,
  get FS(){ return FS; },
  get active(){ return active; }
};
})();
