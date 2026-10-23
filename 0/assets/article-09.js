
/* Self-contained contrastive-loss comparison. No external module dependencies. */
(function (global) {
  'use strict';
  const MATH = {"nce_row_sum":{"url":"assets/figure-01e50ad103ad.svg","width":200.64,"height":62.83},"nce_column_sum":{"url":"assets/figure-77eaf83f4a53.svg","width":199.62,"height":64.46},"sig_positive_sum":{"url":"assets/figure-91a03f27a9ba.svg","width":210.5,"height":61.04},"sig_negative_sum":{"url":"assets/figure-b817c51ffa4c.svg","width":245.25,"height":76.89},"nce_row_0":{"url":"assets/figure-989abbfa1769.svg","width":171.75,"height":61.44},"nce_column_0":{"url":"assets/figure-894bd88afc3b.svg","width":172.04,"height":63.08},"nce_row_1":{"url":"assets/figure-2463e345d0a3.svg","width":171.75,"height":61.44},"nce_column_1":{"url":"assets/figure-9c3881378332.svg","width":172.04,"height":63.08},"nce_row_2":{"url":"assets/figure-188ad550fccd.svg","width":171.75,"height":61.44},"nce_column_2":{"url":"assets/figure-ecc6a61b3b95.svg","width":172.04,"height":63.08},"sig_0":{"url":"assets/figure-0613a20deb03.svg","width":182.93,"height":44.21},"sig_1":{"url":"assets/figure-a96d22406170.svg","width":171.92,"height":44.21},"sig_2":{"url":"assets/figure-5382433eb77d.svg","width":171.92,"height":44.21},"sig_3":{"url":"assets/figure-4dbe44977374.svg","width":171.92,"height":44.21},"sig_4":{"url":"assets/figure-cb8edd1bac7a.svg","width":182.93,"height":44.21},"sig_5":{"url":"assets/figure-9709846dc79e.svg","width":171.92,"height":44.21},"sig_6":{"url":"assets/figure-db07cef6b4d8.svg","width":171.92,"height":44.21},"sig_7":{"url":"assets/figure-c94c3d18814f.svg","width":171.92,"height":44.21},"sig_8":{"url":"assets/figure-cce6f1e84a0e.svg","width":182.93,"height":44.21}};
  const SUB = ['₁', '₂', '₃'];
  const COLORS = ['#245bd7', '#c56a3e', '#197f75'];
  const PALE = ['#edf3ff', '#fff1e8', '#eaf7f4'];
  function img(key, alt, extra) {
    const a = MATH[key];
    return '<img class="blv-math '+(extra || '')+'" src="'+a.url+'" width="'+a.width+'" height="'+a.height+'" alt="'+alt+'" loading="lazy">';
  }
  function nceName(direction, i) { return (direction === 'row' ? 'u' : 'v') + SUB[i]; }
  function nceKey(direction, i) { return 'nce_' + direction + '_' + i; }
  function pairName(i,j) { return '<span class="blv-pair-expression">u<sub>'+(i+1)+'</sub><sup>⊤</sup>v<sub>'+(j+1)+'</sub></span>'; }
  function matrix(kind, direction, index, cell) {
    let html = '<div class="blv-matrix" role="group" aria-label="'+(kind === 'nce' ? 'InfoNCE similarity matrix' : 'Sigmoid similarity matrix; select a pair')+'"><span></span>';
    for (let j=0;j<3;j++) html += '<span class="blv-axis">v'+SUB[j]+'</span>';
    for (let i=0;i<3;i++) {
      html += '<span class="blv-axis">u'+SUB[i]+'</span>';
      for (let j=0;j<3;j++) {
        const active = kind === 'nce' ? (direction === 'row' ? i === index : j === index) : cell === i*3+j;
        const color = kind === 'nce' ? COLORS[index] : (i === j ? COLORS[0] : COLORS[1]);
        const pale = kind === 'nce' ? PALE[index] : (i === j ? PALE[0] : PALE[1]);
        const cls = 'blv-cell'+(active ? ' is-selected' : '')+(i === j ? ' is-positive' : '');
        const style = '--blv-color:'+color+';--blv-pale:'+pale;
        if (kind === 'sigmoid') html += '<button type="button" class="'+cls+'" style="'+style+'" data-sig-cell="'+(i*3+j)+'" aria-pressed="'+active+'" aria-label="'+(i===j?'Positive':'Negative')+' pair u'+(i+1)+', v'+(j+1)+'">'+pairName(i,j)+'</button>';
        else html += '<span class="'+cls+'" style="'+style+'">'+pairName(i,j)+'</span>';
      }
    }
    return html+'</div>';
  }
  function selectedNce(direction,index) {
    const alt = 'Minus one sixth log of exp(u'+(index+1)+' transpose v'+(index+1)+' / tau), divided by the sum over j=1 to 3 of exp('+(direction === 'row'?'u'+(index+1)+' transpose vj':'uj transpose v'+(index+1))+' / tau).';
    return '<div class="blv-term-label" style="color:'+COLORS[index]+'">'+nceName(direction,index)+' anchor · '+direction+'</div>'+img(nceKey(direction,index),alt);
  }
  function selectedSigmoid(cell) {
    const i=Math.floor(cell/3),j=cell%3,positive=i===j;
    return '<div class="blv-term-label" style="color:'+(positive?COLORS[0]:COLORS[1])+'">'+(positive?'Positive':'Negative')+' pair · u'+SUB[i]+', v'+SUB[j]+'</div>'+img('sig_'+cell, 'One third log of one plus exp('+(positive?'−u':'u')+(i+1)+' transpose v'+(j+1)+' / tau '+(positive?'+':'−')+' b).');
  }
  function expanded(kind) {
    const terms=[];
    if (kind === 'nce') {
      for (let i=0;i<3;i++) for (const direction of ['row','column']) terms.push({color:COLORS[i],label:nceName(direction,i)+' anchor',image:img(nceKey(direction,i),'InfoNCE contribution for '+nceName(direction,i)+' anchor')});
    } else {
      for (let cell=0;cell<9;cell++) { const i=Math.floor(cell/3),j=cell%3; terms.push({color:i===j?COLORS[0]:COLORS[1],label:'u'+SUB[i]+', v'+SUB[j],image:img('sig_'+cell,'Sigmoid contribution for u'+(i+1)+', v'+(j+1))}); }
    }
    return '<details class="blv-expanded"><summary>Expand all '+(kind==='nce'?'6 anchor':'9 pair')+' contributions</summary><div class="blv-contribution-sum">'+terms.map((t,i)=>'<div class="blv-contribution"><span class="blv-plus" aria-hidden="true">'+(i?'+':'')+'</span><div><div class="blv-term-label" style="color:'+t.color+'">'+t.label+'</div>'+t.image+'</div></div>').join('')+'</div></details>';
  }
  function render() {
    const groups=['row','column'].map(direction=>'<div class="blv-group-row">'+[0,1,2].map(i=>'<button type="button" class="blv-group'+(direction==='row'&&i===0?' is-selected':'')+'" style="--blv-color:'+COLORS[i]+';--blv-pale:'+PALE[i]+'" data-nce-group="'+direction+':'+i+'" aria-pressed="'+(direction==='row'&&i===0)+'">'+nceName(direction,i)+' '+direction+'</button>').join('')+'</div>').join('');
    return '<div class="blog-loss-v17" data-blog-loss-v17><section class="blv-panel" aria-label="Softmax loss (InfoNCE)"><h3>Softmax loss <span class="blv-method">(InfoNCE)</span></h3><div class="blv-full-formula"><div class="blv-equation-label"><i>L</i><sub>InfoNCE</sub> =</div>'+img('nce_row_sum','Minus one sixth times the sum from i=1 to 3 of log exp(ui transpose vi / tau) divided by the sum from j=1 to 3 of exp(ui transpose vj / tau).')+img('nce_column_sum','Minus one sixth times the sum from i=1 to 3 of log exp(ui transpose vi / tau) divided by the sum from j=1 to 3 of exp(uj transpose vi / tau).')+'</div><div class="blv-controls" aria-label="Choose a denominator group">'+groups+'</div><div data-blv-nce-matrix>'+matrix('nce','row',0,0)+'</div><div class="blv-selected-term" data-blv-nce-term aria-live="polite">'+selectedNce('row',0)+'</div>'+expanded('nce')+'</section><section class="blv-panel" aria-label="Sigmoid loss"><h3>Sigmoid loss</h3><div class="blv-full-formula"><div class="blv-equation-label"><i>L</i><sub>sigmoid</sub> =</div>'+img('sig_positive_sum','One third times the sum from i=1 to 3 of log(1 + exp(−ui transpose vi / tau + b)).')+img('sig_negative_sum','Plus one third times the sum from i=1 to 3 and from j=1 to 3 excluding j=i of log(1 + exp(ui transpose vj / tau − b)).')+'</div><div class="blv-sig-legend"><span class="blv-positive">Positive pair</span><span class="blv-negative">Negative pair</span></div><div data-blv-sig-matrix>'+matrix('sigmoid','row',0,0)+'</div><div class="blv-selected-term" data-blv-sig-term aria-live="polite">'+selectedSigmoid(0)+'</div>'+expanded('sigmoid')+'</section></div>';
  }
  function bind(container) {
    if (!container) return;
    const roots=container.matches && container.matches('[data-blog-loss-v17]') ? [container] : Array.from(container.querySelectorAll('[data-blog-loss-v17]'));
    roots.forEach(root=>{
      if(root.dataset.blvBound) return;
      root.dataset.blvBound='true';
      root.addEventListener('click',event=>{
        const group=event.target.closest('[data-nce-group]');
        if(group && root.contains(group)) {
          const [direction,indexText]=group.dataset.nceGroup.split(':'),index=Number(indexText);
          root.querySelectorAll('[data-nce-group]').forEach(button=>{ const selected=button===group; button.classList.toggle('is-selected',selected); button.setAttribute('aria-pressed',String(selected)); });
          root.querySelector('[data-blv-nce-matrix]').innerHTML=matrix('nce',direction,index,0);
          root.querySelector('[data-blv-nce-term]').innerHTML=selectedNce(direction,index);
        }
        const cell=event.target.closest('[data-sig-cell]');
        if(cell && root.contains(cell)) {
          const index=Number(cell.dataset.sigCell);
          root.querySelectorAll('[data-sig-cell]').forEach(button=>{const selected=Number(button.dataset.sigCell)===index;button.classList.toggle('is-selected',selected);button.setAttribute('aria-pressed',String(selected));});
          root.querySelector('[data-blv-sig-term]').innerHTML=selectedSigmoid(index);
        }
      });
    });
  }
  global.BlogLossV17 = {render,bind};
  if(typeof module !== 'undefined' && module.exports) module.exports=global.BlogLossV17;
})(typeof window !== 'undefined' ? window : globalThis);

