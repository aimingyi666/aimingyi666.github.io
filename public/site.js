/* ==========================================================================
   site.js —— 全站交互（原生，无依赖）
   1. 搜索：/ 键 → 搜索页（已在该页则聚焦输入框）
   2. 移动端抽屉：开合、Esc 关闭、点链接关闭、锁滚动
   3. 代码块复制：读取 pre 文本，写剪贴板，按钮回显「已复制」
   4. 目录高亮
   ========================================================================== */

(function () {
  'use strict';

  /* ---------------- 1. 搜索跳转 / 聚焦 ---------------- */

  function goSearch() {
    var box = document.getElementById('sq') || document.getElementById('q');
    if (box) {
      box.focus();
      box.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else {
      location.href = '/search/';
    }
  }

  /* ---------------- 2. 移动端抽屉 ---------------- */

  var navToggle = document.getElementById('navToggle');
  var drawer = document.getElementById('drawer');

  function openDrawer() {
    if (!drawer) return;
    drawer.hidden = false;
    document.body.classList.add('is-locked');
    navToggle.setAttribute('aria-expanded', 'true');
    var first = drawer.querySelector('a');
    if (first) first.focus();
  }

  function closeDrawer() {
    if (!drawer || drawer.hidden) return;
    drawer.hidden = true;
    document.body.classList.remove('is-locked');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && drawer) {
    navToggle.addEventListener('click', function () {
      if (drawer.hidden) openDrawer();
      else closeDrawer();
    });

    // 点抽屉里的链接后关闭（同页锚点也要关）
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeDrawer();
    });
  }

  /* ---------------- 3. 全局键盘 ---------------- */

  document.addEventListener('keydown', function (e) {
    var el = document.activeElement;
    var tag = el && el.tagName;
    var typing = tag === 'INPUT' || tag === 'TEXTAREA' || (el && el.isContentEditable);

    // Esc 关闭抽屉
    if (e.key === 'Escape') closeDrawer();

    // / 聚焦搜索（不在输入框内时）
    if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      goSearch();
    }
  });

  /* ---------------- 4. 代码块复制 ---------------- */

  document.querySelectorAll('.code__copy').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var block = btn.closest('.code');
      var pre = block && block.querySelector('pre');
      if (!pre) return;

      var text = pre.innerText;
      var done = function () {
        var label = btn.querySelector('span');
        if (!label) return;
        var old = label.textContent;
        label.textContent = '已复制';
        setTimeout(function () { label.textContent = old; }, 1600);
      };

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done, function () {});
      } else {
        // 兜底：老浏览器
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (err) {}
        document.body.removeChild(ta);
      }
    });
  });

  /* ---------------- 5. 目录高亮 ---------------- */

  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc__item[href^="#"]'));
  var headings = tocLinks
    .map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); })
    .filter(Boolean);

  if (headings.length && 'IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        tocLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-96px 0px -70% 0px', threshold: 0 });

    headings.forEach(function (h) { observer.observe(h); });
  }
})();
