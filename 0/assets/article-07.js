
/*
 * Class-collapse / SSEM slide, controlled only by the self weight alpha.
 * Requires the existing window.ClassV8; does not modify it.
 *
 * Paper: Lee, Oh, Lee & Sohn, AISTATS 2025.
 * https://proceedings.mlr.press/v258/lee25a.html
 * Theorem 1 / Appendix Theorem A.2 and Eqs. (A.56)--(A.58).
 *
 * Here n=4 means the TOTAL number of instances in the presentation.
 * The paper has m=2 classes, n_paper=2 instances/class, p=2 views, d>=3.
 * The denominator includes all eight views, including the anchor. Self
 * positives include the anchor; supervised positives are other instances
 * in the same class and are disjoint from the self-positive pool.
 *
 * At tau=1/2, the exact mean loss on the optimal SSEM family is
 *   phi_alpha(W) = log(2) + log(1 + exp(-4W) + 2exp(-4+2W))
 *                  + 4(1-alpha)W,       0 <= W <= 2/3.
 * No additive constant or normalization factor has been removed.
 * phi = (1-alpha)*L_sup + alpha*L_self.
 *
 * The chart's horizontal domain is fixed. Its labeled vertical range adapts
 * to alpha so that a shallow minimum remains visible. This is the loss at
 * each SSEM geometry, not an optimization trajectory or new experiment.
 */
(function (global) {
  'use strict';

  const INK = '#172334', BLUE = '#245bd7', MUTED = '#647184';
  const GRID = '#e6ecf3', AXIS = '#7c899b';
  const TAU = 0.5, W_MAX = 2 / 3, DEFAULT_ALPHA = 0.4;
  const WIDTH = 700, HEIGHT = 420;
  const MODEL_LABEL = 'Combined loss within SSEM';
  const ENDPOINT_LABEL = 'Tetrahedron (simplex ETF for n = 4)';
  const esc = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const f = value => Number(value.toFixed(3));

  function validateAlpha(alpha) {
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
      throw new Error('ClassAlphaV13: alpha must lie in [0,1].');
    }
  }
  function validateW(W) {
    if (!Number.isFinite(W) || W < -1e-12 || W > W_MAX + 1e-12) {
      throw new Error('ClassAlphaV13: W must lie in [0,2/3].');
    }
    return Math.max(0, Math.min(W_MAX, W));
  }
  function core() {
    if (!global.ClassV8) throw new Error('Load class_v8.js before class_alpha_v13.js.');
    return global.ClassV8;
  }

  function components(W) {
    W = validateW(W);
    const self = Math.log(2) + Math.log1p(Math.exp(-4 * W) + 2 * Math.exp(-4 + 2 * W));
    return { self, sup: self + 4 * W };
  }

  function loss(W, alpha = DEFAULT_ALPHA) {
    validateAlpha(alpha);
    W = validateW(W);
    const c = components(W);
    return c.self + 4 * (1 - alpha) * W;
  }

  function derivative(W, alpha = DEFAULT_ALPHA) {
    validateAlpha(alpha);
    W = validateW(W);
    const a = Math.exp(-4 * W), b = Math.exp(-4 + 2 * W);
    const h = (1 - alpha) - alpha * a + (3 - 2 * alpha) * b;
    return 4 * h / (1 + a + 2 * b);
  }

  function state(alpha = DEFAULT_ALPHA) {
    validateAlpha(alpha);
    const s = core().optimum(alpha, TAU);
    const c = components(s.W);
    const phase = alpha === 1 ? 'tetrahedron' : s.W === 0 ? 'collapse' : 'distinct';
    return Object.assign({}, s, {
      alpha, tau: TAU, totalInstances: 4, classesCount: 2, instancesPerClass: 2,
      viewsPerInstance: 2, dimension: 3, Wstar: s.W,
      lossAtMinimum: loss(s.W, alpha),
      selfLossAtMinimum: c.self, supLossAtMinimum: c.sup,
      phase,
      phaseLabel: phase === 'tetrahedron' ? ENDPOINT_LABEL
        : phase === 'collapse' ? 'Class collapse' : 'Same-class instances separate',
      modelLabel: MODEL_LABEL,
      alignedViewLabel: 'Aligned views: uᵢ = vᵢ'
    });
  }

  function text(x, y, value, size = 26, color = INK, anchor = 'middle', weight = 400, extra = '') {
    return '<text x="' + f(x) + '" y="' + f(y) + '" font-size="' + size
      + '" fill="' + color + '" text-anchor="' + anchor + '" font-weight="' + weight
      + '" ' + extra + '>' + esc(value) + '</text>';
  }
  function line(x1, y1, x2, y2, color = GRID, width = 1.5, extra = '') {
    return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2)
      + '" y2="' + f(y2) + '" stroke="' + color + '" stroke-width="' + width + '" ' + extra + '/>';
  }
  function svg(width, height, body, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height
      + '" role="img" aria-label="' + esc(label) + '" font-family="Deck,Arial,sans-serif"'
      + ' style="display:block;width:100%;height:auto;overflow:visible">'
      + '<title>' + esc(label) + '</title>' + body + '</svg>';
  }
  function innerSvg(source) {
    return source.slice(source.indexOf('>') + 1, source.lastIndexOf('</svg>'));
  }

  function geometrySvg(alpha = DEFAULT_ALPHA, options = {}) {
    const s = state(alpha);
    // Reuse the verified exact 3D camera and unit-vector coordinates. The
    // transformation enlarges the drawing; it does not change its geometry.
    const scale = 1.22, cx = 350, cy = 206;
    const original = core().geometrySvg(s.W, { width: 430, height: 380, caption: false,
      labelSize: 25, edges: alpha === 1 });
    let body = text(350, 31, options.title || 'Optimal geometry', 30, INK, 'middle', 600);
    body += '<g transform="translate(' + f(cx - 215 * scale) + ' ' + f(cy - 185 * scale)
      + ') scale(' + scale + ')">' + innerSvg(original) + '</g>';
    body += text(350, 366, s.alignedViewLabel, 24, MUTED);
    body += text(350, 407, s.phaseLabel, 26, INK, 'middle', 500);
    return svg(WIDTH, HEIGHT, body,
      'Global optimum at alpha ' + alpha.toFixed(3) + ', temperature 0.5. '
      + s.phaseLabel + '. Four paired instances, two per class. Within-class variance '
      + s.W.toFixed(6) + '. The two views of each instance are aligned on the unit sphere.');
  }

  function niceStep(raw) {
    const power = Math.pow(10, Math.floor(Math.log10(raw)));
    const unit = raw / power;
    return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 2.5 ? 2.5 : unit <= 5 ? 5 : 10) * power;
  }
  function lossRange(alpha) {
    const s = state(alpha), lo = s.lossAtMinimum;
    // Convexity implies that the maximum on the displayed interval is an
    // endpoint; no sampling estimate is needed for either range endpoint.
    const hi = Math.max(loss(0, alpha), loss(W_MAX, alpha));
    const span = Math.max(0.2, hi - lo), step = niceStep(span / 3.3);
    const min = Math.floor((lo - span * 0.12) / step) * step;
    const max = Math.ceil((hi + span * 0.10) / step) * step;
    const ticks = [];
    for (let value = min; value <= max + step * 0.1; value += step) ticks.push(Number(value.toFixed(10)));
    return { min, max, step, ticks };
  }
  const number = value => value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  const varianceLabel = W => W === 0 ? '0' : Math.abs(W - W_MAX) < 1e-12 ? '2/3' : W.toFixed(3);

  function lossSvg(alpha = DEFAULT_ALPHA, options = {}) {
    const s = state(alpha), range = lossRange(alpha);
    const b = { left: 98, right: 666, top: 65, bottom: 318 };
    const xPos = W => b.left + (b.right - b.left) * W / W_MAX;
    const yPos = y => b.bottom - (b.bottom - b.top) * (y - range.min) / (range.max - range.min);
    let body = text(350, 31, options.title || MODEL_LABEL, 30, INK, 'middle', 600);

    for (const tick of range.ticks) {
      const y = yPos(tick);
      body += line(b.left, y, b.right, y, GRID, 1.3);
      body += text(b.left - 16, y + 8, number(tick), 24, MUTED, 'end');
    }
    body += '<path d="M' + b.left + ',' + b.top + 'V' + b.bottom + 'H' + b.right
      + '" fill="none" stroke="' + AXIS + '" stroke-width="1.6"/>';
    for (const [W, label] of [[0, '0'], [1 / 3, '1/3'], [W_MAX, '2/3']]) {
      const x = xPos(W);
      body += line(x, b.bottom, x, b.bottom + 6, AXIS, 1.6);
      body += text(x, b.bottom + 37, label, 25, MUTED);
    }
    body += '<text transform="translate(25 191) rotate(-90)" text-anchor="middle" font-size="27" fill="'
      + INK + '">Loss</text>';
    body += text((b.left + b.right) / 2, 400, 'W', 29, INK, 'middle', 500);

    const values = Array.from({ length: 241 }, (_, i) => i * W_MAX / 240);
    values.push(s.W);
    values.sort((a, q) => a - q);
    const path = values.map((W, i) => (i ? 'L' : 'M') + f(xPos(W)) + ',' + f(yPos(loss(W, alpha)))).join(' ');
    body += '<path d="' + path + '" fill="none" stroke="' + BLUE
      + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>';

    const mx = xPos(s.W), my = yPos(s.lossAtMinimum);
    body += line(mx, my, mx, b.bottom, INK, 1.5, 'stroke-dasharray="4 5" opacity="0.4"');
    body += '<circle cx="' + f(mx) + '" cy="' + f(my) + '" r="9" fill="#fff" stroke="'
      + INK + '" stroke-width="2.4"/>';
    body += '<circle cx="' + f(mx) + '" cy="' + f(my) + '" r="4" fill="' + INK + '"/>';
    const atRight = mx > (b.left + b.right) / 2;
    const labelX = mx + (atRight ? -14 : 14);
    // Keep the label above the entire curve under its text span, not across
    // the rising limb of the curve. 250px bounds the current 25px label.
    const labelLeft = atRight ? labelX - 250 : labelX;
    const labelRight = atRight ? labelX : labelX + 250;
    const toW = x => Math.max(0, Math.min(W_MAX, (x - b.left) * W_MAX / (b.right - b.left)));
    const curveTopUnderLabel = Math.min(yPos(loss(toW(labelLeft), alpha)), yPos(loss(toW(labelRight), alpha)));
    const labelY = Math.max(b.top + 28, Math.min(my - 23, curveTopUnderLabel - 22));
    body += text(labelX, labelY,
      'Minimum · W = ' + varianceLabel(s.W), 25, INK, atRight ? 'end' : 'start', 500,
      'paint-order="stroke" stroke="#fff" stroke-width="5" stroke-linejoin="round"');

    return svg(WIDTH, HEIGHT, body,
      'Combined loss within SSEM, at self weight alpha ' + alpha.toFixed(3)
      + ' and temperature 0.5. Global minimum at W ' + s.W.toFixed(6)
      + ', loss ' + s.lossAtMinimum.toFixed(6)
      + '. Horizontal domain is fixed from zero to two thirds; the vertical axis adapts to the current alpha.');
  }

  function combinedSvg(alpha = DEFAULT_ALPHA, options = {}) {
    const left = geometrySvg(alpha, options.geometry || {});
    const right = lossSvg(alpha, options.loss || {});
    const body = '<svg x="0" y="0" width="700" height="420" viewBox="0 0 700 420">' + innerSvg(left)
      + '</svg><svg x="725" y="0" width="700" height="420" viewBox="0 0 700 420">' + innerSvg(right) + '</svg>';
    return svg(1425, HEIGHT, body,
      'Changing alpha changes the optimal SSEM geometry and the minimum of its exact loss. Alpha weights self-supervision; temperature is fixed at 0.5.');
  }

  global.ClassAlphaV13 = {
    state, loss, components, derivative, lossRange, geometrySvg, lossSvg, combinedSvg,
    constants: Object.freeze({ tau: TAU, Wmax: W_MAX, defaultAlpha: DEFAULT_ALPHA,
      totalInstances: 4, classes: 2, instancesPerClass: 2, views: 2, dimension: 3,
      modelLabel: MODEL_LABEL, endpointLabel: ENDPOINT_LABEL })
  };
})(window);

