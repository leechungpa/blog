
/* Responsive blog figure: fixed-batch coverage, geometry, and similarities.
 * Load after build/batch_v13.js. No DOM mutation or listeners are installed.
 *
 * BlogBatchV17.state(progress)
 * BlogBatchV17.renderGeometry(progress)        // SVG, 400 x 310
 * BlogBatchV17.renderMatrix(progress,reveal)   // SVG, 400 x 350; reveal=true
 * BlogBatchV17.renderMoments(progress)         // responsive HTML + small SVG
 *
 * The progress parameter uses the exact existing construction:
 * 0..1 rotates two antipodal batches; 1..2 deforms orthogonal axes to a
 * tetrahedron. Moments use all 4 positive / 12 ordered negative pairs.
 */
(function (global) {
  'use strict';
  const Base=global.BatchV13;
  if(!Base)throw new Error('BlogBatchV17 requires BatchV13.');
  const INK='#172334',MUTED='#5e6b7d',LINE='#dce3ec',COLORS=Base.colors;
  const SUB=['₁','₂','₃','₄'];
  const near=(a,b)=>Math.abs(a-b)<1e-10;
  const text=(x,y,label,size=24,fill=INK,anchor='middle',attrs='')=>`<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" ${attrs}>${label}</text>`;
  const svg=(w,h,title,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" class="bb17-svg" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>`;
  const metric=x=>near(x,0)?'0':near(x,1)?'1':near(x,-1/3)?'−1/3':Base.format(x,3);
  const cellValue=x=>near(x,0)?'0':near(x,1)?'1':near(x,-1)?'−1':near(x,-1/3)?'−1/3':Base.format(x,2).replace('−0.','−.').replace(/^0\./,'.');

  function state(progress=0){
    const s=Base.stageState(progress);
    return {...s,statisticsScope:'all_pairs',positiveCount:4,negativeCount:12,
      fixedOptimum:s.isFixedMiniBatchOptimum,fullOptimum:s.isFullBatchOptimum,
      canMask:s.progress<=1,
      fixedStatus:s.isFixedMiniBatchOptimum?'Yes':'No',
      fullStatus:s.isFullBatchOptimum?'Yes':'No'};
  }

  // The same two orthonormal projection rows used in the presentation.
  const project=([x,y,z])=>[200+105*(.8*x+.6*y),158-105*(-.36*x+.48*y+.8*z)];
  function greatCircle(axis){
    const points=Array.from({length:97},(_,k)=>{
      const t=2*Math.PI*k/96;
      const v=axis==='xy'?[Math.cos(t),Math.sin(t),0]:axis==='xz'?[Math.cos(t),0,Math.sin(t)]:[0,Math.cos(t),Math.sin(t)];
      return project(v).map(x=>x.toFixed(2)).join(',');
    });
    return `<polyline points="${points.join(' ')}" fill="none" stroke="#e2e7ed" stroke-width="1.1"/>`;
  }
  function marker(g){
    let body=`<circle cx="${g.x}" cy="${g.y}" r="9.2" fill="white"/>`;
    if(g.ids.length===1){
      const color=COLORS[g.ids[0]];
      return body+`<circle cx="${g.x}" cy="${g.y}" r="8" fill="white" stroke="${color}" stroke-width="2.5"/><circle cx="${g.x}" cy="${g.y}" r="4.1" fill="${color}"/>`;
    }
    g.ids.forEach((i,k)=>{
      const start=-Math.PI/2+k*2*Math.PI/g.ids.length,end=-Math.PI/2+(k+1)*2*Math.PI/g.ids.length;
      const sx=g.x+8*Math.cos(start),sy=g.y+8*Math.sin(start),ex=g.x+8*Math.cos(end),ey=g.y+8*Math.sin(end);
      body+=`<path d="M${sx},${sy} A8,8 0 ${end-start>Math.PI?1:0} 1 ${ex},${ey}" fill="none" stroke="${COLORS[i]}" stroke-width="2.5"/>`;
      const sx2=g.x+4.1*Math.cos(start),sy2=g.y+4.1*Math.sin(start),ex2=g.x+4.1*Math.cos(end),ey2=g.y+4.1*Math.sin(end);
      body+=`<path d="M${g.x},${g.y} L${sx2},${sy2} A4.1,4.1 0 0 1 ${ex2},${ey2} Z" fill="${COLORS[i]}"/>`;
    });
    return body;
  }
  function renderGeometry(progress=0){
    const s=state(progress),points=s.coords.map(project);
    let body=text(200,27,'uᵢ = vᵢ',24,MUTED);
    body+='<circle cx="200" cy="158" r="105" fill="#fff" stroke="#d2dae4" stroke-width="1.4"/>';
    body+=greatCircle('xy')+greatCircle('xz')+greatCircle('yz');
    const edges=s.progress<=1?[[0,1],[2,3]]:[[0,1],[0,2],[0,3],[1,2],[1,3],[2,3]];
    for(const [i,j] of edges)body+=`<line x1="${points[i][0]}" y1="${points[i][1]}" x2="${points[j][0]}" y2="${points[j][1]}" stroke="#c5ceda" stroke-width="1.4"${s.progress<=1?' stroke-dasharray="5 4"':''}/>`;
    points.forEach((p,i)=>body+=`<line x1="200" y1="158" x2="${p[0]}" y2="${p[1]}" stroke="${COLORS[i]}" stroke-width="2" stroke-opacity=".7"/>`);
    body+='<circle cx="200" cy="158" r="2.7" fill="#8692a2"/>';
    const groups=[];
    points.forEach((p,i)=>{
      const g=groups.find(g=>Math.hypot(g.x-p[0],g.y-p[1])<1e-8);
      if(g)g.ids.push(i);else groups.push({x:p[0],y:p[1],ids:[i]});
    });
    groups.forEach(g=>body+=marker(g));
    for(const ids of [[0,2],[1,3]]){
      const right=ids[0]===0;
      const x=right?Math.max(...ids.map(i=>points[i][0]))+19:Math.min(...ids.map(i=>points[i][0]))-19;
      const order=ids.slice().sort((i,j)=>points[i][1]-points[j][1]||i-j);
      let ys=order.map(i=>points[i][1]+8);
      if(ys[1]-ys[0]<33){const center=(ys[0]+ys[1])/2;ys=[center-16.5,center+16.5];}
      order.forEach((i,k)=>{
        body+=`<line x1="${points[i][0]+(right?9:-9)}" y1="${points[i][1]}" x2="${x+(right?-5:5)}" y2="${ys[k]-8}" stroke="${COLORS[i]}" stroke-width="1" stroke-opacity=".65"/>`;
        body+=text(x,ys[k],`u${SUB[i]}`,25,COLORS[i],right?'start':'end',`data-instance="${i+1}"`);
      });
    }
    return svg(400,310,'Four aligned embedding pairs on the unit sphere',body);
  }

  function renderMatrix(progress=0,reveal=true){
    const s=state(progress),masked=s.canMask&&!reveal;
    const X=88,Y=55,CELL=70;
    let body='';
    for(let i=0;i<4;i++){
      body+=text(X+(i+.5)*CELL,38,`v${SUB[i]}`,25,COLORS[i]);
      body+=text(X-20,Y+(i+.5)*CELL+8,`u${SUB[i]}`,25,COLORS[i],'end');
      for(let j=0;j<4;j++){
        const compared=!masked||s.fixedMask[i][j];
        const fill=!compared?'#f1f3f6':i===j?'#eaf0fc':s.fixedMask[i][j]?'#fbf1e9':'#fff';
        body+=`<g data-i="${i+1}" data-j="${j+1}" data-value="${s.matrix[i][j]}" data-compared="${compared}" data-used-in-fixed-loss="${s.fixedMask[i][j]}">`;
        body+=`<rect x="${X+j*CELL}" y="${Y+i*CELL}" width="${CELL}" height="${CELL}" fill="${fill}" stroke="${LINE}" stroke-width="1"/>`;
        body+=text(X+(j+.5)*CELL,Y+(i+.5)*CELL+8,compared?cellValue(s.matrix[i][j]):'N/A',24,compared?INK:'#8491a2');
        body+='</g>';
      }
    }
    for(let b=0;b<2;b++)body+=`<rect x="${X+b*2*CELL}" y="${Y+b*2*CELL}" width="${2*CELL}" height="${2*CELL}" fill="none" stroke="#7b899b" stroke-width="2.2"/>`;
    return svg(400,350,masked?'Compared similarities; eight unobserved entries are N/A':'All sixteen similarities; outlined blocks mark the fixed batches',body);
  }

  function distribution(s){
    const X0=28,X1=372,BASE=159,xOf=x=>X0+(x+1)*(X1-X0)/2,meanX=xOf(s.negMean);
    let body=text(200,25,'All 12 negative pairs',24,MUTED);
    body+=`<line x1="${meanX}" y1="39" x2="${meanX}" y2="${BASE+2}" stroke="#78899f" stroke-width="1.3" stroke-dasharray="4 4"/>`;
    const levels=[];
    s.negativePairs.slice().sort((a,b)=>a.value-b.value||a.i-b.i||a.j-b.j).forEach(pair=>{
      const x=xOf(pair.value);let level=0;
      while(levels[level]&&levels[level].some(oldX=>Math.abs(oldX-x)<13))level++;
      if(!levels[level])levels[level]=[];levels[level].push(x);
      const y=BASE-9-level*9.5;
      body+=`<line x1="${meanX}" y1="${y}" x2="${x}" y2="${y}" stroke="#9eb0c8" stroke-width="1.8" opacity=".7" data-residual="${pair.value-s.negMean}"/>`;
      body+=`<circle cx="${x}" cy="${y}" r="4.2" fill="#526b8e" data-i="${pair.i}" data-j="${pair.j}" data-value="${pair.value}"/>`;
    });
    body+=`<line x1="${X0}" y1="${BASE}" x2="${X1}" y2="${BASE}" stroke="#8996a6" stroke-width="1.3"/>`;
    [-1,0,1].forEach(value=>{
      const x=xOf(value);body+=`<line x1="${x}" y1="${BASE}" x2="${x}" y2="${BASE+5}" stroke="#8996a6"/>`;
      body+=text(x,BASE+31,value===-1?'−1':String(value),24,MUTED);
    });
    body+=text(200,225,'Negative similarity',24,MUTED);
    return svg(400,242,'Twelve negative similarities and their distances from the mean',body);
  }

  function renderMoments(progress=0){
    const s=state(progress);
    const row=(label,count,m,v)=>`<tr><th scope="row" data-count="${count}" aria-label="All ${count} ${label.toLowerCase()} pairs">${label}</th><td data-moment="${label.toLowerCase()}-expectation" data-value="${m}">${metric(m)}</td><td data-moment="${label.toLowerCase()}-variance" data-value="${v}">${metric(v)}</td></tr>`;
    const status=(label,yes,kind)=>`<div class="bb17-status${yes?' bb17-optimum':''}" data-loss="${kind}" data-optimum="${yes}"><span>${label}</span><strong>${yes?'Yes':'No'}</strong></div>`;
    return `<div class="bb17-moments"><table class="bb17-table" aria-label="Population moments of all positive and negative pairs"><thead><tr><th scope="col">Pairs</th><th scope="col">Expectation</th><th scope="col">Variance</th></tr></thead><tbody>${row('Positive',4,s.posMean,s.posVar)}${row('Negative',12,s.negMean,s.negVar)}</tbody></table><div class="bb17-distribution">${distribution(s)}</div><div class="bb17-statuses">${status('Fixed mini-batch optimum',s.fixedOptimum,'fixed-mini-batch')}${status('Full-batch optimum',s.fullOptimum,'full-batch')}</div></div>`;
  }

  global.BlogBatchV17=Object.freeze({state,renderGeometry,renderMatrix,renderMoments,
    sizes:Object.freeze({geometry:[400,310],matrix:[400,350]}),colors:COLORS.slice()});
})(typeof window!=='undefined'?window:globalThis);

