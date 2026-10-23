
(function () {
  'use strict';

  var ids = ['learning-from-pairs', 'infonce-and-sigmoid', 'full-and-mini-batches', 'class-information'];
  var root = document.documentElement;
  var chapters = ids.map(function (id) { return document.getElementById(id); });
  var footerPanels = Array.prototype.slice.call(document.querySelectorAll('[data-reader-footer]')); 
  var overview = document.getElementById('contents');
  var header = document.getElementById('section-reader-header');
  if (!overview || !header || chapters.some(function (chapter) { return !chapter; })) return;

  var activeId = ids[0];
  var overviewExpanded = true;
  var sequence = 0;
  var navigationVersion = 0;
  var currentEntry = null;
  var positions = new Map();
  var scrollFrame = 0;
  var historyFrame = 0;
  var pendingOwnHash = null;
  var headerHeight = 53;
  var initialized = false;

  function installCompactNavigation() {
    if (!document.getElementById('compact-reader-navigation')) {
      var style = document.createElement('style');
      style.id = 'compact-reader-navigation';
      style.textContent = ".section-reader-header{box-shadow:none}\n.reader-header-inner{min-height:52px;padding:4px 24px;gap:12px;align-items:center}\n.reader-contents{min-height:40px;padding:6px 4px;font-size:12px}\n.reader-tabs{display:flex;flex:1 1 auto;gap:4px;min-width:0;overflow-x:auto;scrollbar-width:none}\n.reader-tabs::-webkit-scrollbar{display:none}\n.reader-tab{display:flex;flex:0 0 auto;align-items:center;gap:6px;min-height:40px;padding:7px 12px;font-size:13px;line-height:1.3;border:1px solid transparent;background:transparent;border-radius:5px;white-space:nowrap}\n.reader-tab-number{align-self:center;margin-top:0;font-size:11px;line-height:1.3}\n.reader-tab-label{font-size:13px;white-space:nowrap}\n.reader-tab[aria-current=\"page\"]{background:#edf3ff;border-color:transparent}\nhtml[data-reader-mode=\"single\"][data-reader-overview=\"compact\"] .article{padding-top:calc(var(--reader-header-height,53px) + 18px)}\nhtml[data-reader-mode=\"single\"][data-reader-overview=\"compact\"] .article>.article-header,\nhtml[data-reader-mode=\"single\"][data-reader-overview=\"compact\"] .article>.opening{display:none}\nhtml[data-reader-mode=\"single\"][data-reader-overview=\"compact\"] .chapter{margin-top:0;padding-top:8px;border-top:0}\n@media(max-width:760px){\n .reader-header-inner{min-height:52px;padding:4px 10px;gap:6px}\n .reader-contents{min-width:24px;min-height:44px;padding:6px 2px}\n .reader-contents>span{display:none}\n .reader-tabs{flex:1 1 auto;gap:2px}\n .reader-tab{flex:1 0 auto;min-height:44px;padding:6px 7px;gap:4px}\n .reader-tab-label{font-size:12px}\n .reader-tab-number{font-size:10px}\n}\n@media(max-width:380px){.reader-header-inner{padding-left:6px;padding-right:6px;gap:4px}.reader-tab{padding-left:5px;padding-right:5px;gap:3px}}\n@media print{\n html[data-reader-mode=\"single\"][data-reader-overview=\"compact\"] .article{padding-top:0}\n html[data-reader-mode=\"single\"][data-reader-overview=\"compact\"] .article>.article-header,\n html[data-reader-mode=\"single\"][data-reader-overview=\"compact\"] .article>.opening{display:block}\n}";
      document.head.appendChild(style);
    }
    var labels = ['Basics','Losses','Batches','Classes'];
    header.querySelectorAll('.reader-tab').forEach(function(link,index) {
      var label = link.querySelector('.reader-tab-label');
      var fullTitle = link.getAttribute('title') || (label && label.textContent) || '';
      link.setAttribute('aria-label','Section '+(index+1)+': '+fullTitle);
      if(label) label.textContent = labels[index];
    });
    var contentsLink = header.querySelector('[data-reader-contents]');
    if(contentsLink) {
      contentsLink.setAttribute('aria-controls',overview.id);
      contentsLink.setAttribute('aria-label','Show full contents');
      contentsLink.setAttribute('title','Show full contents');
    }
  }
  function setOverviewExpanded(expanded) {
    overviewExpanded = Boolean(expanded);
    root.dataset.readerOverview = overviewExpanded ? 'expanded' : 'compact';
    var contentsLink = header.querySelector('[data-reader-contents]');
    if(contentsLink) contentsLink.setAttribute('aria-expanded',String(overviewExpanded));
  }

  function newKey() { sequence += 1; return 'cl-reader-' + Date.now() + '-' + sequence; }
  function hashId(hash) {
    try { return decodeURIComponent((hash || '').replace(/^#/, '')); }
    catch (error) { return (hash || '').replace(/^#/, ''); }
  }
  function targetFor(hash) { var id = hashId(hash); return id ? document.getElementById(id) : null; }
  function resetSupplementDetails() {
    var target = targetFor(location.hash);
    document.querySelectorAll('details.math-details, details.empirical-protocol, details.bibtex-details, details.references-details').forEach(function (details) {
      if (!target || !details.contains(target)) details.open = false;
    });
  }
  function sectionFor(target) {
    var chapter = target && target.closest ? target.closest('section.chapter') : null;
    return chapter && ids.indexOf(chapter.id) !== -1 ? chapter.id : null;
  }
  function storedState() {
    try { return history.state && history.state.clReader || null; }
    catch (error) { return null; }
  }
  function mergedState(reader) {
    var original;
    try { original = history.state; } catch (error) { original = null; }
    var state = original && typeof original === 'object' && !Array.isArray(original) ? Object.assign({}, original) : {};
    state.clReader = reader;
    return state;
  }
  function entryState(key, hash, y) {
    return {key: key, section: activeId, hash: hash, scrollY: y, overviewExpanded: overviewExpanded};
  }
  function recordPosition() {
    if (currentEntry) positions.set(currentEntry, {section: activeId, scrollY: window.scrollY});
  }
  function rememberEntry() {
    recordPosition();
    if (!currentEntry) currentEntry = newKey();
    try { history.replaceState(mergedState(entryState(currentEntry, location.hash, window.scrollY)), '', location.href); }
    catch (error) { /* Fragment navigation remains available in opaque embeds. */ }
  }
  function writeHistory(hash) {
    pendingOwnHash = null;
    if (location.hash === hash) {
      rememberEntry();
      return;
    }
    var key = newKey();
    try {
      history.pushState(mergedState(entryState(key, hash, 0)), '', hash || location.pathname + location.search);
      currentEntry = key;
    } catch (error) {
      currentEntry = key;
      pendingOwnHash = hash;
      try { location.hash = hash; } catch (ignored) { pendingOwnHash = null; }
    }
  }
  function measureHeader() {
    if (!header.hidden) {
      var measured = Math.ceil(header.getBoundingClientRect().height);
      if (measured > 0) headerHeight = measured;
    }
    root.style.setProperty('--reader-header-height', headerHeight + 'px');
  }
  function setHeaderVisible(visible) {
    header.hidden = !visible;
    header.setAttribute('aria-hidden', visible ? 'false' : 'true');
    if (visible) measureHeader();
  }
  function updateHeader() {
    setHeaderVisible(!overviewExpanded || overview.getBoundingClientRect().bottom <= 1);
  }
  function activate(id, expanded) {
    if (ids.indexOf(id) === -1) id = ids[0];
    activeId = id;
    setOverviewExpanded(typeof expanded === 'boolean' ? expanded : id === ids[0]);
    chapters.forEach(function (chapter) { chapter.hidden = chapter.id !== id; });
    footerPanels.forEach(function (panel) { panel.hidden = panel.getAttribute('data-reader-footer') !== id; });
    document.querySelectorAll('[data-reader-section]').forEach(function (link) {
      var selected = link.getAttribute('data-reader-section') === id;
      if (selected) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    root.dataset.readerSection = id;
    window.requestAnimationFrame(function () {
      window.dispatchEvent(new Event('resize'));
    });
  }
  function openDetails(target) {
    var node = target;
    while (node && node !== document.body) {
      if (node.tagName === 'DETAILS') node.open = true;
      node = node.parentElement;
    }
  }
  function focusTarget(target) {
    if (!target) return;
    var focus = target;
    if (target.classList.contains('chapter')) focus = target.querySelector('.chapter-title') || target;
    else if (target === overview) focus = overview.querySelector('h2') || overview;
    else if (target.tagName === 'DETAILS') focus = target.querySelector('summary') || target;
    if (!focus.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA|SUMMARY)$/.test(focus.tagName)) focus.setAttribute('tabindex', '-1');
    try { focus.focus({preventScroll: true}); } catch (error) { /* Focus is an enhancement. */ }
  }
  function scrollToTarget(target, focus, version) {
    if (!target || version !== navigationVersion) return;
    openDetails(target);
    var isContents = target === overview || overview.contains(target);
    setHeaderVisible(!isContents);
    var offset = isContents ? 20 : headerHeight + 20;
    var top = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    // Manual positioning avoids combining scroll-padding and scroll-margin offsets.
    window.scrollTo({top: top, behavior: 'instant'});
    if (focus) focusTarget(target);
    updateHeader();
    rememberEntry();
  }
  function afterLayout(callback) {
    window.requestAnimationFrame(function () { window.requestAnimationFrame(callback); });
  }
  function navigate(target, hash, focus) {
    rememberEntry();
    navigationVersion += 1;
    var version = navigationVersion;
    var section = sectionFor(target);
    if (section) activate(section);
    else if (target === overview || overview.contains(target)) setOverviewExpanded(true);
    openDetails(target);
    writeHistory(hash);
    afterLayout(function () { scrollToTarget(target, focus, version); });
  }
  function restoreHistory() {
    historyFrame = 0;
    // A native fragment update can emit popstate and hashchange in separate
    // frames. Ignore both events for our own hash, until the hash changes.
    if (pendingOwnHash !== null && location.hash === pendingOwnHash) return;
    pendingOwnHash = null;
    recordPosition();
    navigationVersion += 1;
    var version = navigationVersion;
    var target = targetFor(location.hash);
    var saved = storedState();
    var match = saved && saved.hash === location.hash;
    var previousPosition = match && saved.key ? positions.get(saved.key) : null;
    var section = sectionFor(target) || (match && saved.section) || ids[0];
    var expanded = target === overview || overview.contains(target) || (match && typeof saved.overviewExpanded === 'boolean' ? saved.overviewExpanded : section === ids[0]);
    activate(section,expanded);
    currentEntry = match && saved.key ? saved.key : newKey();
    if (target) openDetails(target);
    afterLayout(function () {
      if (version !== navigationVersion) return;
      var y = previousPosition ? previousPosition.scrollY : (match && Number.isFinite(saved.scrollY) ? saved.scrollY : null);
      if (y !== null) {
        window.scrollTo({top: y, behavior: 'instant'});
        updateHeader();
        rememberEntry();
      } else if (target) scrollToTarget(target, false, version);
      else {
        window.scrollTo({top: 0, behavior: 'instant'});
        updateHeader();
        rememberEntry();
      }
    });
  }
  function queueHistoryRestore() {
    if (historyFrame) window.cancelAnimationFrame(historyFrame);
    historyFrame = window.requestAnimationFrame(restoreHistory);
  }
  function samePageHash(anchor) {
    var href = anchor.getAttribute('href');
    if (!href) return null;
    if (href.charAt(0) === '#') return href;
    try {
      var url = new URL(href, document.baseURI);
      if (url.origin === location.origin && url.pathname === location.pathname && url.search === location.search && url.hash) return url.hash;
    } catch (error) {}
    return null;
  }
  function init() {
    if (initialized) return;
    initialized = true;
    installCompactNavigation();
    resetSupplementDetails();
    var initialHash = location.hash;
    var target = targetFor(initialHash);
    var saved = storedState();
    activeId = sectionFor(target) || (saved && ids.indexOf(saved.section) !== -1 ? saved.section : ids[0]);
    currentEntry = saved && saved.key || newKey();
    try { history.scrollRestoration = 'manual'; } catch (error) {}
    var showOverview = target === overview || overview.contains(target) || (saved && saved.hash === initialHash && typeof saved.overviewExpanded === 'boolean' ? saved.overviewExpanded : activeId === ids[0]);
    activate(activeId,showOverview);
    root.dataset.readerMode = 'single';
    root.dataset.readerReady = 'true';
    updateHeader();
    rememberEntry();

    document.addEventListener('click', function (event) {
      if (event.defaultPrevented) return;
      var anchor = event.target.closest && event.target.closest('a[href]');
      if (!anchor) return;
      var hash = samePageHash(anchor);
      if (!hash) return;
      var destination = targetFor(hash);
      if (!destination) return;
      // The original article has a delegated bubble-phase scroll handler. Own
      // internal links in capture phase, leaving their native modified-click
      // behavior intact instead of letting that legacy handler cancel it.
      event.stopPropagation();
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
      event.preventDefault();
      navigate(destination, hash, true);
    }, true);
    window.addEventListener('scroll', function () {
      recordPosition();
      if (!scrollFrame) scrollFrame = window.requestAnimationFrame(function () { scrollFrame = 0; updateHeader(); });
    }, {passive: true});
    window.addEventListener('resize', function () { measureHeader(); updateHeader(); }, {passive: true});
    window.addEventListener('popstate', queueHistoryRestore);
    window.addEventListener('hashchange', queueHistoryRestore);
    window.addEventListener('pageshow', function () { resetSupplementDetails(); updateHeader(); });

    if (target) {
      navigationVersion += 1;
      var initialVersion = navigationVersion;
      openDetails(target);
      afterLayout(function () { scrollToTarget(target, false, initialVersion); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
        if (location.hash === initialHash && initialVersion === navigationVersion) afterLayout(function () { scrollToTarget(target, false, initialVersion); });
      });
    }
  }

  // All original plots initialize before the body-end navigation script. If a
  // renderer is deferred, wait for its readiness marker before hiding chapters.
  if (root.dataset.articleReady === 'true') init();
  else {
    var observer = new MutationObserver(function () {
      if (root.dataset.articleReady === 'true') { observer.disconnect(); init(); }
    });
    observer.observe(root, {attributes: true, attributeFilter: ['data-article-ready']});
  }
})();

