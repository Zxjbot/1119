/* =========================================================
   lang.js — 語言（繁體／簡體）、字體與字級切換（兩頁共用）
   簡體轉換為「逐字對照」，在瀏覽器內即時完成，不需要網路。
   設計取捨：宮商角徵羽的「徵」、以及多音字「著」保持原樣，避免誤轉。
   想補字：在下方 PAIRS 加上「繁簡」兩字組（以空白分隔）。
   ========================================================= */
(function () {
  'use strict';

  var PAIRS = '並并 亂乱 佔占 來来 個个 們们 側侧 備备 傳传 僅仅 僕仆 儀仪 兒儿 內内 兩两 冊册 別别 則则 剛刚 創创 劇剧 動动 務务 勝胜 勵励 勸劝 區区 卻却 員员 問问 啟启 單单 嗎吗 嚴严 國国 圍围 圓圆 圖图 團团 執执 報报 場场 塊块 壽寿 夠够 夾夹 娛娱 嬰婴 孫孙 學学 宮宫 實实 審审 寫写 寶宝 將将 專专 尋寻 對对 屬属 師师 帶带 幹干 幾几 張张 彈弹 後后 徑径 從从 復复 愛爱 態态 應应 戰战 戲戏 戶户 捲卷 掛挂 揚扬 換换 搖摇 撥拨 擇择 擊击 擔担 擬拟 擴扩 攜携 數数 斬斩 於于 時时 晉晋 暫暂 書书 會会 東东 條条 棄弃 業业 極极 樂乐 標标 樣样 樹树 機机 檔档 檢检 欄栏 權权 欽钦 歷历 殘残 殺杀 毀毁 氣气 決决 沒没 淨净 淺浅 減减 測测 滅灭 滿满 漢汉 潤润 濕湿 濟济 瀏浏 為为 無无 煉炼 燒烧 爾尔 牆墙 牽牵 獲获 現现 產产 畫画 當当 發发 盡尽 監监 盧卢 眾众 砲炮 確确 禪禅 禮礼 種种 稱称 筆笔 箏筝 節节 築筑 篩筛 簡简 籤签 紀纪 約约 純纯 紙纸 級级 細细 終终 組组 結结 絕绝 給给 統统 經经 維维 網网 緊紧 線线 編编 練练 縣县 縫缝 總总 繳缴 繼继 續续 罰罚 義义 聖圣 聞闻 聲声 職职 聽听 脈脉 臉脸 臨临 與与 舉举 舊旧 萬万 葉叶 蒼苍 藥药 蘇苏 處处 號号 螢萤 術术 衝冲 補补 裝装 裡里 製制 複复 見见 視视 親亲 覲觐 覺觉 覽览 觀观 觸触 計计 訊讯 討讨 記记 訪访 設设 訴诉 詐诈 詔诏 評评 詞词 試试 詩诗 話话 誇夸 誌志 語语 誦诵 說说 誰谁 調调 談谈 請请 論论 諫谏 諸诸 諾诺 謀谋 講讲 謹谨 證证 識识 譜谱 議议 讀读 變变 負负 責责 費费 資资 賜赐 賞赏 趕赶 趙赵 車车 軌轨 軍军 較较 載载 輕轻 輸输 輿舆 轉转 辭辞 農农 這这 連连 進进 運运 過过 達达 違违 遞递 遠远 適适 遲迟 遷迁 選选 還还 邊边 鄉乡 醫医 針针 鈕钮 銀银 銅铜 錄录 錢钱 錯错 鍵键 鑑鉴 長长 門门 開开 閒闲 間间 閣阁 閱阅 關关 陣阵 陳陈 陽阳 隊队 階阶 隨随 險险 隱隐 雙双 雜杂 離离 難难 雲云 霧雾 靜静 響响 頁页 頂顶 項项 順顺 頌颂 預预 領领 頭头 顆颗 題题 願愿 類类 顯显 風风 飛飞 飲饮 養养 餘余 館馆 馬马 駁驳 駕驾 騙骗 驚惊 體体 魯鲁 鮒鲋 鴿鸽 麼么 點点 齊齐 鐘钟 簫箫 黃黄';
  var MAP = Object.create(null);
  PAIRS.split(' ').forEach(function (p) {
    if (p.length === 2) MAP[p.charAt(0)] = p.charAt(1);
  });

  var root = document.documentElement;
  var FONTS = ['default', 'serif', 'kai', 'system'];
  var SIZES = ['s', 'm', 'l', 'xl'];

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }

  var prefs = {
    lang: store('qinLang') === 'sc' ? 'sc' : 'tc',
    font: FONTS.indexOf(store('qinFont')) > -1 ? store('qinFont') : 'default',
    fs: SIZES.indexOf(store('qinFs')) > -1 ? store('qinFs') : 'm'
  };

  /* ---------- 簡繁轉換 ---------- */
  function toSC(str) {
    return str.replace(/[\u3400-\u9fff]/g, function (c) { return MAP[c] || c; });
  }

  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  var ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
  var textOrig = new Map();   // 文字節點 → 繁體原文
  var attrOrig = new Map();   // 元素 → { 屬性: 繁體原文 }
  var titleOrig = document.title;
  var observer = null;

  function convText(n) {
    var cur = n.nodeValue;
    var o = textOrig.get(n);
    if (o === undefined || toSC(o) !== cur) { o = cur; textOrig.set(n, o); }
    var c = toSC(o);
    if (c !== cur) n.nodeValue = c;
  }

  function convAttrs(elm) {
    ATTRS.forEach(function (a) {
      if (!elm.hasAttribute(a)) return;
      var rec = attrOrig.get(elm) || {};
      var cur = elm.getAttribute(a);
      var o = rec[a];
      if (o === undefined || toSC(o) !== cur) { o = cur; rec[a] = o; }
      attrOrig.set(elm, rec);
      var c = toSC(o);
      if (c !== cur) elm.setAttribute(a, c);
    });
  }

  function convTree(node) {
    if (node.nodeType === 3) {
      var p = node.parentNode;
      if (!(p && SKIP[p.nodeName])) convText(node);
      return;
    }
    if (node.nodeType !== 1 || SKIP[node.nodeName]) return;
    var walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        var pp = n.parentNode;
        return (pp && SKIP[pp.nodeName]) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
      }
    });
    var t;
    while ((t = walker.nextNode())) convText(t);
    convAttrs(node);
    node.querySelectorAll('[placeholder],[title],[alt],[aria-label]').forEach(convAttrs);
  }

  function revert() {
    textOrig.forEach(function (o, n) {
      if (n.isConnected) n.nodeValue = o; else textOrig.delete(n);
    });
    attrOrig.forEach(function (rec, elm) {
      if (!elm.isConnected) { attrOrig.delete(elm); return; }
      Object.keys(rec).forEach(function (a) { elm.setAttribute(a, rec[a]); });
    });
    document.title = titleOrig;
  }

  function startObserver() {
    if (observer) return;
    observer = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        m.addedNodes.forEach(function (n) { convTree(n); });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function stopObserver() {
    if (observer) { observer.disconnect(); observer = null; }
  }

  /* ---------- 套用偏好 ---------- */
  function applyLang() {
    root.classList.toggle('lang-sc', prefs.lang === 'sc');
    root.setAttribute('lang', prefs.lang === 'sc' ? 'zh-Hans' : 'zh-Hant');
  }
  function applyFont() {
    ['serif', 'kai', 'system'].forEach(function (f) {
      root.classList.toggle('font-' + f, prefs.font === f);
    });
  }
  function applyFs() {
    ['s', 'l', 'xl'].forEach(function (k) {
      root.classList.toggle('fs-' + k, prefs.fs === k);
    });
  }

  function setLang(l) {
    prefs.lang = l;
    store('qinLang', l);
    applyLang();
    if (l === 'sc') {
      convTree(document.body);
      document.title = toSC(titleOrig);
      startObserver();
    } else {
      stopObserver();
      revert();
    }
    syncUI();
  }

  var uiReady = false;
  function syncUI() {
    if (!uiReady) return;
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      var on = b.getAttribute('data-lang') === prefs.lang;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('.fs-btn').forEach(function (b) {
      var on = b.getAttribute('data-fs') === prefs.fs;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    var sel = document.getElementById('fontSel');
    if (sel) sel.value = prefs.font;
  }

  function init() {
    uiReady = true;
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
    });
    document.querySelectorAll('.fs-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        prefs.fs = b.getAttribute('data-fs');
        store('qinFs', prefs.fs);
        applyFs();
        syncUI();
      });
    });
    var sel = document.getElementById('fontSel');
    if (sel) sel.addEventListener('change', function () {
      if (FONTS.indexOf(sel.value) === -1) return;
      prefs.font = sel.value;
      store('qinFont', prefs.font);
      applyFont();
    });
    syncUI();
    if (prefs.lang === 'sc') {
      convTree(document.body);
      document.title = toSC(titleOrig);
      startObserver();
    }
  }

  // class 先套用，避免畫面閃一下；文字轉換等 DOM 就緒後（在其他腳本之後）再做
  applyLang(); applyFont(); applyFs();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
