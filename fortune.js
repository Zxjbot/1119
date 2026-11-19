/* =========================================================
   fortune.js — 咸陽問卜：抽籤占卜（僅 index.html 使用）
   籤詩皆為原創，解籤與笑點純屬娛樂。
   想新增籤：在 SLIPS 加一筆；想改解籤：改 READING。
   ========================================================= */
(function () {
  'use strict';

  // level: great 上上籤 / good 上籤 / mid 中籤 / bad 下籤 / worst 下下籤
  var LEVELS = {
    great: { label: '上上籤', cls: 'lvl-great', sfx: 'survive' },
    good:  { label: '上籤',   cls: 'lvl-good',  sfx: 'survive' },
    mid:   { label: '中籤',   cls: 'lvl-mid',   sfx: 'unknown' },
    bad:   { label: '下籤',   cls: 'lvl-bad',   sfx: 'flee' },
    worst: { label: '下下籤', cls: 'lvl-worst', sfx: 'pit' }
  };

  var SLIPS = [
    { title: '夾牆藏書', level: 'great', poem: ['牆內藏經卷', '火光過不來', '兩百年後事', '有人敲壁開'] },
    { title: '關中種樹', level: 'great', poem: ['不談周天子', '只問雨和田', '種樹無人問', '平安度十年'] },
    { title: '博士待詔', level: 'good',  poem: ['官家有藏閣', '名列博士班', '莫誇三代美', '低頭保平安'] },
    { title: '三十日期', level: 'good',  poem: ['限期三十日', '交書莫遲疑', '一日不拖延', '臉上免刺字'] },
    { title: '咸陽酒館', level: 'mid',   poem: ['酒館閒談事', '莫提周舊朝', '隔牆有御史', '少語勝多飲'] },
    { title: '出城遠行', level: 'mid',   poem: ['行李輕如葉', '三車書不留', '關門查得嚴', '今日恐難出'] },
    { title: '覲見丞相', level: 'mid',   poem: ['丞相袖中語', '一紙令如山', '拱手應諾聲', '且看風向轉'] },
    { title: '求仙訪藥', level: 'bad',   poem: ['仙山雲霧深', '藥草不成丹', '帝問何時獲', '汗滴濕衣單'] },
    { title: '偶語詩書', level: 'bad',   poem: ['兩人街角語', '低聲說詩經', '風傳入耳目', '回頭已有兵'] },
    { title: '逾期藏書', level: 'bad',   poem: ['夾牆藏未密', '灰落露簡痕', '官差敲門至', '恐要築長城'] },
    { title: '以古非今', level: 'worst', poem: ['開口說三代', '滿堂皆沉默', '一言驚御史', '族譜恐難留'] },
    { title: '坑邊留步', level: 'worst', poem: ['黃土新翻起', '深坑向暮開', '同行四百六', '不見一人回'] }
  ];

  var TOPICS = { career: '問前程', life: '問長生', books: '問藏書', pit: '問坑運' };

  var READING = {
    career: {
      great: '平步青雲，丞相之位在望。記得別得罪趙高。',
      good:  '升遷有望，守法守時就好。',
      mid:   '不上不下，先把眼前的公文批完。',
      bad:   '小心同僚檢舉，嘴巴縫緊一點。',
      worst: '建議辭官，立刻回鄉種樹。'
    },
    life: {
      great: '仙藥有著落，不過還是別全信方士。',
      good:  '養生有成，多睡覺，少熬夜批奏章。',
      mid:   '壽數平平，三餐正常就好。',
      bad:   '服丹要謹慎，水銀不是補品。',
      worst: '別碰丹藥，真的。'
    },
    books: {
      great: '牆夠厚，書能傳到後世。',
      good:  '藏得住，但別到處炫耀。',
      mid:   '再檢查一次夾牆有沒有裂縫。',
      bad:   '有人聞到竹簡味了，趕緊搬家。',
      worst: '現在就交出去吧，三十日期限已經過了。'
    },
    pit: {
      great: '離坑遠遠的，今天不會被點名。',
      good:  '有驚無險，聽到「請移步咸陽」就裝沒聽到。',
      mid:   '還在名單外圍，低調行事。',
      bad:   '名字已經被御史看過一眼。',
      worst: '坑已經替你挖好了。'
    }
  };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  var tube = document.getElementById('fortuneTube');
  var btn = document.getElementById('fortuneDraw');
  var result = document.getElementById('fortuneResult');
  var historyEl = document.getElementById('fortuneHistory');
  if (!tube || !btn || !result || !historyEl) return;

  var history = [];
  var lastIdx = -1;
  var busy = false;

  function currentTopic() {
    var r = document.querySelector('input[name="topic"]:checked');
    return r ? r.value : 'career';
  }

  function renderHistory() {
    historyEl.textContent = '';
    history.forEach(function (h) {
      historyEl.appendChild(el('li', null, h.topic + '・' + LEVELS[h.level].label + '・' + h.title));
    });
  }

  function render(slip, no, topicKey) {
    var lv = LEVELS[slip.level];
    var card = el('div', 'draw-card fortune-card ' + lv.cls);
    var top = el('div', 'draw-card-top');
    top.appendChild(el('span', 'fate-badge', lv.label));
    top.appendChild(el('span', 'slip-no', '第 ' + no + ' 籤・' + TOPICS[topicKey]));
    card.appendChild(top);
    card.appendChild(el('h3', null, slip.title));
    var poem = el('div', 'poem');
    slip.poem.forEach(function (line) { poem.appendChild(el('span', null, line)); });
    card.appendChild(poem);
    card.appendChild(el('p', 'reading', '解曰：' + READING[topicKey][slip.level]));
    result.textContent = '';
    result.appendChild(card);
  }

  btn.addEventListener('click', function () {
    if (busy) return;
    busy = true;
    btn.disabled = true;
    var topicKey = currentTopic();

    tube.classList.remove('shake');
    void tube.offsetWidth; // 重新觸發動畫
    tube.classList.add('shake');
    if (window.QinAudio) window.QinAudio.sfx('draw');

    setTimeout(function () {
      tube.classList.remove('shake');
      var idx;
      do { idx = Math.floor(Math.random() * SLIPS.length); } while (idx === lastIdx && SLIPS.length > 1);
      lastIdx = idx;
      var slip = SLIPS[idx];
      render(slip, idx + 1, topicKey);
      if (window.QinAudio) window.QinAudio.sfx(LEVELS[slip.level].sfx);
      history.unshift({ topic: TOPICS[topicKey], level: slip.level, title: slip.title });
      history = history.slice(0, 6);
      renderHistory();
      busy = false;
      btn.disabled = false;
    }, 700);
  });

  renderHistory();
})();
