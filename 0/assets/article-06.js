
/*
 * Interactive pair-role diagrams for Lee, Oh, Lee & Sohn (AISTATS 2025),
 * Eqs. (1)--(3). Four instances, two views per instance, two classes.
 * https://proceedings.mlr.press/v258/lee25a.html
 *
 * Graphs count undirected edges between DISTINCT nodes. There are:
 *   self loss: 4 positive and 24 negative edges;
 *   supervised loss: 8 positive and 20 negative edges.
 * For each anchor these become 1/6 and 2/5, respectively.
 * The supervised numerator excludes the same instance, so its other view
 * is denominator-only and has a negative role in that isolated component.
 * Both exact denominators contain all 8 views. The self numerator includes
 * the anchor self-comparison; its numerator is constant at unit norm.
 * Self-loops are omitted from this relational diagram, not from the loss.
 *
 * Positions are schematic. Tension arrows indicate contrasting pair roles,
 * not literal gradient vectors or a universal gradient-sign assertion.
 */
(function (global) {
  'use strict';

  const INK = '#172334', MUTED = '#647184';
  const POS = '#2f6d4c', NEG = '#b55b3c';
  const COLORS = ['#245bd7', '#c56a3e', '#197f75', '#8662c4'];
  const TINTS = ['#f0f4fc', '#fbf3ef', '#eff7f5', '#f5f2fa'];
  const ORIGINS = [20, 745], XS = [83, 245, 407, 569];
  const YS = { u: 211, v: 323 };
  const SUBS = ['₁', '₂', '₃', '₄'];
  const NODES = Array.from({ length: 4 }, (_, instance) => ['u', 'v'].map(view => ({
    id: view + (instance + 1), label: view + SUBS[instance], instance,
    view, classIndex: Math.floor(instance / 2), color: COLORS[instance]
  }))).flat();
  const NODE_BY_ID = Object.fromEntries(NODES.map(n => [n.id, n]));
  const ALL_PAIRS = [];
  for (let i = 0; i < NODES.length; ++i) for (let j = i + 1; j < NODES.length; ++j) {
    ALL_PAIRS.push([NODES[i].id, NODES[j].id]);
  }
  let serial = 0;
  const instances = new WeakMap();
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const f = n => Number(n.toFixed(3));
  const isElement = x => !!x && x.nodeType === 1;

  function normalizeAnchor(anchor) {
    if (anchor == null || anchor === '') return null;
    const id = String(anchor).replace(/[₁₂₃₄]/g, s => String(SUBS.indexOf(s) + 1));
    if (!NODE_BY_ID[id]) throw new Error('Expected u1,v1,...,u4,v4 as anchor.');
    return id;
  }
  function pairRole(panel, a, b) {
    const x = NODE_BY_ID[normalizeAnchor(a)], y = NODE_BY_ID[normalizeAnchor(b)];
    if (!x || !y) throw new Error('Pair endpoints are required.');
    if (x.id === y.id) return 'self';
    const sup = panel === 'supervised' || panel === 'class' || panel === 1;
    return (sup ? x.classIndex === y.classIndex && x.instance !== y.instance : x.instance === y.instance)
      ? 'positive' : 'negative';
  }
  function conflictingTarget(anchor) {
    const a = NODE_BY_ID[normalizeAnchor(anchor || 'u1')];
    return (a.view === 'u' ? 'v' : 'u') + ((a.instance ^ 1) + 1);
  }
  function state(anchor = null) {
    anchor = normalizeAnchor(anchor);
    const panels = ['self', 'supervised'].map(kind => {
      const edges = ALL_PAIRS.map(([from, to]) => ({ from, to, role: pairRole(kind, from, to) }));
      const positive = edges.filter(e => e.role === 'positive');
      const negative = edges.filter(e => e.role === 'negative');
      const fromAnchor = anchor ? edges.filter(e => e.from === anchor || e.to === anchor) : [];
      return { kind, edges, positive, negative, fromAnchor,
        positiveNodes: anchor ? NODES.filter(n => pairRole(kind, anchor, n.id) === 'positive').map(n => n.id) : [],
        negativeNodes: anchor ? NODES.filter(n => pairRole(kind, anchor, n.id) === 'negative').map(n => n.id) : [] };
    });
    return { anchor, panels, conflict: [anchor || 'u1', conflictingTarget(anchor || 'u1')] };
  }

  function text(x, y, value, size = 27, color = INK, anchor = 'middle', weight = 400, extra = '') {
    return '<text x="' + f(x) + '" y="' + f(y) + '" font-size="' + size + '" fill="' + color
      + '" text-anchor="' + anchor + '" font-weight="' + weight + '" ' + extra + '>' + esc(value) + '</text>';
  }
  function circle(x, y, radius, fill, stroke, width = 2, extra = '') {
    return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + radius + '" fill="' + fill
      + '" stroke="' + stroke + '" stroke-width="' + width + '" ' + extra + '/>';
  }
  function line(x1, y1, x2, y2, color, width = 2, extra = '') {
    return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2)
      + '" stroke="' + color + '" stroke-width="' + width + '" stroke-linecap="round" ' + extra + '/>';
  }
  function point(panel, id) {
    const n = NODE_BY_ID[id];
    return [ORIGINS[panel] + XS[n.instance], YS[n.view]];
  }
  function edgePath(panel, from, to) {
    const a = point(panel, from), b = point(panel, to);
    if (a[1] !== b[1] || a[0] === b[0]) return 'M' + a.join(',') + 'L' + b.join(',');
    // Route same-row edges into the open region between rows. Straight
    // long edges would incorrectly seem to pass through intervening nodes.
    const bend = (a[1] === YS.u ? 1 : -1) * (33 + Math.abs(a[0] - b[0]) * 0.10);
    return 'M' + a.join(',') + 'Q' + f((a[0] + b[0]) / 2) + ',' + f(a[1] + bend) + ' ' + b.join(',');
  }
  function arrow(a, b, color) {
    const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
    const ux = dx / length, uy = dy / length, h = 10.5, w = 5.8;
    const c = [b[0] - h * ux, b[1] - h * uy];
    return line(a[0], a[1], c[0] + ux, c[1] + uy, color, 4.0)
      + '<path d="M' + f(b[0]) + ',' + f(b[1]) + 'L' + f(c[0] - uy * w) + ',' + f(c[1] + ux * w)
      + 'L' + f(c[0] + uy * w) + ',' + f(c[1] - ux * w) + 'Z" fill="' + color + '"/>';
  }
  const lerp = (a, b, t) => [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
  function conflictArrows(panel, pair) {
    const a = point(panel, pair[0]), b = point(panel, pair[1]), color = panel ? POS : NEG;
    return panel
      ? arrow(lerp(a, b, 0.17), lerp(a, b, 0.43), color) + arrow(lerp(a, b, 0.83), lerp(a, b, 0.57), color)
      : arrow(lerp(a, b, 0.43), lerp(a, b, 0.17), color) + arrow(lerp(a, b, 0.57), lerp(a, b, 0.83), color);
  }
  function boxes(panel) {
    const o = ORIGINS[panel];
    let b = '';
    if (panel === 0) {
      for (let i = 0; i < 4; ++i) {
        b += text(o + XS[i], 119, 'Instance ' + (i + 1), 25, MUTED, 'middle', 500);
        b += '<rect x="' + (o + XS[i] - 67) + '" y="138" width="134" height="245" rx="18"'
          + ' fill="' + TINTS[i] + '" stroke="#e0e6ef" stroke-width="1.2" data-cpv13-instance-box="' + (i + 1) + '"/>';
      }
    } else {
      for (let c = 0; c < 2; ++c) {
        const left = o + 16 + c * 324;
        b += text(left + 148, 119, c ? 'Class B' : 'Class A', 27, MUTED, 'middle', 500);
        b += '<rect x="' + left + '" y="138" width="296" height="245" rx="18"'
          + ' fill="#f3f6fa" stroke="#dde5ef" stroke-width="1.3" data-cpv13-class-box="' + c + '"/>';
      }
    }
    return b;
  }
  function marker(panel, n) {
    const [x, y] = point(panel, n.id);
    return '<g class="cpv13-node" data-cpv13-node="' + n.id + '" data-cpv13-panel="' + panel
      + '" role="button" tabindex="0" aria-label="Select ' + n.id + ' as anchor in both diagrams" aria-pressed="false">'
      + '<rect x="' + (x - 39) + '" y="' + (n.view === 'u' ? y - 63 : y - 30)
      + '" width="78" height="92" fill="transparent" stroke="none"/>'
      + circle(x, y, 31, 'none', INK, 1.5, 'class="cpv13-focus" opacity="0"')
      + circle(x, y, 24, '#fff', INK, 2.5, 'class="cpv13-halo" opacity="0"')
      + circle(x, y, 13.5, n.view === 'u' ? n.color : '#fff', n.color, 3, 'class="cpv13-dot"')
      + text(x, n.view === 'u' ? y - 36 : y + 44, n.label, 29, n.color, 'middle', 400, 'class="cpv13-label"')
      + '</g>';
  }
  function footerMarkup(mode, s, panel) {
    const p = s.panels[panel];
    if (mode === 'tension') {
      const pair = s.conflict.map(id => NODE_BY_ID[id].label).join('–');
      return '<tspan fill="' + INK + '">' + esc(pair) + ': </tspan><tspan fill="'
        + (panel ? POS : NEG) + '">' + (panel ? 'pull together' : 'push apart') + '</tspan>';
    }
    if (!s.anchor) return '<tspan fill="' + POS + '">' + p.positive.length + ' positive pairs</tspan>';
    return '<tspan fill="' + POS + '">' + p.positiveNodes.length + ' positive</tspan>'
      + '<tspan fill="' + MUTED + '"> · </tspan><tspan fill="' + NEG + '">' + p.negativeNodes.length + ' negative</tspan>';
  }
  function legend() {
    return line(386, 476, 430, 476, POS, 3, 'stroke-dasharray="2 7"')
      + text(446, 485, 'Positive', 25, INK, 'start')
      + line(644, 476, 688, 476, NEG, 2.7)
      + text(704, 485, 'Negative', 25, INK, 'start')
      + circle(931, 476, 11, '#fff', INK, 2.4)
      + text(955, 485, 'Anchor', 25, INK, 'start');
  }

  function svg(mode = 'levels', options = {}) {
    if (mode !== 'levels' && mode !== 'tension') throw new Error('Expected levels or tension mode.');
    const anchor = normalizeAnchor(options.anchor), s = state(anchor);
    const id = options.id ? String(options.id).replace(/[^A-Za-z0-9_-]/g, '-') : 'cpv13-' + (++serial);
    let b = '<style>.cpv13-node{cursor:pointer;outline:none}.cpv13-node:focus .cpv13-focus{opacity:1}'
      + '.cpv13-edge,.cpv13-arrows{pointer-events:none}.cpv13-node text{user-select:none}</style>';
    for (let panel = 0; panel < 2; ++panel) {
      const center = ORIGINS[panel] + 326;
      b += text(center, 32, mode === 'levels' ? (panel ? 'Class information' : 'Augmentation')
        : (panel ? 'Supervised loss' : 'Self-supervised loss'), 32, INK, 'middle', 600);
      b += text(center, 73, panel ? 'Same class, different instances' : 'Same instance', 26);
      b += boxes(panel);
      b += '<g class="cpv13-edge-layer" data-cpv13-panel="' + panel + '">';
      for (const e of s.panels[panel].edges) {
        const visible = anchor ? e.from === anchor || e.to === anchor : e.role === 'positive';
        b += '<path class="cpv13-edge" data-cpv13-panel="' + panel + '" data-from="' + e.from + '" data-to="' + e.to
          + '" data-role="' + e.role + '" d="' + edgePath(panel, e.from, e.to) + '" fill="none" stroke="'
          + (e.role === 'positive' ? POS : NEG) + '" stroke-width="' + (e.role === 'positive' ? 3.0 : 2.5)
          + '" stroke-linecap="round"' + (e.role === 'positive' ? ' stroke-dasharray="2 7"' : '')
          + ' opacity="' + (visible ? 0.86 : 0) + '" visibility="' + (visible ? 'visible' : 'hidden') + '"/>';
      }
      b += '</g><g class="cpv13-arrows" data-cpv13-panel="' + panel + '">'
        + (mode === 'tension' ? conflictArrows(panel, s.conflict) : '') + '</g>';
      for (const n of NODES) b += marker(panel, n);
      b += '<text x="' + center + '" y="427" font-size="29" text-anchor="middle" font-weight="500"'
        + ' class="cpv13-footer" data-cpv13-panel="' + panel + '">' + footerMarkup(mode, s, panel) + '</text>';
    }
    b += legend();
    return '<svg xmlns="http://www.w3.org/2000/svg" id="' + esc(id) + '" viewBox="0 0 1425 505" role="group"'
      + ' aria-label="Interactive comparison of self-supervised and supervised pair roles for four instances with two views each"'
      + ' class="cpv13-svg" data-class-pairs-v13="' + mode + '" data-cpv13-anchor="' + (anchor || '')
      + '" font-family="Deck,Arial,sans-serif" style="display:block;width:100%;height:auto;overflow:visible">'
      + '<title>' + (mode === 'levels' ? 'Two levels of positive pairs' : 'One pair, two competing roles')
      + '</title><desc>Hover or focus a point to use the same anchor in both diagrams. '
      + 'Dashed green edges are positive; solid orange edges are negative. '
      + 'The self-loss graph groups each instance separately; the supervised graph groups each class. '
      + 'Self-comparisons are omitted from the graph. These positions show pair relations, not an embedding optimum.</desc>'
      + b + '</svg>';
  }

  function update(svgElement, anchor) {
    anchor = normalizeAnchor(anchor);
    const mode = svgElement.getAttribute('data-class-pairs-v13'), s = state(anchor);
    svgElement.setAttribute('data-cpv13-anchor', anchor || '');
    svgElement.setAttribute('aria-label', anchor
      ? 'Anchor ' + anchor + '. Self-supervised loss: one positive and six negative other views. '
        + 'Supervised loss: two positive and five negative other views.'
      : 'All positive pairs: four self-supervised pairs and eight supervised pairs. Hover or focus any point to compare its roles.');
    for (const edge of svgElement.querySelectorAll('.cpv13-edge')) {
      const panel = Number(edge.getAttribute('data-cpv13-panel'));
      const from = edge.getAttribute('data-from'), to = edge.getAttribute('data-to'), role = edge.getAttribute('data-role');
      const visible = anchor ? from === anchor || to === anchor : role === 'positive';
      const conflict = mode === 'tension' && [from, to].includes(s.conflict[0]) && [from, to].includes(s.conflict[1]);
      // The selected conflict is overlaid by arrows. Keep the positive
      // dotted base edge, while other incident roles remain fully visible.
      edge.setAttribute('visibility', visible ? 'visible' : 'hidden');
      edge.setAttribute('opacity', visible ? (anchor ? (role === 'positive' ? '1' : '0.74') : '0.80') : '0');
      edge.setAttribute('stroke-width', anchor && role === 'positive' ? '3.6' : (role === 'positive' ? '3' : '2.5'));
      edge.setAttribute('data-cpv13-conflict', conflict ? 'true' : 'false');
    }
    for (const node of svgElement.querySelectorAll('.cpv13-node')) {
      const id = node.getAttribute('data-cpv13-node'), panel = Number(node.getAttribute('data-cpv13-panel'));
      const selected = id === anchor;
      const role = anchor ? pairRole(panel, anchor, id) : 'none';
      const isPreviewAnchor = !anchor && mode === 'tension' && id === s.conflict[0];
      const isPreviewTarget = !anchor && mode === 'tension' && id === s.conflict[1];
      const halo = node.querySelector('.cpv13-halo');
      const show = !!anchor || isPreviewAnchor || isPreviewTarget;
      halo.setAttribute('opacity', show ? '1' : '0');
      halo.setAttribute('stroke', selected || isPreviewAnchor ? INK : isPreviewTarget ? (panel ? POS : NEG) : role === 'positive' ? POS : NEG);
      halo.setAttribute('stroke-dasharray', role === 'positive' ? '2 4' : 'none');
      halo.setAttribute('stroke-width', selected || isPreviewAnchor ? '3.2' : '2.5');
      node.setAttribute('data-cpv13-role', selected ? 'anchor' : role);
      node.setAttribute('aria-pressed', selected ? 'true' : 'false');
      node.setAttribute('aria-label', selected ? id + ', anchor in both diagrams' : anchor
        ? id + ', ' + role + ' to ' + anchor + ' in the ' + (panel ? 'supervised' : 'self-supervised') + ' loss. Select as anchor.'
        : 'Select ' + id + ' as anchor in both diagrams');
      node.querySelector('.cpv13-label').setAttribute('font-weight', selected || isPreviewTarget || isPreviewAnchor ? '600' : '400');
    }
    for (const footer of svgElement.querySelectorAll('.cpv13-footer')) {
      footer.innerHTML = footerMarkup(mode, s, Number(footer.getAttribute('data-cpv13-panel')));
    }
    for (const overlay of svgElement.querySelectorAll('.cpv13-arrows')) {
      overlay.innerHTML = mode === 'tension' ? conflictArrows(Number(overlay.getAttribute('data-cpv13-panel')), s.conflict) : '';
    }
    svgElement.setAttribute('data-cpv13-conflict', s.conflict.join('-'));
    return s;
  }

  function findSvgs(root) {
    if (!root) root = global.document;
    if (typeof root === 'string') root = global.document.querySelector(root);
    if (!root) return [];
    const found = [];
    if (isElement(root) && root.matches('svg[data-class-pairs-v13]')) found.push(root);
    if (root.querySelectorAll) found.push(...root.querySelectorAll('svg[data-class-pairs-v13]'));
    return found;
  }
  function bind(root = global.document) {
    const svgs = findSvgs(root);
    const controllers = svgs.map(svgElement => {
      if (instances.has(svgElement)) return instances.get(svgElement);
      let hoverAnchor = null, focusAnchor = null;
      let selectedAnchor = normalizeAnchor(svgElement.getAttribute('data-cpv13-anchor'));
      const nodeAt = target => {
        const node = isElement(target) ? target.closest('.cpv13-node') : null;
        return node && svgElement.contains(node) ? node : null;
      };
      const effective = () => hoverAnchor || focusAnchor || selectedAnchor;
      const render = () => update(svgElement, effective());
      const over = event => {
        const node = nodeAt(event.target);
        if (!node) return;
        hoverAnchor = node.getAttribute('data-cpv13-node'); render();
      };
      const out = event => {
        const from = nodeAt(event.target), next = nodeAt(event.relatedTarget);
        if (!from || from === next) return;
        hoverAnchor = next ? next.getAttribute('data-cpv13-node') : null; render();
      };
      const focusin = event => {
        const node = nodeAt(event.target);
        if (!node) return;
        focusAnchor = node.getAttribute('data-cpv13-node'); render();
      };
      const focusout = event => {
        const node = nodeAt(event.relatedTarget);
        focusAnchor = node ? node.getAttribute('data-cpv13-node') : null; render();
      };
      const click = event => {
        const node = nodeAt(event.target);
        if (!node) return;
        // Focus persists after tapping, so the interaction also works
        // without a hover-capable device.
        if (typeof node.focus === 'function') node.focus({ preventScroll: true });
        focusAnchor = node.getAttribute('data-cpv13-node'); render();
      };
      const keydown = event => {
        const node = nodeAt(event.target);
        if (!node) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault(); event.stopPropagation();
          focusAnchor = node.getAttribute('data-cpv13-node'); render();
        } else if (event.key === 'Escape') {
          event.preventDefault(); event.stopPropagation();
          hoverAnchor = null; focusAnchor = null; selectedAnchor = null;
          if (typeof node.blur === 'function') node.blur();
          update(svgElement, null);
        }
      };
      const listeners = { pointerover: over, pointerout: out, focusin, focusout, click, keydown };
      Object.entries(listeners).forEach(([type, listener]) => svgElement.addEventListener(type, listener));
      const controller = {
        element: svgElement,
        setAnchor(anchor) { hoverAnchor = null; focusAnchor = null; selectedAnchor = normalizeAnchor(anchor); return render(); },
        clear() {
          hoverAnchor = null; focusAnchor = null; selectedAnchor = null;
          if (svgElement.contains(global.document.activeElement) && typeof global.document.activeElement.blur === 'function') global.document.activeElement.blur();
          return update(svgElement, null);
        },
        state() { return state(svgElement.getAttribute('data-cpv13-anchor')); },
        destroy() {
          Object.entries(listeners).forEach(([type, listener]) => svgElement.removeEventListener(type, listener));
          instances.delete(svgElement);
        }
      };
      instances.set(svgElement, controller); render();
      return controller;
    });
    return controllers;
  }
  function setAnchor(root, anchor) {
    return bind(root).map(controller => controller.setAnchor(anchor));
  }
  function clear(root) {
    return bind(root).map(controller => controller.clear());
  }

  global.ClassPairsV13 = {
    svg,
    positiveLevelsSvg: options => svg('levels', options),
    tensionSvg: options => svg('tension', options),
    bind, setAnchor, clear, state, pairRole,
    colors: COLORS.slice(),
    setup: { instances: 4, views: 2, classes: ['A', 'A', 'B', 'B'],
      nodes: NODES.map(n => ({ id: n.id, label: n.label, instance: n.instance + 1, className: n.classIndex ? 'B' : 'A' })) }
  };
})(window);

