/* =========================================================
   features.js — 坑底深度捲動進度條 + 古典樂器五聲音階背景音
   index.html / table.html 共用（需搭配 theme.css 的新增樣式）
   ========================================================= */
(function () {
  'use strict';

  /* ---------- 小工具 ---------- */
  function el(tag, attrs, text) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text != null) node.textContent = text;
    return node;
  }
  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  /* =========================================================
     一、坑底深度捲動進度條
     ========================================================= */
  var STAGES = [
    [0, '咸陽宮頂'],
    [8, '地表'],
    [30, '淺坑'],
    [60, '深坑'],
    [90, '坑底']
  ];
  var MAX_ZHANG = 30; // 捲到頁尾 = 30 丈（秦制 1 丈約 2.3 公尺）

  var bar = el('div', {
    id: 'depthBar', role: 'progressbar', 'aria-label': '坑底深度',
    'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '0'
  });
  var fill = el('div', { id: 'depthFill' });
  bar.appendChild(fill);

  var badge = el('button', { id: 'depthBadge', type: 'button', title: '點擊爬出坑底（回到頁首）' });
  var badgeIcon = el('span', { 'aria-hidden': 'true' }, '🕳️');
  var badgeLabel = el('span', { 'class': 'depth-label' }, '坑底深度');
  var badgeNum = el('b', null, '0.0');
  var badgeUnit = el('span', null, '丈');
  var badgeStage = el('small', null, STAGES[0][1]);
  [badgeIcon, badgeLabel, badgeNum, badgeUnit, badgeStage].forEach(function (n) { badge.appendChild(n); });
  badge.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });

  var depthPct = 0, ticking = false;

  function stageOf(pct) {
    var name = STAGES[0][1];
    for (var i = 0; i < STAGES.length; i++) if (pct >= STAGES[i][0]) name = STAGES[i][1];
    return name;
  }

  function updateDepth() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var pct = max > 0 ? Math.min(100, Math.max(0, (window.pageYOffset / max) * 100)) : 0;
    depthPct = pct;
    fill.style.width = pct + '%';
    bar.setAttribute('aria-valuenow', String(Math.round(pct)));
    badgeNum.textContent = (pct / 100 * MAX_ZHANG).toFixed(1);
    badgeStage.textContent = stageOf(pct);
    badge.classList.toggle('at-bottom', pct >= 99.5);
    window.dispatchEvent(new CustomEvent('qin:depth', { detail: { pct: pct } }));
  }
  function onScroll() {
    if (!ticking) { ticking = true; requestAnimationFrame(updateDepth); }
  }

  /* =========================================================
     二、古典樂器五聲音階（宮、商、角、徵、羽）— Web Audio 合成
     所有樂器都只彈 宮(C) 商(D) 角(E) 徵(G) 羽(A) 這五個音，
     只會在不同八度之間折疊音高，不會出現音階外的音。
     捲得越深：音色越暗、節奏越慢、殘響越長。
     ========================================================= */
  var NAMES = ['宮', '商', '角', '徵', '羽'];
  var NOTE_LETTERS = ['C', 'D', 'E', 'G', 'A'];
  var MODE_LABELS = ['宮調式', '商調式', '角調式', '徵調式', '羽調式'];
  var BASE = 261.63; // C4 = 宮
  // 三個八度內的五聲音階音高（距 C4 的半音數），每 5 個一組：C3 組 / C4 組 / C5 組
  var SEMIS = [-12, -10, -8, -5, -3, 0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
  var LOW = 2, HIGH = 13; // 隨機漫步使用的音域
  var MID = 5;            // C4 組起點

  // min / max：該樂器的舒適音域（Hz）；超出時以八度折疊，音名不變
  var INSTRUMENTS = {
    zheng:     { label: '古箏（撥弦）',   short: '古箏', min: 130, max: 900 },
    pipa:      { label: '琵琶（撥弦）',   short: '琵琶', min: 190, max: 1000 },
    guqin:     { label: '古琴（撥弦）',   short: '古琴', min: 65,  max: 330 },
    dizi:      { label: '笛子（吹管）',   short: '笛子', min: 290, max: 1200 },
    xiao:      { label: '洞簫（吹管）',   short: '洞簫', min: 130, max: 520 },
    erhu:      { label: '二胡（拉弦）',   short: '二胡', min: 260, max: 1000 },
    bianzhong: { label: '編鐘（敲擊）',   short: '編鐘', min: 200, max: 1000 },
    ensemble:  { label: '合奏（箏＋笛＋鐘＋簫）', short: '合奏', min: 130, max: 900 }
  };
  var INSTR_ORDER = ['zheng', 'pipa', 'guqin', 'dizi', 'xiao', 'erhu', 'bianzhong', 'ensemble'];

  var Z = {
    ctx: null, master: null, filter: null, wet: null, comp: null, noise: null,
    droneOsc: [], droneGain: null,
    on: false, vol: 0.6, mode: 0, instr: 'zheng',
    timer: null, nextTime: 0, pos: 7, phrase: 0, lastIdx: -1,
    cache: {}
  };
  var savedVol = parseFloat(store('qinMusicVol'));
  if (!isNaN(savedVol)) Z.vol = Math.min(1, Math.max(0, savedVol));
  var savedMode = parseInt(store('qinMusicMode'), 10);
  if (savedMode >= 0 && savedMode <= 4) Z.mode = savedMode;
  var savedInstr = store('qinMusicInstr');
  if (savedInstr && INSTRUMENTS[savedInstr]) Z.instr = savedInstr;

  function freqOf(i) { return BASE * Math.pow(2, SEMIS[i] / 12); }
  function noteLabel(i) {
    var oct = i < 5 ? 3 : (i < 10 ? 4 : 5);
    return NAMES[i % 5] + '（' + NOTE_LETTERS[i % 5] + oct + '）';
  }
  function depthMul() { return 1 + (depthPct / 100) * 0.7; }
  function fold(f, min, max) {
    while (f < min) f *= 2;
    while (f > max) f /= 2;
    return f;
  }

  function makeImpulse(ctx, sec) {
    var len = Math.floor(ctx.sampleRate * sec);
    var buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = buf.getChannelData(c);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
    }
    return buf;
  }

  function initAudio() {
    if (Z.ctx) return true;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    var ctx = new AC();
    Z.ctx = ctx;

    Z.comp = ctx.createDynamicsCompressor();
    Z.comp.connect(ctx.destination);

    Z.master = ctx.createGain();
    Z.master.gain.value = 0;
    Z.master.connect(Z.comp);

    Z.filter = ctx.createBiquadFilter();
    Z.filter.type = 'lowpass';
    Z.filter.frequency.value = 7000;
    Z.filter.Q.value = 0.6;
    Z.filter.connect(Z.master);

    var conv = ctx.createConvolver();
    conv.buffer = makeImpulse(ctx, 2.4);
    Z.wet = ctx.createGain();
    Z.wet.gain.value = 0.22;
    Z.filter.connect(Z.wet);
    Z.wet.connect(conv);
    conv.connect(Z.master);
    applyDepth();
    return true;
  }

  function masterLevel() { return Math.pow(Z.vol, 2) * 0.9; }

  function applyDepth() {
    if (!Z.ctx) return;
    var t = Z.ctx.currentTime, p = depthPct / 100;
    Z.filter.frequency.setTargetAtTime(7000 - 5800 * p, t, 0.4);
    Z.wet.gain.setTargetAtTime(0.22 + 0.22 * p, t, 0.4);
  }

  function noiseBuf() {
    if (Z.noise) return Z.noise;
    var ctx = Z.ctx, len = ctx.sampleRate * 2;
    var b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    Z.noise = b;
    return b;
  }

  /* ---------- 撥弦類：Karplus-Strong（古箏 / 琵琶 / 古琴）---------- */
  // lp：初始雜訊的低通程度（越大越圓潤）　decay：每週期衰減　sec：緩衝長度
  var KS = {
    zheng: { lp: 0.45, decay: 0.9975, sec: 3.2 },
    pipa:  { lp: 0.12, decay: 0.9935, sec: 1.8 },
    guqin: { lp: 0.78, decay: 0.9988, sec: 4.2 }
  };

  function pluckBuffer(freq, kind) {
    var P = KS[kind];
    var key = kind + Math.round(freq * 100);
    if (Z.cache[key]) return Z.cache[key];
    var sr = Z.ctx.sampleRate;
    var len = Math.floor(sr * P.sec);
    var d = Math.max(2, Math.round(sr / freq));
    var buf = Z.ctx.createBuffer(1, len, sr);
    var data = buf.getChannelData(0);
    var prev = 0, i;
    for (i = 0; i < d; i++) {
      prev = prev * P.lp + (Math.random() * 2 - 1) * (1 - P.lp);
      data[i] = prev;
    }
    for (i = d; i < len; i++) {
      var a = data[i - d];
      var b = i - d - 1 >= 0 ? data[i - d - 1] : 0;
      data[i] = P.decay * 0.5 * (a + b);
    }
    var peak = 0;
    for (i = 0; i < len; i++) { var v = Math.abs(data[i]); if (v > peak) peak = v; }
    var norm = peak > 0 ? 0.9 / peak : 1;
    var fade = Math.floor(sr * 0.25);
    for (i = 0; i < len; i++) {
      var g = norm;
      if (i > len - fade) g *= (len - i) / fade;
      data[i] *= g;
    }
    Z.cache[key] = buf;
    return buf;
  }

  function voicePluck(kind, f, when, vel, slideFrom) {
    var ctx = Z.ctx;
    var src = ctx.createBufferSource();
    src.buffer = pluckBuffer(f, kind);
    if (slideFrom && slideFrom !== f) { // 吟猱：從鄰近的五聲音滑入
      src.playbackRate.setValueAtTime(slideFrom / f, when);
      src.playbackRate.linearRampToValueAtTime(1, when + 0.16);
    }
    var g = ctx.createGain();
    g.gain.value = vel * (kind === 'guqin' ? 0.95 : 1);
    if (kind === 'guqin') {
      var lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 1500;
      src.connect(lp); lp.connect(g);
    } else {
      src.connect(g);
    }
    g.connect(Z.filter);
    src.start(when);
  }

  /* ---------- 吹管類：笛子 / 洞簫 ---------- */
  var WIND = {
    dizi: { atk: 0.06, breath: 0.07, h2: 0.22, vib: 0.006, peak: 0.5 },
    xiao: { atk: 0.14, breath: 0.12, h2: 0.07, vib: 0.004, peak: 0.55 }
  };

  function voiceWind(name, f, when, vel, dur) {
    var ctx = Z.ctx, c = WIND[name];
    var end = when + Math.max(dur, 0.3), rel = 0.25;
    var env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(vel * c.peak, when + c.atk);
    env.gain.setValueAtTime(vel * c.peak * 0.9, end);
    env.gain.linearRampToValueAtTime(0, end + rel);

    var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
    var o2 = ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2;
    var g2 = ctx.createGain(); g2.gain.value = c.h2;

    var lfo = ctx.createOscillator(); lfo.frequency.value = 5.2;
    var d1 = ctx.createGain(), d2 = ctx.createGain();
    d1.gain.setValueAtTime(0, when); d1.gain.linearRampToValueAtTime(f * c.vib, when + 0.45);
    d2.gain.setValueAtTime(0, when); d2.gain.linearRampToValueAtTime(f * 2 * c.vib, when + 0.45);
    lfo.connect(d1); d1.connect(o1.frequency);
    lfo.connect(d2); d2.connect(o2.frequency);

    var n = ctx.createBufferSource(); n.buffer = noiseBuf(); n.loop = true;
    var bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 1.5;
    var ng = ctx.createGain(); ng.gain.value = c.breath;
    n.connect(bp); bp.connect(ng); ng.connect(env);

    o1.connect(env); o2.connect(g2); g2.connect(env);
    env.connect(Z.filter);

    var stopAt = end + rel + 0.05;
    o1.start(when); o2.start(when); lfo.start(when); n.start(when, Math.random() * 1.5);
    o1.stop(stopAt); o2.stop(stopAt); lfo.stop(stopAt); n.stop(stopAt);
  }

  /* ---------- 拉弦類：二胡 ---------- */
  function voiceErhu(f, when, vel, dur, slideFrom) {
    var ctx = Z.ctx;
    var end = when + Math.max(dur, 0.35), rel = 0.22, atk = 0.07;
    var env = ctx.createGain();
    env.gain.setValueAtTime(0, when);
    env.gain.linearRampToValueAtTime(vel * 0.3, when + atk);
    env.gain.setValueAtTime(vel * 0.27, end);
    env.gain.linearRampToValueAtTime(0, end + rel);

    var mix = ctx.createGain(); mix.gain.value = 0.5;
    var oscs = [];
    [0, 7].forEach(function (cents) {
      var o = ctx.createOscillator(); o.type = 'sawtooth';
      o.detune.value = cents;
      if (slideFrom && slideFrom !== f) { // 滑音：從鄰近的五聲音滑入
        o.frequency.setValueAtTime(slideFrom, when);
        o.frequency.exponentialRampToValueAtTime(f, when + 0.14);
      } else {
        o.frequency.setValueAtTime(f, when);
      }
      o.connect(mix);
      oscs.push(o);
    });

    var lfo = ctx.createOscillator(); lfo.frequency.value = 5.6;
    var depth = ctx.createGain();
    depth.gain.setValueAtTime(0, when);
    depth.gain.setValueAtTime(0, when + 0.3);
    depth.gain.linearRampToValueAtTime(22, when + 0.7); // 音分
    lfo.connect(depth);
    oscs.forEach(function (o) { depth.connect(o.detune); });

    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 1;
    var pk = ctx.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 900; pk.gain.value = 7; pk.Q.value = 1.2;
    mix.connect(lp); lp.connect(pk); pk.connect(env); env.connect(Z.filter);

    var stopAt = end + rel + 0.05;
    oscs.forEach(function (o) { o.start(when); o.stop(stopAt); });
    lfo.start(when); lfo.stop(stopAt);
  }

  /* ---------- 敲擊類：編鐘 ---------- */
  var BELL = [ // [頻率倍率, 音量, 衰減秒數]
    [1, 1, 3.2], [2, 0.45, 2.0], [2.76, 0.25, 1.2], [4.07, 0.12, 0.7]
  ];
  function voiceBell(f, when, vel) {
    var ctx = Z.ctx;
    BELL.forEach(function (p) {
      var o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * p[0];
      var g = ctx.createGain();
      var peak = vel * 0.38 * p[1];
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(peak, when + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, when + p[2]);
      o.connect(g); g.connect(Z.filter);
      o.start(when); o.stop(when + p[2] + 0.05);
    });
  }

  /* ---------- 樂器分派 ---------- */
  function playVoice(name, f, when, vel, dur, slideFrom) {
    var I = INSTRUMENTS[name];
    f = fold(f, I.min, I.max);
    if (slideFrom) slideFrom = fold(slideFrom, I.min, I.max);
    switch (name) {
      case 'zheng': case 'pipa': voicePluck(name, f, when, vel, 0); break;
      case 'guqin': voicePluck('guqin', f, when, vel, slideFrom); break;
      case 'dizi': case 'xiao': voiceWind(name, f, when, vel, dur); break;
      case 'erhu': voiceErhu(f, when, vel, dur, slideFrom); break;
      case 'bianzhong': voiceBell(f, when, vel); break;
    }
  }

  var keyEls = [];
  var statusEl = null;
  function flashKey(i, when) {
    var delay = Math.max(0, (when - Z.ctx.currentTime) * 1000);
    setTimeout(function () {
      var k = keyEls[i % 5];
      if (!k) return;
      k.classList.add('playing');
      setTimeout(function () { k.classList.remove('playing'); }, 380);
      if (statusEl) statusEl.textContent = INSTRUMENTS[Z.instr].short + '：' + noteLabel(i);
    }, delay);
  }

  // role：walk 級進 / gliss 刮奏 / cadence 終止式 / key 手動琴鍵 / sfx 音效
  function note(i, when, vel, role, dur) {
    if (!Z.ctx) return;
    var f = freqOf(i), name = Z.instr;
    vel = vel == null ? 0.7 : vel;
    dur = dur || 1.5;
    var slide = (role === 'walk' && Z.lastIdx >= 0 && Z.lastIdx !== i && Math.random() < 0.6)
      ? freqOf(Z.lastIdx) : 0;

    if (name === 'ensemble') {
      if (role === 'cadence') {
        playVoice('zheng', f, when, vel, dur, 0);
        playVoice('bianzhong', f, when, vel * 0.8, dur, 0);
        playVoice('xiao', f, when, vel * 0.7, dur + 1, 0);
      } else if (role === 'gliss') {
        playVoice('zheng', f, when, vel, dur, 0);
      } else {
        playVoice('zheng', f, when, vel, dur, 0);
        if (i % 2 === 0) playVoice('dizi', f, when + 0.02, vel * 0.6, dur * 1.1, 0);
        else playVoice('erhu', f, when + 0.02, vel * 0.45, dur * 1.1, slide);
      }
    } else {
      playVoice(name, f, when, vel, dur, slide);
    }
    if (role === 'walk') Z.lastIdx = i;
    flashKey(i, when);
  }

  function tonicIdx() { return MID + Z.mode; }

  function startDrone() {
    stopDrone(true);
    var ctx = Z.ctx, f = freqOf(tonicIdx()) / 4;
    Z.droneGain = ctx.createGain();
    Z.droneGain.gain.value = 0;
    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 400;
    var o1 = ctx.createOscillator(); o1.type = 'sine'; o1.frequency.value = f;
    var o2 = ctx.createOscillator(); o2.type = 'triangle'; o2.frequency.value = f * 2;
    var g2 = ctx.createGain(); g2.gain.value = 0.45;
    o1.connect(Z.droneGain); o2.connect(g2); g2.connect(Z.droneGain);
    Z.droneGain.connect(lp); lp.connect(Z.master);
    o1.start(); o2.start();
    Z.droneGain.gain.setTargetAtTime(0.07, ctx.currentTime, 1.2);
    Z.droneOsc = [o1, o2];
  }
  function stopDrone(immediate) {
    var oscs = Z.droneOsc; Z.droneOsc = [];
    if (!oscs.length) return;
    var stopAt = Z.ctx.currentTime + (immediate ? 0.02 : 0.9);
    if (Z.droneGain && !immediate) Z.droneGain.gain.setTargetAtTime(0, Z.ctx.currentTime, 0.2);
    oscs.forEach(function (o) { try { o.stop(stopAt); } catch (e) { /* 已停止 */ } });
  }

  function beatLen() { return (0.85 + Math.random() * 0.55) * depthMul(); }
  function clampIdx(n) { return Math.min(HIGH, Math.max(LOW, n)); }

  function playStep() {
    var t = Z.nextTime, r = Math.random(), gap;
    // 終止式：回到主音
    if (Z.phrase >= 7 + Math.floor(Math.random() * 3)) {
      var ti = tonicIdx();
      note(ti - 5, t, 0.75, 'cadence', 3.2);
      note(ti, t + 0.38 * depthMul(), 0.65, 'cadence', 2.6);
      Z.pos = ti; Z.lastIdx = ti; Z.phrase = 0;
      Z.nextTime = t + 2.4 * depthMul();
      return;
    }
    // 留白
    if (r < 0.14) { Z.nextTime = t + beatLen(); Z.phrase++; return; }
    // 刮奏 / 輪指
    if (r < 0.34) {
      var k;
      if (Z.instr === 'pipa' && Math.random() < 0.6) { // 琵琶輪指：同一音快速反覆
        var nn = 6 + Math.floor(Math.random() * 3);
        for (k = 0; k < nn; k++) note(Z.pos, t + k * 0.075, 0.35 + k * 0.07, 'gliss', 0.2);
        Z.nextTime = t + nn * 0.075 + beatLen();
        Z.phrase++;
        return;
      }
      var dir = Math.random() < 0.5 ? 1 : -1;
      var n = 4 + Math.floor(Math.random() * 3), p = Z.pos;
      for (k = 0; k < n; k++) {
        if (p + dir > HIGH || p + dir < LOW) dir = -dir;
        p += dir;
        note(p, t + k * 0.11, 0.45 + k * 0.05, 'gliss', 0.32);
      }
      Z.pos = p; Z.lastIdx = p;
      Z.nextTime = t + n * 0.11 + beatLen();
      Z.phrase++;
      return;
    }
    // 單音級進
    var steps = [-2, -1, -1, 1, 1, 2];
    gap = beatLen();
    Z.pos = clampIdx(Z.pos + steps[Math.floor(Math.random() * steps.length)]);
    note(Z.pos, t, 0.7, 'walk', gap * 1.4);
    if (Math.random() < 0.2) note(clampIdx(Z.pos - 5), t, 0.35, 'walk', gap); // 偶爾加低八度
    Z.nextTime = t + gap;
    Z.phrase++;
  }

  function schedule() {
    if (!Z.on || !Z.ctx) return;
    while (Z.nextTime < Z.ctx.currentTime + 0.6) playStep();
  }

  function startMusic() {
    if (!initAudio()) {
      statusEl.textContent = '此瀏覽器不支援 Web Audio，無法播放。';
      return false;
    }
    Z.ctx.resume();
    Z.on = true;
    Z.master.gain.cancelScheduledValues(Z.ctx.currentTime);
    Z.master.gain.setTargetAtTime(masterLevel(), Z.ctx.currentTime, 0.4);
    startDrone();
    Z.pos = tonicIdx(); Z.phrase = 0; Z.lastIdx = -1;
    Z.nextTime = Z.ctx.currentTime + 0.25;
    note(tonicIdx() - 5, Z.nextTime, 0.7, 'cadence', 3);
    Z.nextTime += 1.6;
    Z.timer = setInterval(schedule, 150);
    store('qinMusicWasOn', '1');
    return true;
  }
  function stopMusic() {
    Z.on = false;
    clearInterval(Z.timer);
    store('qinMusicWasOn', '0');
    if (!Z.ctx) return;
    Z.master.gain.cancelScheduledValues(Z.ctx.currentTime);
    Z.master.gain.setTargetAtTime(0, Z.ctx.currentTime, 0.25);
    stopDrone(false);
    statusEl.textContent = '演奏已停。';
  }

  // 對外提供：抽籤器 / 推人遊戲音效（只在背景音開啟時才發聲，用目前選的樂器）
  function sfx(kind) {
    if (!Z.on || !Z.ctx) return;
    var t = Z.ctx.currentTime + 0.05, seq, gap;
    if (kind === 'draw') {
      seq = [5, 7, 6, 8, 7, 9]; gap = 0.07;
    } else if (kind === 'survive') {
      seq = [5, 6, 7, 8, 9, 10]; gap = 0.1;
    } else if (kind === 'flee') {
      seq = [8, 7, 6, 5]; gap = 0.14;
    } else if (kind === 'pit') {
      seq = [9, 8, 7, 6, 5, 3, 2, 0]; gap = 0.16;
    } else {
      seq = [5, 7]; gap = 0.25;
    }
    seq.forEach(function (idx, k) { note(idx, t + k * gap, 0.75, 'sfx', gap * 1.6); });
  }
  window.QinAudio = { isOn: function () { return Z.on; }, sfx: sfx };

  /* ---------- 樂器面板 UI ---------- */
  var panel = el('div', { id: 'zhengPanel' });
  var head = el('div', { 'class': 'zheng-head' });
  var playBtn = el('button', { type: 'button', 'class': 'zheng-play', 'aria-pressed': 'false' });
  var optBtn = el('button', {
    type: 'button', 'class': 'zheng-opt', 'aria-expanded': 'false',
    'aria-controls': 'zhengBody', 'aria-label': '展開樂器設定'
  }, '⚙');
  head.appendChild(playBtn);
  head.appendChild(optBtn);

  var body = el('div', { id: 'zhengBody', 'class': 'zheng-body' });

  var instRow = el('div', { 'class': 'zheng-row' });
  var instLabel = el('label', { 'for': 'zhengInstr' }, '樂器');
  var instSel = el('select', { id: 'zhengInstr' });
  INSTR_ORDER.forEach(function (key) {
    var o = el('option', { value: key }, INSTRUMENTS[key].label);
    if (key === Z.instr) o.selected = true;
    instSel.appendChild(o);
  });
  instRow.appendChild(instLabel); instRow.appendChild(instSel);

  var modeRow = el('div', { 'class': 'zheng-row' });
  var modeLabel = el('label', { 'for': 'zhengMode' }, '調式');
  var modeSel = el('select', { id: 'zhengMode' });
  MODE_LABELS.forEach(function (name, i) {
    var o = el('option', { value: String(i) }, name + '（以「' + NAMES[i] + '」為主音）');
    if (i === Z.mode) o.selected = true;
    modeSel.appendChild(o);
  });
  modeRow.appendChild(modeLabel); modeRow.appendChild(modeSel);

  var volRow = el('div', { 'class': 'zheng-row' });
  var volLabel = el('label', { 'for': 'zhengVol' }, '音量');
  var volInput = el('input', { id: 'zhengVol', type: 'range', min: '0', max: '1', step: '0.05' });
  volInput.value = String(Z.vol);
  volRow.appendChild(volLabel); volRow.appendChild(volInput);

  var keys = el('div', { 'class': 'zheng-keys', role: 'group', 'aria-label': '五聲音階琴鍵' });
  NAMES.forEach(function (name, i) {
    var k = el('button', { type: 'button', 'class': 'zheng-key', 'aria-label': name + '音' });
    k.appendChild(el('span', { 'class': 'k-name' }, name));
    k.appendChild(el('small', null, NOTE_LETTERS[i]));
    k.addEventListener('click', function () {
      if (!initAudio()) { statusEl.textContent = '此瀏覽器不支援 Web Audio。'; return; }
      Z.ctx.resume();
      if (!Z.on) Z.master.gain.setTargetAtTime(masterLevel(), Z.ctx.currentTime, 0.05);
      note(MID + i, Z.ctx.currentTime + 0.02, 0.85, 'key', 1.8);
    });
    keyEls.push(k);
    keys.appendChild(k);
  });

  statusEl = el('p', { 'class': 'zheng-status', 'aria-live': 'polite' }, '點上方琴鍵可手動演奏。');
  var hint = el('p', { 'class': 'zheng-hint' }, '所有樂器都只彈宮商角徵羽五音。頁面捲得越深，音色越低沉、節奏越慢。');

  body.appendChild(instRow);
  body.appendChild(modeRow);
  body.appendChild(volRow);
  body.appendChild(keys);
  body.appendChild(statusEl);
  body.appendChild(hint);
  panel.appendChild(head);
  panel.appendChild(body);

  function refreshPlayBtn() {
    var name = INSTRUMENTS[Z.instr].short;
    var resume = !Z.on && store('qinMusicWasOn') === '1';
    playBtn.textContent = '🎼 ' + name + '　' + (Z.on ? '⏸ 暫停' : (resume ? '▶ 繼續演奏' : '▶ 演奏'));
    playBtn.setAttribute('aria-pressed', Z.on ? 'true' : 'false');
    playBtn.classList.toggle('is-on', Z.on);
    playBtn.classList.toggle('nudge', resume);
  }

  playBtn.addEventListener('click', function () {
    if (Z.on) stopMusic(); else startMusic();
    refreshPlayBtn();
  });
  optBtn.addEventListener('click', function () {
    var open = panel.classList.toggle('open');
    optBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    optBtn.setAttribute('aria-label', open ? '收合樂器設定' : '展開樂器設定');
  });
  volInput.addEventListener('input', function () {
    Z.vol = parseFloat(volInput.value);
    store('qinMusicVol', String(Z.vol));
    if (Z.ctx && Z.on) Z.master.gain.setTargetAtTime(masterLevel(), Z.ctx.currentTime, 0.05);
  });
  instSel.addEventListener('change', function () {
    if (!INSTRUMENTS[instSel.value]) return;
    Z.instr = instSel.value;
    store('qinMusicInstr', Z.instr);
    refreshPlayBtn();
    // 換樂器時彈一個主音試聽（這是使用者操作，可以發聲）
    if (initAudio()) {
      Z.ctx.resume();
      if (!Z.on) Z.master.gain.setTargetAtTime(masterLevel(), Z.ctx.currentTime, 0.05);
      note(tonicIdx(), Z.ctx.currentTime + 0.05, 0.85, 'key', 1.8);
    }
  });
  modeSel.addEventListener('change', function () {
    Z.mode = parseInt(modeSel.value, 10);
    store('qinMusicMode', String(Z.mode));
    if (Z.ctx && Z.on) {
      startDrone();
      Z.pos = tonicIdx(); Z.phrase = 0;
      note(tonicIdx(), Z.ctx.currentTime + 0.05, 0.8, 'key', 1.8);
    }
  });

  window.addEventListener('qin:depth', applyDepth);
  document.addEventListener('visibilitychange', function () {
    if (!Z.ctx || !Z.on) return;
    if (document.hidden) Z.ctx.suspend(); else Z.ctx.resume();
  });

  /* ---------- 掛載 ---------- */
  function mount() {
    document.body.appendChild(bar);
    document.body.appendChild(panel); // 面板在前，窄螢幕展開時可用兄弟選擇器隱藏深度徽章
    document.body.appendChild(badge);
    refreshPlayBtn();
    updateDepth();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
