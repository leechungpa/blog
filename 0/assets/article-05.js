
/*
 * Four-instance class-collapse illustrations, drawn from exact unit vectors.
 * C = n = 2, p = 2; the two views of each instance coincide in the SSEM family.
 * Source: Lee et al., AISTATS 2025, Theorem 2 / Appendix Theorem A.2.
 * https://proceedings.mlr.press/v258/lee25a.html
 * All drawings are new SVGs. No paper figure pixels are used.
 */
(function (global) {
  'use strict';

  const INK = '#172334', BLUE = '#245bd7', ORANGE = '#c56a3e';
  const GREEN = '#197f75', MUTED = '#647184', LIGHT = '#dce3ec';
  const COLORS = [BLUE, ORANGE, '#197f75', '#8662c4'];
  const NAMES = ['u₁', 'u₂', 'u₃', 'u₄'];
  const U_NAMES = ['u₁', 'u₂', 'u₃', 'u₄'];
  const V_NAMES = ['v₁', 'v₂', 'v₃', 'v₄'];
  const W_MAX = 2 / 3;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const f = x => Number(x.toFixed(3));

  function text(x, y, value, size = 26, color = INK, anchor = 'middle', weight = 400) {
    return '<text x="' + f(x) + '" y="' + f(y) + '" font-size="' + size
      + '" fill="' + color + '" text-anchor="' + anchor + '" font-weight="' + weight
      + '">' + esc(value) + '</text>';
  }
  function line(x1, y1, x2, y2, color = LIGHT, width = 2, extra = '') {
    return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2)
      + '" y2="' + f(y2) + '" stroke="' + color + '" stroke-width="' + width + '" ' + extra + '/>';
  }
  function circle(x, y, radius, fill = 'none', stroke = LIGHT, width = 2, extra = '') {
    return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(radius)
      + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="' + width + '" ' + extra + '/>';
  }
  function svg(width, height, body, label) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + width + ' ' + height
      + '" role="img" aria-label="' + esc(label) + '" font-family="Deck,Arial,sans-serif"'
      + ' style="display:block;width:100%;height:auto;overflow:visible">'
      + '<title>' + esc(label) + '</title>' + body + '</svg>';
  }

  function state(W = 0.35) {
    if (!Number.isFinite(W) || W < -1e-12 || W > W_MAX + 1e-12) {
      throw new Error('ClassV8 requires 0 <= W <= 2/3.');
    }
    W = Math.max(0, Math.min(W_MAX, W));
    const a = Math.sqrt(1 - W), b = Math.sqrt(W);
    const vectors = [[a, b, 0], [a, -b, 0], [-a, 0, b], [-a, 0, -b]];
    const same = 1 - 2 * W, different = W - 1;
    const gram = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) =>
      i === j ? 1 : Math.floor(i / 2) === Math.floor(j / 2) ? same : different));
    return {
      W, B: 1 - W, wMax: W_MAX, same, different,
      delta: Math.sqrt(1.5 * W), collapsed: W === 0,
      vectors, gram, labels: NAMES.slice(), classes: ['A', 'A', 'B', 'B'],
      // The instance matrix above is 4x4. The analyzed loss uses all 8 views.
      fullGram: Array.from({ length: 8 }, (_, i) => Array.from({ length: 8 }, (_, j) =>
        gram[Math.floor(i / 2)][Math.floor(j / 2)]))
    };
  }

  function boundary(tau = 0.5) {
    if (!Number.isFinite(tau) || tau <= 0) throw new Error('Temperature must be positive.');
    const q = Math.exp(-2 / tau);
    return (1 + 3 * q) / (2 + 2 * q);
  }

  function optimum(alpha = 0.7, tau = 0.5) {
    if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
      throw new Error('Self-supervision weight must lie in [0,1].');
    }
    const alphaCrit = boundary(tau);
    let W = 0;
    if (alpha === 1) W = W_MAX;
    else if (alpha > alphaCrit) {
      let lo = 0, hi = W_MAX;
      for (let k = 0; k < 64; ++k) {
        const w = (lo + hi) / 2;
        const derivativeSign = (1 - alpha) - alpha * Math.exp(-2 * w / tau)
          + (3 - 2 * alpha) * Math.exp(-(2 - w) / tau);
        if (derivativeSign < 0) lo = w;
        else hi = w;
      }
      W = (lo + hi) / 2;
    }
    return Object.assign(state(W), { alpha, tau, alphaCrit });
  }

  function bracket(x1, x2, y, label, color) {
    return '<path d="M' + x1 + ',' + (y + 8) + 'V' + y + 'H' + x2 + 'V' + (y + 8)
      + '" fill="none" stroke="' + color + '" stroke-width="1.8" opacity="0.55"/>'
      + text((x1 + x2) / 2, y - 14, label, 25, color);
  }

  function positiveRulesSvg() {
    let b = '';
    // A separate olive highlight avoids confusing the positive halo with the
    // teal identity color of instance 3.
    const POSITIVE = '#71802a';
    const top = 199, bottom = 292;
    for (let panel = 0; panel < 2; ++panel) {
      const offset = panel * 715;
      const xs = [105, 262, 419, 576].map(x => x + offset);
      const cx = 340 + offset;
      b += text(cx, 36, panel ? 'Supervised positives' : 'Self-supervised positives', 30, INK, 'middle', 600);
      b += text(cx, 76, panel ? 'Same class, other instance' : 'Same instance', 27);
      b += bracket(xs[0] - 34, xs[1] + 34, 129, 'Class A', MUTED);
      b += bracket(xs[2] - 34, xs[3] + 34, 129, 'Class B', MUTED);
      for (let i = 0; i < 4; ++i) {
        b += line(xs[i], top, xs[i], bottom, LIGHT, 2, 'stroke-dasharray="5 5"');
      }
      // Only positives for anchor u1 are emphasized. The context edges merely
      // join the two views of an instance; they are not negative-pair claims.
      if (panel === 0) b += line(xs[0], top, xs[0], bottom, POSITIVE, 4);
      else {
        b += line(xs[0], top, xs[1], top, POSITIVE, 4);
        b += line(xs[0], top, xs[1], bottom, POSITIVE, 4);
      }
      for (let i = 0; i < 4; ++i) {
        for (let view = 0; view < 2; ++view) {
          const y = view ? bottom : top;
          const isPositive = panel === 0 ? i === 0 : i === 1;
          if (isPositive) b += circle(xs[i], y, 23, '#fff', POSITIVE, 3);
          b += circle(xs[i], y, 14, view ? '#fff' : COLORS[i], COLORS[i], 3);
          if (i === 0 && view === 0) b += circle(xs[i], y, 29, 'none', INK, 2.5);
        }
        b += text(xs[i], top - 34, U_NAMES[i], 27, COLORS[i]);
        b += text(xs[i], bottom + 45, V_NAMES[i], 27, COLORS[i]);
      }
      b += text(cx, 386, panel ? 'Positives: u₂, v₂' : 'Positives: u₁, v₁', 28, POSITIVE);
    }
    b += circle(380, 431, 12, 'none', INK, 2.5);
    b += text(404, 440, 'Anchor u₁', 25, MUTED, 'start');
    b += circle(745, 431, 12, 'none', POSITIVE, 3);
    b += text(769, 440, 'Positive', 25, MUTED, 'start');
    return svg(1425, 458, b,
      'Four instances and two views per instance, shown in each panel. Classes A and B each contain two instances. For anchor u1, self positives are u1 and v1, including the anchor. Supervised positives are u2 and v2, the other instance in the same class.');
  }

  // Fixed orthonormal camera. Each visible point is the projection of the
  // explicit unit vector returned by state(), never a hand-placed 2D point.
  const phi = 28 * Math.PI / 180, theta = 22 * Math.PI / 180;
  const CAMERA = [
    [Math.cos(phi), -Math.sin(phi), 0],
    [Math.sin(phi) * Math.sin(theta), Math.cos(phi) * Math.sin(theta), -Math.cos(theta)],
    [Math.sin(phi) * Math.cos(theta), Math.cos(phi) * Math.cos(theta), Math.sin(theta)]
  ];
  const dot = (a, b) => a.reduce((s, v, k) => s + v * b[k], 0);
  function project(v, cx, cy, radius) {
    return [cx + radius * dot(CAMERA[0], v), cy + radius * dot(CAMERA[1], v), dot(CAMERA[2], v)];
  }

  function sphere(cx, cy, radius) {
    let b = circle(cx, cy, radius, '#fbfcfe', '#bac8dc', 1.8);
    const segments = [[], []];
    for (let plane = 0; plane < 3; ++plane) {
      const points = [];
      for (let k = 0; k <= 144; ++k) {
        const angle = 2 * Math.PI * k / 144, v = [0, 0, 0];
        v[plane] = Math.cos(angle);
        v[(plane + 1) % 3] = Math.sin(angle);
        points.push(project(v, cx, cy, radius));
      }
      for (let k = 0; k < points.length - 1; ++k) {
        const a = points[k], q = points[k + 1], front = (a[2] + q[2]) >= 0;
        // Back arcs use alternate short segments to form unobtrusive dashes.
        if (!front && Math.floor(k / 2) % 2) continue;
        segments[front ? 1 : 0].push(line(a[0], a[1], q[0], q[1], front ? '#c1cede' : '#d9e1ed', front ? 1.3 : 1));
      }
    }
    return b + segments[0].join('') + segments[1].join('');
  }

  function alignedMarker(x, y, color, size = 10) {
    // Outer outline and filled center are the coincident two-view markers.
    return circle(x, y, size + 5, '#fff', color, 2.5)
      + circle(x, y, size, color, color, 0);
  }

  function collapsedMarker(x, y, i, size = 11) {
    const r = size + 5;
    let b = circle(x, y, r, '#fff', 'none', 0);
    // Both instance colors remain visible at the SAME projected location.
    for (let half = 0; half < 2; ++half) {
      const color = COLORS[i + half], sweep = half === 0 ? 0 : 1;
      b += '<path d="M' + f(x) + ',' + f(y - r) + 'A' + r + ',' + r + ' 0 0 ' + sweep
        + ' ' + f(x) + ',' + f(y + r) + '" fill="none" stroke="' + color + '" stroke-width="2.5"/>';
      b += '<path d="M' + f(x) + ',' + f(y - size) + 'A' + size + ',' + size + ' 0 0 ' + sweep
        + ' ' + f(x) + ',' + f(y + size) + 'Z" fill="' + color + '"/>';
    }
    return b;
  }

  function collapsedLabel(x, y, i, size) {
    return '<text x="' + f(x) + '" y="' + f(y) + '" font-size="' + size
      + '" text-anchor="middle" font-weight="500">'
      + '<tspan fill="' + COLORS[i] + '">' + NAMES[i] + '</tspan>'
      + '<tspan fill="' + INK + '"> = </tspan>'
      + '<tspan fill="' + COLORS[i + 1] + '">' + NAMES[i + 1] + '</tspan></text>';
  }

  function geometry(W, cx, cy, radius, options = {}) {
    const s = state(W), points = s.vectors.map(v => project(v, cx, cy, radius));
    const labelSize = options.labelSize || 27;
    let b = sphere(cx, cy, radius);
    if (options.edges && W > 0) {
      for (let i = 0; i < 4; ++i) for (let j = i + 1; j < 4; ++j) {
        const isSame = Math.floor(i / 2) === Math.floor(j / 2);
        b += line(points[i][0], points[i][1], points[j][0], points[j][1],
          isSame ? '#8996a7' : '#bcc8da', isSame ? 2.1 : 1.4, 'opacity="0.55"');
      }
    } else if (W > 0) {
      b += line(points[0][0], points[0][1], points[1][0], points[1][1], '#8996a7', 2.2, 'opacity="0.5"');
      b += line(points[2][0], points[2][1], points[3][0], points[3][1], '#8996a7', 2.2, 'opacity="0.5"');
    }
    if (W === 0) {
      for (const i of [2, 0]) {
        const [x, y] = points[i];
        b += collapsedMarker(x, y, i, 11);
        b += collapsedLabel(x, y + (i === 0 ? 44 : -28), i, labelSize);
      }
    } else {
      const order = [0, 1, 2, 3].sort((i, j) => points[i][2] - points[j][2]);
      for (const i of order) {
        const [x, y] = points[i];
        b += alignedMarker(x, y, COLORS[i], 10);
      }
      for (let i = 0; i < 4; ++i) {
        const [x, y] = points[i];
        const r = Math.hypot(x - cx, y - cy);
        const ox = r > 1 ? 28 * (x - cx) / r : 0;
        const oy = r > 1 ? 28 * (y - cy) / r : -28;
        let labelY = y + oy + 8;
        if (W < 0.12) labelY += i % 2 ? -14 : 14;
        b += text(x + ox, labelY, NAMES[i], labelSize, COLORS[i], 'middle', 500);
      }
    }
    return b;
  }

  function collapseSvg(W = 0.35) {
    if (!(W > 0)) throw new Error('The distinct-instance panel requires W > 0.');
    let b = text(350, 36, 'Distinct instances', 32, INK, 'middle', 600)
      + text(1075, 36, 'Class collapse', 32, INK, 'middle', 600)
      + text(350, 78, 'W > 0', 28, BLUE)
      + text(1075, 78, 'W = 0', 28);
    b += geometry(W, 350, 223, 116);
    b += geometry(0, 1075, 223, 116);
    b += text(350, 401, 'Same class, different vectors', 28);
    b += text(1075, 401, 'Same class, same vector', 28);
    b += text(712.5, 447, 'Aligned views: uᵢ = vᵢ', 25, MUTED);
    return svg(1425, 464, b,
      'Four instances on the unit sphere. With positive within-class variance there are four distinct instance vectors. At class collapse, the two instances in each class occupy the same point, leaving two antipodal occupied points. Matching views remain aligned in both panels.');
  }

  function ssemSvg() {
    let b = '';
    for (const p of [
      { x: 237, W: 0, title: 'Class simplex', label: 'W = 0' },
      { x: 712, W: 0.35, title: 'Class + instance', label: 'W = 0.35' },
      { x: 1187, W: W_MAX, title: 'Instance simplex', label: 'W = 2/3' }
    ]) {
      b += text(p.x, 34, p.title, 29, INK, 'middle', 600);
      b += geometry(p.W, p.x, 179, 98, { edges: true, labelSize: 26 });
      b += text(p.x, 343, p.label, 28);
    }
    return svg(1425, 365, b,
      'Exact four-instance SSEM family on the unit sphere: two antipodal class points at W=0, class and instance structure at W=0.35, and a regular tetrahedron with all pairwise similarities minus one third at W=2/3.');
  }

  function geometrySvg(W = 0.35, options = {}) {
    const width = options.width || 430, height = options.height || 365;
    let b = geometry(W, width / 2, height / 2 - 5, Math.min(width * 0.26, height * 0.28),
      { edges: !!options.edges, labelSize: options.labelSize || 27 });
    if (options.caption === true) b += text(width / 2, height - 15, 'uᵢ = vᵢ', 25, MUTED);
    return svg(width, height, b, 'Four exact unit instance vectors, with within-class variance ' + W.toFixed(3) + '.');
  }

  function cellColor(value) {
    const target = value >= 0 ? [36, 91, 215] : [197, 106, 62];
    const amount = 0.07 + 0.25 * Math.abs(value);
    return '#' + target.map(c => Math.round(255 + amount * (c - 255)).toString(16).padStart(2, '0')).join('');
  }
  function matrixSvg(W = 0.35, options = {}) {
    const s = state(W), cell = 72, left = 91, top = 85;
    let b = options.title === false ? '' : text(215, 31, 'Instance similarities', 27, INK, 'middle', 600);
    for (let i = 0; i < 4; ++i) {
      b += text(left + cell * (i + 0.5), top - 17, V_NAMES[i], 26, COLORS[i]);
      b += text(left - 20, top + cell * (i + 0.5) + 9, NAMES[i], 26, COLORS[i], 'end');
      for (let j = 0; j < 4; ++j) {
        const value = s.gram[i][j];
        let label = Math.abs(value) < 5e-4 ? '0' : value === 1 ? '1' : value === -1 ? '−1' : value.toFixed(2).replace('-', '−');
        b += '<rect x="' + (left + j * cell) + '" y="' + (top + i * cell)
          + '" width="' + cell + '" height="' + cell + '" fill="' + cellColor(value)
          + '" stroke="#fff" stroke-width="3"/>';
        b += text(left + cell * (j + 0.5), top + cell * (i + 0.5) + 8, label, 24);
      }
    }
    return svg(430, 390, b,
      'Four by four cross-view similarity matrix: row u_i and column v_j. Matching views are aligned, so this is also the instance Gram matrix. The loss denominator separately contains all eight views.');
  }

  function heatmapSvg(alpha = 0.7, tau = 0.5) {
    if (!global.ClassTheory) throw new Error('Load class_visuals.js before using ClassV8.heatmapSvg.');
    return global.ClassTheory.heatmapSvg(2, 2, alpha, tau)
      .replace('font-family="Helvetica"', 'font-family="Deck,Arial,sans-serif"')
      .replace('>0.67</text>', '>2/3</text>');
  }

  global.ClassV8 = { positiveRulesSvg, collapseSvg, ssemSvg, geometrySvg, matrixSvg,
    state, optimum, boundary, heatmapSvg };
})(window);

