
/* Three-instance reference objectives for native blog figures.
 * Independent of the optimizer: these are actual unit-vector constructions.
 * CSS uses the scoped bsg legend/metric styles from blog_sigmoid_v17.css.
 * Root supplies headings and controls.
 */
(function(global){
  'use strict';
  const COLORS=['#245bd7','#c56a3e','#197f75'],INK='#172334',MUTED='#5e6b7d',SUB=['₁','₂','₃'];
  const EL=25*Math.PI/180,CX=190,CY=145,R=100;
  const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const f=x=>Number(x.toFixed(4)),dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const fmt=x=>(Math.abs(x)<.0005?0:x).toFixed(3).replace('-','−');
  const project=v=>[CX+R*v[0],CY-R*(Math.sin(EL)*v[1]+Math.cos(EL)*v[2])];
  const text=(x,y,t,color=INK,anchor='middle')=>`<text x="${f(x)}" y="${f(y)}" text-anchor="${anchor}" font-size="22" fill="${color}">${esc(t)}</text>`;
  const line=(x1,y1,x2,y2,color='#dce3ec',width=1.2,extra='')=>`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const circle=(x,y,r,fill,extra='')=>`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${fill}" ${extra}/>`;
  function buildState(mode,amount,u,v){
    const matrix=u.map(a=>v.map(b=>dot(a,b)));
    const positive=matrix.reduce((s,row,i)=>s+row[i],0)/3;
    const negatives=matrix.flatMap((row,i)=>row.filter((_,j)=>i!==j));
    const negative=negatives.reduce((s,x)=>s+x,0)/6;
    return{mode,amount,n:3,d:3,u,v,matrix,positive,negative,meanPositive:positive,meanNegative:negative,negativeSimilarities:negatives,projectedU:u.map(project),projectedV:v.map(project)};
  }
  function alignedState(amount=0){
    const a=Number(amount);if(!Number.isFinite(a)||a<0||a>1)throw new RangeError('amount must be in [0,1].');
    const u=[0,2*Math.PI*a/3,4*Math.PI*a/3].map(t=>[Math.cos(t),Math.sin(t),0]);
    return buildState('aligned',a,u,u.map(v=>v.slice()));
  }
  function negativeState(){return buildState('negative',null,Array.from({length:3},()=>[0,0,1]),Array.from({length:3},()=>[0,0,-1]));}
  function state(mode='aligned',amount=0){
    if(typeof mode==='number')return alignedState(mode);
    if(mode==='aligned')return alignedState(amount);
    if(mode==='negative')return negativeState();
    throw new RangeError('mode must be aligned or negative.');
  }
  function baseSphere(){
    return circle(CX,CY,R,'#fafcff','stroke="#cbd7e6" stroke-width="1.4"')
      +`<ellipse cx="${CX}" cy="${CY}" rx="${R}" ry="${f(R*Math.sin(EL))}" fill="none" stroke="#c3d0e2" stroke-width="1.2"/>`
      +circle(CX,CY,2.2,MUTED);
  }
  function cluster(x,y,view,r=9){
    let out='';
    for(let i=0;i<3;i++){
      const a=-Math.PI/2+2*Math.PI*i/3,b=a+2*Math.PI/3;
      const x1=x+r*Math.cos(a),y1=y+r*Math.sin(a),x2=x+r*Math.cos(b),y2=y+r*Math.sin(b);
      const d=view==='u'?`M ${f(x)} ${f(y)} L ${f(x1)} ${f(y1)} A ${r} ${r} 0 0 1 ${f(x2)} ${f(y2)} Z`:`M ${f(x1)} ${f(y1)} A ${r} ${r} 0 0 1 ${f(x2)} ${f(y2)}`;
      out+=`<path d="${d}" fill="${view==='u'?COLORS[i]:'none'}" stroke="${view==='u'?'white':COLORS[i]}" stroke-width="${view==='u'?1:2.6}"/>`;
    }return out;
  }
  function pairedMarker(x,y,color){return circle(x,y,8.2,'white',`stroke="${color}" stroke-width="2.4"`)+circle(x,y,5,color);}
  function labelPairs(points){
    const used=[];let out='';
    const overlaps=(a,b,pad=5)=>a.x<b.x+b.w+pad&&a.x+a.w+pad>b.x&&a.y<b.y+b.h+pad&&a.y+a.h+pad>b.y;
    for(let i=0;i<3;i++){
      const [px,py]=points[i],side=px>=CX?1:-1;let chosen=null;
      for(const s of [side,-side]){
        for(const offset of [0,-38,38,-76,76]){
          const tx=px+s*14,ty=py+7+offset,box={x:s===1?tx:tx-88,y:ty-22,w:88,h:29};
          if(box.x<4||box.x+box.w>396||box.y<4||box.y+box.h>296)continue;
          if(used.some(b=>overlaps(box,b)))continue;
          if(points.some(p=>overlaps(box,{x:p[0]-7,y:p[1]-7,w:14,h:14},2)))continue;
          chosen={tx,ty,box,side:s};break;
        }if(chosen)break;
      }
      if(!chosen){const ty=40+i*39;chosen={tx:306,ty,box:{x:306,y:ty-22,w:88,h:29},side:1};}
      used.push(chosen.box);
      const lx=chosen.tx-chosen.side*4,ly=chosen.ty-7;
      out+=line(px,py,lx,ly,COLORS[i],1,'opacity=".48"');
      out+=text(chosen.tx,chosen.ty,`u${SUB[i]} = v${SUB[i]}`,COLORS[i],chosen.side===1?'start':'end');
    }return out;
  }
  function drawing(g){
    let out=baseSphere();
    if(g.mode==='negative'){
      const top=g.projectedU[0],bottom=g.projectedV[0];
      out+=line(...top,...bottom,'#acbbce',1.2,'stroke-dasharray="3 4"');
      out+=cluster(...top,'u')+cluster(...bottom,'v');
      for(let i=0;i<3;i++){
        const x=CX+(i-1)*70;
        out+=line(top[0],top[1],x,top[1]-15,COLORS[i],1,'opacity=".5"')+text(x,top[1]-22,`u${SUB[i]}`,COLORS[i]);
        out+=line(bottom[0],bottom[1],x,bottom[1]+13,COLORS[i],1,'opacity=".5"')+text(x,bottom[1]+33,`v${SUB[i]}`,COLORS[i]);
      }
    }else{
      const pts=g.projectedU;
      if(g.amount>0)out+=`<path d="M ${pts.map(p=>f(p[0])+' '+f(p[1])).join(' L ')} Z" fill="#d7e4f5" fill-opacity=".17" stroke="#afc1d8" stroke-width="1.2"/>`;
      for(let i=0;i<3;i++)out+=line(CX,CY,...pts[i],COLORS[i],1,'opacity=".18"');
      if(g.amount===0)out+=cluster(...pts[0],'v',10.5)+cluster(...pts[0],'u',7);
      else for(let i=0;i<3;i++)out+=pairedMarker(...pts[i],COLORS[i]);
      out+=labelPairs(pts);
    }
    const title=g.mode==='negative'?'All negative similarities equal minus one':'Three aligned positive pairs with variable negative similarities';
    const description=g.mode==='negative'?'Three first-view vectors share the north pole, and three second-view vectors share the south pole of the same unit sphere. Every positive and negative similarity is minus one.':`All three positive pairs are aligned. Actual unit vectors have great-circle angles 0, 2*pi*${g.amount}/3, and 4*pi*${g.amount}/3. At zero they coincide; at one they form an equilateral triangle. The six ordered negative similarities have mean ${g.meanNegative}. Label leaders do not move vector positions.`;
    return `<svg class="bsg-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>${esc(description)}</desc>${out}</svg>`;
  }
  function html(g){
    const legend='<div class="bsg-legend" aria-label="Filled u markers and hollow v markers"><span><i class="bsg-dot"></i>u</span><span><i class="bsg-dot bsg-hollow"></i>v</span></div>';
    const metrics=`<dl class="bsg-metrics" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div><dt>Mean positive</dt><dd style="color:${COLORS[0]}">${fmt(g.meanPositive)}</dd></div><div><dt>Mean negative</dt><dd style="color:${COLORS[1]}">${fmt(g.meanNegative)}</dd></div></dl>`;
    return `<div class="bsg-geometry bref-figure">${legend}${drawing(g)}${metrics}</div>`;
  }
  const renderNegative=()=>html(negativeState());
  const renderAligned=(amount=0)=>html(alignedState(amount));
  global.BlogReferenceV17=Object.freeze({state,alignedState,negativeState,renderNegative,renderAligned});
})(typeof window!=='undefined'?window:globalThis);

