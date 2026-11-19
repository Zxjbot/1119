/* =========================================================
   pit.js — 坑底全景圖（僅 index.html 使用）
   監聽 survivor.js 送出的 qin:roster 事件，用 SVG 畫出坑與坑裡的人。
   新被推下去的人會從坑口掉進去。
   ========================================================= */
(function () {
  'use strict';
  var host = document.getElementById('pitPanorama');
  if (!host) return;

  var NS = 'http://www.w3.org/2000/svg';
  var W = 640, H = 290, GY = 58, BY = 272; // 畫布、地表 y、坑底 y
  var PER_ROW = 8;
  var FATE_COLOR = { survive: '#5fbf8a', flee: '#e0b14a', unknown: '#aab0b8', pit: '#e06a5a' };
  var FATE_LABEL = { survive: '史實：躲過此劫', flee: '史實：連夜逃亡', unknown: '史實：史書失載', pit: '史實：確實入坑' };

  function s(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (parent) parent.appendChild(n);
    return n;
  }
  function leftAt(y) { return 150 + (y - GY) * (60 / (BY - GY)); }
  function rightAt(y) { return 490 - (y - GY) * (60 / (BY - GY)); }

  function drawEmperor(svg) {
    var g = s('g', { transform: 'translate(566,' + GY + ')' }, svg);
    s('rect', { x: -11, y: -34, width: 22, height: 34, rx: 6, 'class': 'pn-robe' }, g);
    s('circle', { cx: 0, cy: -43, r: 8, 'class': 'pn-face' }, g);
    var crown = s('text', { x: 0, y: -54, 'text-anchor': 'middle', 'font-size': 18 }, g);
    crown.textContent = '👑';
    s('line', { x1: -9, y1: -26, x2: -34, y2: -34, 'class': 'pn-arm' }, g); // 伸手指向坑
    var lbl = s('text', { x: 0, y: 18, 'text-anchor': 'middle', 'class': 'pn-label' }, g);
    lbl.textContent = '始皇帝';
  }

  function drawFigure(svg, entry, i, added) {
    var jit = ((i * 37) % 7) - 3;
    var x = 320 + ((i % PER_ROW) - (PER_ROW - 1) / 2) * 26 + jit * 1.2;
    var y = BY - 8 - Math.floor(i / PER_ROW) * 27;
    var rot = jit * 4;
    var outer = s('g', { transform: 'translate(' + x.toFixed(1) + ',' + y + ') rotate(' + rot + ')' }, svg);
    var order = added.indexOf(entry.name);
    var inner = s('g', { 'class': 'pn-fig' + (order > -1 ? ' pn-drop' : '') }, outer);
    if (order > -1) inner.style.animationDelay = (order * 0.1) + 's';
    var color = FATE_COLOR[entry.fate] || FATE_COLOR.unknown;
    s('line', { x1: -6, y1: -16, x2: -12, y2: -29, stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }, inner);
    s('line', { x1: 6, y1: -16, x2: 12, y2: -29, stroke: color, 'stroke-width': 3, 'stroke-linecap': 'round' }, inner);
    s('rect', { x: -6, y: -21, width: 12, height: 21, rx: 4, fill: color }, inner);
    s('circle', { cx: 0, cy: -27, r: 6, fill: '#f1d9b5' }, inner);
    var t = s('title', null, inner);
    t.textContent = entry.name + '（' + (FATE_LABEL[entry.fate] || '') + '）';
  }

  function render(entries, added, total) {
    host.textContent = '';
    var svg = s('svg', {
      viewBox: '0 0 ' + W + ' ' + H, 'class': 'pn-svg', role: 'img',
      'aria-label': '坑底全景圖：目前 ' + entries.length + ' 人在坑中'
    });

    var defs = s('defs', null, svg);
    var grad = s('linearGradient', { id: 'pnPit', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    s('stop', { offset: '0%', 'stop-color': '#2a1d14' }, grad);
    s('stop', { offset: '100%', 'stop-color': '#080504' }, grad);

    s('rect', { x: 0, y: 0, width: W, height: GY, 'class': 'pn-sky' }, svg);
    s('rect', { x: 0, y: GY, width: W, height: H - GY, 'class': 'pn-soil' }, svg);
    [100, 150, 205].forEach(function (y) {
      s('line', { x1: 0, y1: y, x2: W, y2: y, 'class': 'pn-strata' }, svg);
    });
    s('polygon', {
      points: leftAt(GY) + ',' + GY + ' ' + rightAt(GY) + ',' + GY + ' ' +
              rightAt(BY) + ',' + BY + ' ' + leftAt(BY) + ',' + BY,
      fill: 'url(#pnPit)'
    }, svg);
    s('path', { d: 'M0 ' + GY + ' H' + leftAt(GY) + ' M' + rightAt(GY) + ' ' + GY + ' H' + W, 'class': 'pn-surface' }, svg);

    drawEmperor(svg);
    entries.forEach(function (e, i) { drawFigure(svg, e, i, added); });
    host.appendChild(svg);

    var cap = document.createElement('p');
    cap.className = 'pn-caption';
    cap.textContent = entries.length === 0
      ? '坑底還是空的。下詔吧，陛下。'
      : '坑底共 ' + entries.length + ' / ' + total + ' 人：' + entries.map(function (e) { return e.name; }).join('、');
    host.appendChild(cap);
  }

  window.addEventListener('qin:roster', function (ev) {
    var d = ev.detail || {};
    render(d.entries || [], d.added || [], d.total || 0);
  });
  render([], [], 0);
})();
