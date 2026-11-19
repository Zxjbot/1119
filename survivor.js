/* =========================================================
   survivor.js — 始皇帝欽點：推入坑中（僅 index.html 使用）
   你是始皇帝：按下詔書，隨機欽點一人推入坑中（不重複，直到坑滿）。
   「史實對照」依《史記》等記載改寫，台詞與笑點為後人加工。
   ========================================================= */
(function () {
  'use strict';

  var FATES = {
    survive: { label: '史實：躲過此劫', icon: '🟢' },
    flee:    { label: '史實：連夜逃亡', icon: '🟡' },
    unknown: { label: '史實：史書失載', icon: '🌫️' },
    pit:     { label: '史實：確實入坑', icon: '🔴' }
  };

  // quip：始皇帝下詔時的一句話（可選）。想新增人物，照格式加一筆即可。
  var POOL = [
    { name: '伏生', origin: '濟南・秦博士', fate: 'survive', quip: '藏書的老頭，朕早就盯上你了。',
      story: '焚書令下，他把《尚書》藏進牆壁。漢初取出時已散佚大半，只剩二十九篇，靠他口授傳了下來。' },
    { name: '孔鮒', origin: '魯國・孔子後裔', fate: 'survive', quip: '孔家的牆，朕改天派人去敲。',
      story: '相傳他把《尚書》《論語》等書砌進孔子舊宅的牆裡，後來投奔陳勝，擔任博士。' },
    { name: '叔孫通', origin: '薛縣・待詔博士', fate: 'survive', quip: '這人最會看臉色，可惜今天看錯了。',
      story: '史書沒有他被坑的紀錄。陳勝起兵後，他在二世面前見風轉舵，領了賞賜就逃出咸陽，日後替漢高祖制定朝儀。' },
    { name: '張蒼', origin: '陽武・柱下御史', fate: 'survive', quip: '管文書的也推，書要是少了一本，朕唯你是問。',
      story: '在秦朝掌管宮中文書典籍，後來因罪逃回家鄉。漢初一路升官，做到丞相。' },
    { name: '扶蘇', origin: '咸陽宮・始皇長子', fate: 'survive', quip: '長子也推？……群臣一起倒抽一口氣。推。',
      story: '他公開勸諫父親不要重罰儒生，惹怒始皇，被派去上郡監軍。這次躲過了，後來的事就別提了。' },
    { name: '李斯', origin: '咸陽宮・丞相', fate: 'survive', quip: '丞相也是人，一視同仁。推。',
      story: '焚書令的提出者。前 208 年，他被趙高腰斬於咸陽市集，下場比進坑更戲劇化。' },
    { name: '關中老秦路人', origin: '咸陽街頭・圍觀群眾', fate: 'survive', quip: '吃瓜的也別想置身事外。',
      story: '只會種田打仗，聽不懂「《詩》云、《書》曰」。站在遠處吃瓜，平安回家。' },
    { name: '盧生與侯生', origin: '燕齊・方士', fate: 'flee', quip: '騙朕的仙藥錢！推兩個！',
      story: '替始皇求仙藥沒有結果，私下批評他剛愎自用，然後連夜逃走。他們一跑，咸陽諸生就被牽連了。' },
    { name: '淳于越', origin: '齊國・博士', fate: 'unknown', quip: '壽宴上最會講周禮的就是你。',
      story: '壽宴上主張恢復分封，引出焚書令的人。史書沒有交代他的下場，留給後人自己想像。' },
    { name: '周青臣', origin: '咸陽宮・僕射', fate: 'unknown', quip: '壽宴上拍馬屁拍最大聲的，也別漏了。',
      story: '壽宴上高聲頌揚郡縣制的僕射，正好是淳于越反駁的對象。史書沒有交代他之後的下場。' },
    { name: '趙高', origin: '咸陽宮・中車府令', fate: 'survive', quip: '朕的車誰來駕？……算了，推。',
      story: '始皇死後，他和李斯合謀改立胡亥，後來又腰斬李斯。前 207 年，他被子嬰設計殺死。' },
    { name: '蒙恬', origin: '北境・大將軍', fate: 'survive', quip: '長城還沒修完，推下去誰接手？……推。',
      story: '坑儒時他正帶兵在北方築長城、防匈奴。始皇死後，他被迫自殺。' },
    { name: '胡亥', origin: '咸陽宮・始皇幼子', fate: 'survive', quip: '這個兒子最黏朕，可惜今天也要推。',
      story: '始皇死後被趙高扶上帝位，是為秦二世。前 207 年，他在望夷宮被逼自盡。' },
    { name: '抱著三車竹簡的儒生', origin: '魯國・咸陽諸生', fate: 'pit', quip: '三車竹簡，正好陪葬。',
      story: '出門一定要帶書，也一定被搜到。四百六十餘名被牽連的諸生之一。' },
    { name: '街頭偶語《詩》《書》的諸生', origin: '齊國・咸陽諸生', fate: 'pit', quip: '偶語者棄市，這是秦律。',
      story: '兩個人在街上聊《詩經》，依秦律就是「偶語」。四百六十餘名被牽連的諸生之一。' },
    { name: '嘴上說「周朝比較好」的諸生', origin: '魯國・咸陽諸生', fate: 'pit', quip: '以古非今？那你去古代找他們吧。',
      story: '酒館裡多說了一句「以前比較好」，被御史聽見。四百六十餘名被牽連的諸生之一。' }
  ];

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function loadRoster() {
    try {
      var r = JSON.parse(localStorage.getItem('qinPitRoster'));
      if (Array.isArray(r)) {
        var names = POOL.map(function (p) { return p.name; });
        return r.filter(function (n) { return names.indexOf(n) !== -1; });
      }
    } catch (e) { /* 忽略 */ }
    return [];
  }
  function saveRoster() {
    try { localStorage.setItem('qinPitRoster', JSON.stringify(roster)); } catch (e) { /* 忽略 */ }
  }

  var scene   = document.getElementById('pitScene');
  var faller  = document.getElementById('faller');
  var result  = document.getElementById('drawResult');
  var btnOne  = document.getElementById('drawOne');
  var btnMany = document.getElementById('drawTen');
  var btnReset = document.getElementById('drawReset');
  var rosterEl = document.getElementById('drawHistory');
  if (!scene || !faller || !result || !btnOne || !btnMany || !rosterEl) return;

  var roster = loadRoster();   // 已被推入坑中的名字
  var decreeNo = roster.length; // 第幾道詔
  var busy = false;
  var lastAdded = [];

  function remaining() {
    return POOL.filter(function (p) { return roster.indexOf(p.name) === -1; });
  }
  function sfx(kind) { if (window.QinAudio) window.QinAudio.sfx(kind); }

  function renderRoster() {
    document.getElementById('pitCount').textContent = String(roster.length);
    document.getElementById('pitTotal').textContent = String(POOL.length);
    document.getElementById('pitRate').textContent = Math.round(roster.length / POOL.length * 100) + '%';
    rosterEl.textContent = '';
    if (!roster.length) {
      rosterEl.appendChild(el('li', 'empty', '坑底還是空的。下詔吧，陛下。'));
    } else {
      roster.forEach(function (n) { rosterEl.appendChild(el('li', null, '🕳️ ' + n)); });
    }
    var empty = remaining().length === 0;
    btnOne.disabled = btnMany.disabled = empty || busy;
    // 通知「坑底全景圖」重畫
    var entries = roster.map(function (n) {
      var p = POOL.filter(function (x) { return x.name === n; })[0];
      return { name: n, fate: p ? p.fate : 'unknown' };
    });
    window.dispatchEvent(new CustomEvent('qin:roster', {
      detail: { entries: entries, added: lastAdded, total: POOL.length }
    }));
    lastAdded = [];
    var n = remaining().length;
    btnOne.textContent = '📜 推一人';
    btnMany.textContent = (n > 0 && n < 10) ? '📜 推光剩下 ' + n + ' 人' : '📜 一次推十人';
  }

  function decreeCard(entry, no) {
    var f = FATES[entry.fate];
    var card = el('div', 'draw-card fate-' + entry.fate);
    var top = el('div', 'draw-card-top');
    top.appendChild(el('span', 'fate-badge', '⚫ 已推入坑中'));
    top.appendChild(el('span', 'slip-no', '第 ' + no + ' 道詔'));
    card.appendChild(top);
    card.appendChild(el('h3', null, entry.name));
    card.appendChild(el('p', 'draw-origin', entry.origin));
    card.appendChild(el('p', 'decree', '始皇帝：「' + (entry.quip || '朕意已決。') + '」'));
    card.appendChild(el('p', 'history-note', f.icon + ' ' + f.label + '。' + entry.story));
    return card;
  }

  function showAll(entries, startNo) {
    result.textContent = '';
    entries.forEach(function (e, i) { result.appendChild(decreeCard(e, startNo + i)); });
  }

  function showCompact(entries, startNo) {
    var surv = entries.filter(function (e) { return e.fate !== 'pit'; }).length;
    result.textContent = '';
    var wrap = el('div', 'draw-card ten');
    wrap.appendChild(el('h3', null, '一次推入 ' + entries.length + ' 人（第 ' + startNo + '–' + (startNo + entries.length - 1) + ' 道詔）'));
    wrap.appendChild(el('p', 'decree', '始皇帝：「全部推下去，一個不留。」'));
    wrap.appendChild(el('p', 'draw-origin', '其中 ' + surv + ' 人在史實上並不是死於坑儒。想看每個人的史實，請改成一次推一人。'));
    var list = el('ul', 'ten-grid');
    entries.forEach(function (e) {
      var li = el('li', null, '🕳️ ' + e.name);
      li.appendChild(el('small', null, e.origin + '　' + FATES[e.fate].icon + ' ' + FATES[e.fate].label));
      list.appendChild(li);
    });
    wrap.appendChild(list);
    result.appendChild(wrap);
  }

  function run(count) {
    if (busy) return;
    var left = remaining();
    if (!left.length) return;
    busy = true;
    btnOne.disabled = btnMany.disabled = true;

    // 隨機抽出 count 人（不重複；剩不到 count 人就全部推下去）
    var picks = [];
    for (var i = 0; i < count && left.length; i++) {
      picks.push(left.splice(Math.floor(Math.random() * left.length), 1)[0]);
    }

    var many = picks.length > 1;
    faller.classList.remove('falling', 'many');
    void faller.offsetWidth; // 重新觸發動畫
    faller.classList.add('falling');
    if (many) faller.classList.add('many');
    sfx('draw');

    setTimeout(function () {
      faller.classList.remove('falling', 'many');
      var startNo = decreeNo + 1;
      picks.forEach(function (p) { roster.push(p.name); decreeNo++; });
      saveRoster();
      lastAdded = picks.map(function (p) { return p.name; });
      if (picks.length <= 3) showAll(picks, startNo); else showCompact(picks, startNo);
      sfx('pit');
      busy = false;
      renderRoster();
      if (!remaining().length) {
        result.appendChild(el('p', 'draw-empty', '朝中已無人可坑。點「大赦天下」重新開始。'));
      }
    }, many ? 2100 : 950);
  }

  btnOne.addEventListener('click', function () { run(1); });
  btnMany.addEventListener('click', function () { run(10); });
  if (btnReset) btnReset.addEventListener('click', function () {
    roster = []; decreeNo = 0; saveRoster();
    result.textContent = '';
    result.appendChild(el('p', 'draw-empty', '大赦天下，坑底清空。陛下可以重新下詔。'));
    renderRoster();
  });

  renderRoster();
})();
