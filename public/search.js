/* ==========================================================================
   search.js —— 客户端搜索
   索引在构建时生成（/search-index.json），运行时只做匹配与排序。
   没有后端、没有第三方服务、离线可用。

   打分规则（简单但要准）：
   标题命中 10 / 摘要命中 4 / 标签命中 6 / 正文命中 1
   多词同时命中会累加，所以「vllm 显存」比单独任一个更靠前。
   ========================================================================== */

(function () {
  'use strict';

  var form = document.getElementById('searchForm');
  var input = document.getElementById('sq');
  var list = document.getElementById('results');
  var meta = document.getElementById('resultMeta');
  var suggestBox = document.getElementById('suggest');
  var filters = document.getElementById('filters');

  if (!form || !input || !list) return;

  var docs = [];
  var ready = false;
  // 必须是 '全部'（中文），因为过滤时比的是 doc.g 的中文名。
  // 早先写成 'all' 导致带 ?q= 首屏加载时全部被过滤掉——加类型注释防止再犯。
  var ALL = '全部';
  var activeType = ALL;

  // 部署子路径（base）。根域部署时 BASE 为 '/'，与原来行为一致。
  var BASE = (window.__BASE__ || '/');

  /* ---------------- 加载索引 ---------------- */

  fetch(BASE + 'search-index.json')
    .then(function (r) { return r.json(); })
    .then(function (data) {
      docs = data.docs || [];
      ready = true;
      // 支持 ?q= 直接搜
      var q = new URLSearchParams(location.search).get('q');
      if (q) {
        input.value = q;
        run(q);
      } else {
        showSuggest();
      }
    })
    .catch(function () {
      if (meta) meta.textContent = '搜索索引加载失败，请刷新重试。';
    });

  /* ---------------- 查询 ---------------- */

  // 中文不分词，用二元切分保证「显存碎片」能匹配到「显存」和「碎片」
  function terms(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    var out = [];
    // 按空白切
    q.split(/\s+/).forEach(function (chunk) {
      if (!chunk) return;
      if (/^[\u4e00-\u9fa5]+$/.test(chunk) && chunk.length > 1) {
        // 纯中文：整词 + 二元组都收
        out.push(chunk);
        for (var i = 0; i < chunk.length - 1; i++) {
          out.push(chunk.slice(i, i + 2));
        }
      } else {
        out.push(chunk);
      }
    });
    return out.filter(function (t, i, a) { return a.indexOf(t) === i; });
  }

  function score(doc, ts) {
    var title = doc.t.toLowerCase();
    var summary = doc.s.toLowerCase();
    var tags = doc.k.toLowerCase();
    var body = doc.b.toLowerCase();

    var total = 0;
    var hitTitle = false;

    for (var i = 0; i < ts.length; i++) {
      var t = ts[i];
      var hit = false;
      if (title.indexOf(t) !== -1) { total += 10; hit = true; hitTitle = true; }
      if (tags.indexOf(t) !== -1) { total += 6; hit = true; }
      if (summary.indexOf(t) !== -1) { total += 4; hit = true; }
      if (body.indexOf(t) !== -1) { total += 1; hit = true; }
      if (!hit) return 0;   // 有任一词完全没命中，判为不相关
    }

    // 标题命中的额外加权，让「vllm 部署」优先出标题含 vllm 的那篇
    if (hitTitle) total += ts.length * 3;
    return total;
  }

  /* ---------------- 高亮 ---------------- */

  function esc(s) {
    return s.replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function mark(text, ts) {
    var out = esc(text);
    ts.forEach(function (t) {
      if (t.length < 2) return;
      var re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      out = out.replace(re, '<mark>$1</mark>');
    });
    return out;
  }

  // 从正文里切出包含关键词的一小段
  function snippet(doc, ts) {
    var body = doc.b;
    if (!body) return '';
    var lower = body.toLowerCase();
    var pos = -1;
    for (var i = 0; i < ts.length; i++) {
      var p = lower.indexOf(ts[i]);
      if (p !== -1 && (pos === -1 || p < pos)) pos = p;
    }
    if (pos === -1) return body.slice(0, 110);
    var start = Math.max(0, pos - 30);
    var end = Math.min(body.length, pos + 90);
    return (start > 0 ? '…' : '') + body.slice(start, end) + (end < body.length ? '…' : '');
  }

  /* ---------------- 渲染 ---------------- */

  var TYPE_KEYS = ['全部', '长文', '笔记', '手册', '排障', '日志'];

  function renderFilters(results, ts) {
    if (!filters) return;
    var counts = {};
    results.forEach(function (r) {
      counts[r.doc.g] = (counts[r.doc.g] || 0) + 1;
    });

    filters.innerHTML = TYPE_KEYS.map(function (key) {
      var n = key === ALL ? results.length : (counts[key] || 0);
      var cls = 'filter' + (activeType === key ? ' is-active' : '');
      return '<button type="button" class="' + cls + '" data-type="' + esc(key) + '"' +
        (n === 0 ? ' disabled style="opacity:.4;cursor:default"' : '') + '>' +
        esc(key) + '<span class="filter__count">' + n + '</span></button>';
    }).join('');

    filters.querySelectorAll('.filter').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.disabled) return;
        activeType = btn.dataset.type;
        run(input.value);
      });
    });
  }

  function renderResults(results, ts, q) {
    if (!results.length) {
      list.innerHTML = '';
      if (meta) meta.textContent = '';
      var box = document.createElement('div');
      box.className = 'empty';
      box.innerHTML =
        '<p class="empty__title">没有找到「' + esc(q) + '」</p>' +
        '<p class="empty__hint">换个词试试。中文可以只打两三个字，比如「显存」「幂等」「代理」。' +
        '也可以去 <a href="' + BASE + 'toolbox/">工具库</a> 按任务找，或从 <a href="' + BASE + 'collections/">专题</a> 顺着读。</p>';
      list.appendChild(box);
      return;
    }

    list.innerHTML = results.map(function (r) {
      var d = r.doc;
      var snip = snippet(d, ts);
      var badges = '';
      if (d.m && d.g !== '日志') {
        var cls = d.m === '已成体系' ? 'chip chip--evergreen'
          : d.m === '生长中' ? 'chip chip--budding' : 'chip chip--outline';
        badges += '<span class="' + cls + '" style="font-size:10px;padding:2px 7px">' + esc(d.m) + '</span>';
      }
      badges += '<span class="result__tag">' + esc(d.g) + '</span>';

      // 摘要是人工写的，优先显示；只有当摘要不含命中词、
      // 且片段确实提供了新信息时才补第二行，否则会重复同一句话。
      var showSnippet = snip && snip.length > 20;
      if (showSnippet && d.s) {
        var sLow = d.s.toLowerCase();
        var hitInSummary = ts.some(function (t) { return sLow.indexOf(t) !== -1; });
        // 摘要已命中关键词 → 摘要足够说明为什么匹配，不再贴片段
        if (hitInSummary) showSnippet = false;
      }

      return '<a class="result" href="' + d.u + '">' +
        '<div class="result__top">' +
          '<span class="result__title">' + mark(d.t, ts) + '</span>' +
          '<span class="result__badges">' + badges + '</span>' +
        '</div>' +
        (d.s ? '<p class="result__snippet">' + mark(d.s, ts) + '</p>' : '') +
        (showSnippet ? '<p class="result__snippet" style="margin-top:4px;color:var(--faint);font-size:13px">' +
          mark(snip, ts) + '</p>' : '') +
        '</a>';
    }).join('');
  }

  /* ---------------- 主流程 ---------------- */

  var timer = null;

  function run(q) {
    if (!ready) return;
    q = (q || '').trim();

    if (!q) {
      showSuggest();
      return;
    }

    var ts = terms(q);
    var scored = [];
    for (var i = 0; i < docs.length; i++) {
      var s = score(docs[i], ts);
      if (s > 0) scored.push({ doc: docs[i], s: s });
    }
    scored.sort(function (a, b) { return b.s - a.s; });

    renderFilters(scored, ts);

    var filtered = activeType === ALL
      ? scored
      : scored.filter(function (r) { return r.doc.g === activeType; });

    if (meta) {
      meta.textContent = filtered.length
        ? '找到 ' + filtered.length + ' 条结果'
        : '';
    }

    if (suggestBox) suggestBox.style.display = 'none';
    renderResults(filtered, ts, q);

    // 地址栏同步（刷新/分享能保住结果）
    try {
      var url = new URL(location.href);
      if (q) url.searchParams.set('q', q);
      else url.searchParams.delete('q');
      history.replaceState(null, '', url);
    } catch (e) {}
  }

  function showSuggest() {
    if (suggestBox) suggestBox.style.display = '';
    if (filters) filters.innerHTML = '';
    if (list) list.innerHTML = '';
    if (meta) meta.textContent = '';
    activeType = ALL;
  }

  input.addEventListener('input', function () {
    clearTimeout(timer);
    var v = input.value;
    timer = setTimeout(function () { run(v); }, 120);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    run(input.value);
  });

  // 建议词：点了直接搜
  document.querySelectorAll('.suggest__item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var w = btn.dataset.q || btn.textContent;
      input.value = w;
      activeType = ALL;
      run(w);
      input.focus();
    });
  });
})();
