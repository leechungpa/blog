
/* N=4 constructions for full-batch versus fixed mini-batch InfoNCE.
 * All displayed pairs satisfy u_i = v_i. The statistics use the population
 * of 4 positive / 12 ordered negative cross-view pairs, including entries
 * that the fixed mini-batch loss does not compare. An N/A cell is never zero.
 *
 * API:
 *   BatchV13.state('mini', thetaDegrees)    // 0 <= theta <= 90
 *   BatchV13.state('path', t)               // 0 <= t <= 1
 *   BatchV13.state('full')                  // regular tetrahedron
 *   BatchV13.geometrySvg(mode, value)      // 600 x 460
 *   BatchV13.matrixSvg(mode, value, view)  // 400 x 440; view='batch'|'all'
 *   BatchV13.distributionSvg(mode, value)  // 430 x 440; all 12 negatives
 * SVG methods also accept a previously computed state as their first arg.
 * For a state object, matrixSvg(state, 'all') selects the matrix view.
 *
 * The path is an analytic interpolation, not a trajectory of training and
 * not a family of fixed-mini-batch optima: only t=0 is a mini-batch optimum.
 */
(function (global) {
  'use strict';
  const INK = '#172334', MUTED = '#5e6b7d';
  const COLORS = ['#245bd7', '#c56a3e', '#197f75', '#8662c4'];
  const FONT = 'Deck,Arial,sans-serif';
  const SUB = ['₁', '₂', '₃', '₄'];
  const SIZES = Object.freeze({ geometry: [600, 460], matrix: [400, 440], distribution: [430, 440] });
  const dot = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0);
  const clean = x => Math.abs(x) < 1e-12 ? 0 : Math.abs(x - 1) < 1e-12 ? 1 : Math.abs(x + 1) < 1e-12 ? -1 : x;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, Number(x)));
  const txt = (x, y, text, size = 24, color = INK, anchor = 'middle', attrs = '') =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" ${attrs}>${text}</text>`;
  const format = (x, places = 2) => {
    const magnitude = Math.round((Math.abs(x) + 1e-12) * 10 ** places) / 10 ** places;
    return `${x < 0 && magnitude > 0 ? '−' : ''}${magnitude.toFixed(places)}`;
  };
  const svg = (size, description, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size[0]} ${size[1]}" role="img" aria-label="${description}" style="font-family:${FONT}"><title>${description}</title>${body}</svg>`;
  const stats = values => {
    const mean = clean(values.reduce((a, b) => a + b, 0) / values.length);
    const variance = clean(values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / values.length);
    return { values: values.slice(), count: values.length, mean, variance, var: variance };
  };

  function state(mode = 'mini', value) {
    if (mode && typeof mode === 'object' && Array.isArray(mode.matrix)) return mode;
    const aliases = { rotation: 'mini', fixed: 'mini', bridge: 'path', transition: 'path' };
    mode = aliases[mode] || mode;
    if (!['mini', 'path', 'full'].includes(mode)) throw new RangeError('BatchV13 mode must be mini, path, or full.');
    if (value !== undefined && !Number.isFinite(Number(value))) throw new TypeError('BatchV13 parameter must be finite.');
    let coords, parameter;
    if (mode === 'mini') {
      parameter = clamp(value === undefined ? 90 : value, 0, 90);
      const c = clean(Math.cos(parameter * Math.PI / 180));
      const s = clean(Math.sin(parameter * Math.PI / 180));
      coords = [[1, 0, 0], [-1, 0, 0], [c, s, 0], [-c, -s, 0]];
    } else {
      parameter = mode === 'full' ? 1 : clamp(value === undefined ? 0 : value, 0, 1);
      const h = Math.sqrt(parameter / 3), a = Math.sqrt(1 - parameter / 3);
      coords = [[a, 0, h], [-a, 0, h], [0, a, -h], [0, -a, -h]];
    }
    coords = coords.map(v => v.map(clean));
    const matrix = coords.map(u => coords.map(v => clean(dot(u, v))));
    const fixedMask = matrix.map((row, i) => row.map((_, j) => Math.floor(i / 2) === Math.floor(j / 2)));
    const positivePairs = [], negativePairs = [], fixedNegativePairs = [];
    matrix.forEach((row, i) => row.forEach((similarity, j) => {
      const pair = { i: i + 1, j: j + 1, similarity, value: similarity, comparedInFixedBatches: fixedMask[i][j] };
      if (i === j) positivePairs.push(pair);
      else {
        negativePairs.push(pair);
        if (fixedMask[i][j]) fixedNegativePairs.push(pair);
      }
    }));
    const positive = stats(positivePairs.map(p => p.value));
    const negative = stats(negativePairs.map(p => p.value));
    const fixedNegative = stats(fixedNegativePairs.map(p => p.value));
    const fixedBatch = { positive, negative: fixedNegative, positivePairs, negativePairs: fixedNegativePairs, mask: fixedMask };
    const allPairs = { positive, negative, positivePairs, negativePairs };
    return {
      mode, value: parameter, parameter,
      thetaDegrees: mode === 'mini' ? parameter : null,
      t: mode === 'mini' ? null : parameter,
      coords, u: coords.map(v => v.slice()), v: coords.map(v => v.slice()), matrix,
      positive, negative, positivePairs, negativePairs,
      fixedMask, comparisonMask: mode === 'mini' ? fixedMask : matrix.map(row => row.map(() => true)),
      fixedBatch, allPairs, observed: mode === 'mini' ? fixedBatch : allPairs,
      positiveMean: positive.mean, positiveVariance: positive.variance,
      negativeMean: negative.mean, negativeVariance: negative.variance,
      posMean: positive.mean, posVar: positive.variance,
      negMean: negative.mean, negVar: negative.variance,
      mean: negative.mean, variance: negative.variance, var: negative.variance,
      isFixedMiniBatchOptimum: mode === 'mini' || parameter === 0,
      isFullBatchOptimum: mode !== 'mini' && parameter === 1,
      fixedMiniBatchVarianceBounds: [2 / 9, 8 / 9],
      occupiedPositions: coords.filter((v, i) => !coords.slice(0, i).some(w => v.every((x, k) => Math.abs(x - w[k]) < 1e-10))).length
    };
  }

  // Two orthonormal projection rows: a genuine fixed orthographic projection.
  const project = ([x, y, z]) => [300 + 160 * (0.8 * x + 0.6 * y), 220 - 160 * (-0.36 * x + 0.48 * y + 0.8 * z)];
  function greatCircle(axis) {
    const points = Array.from({ length: 121 }, (_, k) => {
      const t = 2 * Math.PI * k / 120;
      const p = axis === 'xy' ? [Math.cos(t), Math.sin(t), 0] : axis === 'xz' ? [Math.cos(t), 0, Math.sin(t)] : [0, Math.cos(t), Math.sin(t)];
      return project(p).map(n => n.toFixed(2)).join(',');
    });
    return `<polyline points="${points.join(' ')}" fill="none" stroke="#e2e7ed" stroke-width="1.3"/>`;
  }
  function arc(cx, cy, radius, start, end) {
    const sx = cx + radius * Math.cos(start), sy = cy + radius * Math.sin(start);
    const ex = cx + radius * Math.cos(end), ey = cy + radius * Math.sin(end);
    return `M${sx},${sy} A${radius},${radius} 0 ${end - start > Math.PI ? 1 : 0} 1 ${ex},${ey}`;
  }

  function geometrySvg(mode, value) {
    const s = state(mode, value), points = s.coords.map(project);
    let body = `<circle cx="300" cy="220" r="160" fill="#fff" stroke="#d2dae4" stroke-width="1.5"/>`;
    body += greatCircle('xy') + greatCircle('xz') + greatCircle('yz');
    const edges = s.mode === 'mini' ? [[0, 1], [2, 3]] : [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
    edges.forEach(([i, j]) => {
      body += `<line x1="${points[i][0]}" y1="${points[i][1]}" x2="${points[j][0]}" y2="${points[j][1]}" stroke="#c5ceda" stroke-width="1.5"${s.mode === 'mini' ? ' stroke-dasharray="6 5"' : ''}/>`;
    });
    points.forEach((p, i) => { body += `<line x1="300" y1="220" x2="${p[0]}" y2="${p[1]}" stroke="${COLORS[i]}" stroke-opacity="0.68" stroke-width="2.4"/>`; });
    body += '<circle cx="300" cy="220" r="3.4" fill="#8692a2"/>';

    // Coincident endpoints retain all instance colors; no point is displaced.
    const groups = [];
    points.forEach((p, i) => {
      const existing = groups.find(g => Math.hypot(g.x - p[0], g.y - p[1]) < 1e-8);
      if (existing) existing.ids.push(i);
      else groups.push({ x: p[0], y: p[1], ids: [i] });
    });
    groups.forEach(g => {
      body += `<circle cx="${g.x}" cy="${g.y}" r="12.5" fill="white"/>`;
      if (g.ids.length === 1) {
        const color = COLORS[g.ids[0]];
        body += `<circle cx="${g.x}" cy="${g.y}" r="11" fill="white" stroke="${color}" stroke-width="2.7"/><circle cx="${g.x}" cy="${g.y}" r="5.7" fill="${color}"/>`;
      } else {
        g.ids.forEach((i, part) => {
          const start = -Math.PI / 2 + part * 2 * Math.PI / g.ids.length;
          const end = -Math.PI / 2 + (part + 1) * 2 * Math.PI / g.ids.length;
          body += `<path d="${arc(g.x, g.y, 11, start, end)}" fill="none" stroke="${COLORS[i]}" stroke-width="2.7"/>`;
          const sx = g.x + 5.7 * Math.cos(start), sy = g.y + 5.7 * Math.sin(start);
          const ex = g.x + 5.7 * Math.cos(end), ey = g.y + 5.7 * Math.sin(end);
          body += `<path d="M${g.x},${g.y} L${sx},${sy} A5.7,5.7 0 0 1 ${ex},${ey} Z" fill="${COLORS[i]}"/>`;
        });
      }
    });

    // Use stable left/right label columns and spread close baselines, keeping
    // geometry exact while avoiding label collisions at coincident endpoints.
    for (const ids of [[0, 2], [1, 3]]) {
      const right = ids[0] === 0;
      const labelX = right ? Math.max(...ids.map(i => points[i][0])) + 23 : Math.min(...ids.map(i => points[i][0])) - 23;
      const order = ids.slice().sort((i, j) => points[i][1] - points[j][1] || i - j);
      let ys = order.map(i => points[i][1] + 8);
      if (ys[1] - ys[0] < 43) {
        const middle = (ys[0] + ys[1]) / 2;
        ys = [middle - 22, middle + 22];
      }
      order.forEach((i, k) => {
        const p = points[i], endX = labelX + (right ? -6 : 6), endY = ys[k] - 8;
        body += `<line x1="${p[0] + (right ? 13 : -13)}" y1="${p[1]}" x2="${endX}" y2="${endY}" stroke="${COLORS[i]}" stroke-opacity="0.65" stroke-width="1.2"/>`;
        body += txt(labelX, ys[k], `u${SUB[i]} = v${SUB[i]}`, 25, COLORS[i], right ? 'start' : 'end', `data-instance="${i + 1}"`);
      });
    }
    return svg(SIZES.geometry, 'Four unit-vector pairs; each filled point and hollow ring share the same position', body);
  }

  function matrixSvg(mode, value, view) {
    let s;
    if (mode && typeof mode === 'object') { s = state(mode); view = typeof value === 'string' ? value : view; }
    else s = state(mode, value);
    const masked = s.mode === 'mini' && view !== 'all';
    const X = 86, Y = 100, CELL = 70;
    let body = txt(228, 32, masked ? 'Batch comparisons' : 'All pairs', 26, INK, 'middle', 'font-weight="600"');
    for (let i = 0; i < 4; i++) {
      body += txt(X + (i + 0.5) * CELL, 82, `v${SUB[i]}`, 27, COLORS[i]);
      body += txt(X - 22, Y + (i + 0.5) * CELL + 9, `u${SUB[i]}`, 27, COLORS[i], 'end');
      for (let j = 0; j < 4; j++) {
        const compared = !masked || s.fixedMask[i][j];
        const fill = !compared ? '#f2f4f7' : i === j ? '#eef3fc' : '#fff';
        const label = compared ? format(s.matrix[i][j]) : 'N/A';
        body += `<g data-i="${i + 1}" data-j="${j + 1}" data-value="${s.matrix[i][j]}" data-compared="${compared}" data-fixed-compared="${s.fixedMask[i][j]}">`;
        body += `<title>u${i + 1} with v${j + 1}: ${compared ? label : 'not compared in the fixed mini-batches'}</title>`;
        body += `<rect x="${X + j * CELL}" y="${Y + i * CELL}" width="${CELL}" height="${CELL}" fill="${fill}" stroke="#dfe5ec" stroke-width="1"/>`;
        body += txt(X + (j + 0.5) * CELL, Y + (i + 0.5) * CELL + 9, label, 25, compared ? INK : '#8691a0', 'middle', 'font-variant-numeric="tabular-nums"');
        body += '</g>';
      }
    }
    if (masked) {
      for (let b = 0; b < 2; b++) body += `<rect x="${X + b * 2 * CELL}" y="${Y + b * 2 * CELL}" width="${2 * CELL}" height="${2 * CELL}" fill="none" stroke="#7c899b" stroke-width="2.4"/>`;
    }
    return svg(SIZES.matrix, masked ? 'Similarity matrix with unobserved cross-batch comparisons marked N/A' : 'All sixteen similarities computed from the displayed unit vectors', body);
  }

  function distributionSvg(mode, value) {
    const s = state(mode, value), X0 = 49, X1 = 399, BASE = 330;
    const xOf = x => X0 + (x + 1) * (X1 - X0) / 2;
    const meanX = xOf(s.negative.mean);
    let body = txt(224, 32, 'All 12 negative pairs', 25, INK, 'middle', 'font-weight="600"');
    body += txt(224, 74, 'Mean = −1/3', 24, MUTED);
    body += `<line x1="${meanX}" y1="94" x2="${meanX}" y2="${BASE + 4}" stroke="#5e6b7d" stroke-width="1.6" stroke-dasharray="5 5"/>`;
    body += `<line x1="${X0}" y1="${BASE}" x2="${X1}" y2="${BASE}" stroke="#8794a5" stroke-width="1.5"/>`;
    [-1, -0.5, 0, 0.5, 1].forEach(value => {
      const x = xOf(value);
      body += `<line x1="${x}" y1="${BASE}" x2="${x}" y2="${BASE + 7}" stroke="#8794a5" stroke-width="1.4"/>`;
      body += txt(x, BASE + 37, value === 0 ? '0' : value === -1 ? '−1' : value === 1 ? '1' : value < 0 ? '−.5' : '.5', 24, MUTED);
    });
    // Every dot is one ordered pair. Nearby values may share vertical levels,
    // but their horizontal positions are never binned or rounded.
    const levels = [];
    s.negativePairs.slice().sort((a, b) => a.value - b.value || a.i - b.i || a.j - b.j).forEach(pair => {
      const x = xOf(pair.value);
      let level = 0;
      while (levels[level] && levels[level].some(previousX => Math.abs(previousX - x) < 17)) level++;
      if (!levels[level]) levels[level] = [];
      levels[level].push(x);
      const y = BASE - 13 - 17.4 * level;
      body += `<circle cx="${x}" cy="${y}" r="6.7" fill="#586d8a" data-i="${pair.i}" data-j="${pair.j}" data-value="${pair.value}"><title>u${pair.i} with v${pair.j}: ${format(pair.value, 4)}</title></circle>`;
    });
    body += txt(224, 417, 'Negative-pair similarity', 24, MUTED);
    return svg(SIZES.distribution, `All twelve ordered negative pairs; mean minus one third; population variance ${format(s.negative.variance, 4)}`, body);
  }

  global.BatchV13 = Object.freeze({ state, geometrySvg, matrixSvg, distributionSvg, sizes: SIZES, colors: COLORS.slice(), format });
})(typeof window !== 'undefined' ? window : globalThis);

/* v11 narrative: comparison coverage -> geometric freedom -> similarities.
 * This module is standalone and retains the v8 construction APIs above.
 *
 * New APIs:
 *   stageState(progress)                       // 0..2, continuous in coordinates
 *   storySvg(progress, {reveal:false})          // 1425 x 480, geometry + matrix
 *   distributionComparisonSvg(thetaDegrees)    // 920 x 440, all 12 negatives
 *   varianceBounds(n,m), batchSizes(n)
 *   varianceFloorSvg(n=4, activeM=2)            // 460 x 420
 *
 * The second stage is an analytic path, not a trajectory of training or a
 * family of fixed-mini-batch optima. Only its first point is a mini optimum;
 * only its last point is a full-batch optimum.
 */
(function (global) {
  'use strict';
  const Base = global.BatchV13;
  const INK = '#172334', MUTED = '#5e6b7d', BLUE = '#245bd7';
  const FONT = 'Deck,Arial,sans-serif';
  const SUB = ['₁', '₂', '₃', '₄'];
  const txt = (x,y,label,size=25,color=INK,anchor='middle',attrs='') =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" ${attrs}>${label}</text>`;
  const wrap = (w,h,title,body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}" style="font-family:${FONT}"><title>${title}</title>${body}</svg>`;
  const inner = content => content.slice(content.indexOf('>') + 1, content.lastIndexOf('</svg>'));
  const near = (a,b) => Math.abs(a-b)<1e-10;
  const valueText = x => near(x,0) ? '0' : near(x,1) ? '1' : near(x,-1) ? '−1' : near(x,-1/3) ? '−1/3' : Base.format(x,2);

  function stageState(progress=0) {
    if (!Number.isFinite(Number(progress))) throw new TypeError('Progress must be finite.');
    const p = Math.max(0,Math.min(2,Number(progress)));
    const s = p <= 1 ? Base.state('mini',p*90) : Base.state('path',p-1);
    return {...s, progress:p, stage:p<=1 ? 1 : 2,
      stageTitle: p<1 ? 'Relative rotation of mini-batches' : p===1 ? 'Orthogonal mini-batches' : p<2 ? 'Deformation to a regular simplex' : 'Tetrahedron (simplex ETF for n = 4)',
      optimumLabel: p<=1 ? 'Mini-batch optimum' : p<2 ? 'Toward the full-batch optimum' : 'Full-batch optimum',
      comparedNegative:s.matrix[0][1],
      crossBatchValues:s.negativePairs.filter(pair=>!pair.comparedInFixedBatches).map(pair=>pair.value)
    };
  }

  function storyMatrix(s,reveal) {
    const masked = s.progress<=1 && !reveal;
    const X=138,Y=74,CELL=79;
    let body=txt(296,29,masked ? 'Within each batch' : 'All pairs',28,INK,'middle','font-weight="600"');
    for(let i=0;i<4;i++) {
      body+=txt(X+(i+.5)*CELL,60,`v${SUB[i]}`,27,Base.colors[i]);
      body+=txt(X-23,Y+(i+.5)*CELL+9,`u${SUB[i]}`,27,Base.colors[i],'end');
      for(let j=0;j<4;j++) {
        const compared=!masked || s.fixedMask[i][j];
        const fill=!compared ? '#f1f3f6' : i===j ? '#eaf0fc' : s.fixedMask[i][j] ? '#fbf1e9' : '#ffffff';
        const label=compared ? valueText(s.matrix[i][j]) : 'N/A';
        body+=`<g data-i="${i+1}" data-j="${j+1}" data-value="${s.matrix[i][j]}" data-compared="${compared}" data-fixed-compared="${s.fixedMask[i][j]}">`;
        body+=`<rect x="${X+j*CELL}" y="${Y+i*CELL}" width="${CELL}" height="${CELL}" fill="${fill}" stroke="#d9e0e9" stroke-width="1"/>`;
        body+=txt(X+(j+.5)*CELL,Y+(i+.5)*CELL+9,label,label.length>=5?23.5:26,compared?INK:'#8a95a3','middle','font-variant-numeric="tabular-nums"');
        body+='</g>';
      }
    }
    for(let b=0;b<2;b++) body+=`<rect x="${X+2*b*CELL}" y="${Y+2*b*CELL}" width="${2*CELL}" height="${2*CELL}" fill="none" stroke="#77869a" stroke-width="2.4"/>`;
    if(s.progress<=1) body+=txt(296,431,'Each block stays at 1 and −1',24,MUTED);
    else body+=txt(296,431,near(s.progress,2)?'All negative pairs: −1/3':'Within-block negatives: −1 → −1/3',24,MUTED);
    return body;
  }

  function storySvg(progress=0, options={}) {
    const s=stageState(progress),reveal=!!options.reveal;
    let body=`<svg x="6" y="2" width="676" height="458" viewBox="0 0 600 460">${inner(Base.geometrySvg(s))}</svg>`;
    body+='<line x1="710" y1="20" x2="710" y2="448" stroke="#dce3ec" stroke-width="1.5"/>';
    body+=`<g transform="translate(760 0)">${storyMatrix(s,reveal)}</g>`;
    body+=txt(340,463,s.optimumLabel,25, s.progress>1&&s.progress<2?MUTED:BLUE,'middle','font-weight="600"');
    return wrap(1425,480,'Two stages: free rotation of the fixed batches, then a path to the full-batch tetrahedron',body);
  }

  function comparisonPanel(s,xOffset,title) {
    const X0=48,X1=396,BASE=285,meanX=X0+(s.negative.mean+1)*(X1-X0)/2;
    const xOf=value=>X0+(value+1)*(X1-X0)/2;
    let body=txt(222,30,title,27,INK,'middle','font-weight="600"');
    body+=txt(222,68,'Mean = −1/3',25,MUTED);
    body+=`<line x1="${meanX}" y1="91" x2="${meanX}" y2="${BASE+3}" stroke="#7c899b" stroke-width="1.5" stroke-dasharray="5 5"/>`;
    const levels=[];
    s.negativePairs.slice().sort((a,b)=>a.value-b.value||a.i-b.i||a.j-b.j).forEach(pair=>{
      const x=xOf(pair.value);let level=0;
      while(levels[level]&&levels[level].some(oldX=>Math.abs(oldX-x)<16))level++;
      if(!levels[level])levels[level]=[];
      levels[level].push(x);
      const y=BASE-12-level*14.7;
      body+=`<line x1="${meanX}" y1="${y}" x2="${x}" y2="${y}" stroke="#9eb0c8" stroke-width="2.2" opacity=".65" data-residual="${pair.value-s.negative.mean}"/>`;
      body+=`<circle cx="${x}" cy="${y}" r="6.1" fill="#526b8e" data-i="${pair.i}" data-j="${pair.j}" data-value="${pair.value}"><title>u${pair.i} with v${pair.j}: ${Base.format(pair.value,4)}</title></circle>`;
    });
    body+=`<line x1="${X0}" y1="${BASE}" x2="${X1}" y2="${BASE}" stroke="#8996a6" stroke-width="1.5"/>`;
    [-1,-.5,0,.5,1].forEach(value=>{
      const x=xOf(value);body+=`<line x1="${x}" y1="${BASE}" x2="${x}" y2="${BASE+7}" stroke="#8996a6" stroke-width="1.4"/>`;
      body+=txt(x,BASE+37,value===-1?'−1':value===1?'1':value===0?'0':value<0?'−.5':'.5',23,MUTED);
    });
    body+=txt(222,361,'Negative similarity',23,MUTED);
    body+=txt(222,413,`Variance = ${near(s.negative.variance,0)?'0':Base.format(s.negative.variance,3)}`,29,INK,'middle','font-weight="600"');
    return `<g transform="translate(${xOffset} 0)">${body}</g>`;
  }

  function distributionComparisonSvg(thetaDegrees=90) {
    const full=Base.state('full'),mini=Base.state('mini',thetaDegrees);
    return wrap(920,440,'All twelve negative pairs: the full and mini-batch optima have the same mean and different variance',
      comparisonPanel(full,0,'Full batch')+
      '<line x1="458" y1="10" x2="458" y2="424" stroke="#dce3ec" stroke-width="1.4"/>'+
      comparisonPanel(mini,478,'Fixed mini-batches'));
  }

  function batchSizes(n=4) {
    n=Number(n);
    if(!Number.isInteger(n)||n<2)throw new RangeError('n must be an integer at least 2.');
    return Array.from({length:n-1},(_,i)=>i+2).filter(m=>n%m===0);
  }
  function varianceBounds(n=4,m=2) {
    n=Number(n);m=Number(m);
    if(!batchSizes(n).includes(m))throw new RangeError('m must divide n, with 2 ≤ m ≤ n.');
    const lower=(n-m)/((m-1)*(n-1)**2);
    return {n,m,mean:-1/(n-1),lower,upper:n*lower,
      lowerAttainableDimension:(n/m)*(m-1)};
  }
  function varianceFloorSvg(n=4,activeM=2) {
    n=Number(n);const ms=batchSizes(n);
    activeM=ms.includes(Number(activeM))?Number(activeM):ms[0];
    const points=ms.map(m=>varianceBounds(n,m));
    const max=Math.max(...points.map(p=>p.lower));
    const YMAX=max>0?Math.ceil(max*10)/10:.1;
    const X0=61,X1=433,TOP=101,BASE=317;
    const gap=(X1-X0)/ms.length,barWidth=Math.min(71,gap*.56);
    const yOf=value=>BASE-(BASE-TOP)*value/YMAX;
    let body=txt(246,31,'Variance lower bound',26,INK,'middle','font-weight="600"');
    body+=txt(246,67,`n = ${n}`,25,MUTED);
    [0,YMAX/2,YMAX].forEach(value=>{
      const y=yOf(value);
      body+=`<line x1="${X0}" y1="${y}" x2="${X1}" y2="${y}" stroke="#e2e7ef" stroke-width="1.1"/>`;
      body+=txt(X0-12,y+7,value===0?'0':Base.format(value,2),20,MUTED,'end');
    });
    points.forEach((point,index)=>{
      const x=X0+(index+.5)*gap,top=yOf(point.lower),active=point.m===activeM;
      body+=`<rect x="${x-barWidth/2}" y="${top}" width="${barWidth}" height="${Math.max(2,BASE-top)}" rx="3" fill="${active?BLUE:'#becbde'}" data-batch-size="${point.m}" data-lower-bound="${point.lower}"/>`;
      body+=txt(x,Math.max(91,top-12),point.lower===0?'0':Base.format(point.lower,3),21,active?BLUE:MUTED);
      body+=txt(x,BASE+33,String(point.m),26,active?BLUE:INK,'middle',active?'font-weight="600"':'');
    });
    body+=txt(246,390,'Batch size m',25,MUTED);
    return wrap(460,420,'A smaller fixed batch size gives a larger lower bound on negative-similarity variance',body);
  }

  global.BatchV13=Object.freeze({...Base,stageState,storySvg,distributionComparisonSvg,varianceBounds,batchSizes,varianceFloorSvg,
    sizes:Object.freeze({...Base.sizes,story:[1425,480],distributionComparison:[920,440],varianceFloor:[460,420]})});
})(typeof window !== 'undefined' ? window : globalThis);

