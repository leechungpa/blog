
/*
 * Responsive blog adapters for the verified class-collapse diagrams.
 * New rendering / layout only. The pair definitions, SSEM coordinates,
 * exact objective, and scalar optimizer remain in the original modules.
 * Requires: ClassPairsV13, ClassLabelsV16, ClassAlphaV13.
 */
(function (global) {
  'use strict';
  const controllers = new WeakMap();
  let serial = 0;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const isElement = x => !!x && x.nodeType === 1;
  const STYLE_ID = 'blog-class-v17-style';
  const CSS = `
    .blog-class-v17{width:100%;max-width:1040px;margin:0 auto;container-type:inline-size;container-name:blog-class-v17}
    .blog-class-grid-v17{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;align-items:start}
    .blog-class-panel-v17{margin:0;min-width:0;width:100%}
    .blog-class-panel-v17>svg{display:block;width:100%;height:auto;max-width:100%;overflow:visible}
    .blog-class-panel-v17>figcaption{font-size:16px;line-height:1.45;text-align:center;color:#647184;margin:8px 0 0}
    .blog-class-legend-v17{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:12px 26px;margin:14px 0 0;font:inherit;font-size:16px;line-height:1.45;color:#172334}
    .blog-class-legend-v17 span{display:inline-flex;align-items:center;gap:9px;white-space:nowrap}
    .blog-class-legend-v17 i{display:inline-block;width:28px;height:0;border-top:2px solid #b55b3c}
    .blog-class-legend-v17 .positive i{border-top:3px dotted #2f6d4c}
    .blog-class-legend-v17 .anchor i{width:15px;height:15px;border:2px solid #172334;border-radius:50%;background:#fff;box-sizing:border-box}
    @container blog-class-v17 (max-width:760px){
      .blog-class-grid-v17{grid-template-columns:minmax(0,1fr);gap:24px}
      .blog-class-panel-v17{max-width:700px;margin-left:auto;margin-right:auto}
    }
    @supports not (container-type:inline-size){
      @media(max-width:800px){.blog-class-grid-v17{grid-template-columns:minmax(0,1fr)}}
    }
  `;
  function ensureStyles() {
    if (!global.document.getElementById(STYLE_ID)) {
      const style = global.document.createElement('style');
      style.id = STYLE_ID; style.textContent = CSS;
      global.document.head.appendChild(style);
    }
  }
  function needModules() {
    if (!global.ClassPairsV13 || !global.ClassLabelsV16 || !global.ClassAlphaV13) {
      throw new Error('Load ClassPairsV13, ClassLabelsV16 and ClassAlphaV13 before BlogClassV17.');
    }
  }
  function parseSvg(source) {
    const doc = new global.DOMParser().parseFromString(source, 'image/svg+xml');
    if (doc.querySelector('parsererror')) throw new Error('Unable to parse the class diagram SVG.');
    return doc.documentElement;
  }
  function serialize(node) { return new global.XMLSerializer().serializeToString(node); }
  function svgGroup(doc, attribute) {
    const group = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute(attribute, ''); return group;
  }
  function panelOf(node) {
    const given = node.getAttribute('data-cpv13-panel');
    if (given !== null) return Number(given);
    if (node.classList.contains('class-loss-heading-v16')) return node.getAttribute('data-loss') === 'self' ? 0 : 1;
    const x = node.getAttribute('x');
    return x === null ? null : (+x < 712.5 ? 0 : 1);
  }

  function splitPairsSvg(source, panel, id) {
    const original = parseSvg(source), doc = original.ownerDocument;
    const output = original.cloneNode(false);
    output.id = id;
    output.setAttribute('viewBox', (panel ? '725' : '0') + ' 0 700 445');
    output.setAttribute('data-blog-class-pair-panel', String(panel));
    const heading = svgGroup(doc, 'data-blog-class-heading');
    const groupLabels = svgGroup(doc, 'data-blog-class-group-labels');
    const graph = svgGroup(doc, 'data-blog-class-graph');
    for (const child of Array.from(original.children)) {
      const tag = child.localName;
      if (['style', 'title', 'desc'].includes(tag)) { output.appendChild(child.cloneNode(true)); continue; }
      // The original shared SVG legend becomes one responsive HTML legend.
      const y = child.getAttribute('y') ?? child.getAttribute('y1') ?? child.getAttribute('cy');
      if (y !== null && +y >= 460) continue;
      if (panelOf(child) !== panel) continue;
      if (child.classList.contains('class-loss-heading-v16')) heading.appendChild(child.cloneNode(true));
      else if (tag === 'text' && +child.getAttribute('y') === 73) {
        const copy = child.cloneNode(true); copy.setAttribute('data-blog-class-subtitle', ''); heading.appendChild(copy);
      } else if (tag === 'text' && +child.getAttribute('y') === 119) {
        const copy = child.cloneNode(true);
        if (panel === 0) copy.setAttribute('data-blog-class-instance-label', copy.textContent);
        groupLabels.appendChild(copy);
      } else graph.appendChild(child.cloneNode(true));
    }
    output.appendChild(heading); output.appendChild(groupLabels); output.appendChild(graph);
    return serialize(output);
  }
  function renderPairs(options = {}) {
    needModules();
    const base = 'blog-class-pairs-' + (++serial);
    const source = global.ClassLabelsV16.tensionSvg({ anchor: options.anchor || null });
    const left = splitPairsSvg(source, 0, base + '-self');
    const right = splitPairsSvg(source, 1, base + '-sup');
    return '<div class="blog-class-v17 blog-class-pairs-v17" data-blog-class-pairs-v17="">'
      + '<div class="blog-class-grid-v17">'
      + '<figure class="blog-class-panel-v17" aria-label="Self-supervised pair relationships">' + left + '</figure>'
      + '<figure class="blog-class-panel-v17" aria-label="Supervised pair relationships">' + right + '</figure>'
      + '</div><div class="blog-class-legend-v17" aria-label="Pair relationship legend">'
      + '<span class="positive"><i aria-hidden="true"></i>Positive</span>'
      + '<span class="negative"><i aria-hidden="true"></i>Negative</span>'
      + '<span class="anchor"><i aria-hidden="true"></i>Anchor</span></div></div>';
  }

  function geometrySvg(alpha) {
    return global.ClassAlphaV13.geometrySvg(alpha)
      .split('Tetrahedron (simplex ETF for n = 4)').join('Tetrahedron (simplex ETF)');
  }
  function lossSvg(alpha) {
    let svg = global.ClassLabelsV16.lossSvg(alpha);
    // The dot already shows the optimizer on the labeled variance axis.
    svg = svg.replace(/(<text\b[^>]*>)Minimum · W = [^<]*(<\/text>)/, '$1Minimum$2');
    return svg.replace('translate(25 191) rotate(-90)', 'translate(40 191) rotate(-90)')
      .replace(/<text\b[^>]*>mean squared distance to the class center<\/text>/, '')
      .replace('viewBox="0 0 700 456"', 'viewBox="0 0 700 420"');
  }
  function lossPanel(alpha, definition) {
    return lossSvg(alpha) + (definition ? '<figcaption>Mean squared distance to the class center</figcaption>' : '');
  }
  function renderOptimum(alpha = 0.4, options = {}) {
    needModules(); global.ClassAlphaV13.state(alpha);
    const definition = options.includeVarianceDefinition === true;
    return '<div class="blog-class-v17 blog-class-optimum-v17" data-blog-class-optimum-v17=""'
      + ' data-blog-class-alpha="' + alpha + '" data-blog-class-variance-definition="' + definition + '">'
      + '<div class="blog-class-grid-v17">'
      + '<figure class="blog-class-panel-v17" data-blog-class-slot="geometry" aria-label="Optimal embedding geometry">'
      + geometrySvg(alpha) + '</figure>'
      + '<figure class="blog-class-panel-v17" data-blog-class-slot="loss" aria-label="Loss over within-class variance">'
      + lossPanel(alpha, definition) + '</figure></div></div>';
  }

  function findRoots(root) {
    if (!root) root = global.document;
    if (typeof root === 'string') root = global.document.querySelector(root);
    if (!root) return [];
    const selector = '[data-blog-class-pairs-v17],[data-blog-class-optimum-v17]';
    const result = [];
    if (isElement(root) && root.matches(selector)) result.push(root);
    if (root.querySelectorAll) result.push(...root.querySelectorAll(selector));
    return result;
  }
  function compactPairs(svg, compact) {
    const panel = +svg.getAttribute('data-blog-class-pair-panel');
    svg.setAttribute('viewBox', (panel ? '725' : '0') + ' 0 700 ' + (compact ? 485 : 445));
    svg.querySelector('[data-blog-class-graph]').setAttribute('transform', compact ? 'translate(0 40)' : 'translate(0 0)');
    const labels = svg.querySelector('[data-blog-class-group-labels]');
    labels.setAttribute('transform', compact && panel === 1 ? 'translate(0 20)' : 'translate(0 0)');
    const subtitle = svg.querySelector('[data-blog-class-subtitle]');
    if (subtitle) subtitle.style.display = compact ? 'none' : '';
    for (const label of labels.querySelectorAll('[data-blog-class-instance-label]')) {
      const original = label.getAttribute('data-blog-class-instance-label');
      if (compact) {
        const x = label.getAttribute('x'), index = original.split(' ').pop();
        label.innerHTML = '<tspan x="' + x + '" y="96">Instance</tspan><tspan x="' + x + '" y="140">' + index + '</tspan>';
      } else label.textContent = original;
    }
  }
  function fitFonts(root) {
    if (!root.isConnected) return;
    for (const svg of root.querySelectorAll('svg[data-blog-class-pair-panel]')) {
      compactPairs(svg, svg.getBoundingClientRect().width < 410);
    }
    // Use each element's real screen transform, including nested camera
    // groups. This guarantees a 16 CSS-pixel minimum without assuming that
    // every text element shares the outer SVG's scale.
    for (const text of root.querySelectorAll('svg text')) {
      if (!text.hasAttribute('data-blog-class-base-font')) {
        text.setAttribute('data-blog-class-base-font', text.getAttribute('font-size') || parseFloat(global.getComputedStyle(text).fontSize) || 26);
      }
      const base = +text.getAttribute('data-blog-class-base-font');
      const m = text.getScreenCTM();
      const scale = m ? Math.hypot(m.a, m.b) : 0;
      if (!(scale > 0)) continue;
      const size = Math.max(base, 16 / scale);
      text.setAttribute('font-size', String(Math.round(size * 1000) / 1000));
    }
    // Recenter the heading and its adjacent math symbol after mobile font
    // enlargement. Otherwise the longer text could run into the symbol.
    for (const heading of root.querySelectorAll('.class-loss-heading-v16')) {
      const text = heading.querySelector('text'), symbol = heading.querySelector('image');
      const m = text.getScreenCTM(), scale = m ? Math.hypot(m.a, m.b) : 0;
      if (!(scale > 0)) continue;
      if (!symbol.hasAttribute('data-blog-class-symbol-ratio')) {
        symbol.setAttribute('data-blog-class-symbol-ratio', +symbol.getAttribute('width') / +symbol.getAttribute('height'));
      }
      const center = heading.getAttribute('data-loss') === 'self' ? 346 : 1071;
      const height = Math.max(35, 18 / scale), width = height * +symbol.getAttribute('data-blog-class-symbol-ratio');
      const gap = Math.max(14, 7 / scale), textWidth = text.getBBox().width;
      text.setAttribute('x', center - (gap + width) / 2);
      symbol.setAttribute('width', width); symbol.setAttribute('height', height);
      symbol.setAttribute('x', center - (textWidth + gap + width) / 2 + textWidth + gap);
    }
  }
  function bindPairs(root) {
    const pairControllers = global.ClassPairsV13.bind(root);
    let hover = null, focused = null;
    const nodeAt = target => {
      const node = isElement(target) ? target.closest('.cpv13-node') : null;
      return node && root.contains(node) ? node : null;
    };
    const select = anchor => pairControllers.forEach(controller => controller.setAnchor(anchor));
    const render = () => select(hover || focused);
    const over = event => {
      const node = nodeAt(event.target); if (!node) return;
      hover = node.getAttribute('data-cpv13-node'); render();
    };
    const out = event => {
      const from = nodeAt(event.target), to = nodeAt(event.relatedTarget);
      if (!from || from === to) return;
      hover = to ? to.getAttribute('data-cpv13-node') : null; render();
    };
    const focusin = event => {
      const node = nodeAt(event.target); if (!node) return;
      focused = node.getAttribute('data-cpv13-node'); render();
    };
    const focusout = event => {
      const node = nodeAt(event.relatedTarget);
      focused = node ? node.getAttribute('data-cpv13-node') : null; render();
    };
    const keydown = event => {
      if (event.key !== 'Escape' || !nodeAt(event.target)) return;
      event.preventDefault(); event.stopPropagation();
      hover = null; focused = null;
      const active = global.document.activeElement;
      if (root.contains(active) && active.blur) active.blur();
      pairControllers.forEach(controller => controller.clear());
    };
    const listeners = { pointerover: over, pointerout: out, focusin, focusout };
    Object.entries(listeners).forEach(([name, listener]) => root.addEventListener(name, listener));
    root.addEventListener('keydown', keydown, true);
    return {
      select(anchor) { hover = null; focused = null; select(anchor); },
      clear() {
        hover = null; focused = null;
        pairControllers.forEach(controller => controller.clear());
      },
      destroy() {
        Object.entries(listeners).forEach(([name, listener]) => root.removeEventListener(name, listener));
        root.removeEventListener('keydown', keydown, true);
        pairControllers.forEach(controller => controller.destroy());
      }
    };
  }
  function bind(root = global.document) {
    needModules(); ensureStyles();
    return findRoots(root).map(element => {
      if (controllers.has(element)) { controllers.get(element).refresh(); return controllers.get(element); }
      const pairs = element.hasAttribute('data-blog-class-pairs-v17') ? bindPairs(element) : null;
      let pending = 0;
      const refresh = () => {
        if (pending) global.cancelAnimationFrame(pending);
        pending = global.requestAnimationFrame(() => { pending = 0; fitFonts(element); });
      };
      const observer = new global.ResizeObserver(refresh); observer.observe(element);
      const controller = {
        element, refresh,
        setAnchor(anchor) { if (pairs) pairs.select(anchor); },
        clear() { if (pairs) pairs.clear(); },
        update(alpha) { if (element.hasAttribute('data-blog-class-optimum-v17')) updateOptimum(element, alpha); },
        destroy() {
          observer.disconnect(); if (pending) global.cancelAnimationFrame(pending);
          if (pairs) pairs.destroy(); controllers.delete(element);
        }
      };
      controllers.set(element, controller); refresh();
      if (global.document.fonts) global.document.fonts.ready.then(refresh);
      return controller;
    });
  }
  function updateOptimum(root, alpha) {
    needModules(); const s = global.ClassAlphaV13.state(alpha);
    for (const element of findRoots(root)) {
      if (!element.hasAttribute('data-blog-class-optimum-v17')) continue;
      const definition = element.getAttribute('data-blog-class-variance-definition') === 'true';
      element.querySelector('[data-blog-class-slot="geometry"]').innerHTML = geometrySvg(alpha);
      element.querySelector('[data-blog-class-slot="loss"]').innerHTML = lossPanel(alpha, definition);
      element.setAttribute('data-blog-class-alpha', String(alpha));
      bind(element)[0].refresh();
    }
    return s;
  }
  global.BlogClassV17 = { renderPairs, renderOptimum, bind, updateOptimum, styles: CSS };
})(window);

