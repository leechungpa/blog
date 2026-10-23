
/* The two loss components of Eqs. (2)-(3). Positive means a numerator target in that component; all other comparisons are denominator-only. */
(function(global){
 'use strict';
 const C=['#245bd7','#c56a3e','#197f75','#8662c4'],INK='#172334',POS='#2f6d4c',NEG='#738196';
 const SUB=['₁','₂','₃','₄'], ids=['u1','v1','u2','v2','u3','v3','u4','v4'];
 const controllers=new WeakMap();let serial=0;
 const label=id=>id[0]+SUB[+id[1]-1];
 const coord=id=>[50+100*(+id[1]-1),id[0]==='u'?108:210];
 const normalize=a=>{if(a==null||a==='')return null;a=String(a).replace(/[₁₂₃₄]/g,s=>String(SUB.indexOf(s)+1));if(!ids.includes(a))throw Error('Unknown anchor: '+a);return a;};
 const state=(anchor='u1')=>global.ClassPairsV13.state(normalize(anchor));
 const text=(x,y,s,extra='')=>'<text x="'+x+'" y="'+y+'" text-anchor="middle" font-size="18" '+extra+'>'+s+'</text>';
 const f=n=>Number(n.toFixed(2));
 function path(a,b){const [x1,y1]=coord(a),[x2,y2]=coord(b);if(y1!==y2)return 'M'+x1+','+y1+'L'+x2+','+y2;
  const bend=(y1===108?1:-1)*(26+Math.abs(x2-x1)*.13);
  return 'M'+x1+','+y1+'Q'+f((x1+x2)/2)+','+f(y1+bend)+' '+x2+','+y2;
 }
 function graph(panel,anchor,uid){
  const s=state(anchor),p=s.panels[panel];let b='';
  if(panel===0){for(let i=0;i<4;i++)b+=text(50+100*i,22,'Instance','class="bp18-group-name"')+text(50+100*i,47,i+1,'class="bp18-group-name"')+'<rect x="'+(12+100*i)+'" y="61" width="76" height="194" rx="11" fill="'+C[i]+'" fill-opacity=".055" stroke="#e0e6ef"/>';}
  else for(let i=0;i<2;i++)b+=text(100+200*i,37,'Class '+(i?'B':'A'),'class="bp18-group-name"')+'<rect x="'+(12+200*i)+'" y="61" width="176" height="194" rx="11" fill="#f3f6fa" stroke="#dde5ef"/>';
  b+='<g class="bp18-edges">';
  for(const e of [...p.edges].sort((a,b)=>(a.role==='positive')-(b.role==='positive'))){const visible=anchor?(e.from===anchor||e.to===anchor):e.role==='positive';b+='<path class="bp18-edge '+e.role+'" data-from="'+e.from+'" data-to="'+e.to+'" data-role="'+e.role+'" d="'+path(e.from,e.to)+'" fill="none" visibility="'+(visible?'visible':'hidden')+'" vector-effect="non-scaling-stroke"/>';}
  b+='</g>';
  for(const id of ids){const [x,y]=coord(id),i=+id[1]-1;b+='<g class="bp18-node" data-bp18-node="'+id+'" data-panel="'+panel+'" role="button" tabindex="0" aria-pressed="'+(id===anchor)+'" aria-label="Select '+label(id)+' as anchor">'
   +'<rect class="bp18-hit" x="'+(x-28)+'" y="'+(y-28)+'" width="56" height="56" fill="transparent"/>'
   +'<circle class="bp18-focus" cx="'+x+'" cy="'+y+'" r="21" fill="none" stroke="'+INK+'" stroke-width="2" vector-effect="non-scaling-stroke"/>'
   +'<circle class="bp18-halo" cx="'+x+'" cy="'+y+'" r="16" fill="white" stroke="'+INK+'" stroke-width="2.5" vector-effect="non-scaling-stroke" opacity="'+(id===anchor?1:0)+'"/>'
   +'<circle cx="'+x+'" cy="'+y+'" r="9" fill="'+(id[0]==='u'?C[i]:'white')+'" stroke="'+C[i]+'" stroke-width="2" vector-effect="non-scaling-stroke"/>'
   +text(x,id[0]==='u'?80:244,label(id),'fill="'+C[i]+'" class="bp18-node-label"')+'</g>';}
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 274" data-bp18-panel="'+panel+'" aria-labelledby="'+uid+'-'+panel+'" role="group"><title id="'+uid+'-'+panel+'">'+(panel?'Supervised':'Self-supervised')+' pair relationships</title>'+b+'</svg>';
 }
 function list(nodes){return nodes.map(id=>'<span class="bp18-target">'+label(id)+'</span>').join(', ');}
 function summaries(panel,anchor){const p=state(anchor).panels[panel];return anchor?'<p><strong class="bp18-positive-word">Positive numerator:</strong> <span data-bp18-positive>'+list(p.positiveNodes)+'</span></p><p><strong class="bp18-negative-word">Denominator only:</strong> <span data-bp18-negative>'+list(p.negativeNodes)+'</span></p>':'<p><strong class="bp18-positive-word">'+p.positive.length+' positive pairs</strong></p>';}
 function render(options={}){
  if(!global.ClassPairsV13)throw Error('Load ClassPairsV13 before BlogPairsV19.');
  const anchor=normalize(options.anchor||'u1'),uid='bp18-'+(++serial);
  return '<div class="blog-pairs-v18" data-blog-pairs-v18 data-bp18-anchor="'+anchor+'"><div class="bp18-toolbar"><p class="bp18-status" aria-live="polite">Anchor: <strong data-bp18-status>'+label(anchor)+'</strong></p><button type="button" class="bp18-overview" aria-pressed="false">All positive pairs</button></div><div class="bp18-grid">'+[0,1].map(panel=>'<section class="bp18-panel" aria-label="'+(panel?'Supervised':'Self-supervised')+' component"><h4 class="bp18-title">'+(panel?'Supervised term':'Self-supervised term')+' <span class="bp18-symbol" role="math" aria-label="L '+(panel?'sup':'self')+'">𝓛<sub>'+(panel?'sup':'self')+'</sub></span></h4><p class="bp18-subtitle">'+(panel?'Same class, different instances':'Same instance')+'</p>'+graph(panel,anchor,uid)+'<div class="bp18-summary" data-bp18-summary="'+panel+'">'+summaries(panel,anchor)+'</div></section>').join('')+'</div><div class="bp18-legend"><span><i class="bp18-positive-line"></i>Positive numerator</span><span data-bp18-negative-legend><i class="bp18-negative-line"></i>Denominator only</span><span data-bp18-anchor-legend><i class="bp18-anchor-ring"></i>Anchor</span></div></div>';
 }
 function roots(root){if(typeof root==='string')root=global.document.querySelector(root);root=root||global.document;const found=[];if(root.matches&&root.matches('[data-blog-pairs-v18]'))found.push(root);if(root.querySelectorAll)found.push(...root.querySelectorAll('[data-blog-pairs-v18]'));return found;}
 function bind(root){return roots(root).map(el=>{
  if(controllers.has(el))return controllers.get(el);
  let pinned=normalize(el.dataset.bp18Anchor)||'u1',hover=null,focused=null,overview=false;
  const nodeAt=t=>t&&t.nodeType===1?t.closest('.bp18-node'):null;
  function draw(){const anchor=hover||focused||(overview?null:pinned),s=state(anchor);el.dataset.bp18Anchor=anchor||'';el.dataset.bp18Mode=anchor?'anchor':'all-positive';
   const status=el.querySelector('.bp18-status');status.innerHTML=anchor?'Anchor: <strong data-bp18-status>'+label(anchor)+'</strong>':'<strong data-bp18-status>All positive pairs</strong>';
   el.querySelector('.bp18-overview').setAttribute('aria-pressed',String(overview));el.querySelector('.bp18-overview').textContent=overview?'Return to selected anchor':'All positive pairs';
   for(const svg of el.querySelectorAll('[data-bp18-panel]')){const panel=+svg.dataset.bp18Panel,p=s.panels[panel];svg.setAttribute('aria-label',anchor?(panel?'Supervised':'Self-supervised')+' component, anchor '+label(anchor)+': '+p.positiveNodes.length+' positive numerator and '+p.negativeNodes.length+' denominator-only comparisons':p.positive.length+' positive pairs');
    for(const edge of svg.querySelectorAll('.bp18-edge'))edge.setAttribute('visibility',(anchor?(edge.dataset.from===anchor||edge.dataset.to===anchor):edge.dataset.role==='positive')?'visible':'hidden');
    for(const node of svg.querySelectorAll('.bp18-node')){const id=node.dataset.bp18Node,selected=id===anchor,role=anchor?(selected?'anchor':global.ClassPairsV13.pairRole(panel,anchor,id)):'none';node.dataset.role=role;node.setAttribute('aria-pressed',String(selected));node.setAttribute('aria-label',label(id)+(anchor?', '+(role==='negative'?'denominator only':role==='positive'?'positive numerator':role)+' for '+label(anchor):'')+'. Select as anchor.');node.querySelector('.bp18-halo').setAttribute('opacity',selected?'1':'0');}
    el.querySelector('[data-bp18-summary="'+panel+'"]').innerHTML=summaries(panel,anchor);
   }
   el.querySelector('[data-bp18-negative-legend]').hidden=!anchor;el.querySelector('[data-bp18-anchor-legend]').hidden=!anchor;
  }
  function fit(){for(const svg of el.querySelectorAll('svg')){const scale=svg.getBoundingClientRect().width/400;if(!(scale>0))continue;for(const t of svg.querySelectorAll('text'))t.setAttribute('font-size',Math.max(18,16/scale));for(const n of svg.querySelectorAll('.bp18-node')){const [x,y]=coord(n.dataset.bp18Node),size=Math.max(44,42/scale),r=n.querySelector('.bp18-hit');r.setAttribute('x',x-size/2);r.setAttribute('y',y-size/2);r.setAttribute('width',size);r.setAttribute('height',size);}}}
  const onOver=e=>{if(e.pointerType==='touch')return;const n=nodeAt(e.target);if(n&&el.contains(n)){hover=n.dataset.bp18Node;draw();}};
  const onOut=e=>{if(e.pointerType==='touch')return;const from=nodeAt(e.target),to=nodeAt(e.relatedTarget);if(!from||from===to)return;hover=to&&el.contains(to)?to.dataset.bp18Node:null;draw();};
  const onFocus=e=>{const n=nodeAt(e.target);if(n){focused=n.dataset.bp18Node;draw();}};
  const onBlur=e=>{const n=nodeAt(e.relatedTarget);focused=n&&el.contains(n)?n.dataset.bp18Node:null;draw();};
  const pin=id=>{pinned=id;overview=false;hover=null;draw();};
  const onClick=e=>{const n=nodeAt(e.target);if(n){pin(n.dataset.bp18Node);if(n.focus)n.focus({preventScroll:true});draw();return;}if(e.target.closest('.bp18-overview')){overview=!overview;hover=null;focused=null;draw();}};
  const onKey=e=>{const n=nodeAt(e.target);if(!n)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();pin(n.dataset.bp18Node);}else if(e.key==='Escape'){e.preventDefault();hover=null;focused=null;overview=false;n.blur();draw();}};
  const handlers={pointerover:onOver,pointerout:onOut,focusin:onFocus,focusout:onBlur,click:onClick,keydown:onKey};Object.entries(handlers).forEach(([k,v])=>el.addEventListener(k,v));
  const ro=new global.ResizeObserver(fit);ro.observe(el);fit();draw();if(global.document.fonts)global.document.fonts.ready.then(fit);
  const controller={element:el,state:()=>state(el.dataset.bp18Anchor||null),setAnchor:id=>{pinned=normalize(id)||'u1';overview=false;hover=null;focused=null;draw();},refresh:fit,destroy:()=>{ro.disconnect();Object.entries(handlers).forEach(([k,v])=>el.removeEventListener(k,v));controllers.delete(el);}};controllers.set(el,controller);return controller;
 });}
 global.BlogPairsV19={render,bind,state};
})(window);

