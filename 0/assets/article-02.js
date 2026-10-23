
/* Four paired instances; every matrix is computed from the actual unit vectors. */
(function(global){
 'use strict';
 const C=['#245bd7','#c56a3e','#197f75','#8662c4'],P=['#eef3ff','#fbf1eb','#edf6f4','#f3effa'];
 const INK='#172334',MUTED='#647184',LINE='#dce3ec',SUB=['₁','₂','₃','₄'];
 const phi=25*Math.PI/180,theta=20*Math.PI/180;
 const EX=[Math.cos(phi),-Math.sin(phi),0],EY=[Math.sin(phi)*Math.sin(theta),Math.cos(phi)*Math.sin(theta),-Math.cos(theta)],EZ=[Math.sin(phi)*Math.cos(theta),Math.cos(phi)*Math.cos(theta),Math.sin(theta)];
 const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),f=x=>+x.toFixed(4),clean=x=>Math.abs(x)<1e-12?0:Math.max(-1,Math.min(1,x));
 const fmt=x=>{const a=Math.round(Math.abs(x)*100)/100;return (x<0&&a?'−':'')+a.toFixed(2)};
 const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
 const txt=(x,y,s,n=28,color=INK,anchor='middle',weight=400,extra='')=>`<text x="${f(x)}" y="${f(y)}" font-size="${n}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}" ${extra}>${esc(s)}</text>`;
 const line=(x1,y1,x2,y2,c=LINE,w=2,extra='')=>`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${c}" stroke-width="${w}" ${extra}/>`;
 const circle=(x,y,r,color,extra='')=>`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${color}" ${extra}/>`;
 const marker=(x,y,color,view,r=9,extra='')=>circle(x,y,r,view==='u'?color:'white',`stroke="${color}" stroke-width="2.5" ${extra}`);
 const arrow=(x1,y1,x2,y2,color=INK,w=2.2,h=9,extra='')=>{const a=Math.atan2(y2-y1,x2-x1);return line(x1,y1,x2,y2,color,w,extra)+`<path d="M${f(x2)},${f(y2)}L${f(x2-h*Math.cos(a-.43))},${f(y2-h*Math.sin(a-.43))}L${f(x2-h*Math.cos(a+.43))},${f(y2-h*Math.sin(a+.43))}Z" fill="${color}" ${extra}/>`};
 const svg=(w,h,title,b)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" style="font-family:Deck,Arial,sans-serif;display:block;width:100%;height:auto"><title>${esc(title)}</title>${b}</svg>`;
 const fromScreen=(x,y,sign)=>{const z=sign*Math.sqrt(1-x*x-y*y);return EX.map((_,i)=>x*EX[i]+y*EY[i]+z*EZ[i])};
 const TETRA=[[1,1,1],[1,-1,-1],[-1,1,-1],[-1,-1,1]].map(v=>v.map(x=>x/Math.sqrt(3)));
 const GU=[[.70,-.45,1],[-.52,-.65,1],[-.56,.57,1],[.62,.60,-1]].map(v=>fromScreen(...v));
 const GV=[[.42,-.20,1],[-.80,-.17,1],[-.18,.83,1],[.25,.37,-1]].map(v=>fromScreen(...v));
 function state(mode='irregular'){
  let u,v;
  if(mode==='antipodal'){u=Array.from({length:4},()=>[0,0,1]);v=Array.from({length:4},()=>[0,0,-1]);}
  else {u=(mode==='simplex'?TETRA:GU).map(v=>v.slice());v=(mode==='irregular'?GV:u).map(v=>v.slice());}
  const matrix=u.map(a=>v.map(b=>clean(dot(a,b))));
  const positive=matrix.map((r,i)=>r[i]),negative=matrix.flatMap((r,i)=>r.filter((_,j)=>j!==i));
  const mean=a=>a.reduce((s,x)=>s+x,0)/a.length,variance=a=>{const m=mean(a);return mean(a.map(x=>(x-m)**2))};
  return {mode,u,v,matrix,positive,negative,meanPositive:mean(positive),meanNegative:mean(negative),variancePositive:variance(positive),varianceNegative:variance(negative)};
 }
 const project=(v,cx,cy,r)=>[cx+r*dot(EX,v),cy+r*dot(EY,v),dot(EZ,v)];
 function sphere(cx,cy,r){
  let b=circle(cx,cy,r,'#fbfcff',`stroke="#d4deec" stroke-width="1.6"`);
  for(const plane of ['xy','xz','yz']){
   let path='',last=null,front=null;
   const flush=()=>{if(path)b+=`<path d="${path}" fill="none" stroke="${front?'#d6e0ee':'#e7edf5'}" stroke-width="1.2" ${front?'':'stroke-dasharray="5 6"'}/>`};
   for(let k=0;k<=192;k++){
    const t=k*Math.PI/96,a=Math.cos(t),d=Math.sin(t),v=plane==='xy'?[a,d,0]:plane==='xz'?[a,0,d]:[0,a,d],p=project(v,cx,cy,r),now=p[2]>=0;
    if(front!==null&&now!==front){flush();path=last?`M${f(last[0])},${f(last[1])}`:'';}
    path+=(path?'L':'M')+f(p[0])+','+f(p[1]);front=now;last=p;
   }
   flush();
  }
  return b;
 }
 const UO=[[24,-13,'start'],[-24,-13,'end'],[-24,30,'end'],[24,30,'start']];
 const VO=[[23,27,'start'],[-23,27,'end'],[-10,34,'middle'],[23,-13,'start']];
 function geometryBody(data,cx,cy,r,labels=true,selected=null){
  const up=data.u.map(v=>project(v,cx,cy,r)),vp=data.v.map(v=>project(v,cx,cy,r));
  let b=sphere(cx,cy,r);
  if(data.mode==='antipodal'){
   const us=up[0],vs=vp[0];
   b+=arrow(cx,cy,us[0],us[1],MUTED,2.3,9)+arrow(cx,cy,vs[0],vs[1],MUTED,2.3,9);
   for(const [pt,view] of [[us,'u'],[vs,'v']]){
    for(let i=0;i<4;i++){
     const a=-Math.PI/2+i*Math.PI/2,e=a+Math.PI/2,rr=11;
     const x1=pt[0]+rr*Math.cos(a),y1=pt[1]+rr*Math.sin(a),x2=pt[0]+rr*Math.cos(e),y2=pt[1]+rr*Math.sin(e);
     const d=view==='u'?`M${f(pt[0])},${f(pt[1])}L${f(x1)},${f(y1)}A${rr},${rr} 0 0 1 ${f(x2)},${f(y2)}Z`:`M${f(x1)},${f(y1)}A${rr},${rr} 0 0 1 ${f(x2)},${f(y2)}`;
     b+=`<path d="${d}" fill="${view==='u'?C[i]:'none'}" stroke="${C[i]}" stroke-width="${view==='u'?1:3.5}" data-view="${view}" data-index="${i+1}"/>`;
     if(labels)b+=txt(pt[0]+(i-1.5)*47,pt[1]+(view==='u'?-27:42),view+SUB[i],27,C[i]);
    }
   }
  }else{
   if(data.mode==='simplex')for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)b+=line(...up[i].slice(0,2),...up[j].slice(0,2),'#d5dfea',1.5);
   for(let i=0;i<4;i++){
    if(data.mode==='irregular')b+=line(...up[i].slice(0,2),...vp[i].slice(0,2),C[i],1.8,'stroke-dasharray="5 6" opacity=".65"');
    for(const [pts,view] of [[up,'u'],[vp,'v']]){
     if(view==='v'&&data.mode!=='irregular')continue;
     const p=pts[i],a=Math.atan2(p[1]-cy,p[0]-cx);
     b+=arrow(cx,cy,p[0]-12*Math.cos(a),p[1]-12*Math.sin(a),C[i],1.8,8,'opacity=".5"');
    }
   }
   if(selected)b+=line(...up[selected.i-1].slice(0,2),...vp[selected.j-1].slice(0,2),INK,3,'class="four-pair-selected-edge"');
   for(let i=0;i<4;i++){
    const [ux,uy]=up[i],[vx,vy]=vp[i];
    if(data.mode==='irregular'){
     b+=marker(vx,vy,C[i],'v',9.5,`data-view="v" data-index="${i+1}"`)+marker(ux,uy,C[i],'u',8.5,`data-view="u" data-index="${i+1}"`);
     if(labels){const[a,d,k]=UO[i],[e,g,h]=VO[i];b+=txt(ux+a,uy+d,'u'+SUB[i],28,C[i],k)+txt(vx+e,vy+g,'v'+SUB[i],28,C[i],h);}
    }else{
     b+=marker(ux,uy,C[i],'v',12.5,`data-view="v" data-index="${i+1}"`)+marker(ux,uy,C[i],'u',7,`data-view="u" data-index="${i+1}"`);
     if(labels){const right=ux>=cx,dy=uy<cy?-18:30;b+=txt(ux+(right?21:-21),uy+dy,`u${SUB[i]} = v${SUB[i]}`,26,C[i],right?'start':'end');}
    }
   }
  }
  b+=circle(cx,cy,3.7,INK);return b;
 }
 function legend(cx,y){return marker(cx-114,y-8,INK,'u',7)+txt(cx-96,y,'View 1',25,MUTED,'start')+marker(cx+44,y-8,INK,'v',8)+txt(cx+62,y,'View 2',25,MUTED,'start');}
 function geometrySvg(mode='irregular',selected=null){
  const data=state(mode);return svg(740,510,'Four paired unit embeddings',legend(368,34)+geometryBody(data,368,269,177,true,selected));
 }
 function matrixSvg(mode='irregular'){
  const data=state(mode),x0=86,y0=91,c=78;
  const POS='#245bd7',NEG='#c56a3e',POS_FILL='#eaf0ff',NEG_FILL='#fff0e6';
  let b='';
  b+=txt(242,28,'View 2',25,MUTED);
  b+=`<text x="21" y="249" transform="rotate(-90 21 249)" font-size="25" fill="${MUTED}" text-anchor="middle">View 1</text>`;
  for(let i=0;i<4;i++){
   // Neutral index labels keep pair-relation colors distinct from instance colors.
   b+=txt(x0+(i+.5)*c,73,'v'+SUB[i],28,INK);
   b+=txt(66,y0+(i+.5)*c+10,'u'+SUB[i],28,INK);
   for(let j=0;j<4;j++){
    const x=x0+j*c,y=y0+i*c,positive=i===j,value=fmt(data.matrix[i][j]);
    const relation=positive?'Positive pair':'Negative pair';
    b+=`<g class="four-pair-cell ${positive?'four-pair-positive':'four-pair-negative'}" data-i="${i+1}" data-j="${j+1}" data-pair="${i+1}-${j+1}" tabindex="0" role="button" aria-label="${relation}, u${i+1} with v${j+1}: ${value}"><rect class="four-pair-cell-bg" x="${x+2}" y="${y+2}" width="${c-4}" height="${c-4}" rx="2" fill="${positive?POS_FILL:NEG_FILL}" stroke="${positive?POS:NEG}" stroke-width="${positive?2:1.15}"/>${txt(x+c/2,y+c/2+10,value,27,INK,'middle',400,'pointer-events="none"')}</g>`;
   }
  }
  // The leaders touch actual cells: u2-v4 is negative and u4-v4 is positive.
  // Keeping both leaders outside the grid prevents them from obscuring values.
  for(const item of [
   {i:1,j:3,color:NEG,label:'Negative pair',kind:'negative'},
   {i:3,j:3,color:POS,label:'Positive pair',kind:'positive'}
  ]){
   const y=y0+(item.i+.5)*c,right=x0+(item.j+1)*c-2;
   b+=`<g class="four-pair-${item.kind}-callout" data-i="${item.i+1}" data-j="${item.j+1}" pointer-events="none">`;
   b+=line(right,y,431,y,item.color,2.2)+circle(right,y,3.3,item.color);
   b+=txt(444,y+9,item.label,26,item.color,'start',600)+'</g>';
  }
  return svg(635,430,'All sixteen similarities, with blue positive-pair diagonal cells and orange negative-pair off-diagonal cells',b);
 }

 // Page 9: a compact geometry → matrix → means layout.
 // Dedicated methods leave all pre-existing intro, setup and reference SVGs unchanged.
 function compactGeometrySvg(mode='irregular',selected=null){
  const data=state(mode);
  return svg(520,450,'Four paired unit embeddings',
   legend(260,34)+geometryBody(data,260,244,160,true,selected));
 }
 function compactMatrixSvg(mode='irregular'){
  const data=state(mode),x0=70,y0=111,c=78;
  const POS='#245bd7',NEG='#c56a3e',POS_FILL='#eaf0ff',NEG_FILL='#fff0e6';
  let b='';
  // The same two colors identify pair types in the legend and in every matrix cell.
  // Row and column indices stay neutral so they cannot be mistaken for relation colors.
  b+=`<rect x="8" y="8" width="20" height="20" rx="2" fill="${POS_FILL}" stroke="${POS}" stroke-width="1.8"/>`;
  b+=txt(37,26,'Positive pair',23,POS,'start',500);
  b+=`<rect x="215" y="8" width="20" height="20" rx="2" fill="${NEG_FILL}" stroke="${NEG}" stroke-width="1.4"/>`;
  b+=txt(244,26,'Negative pair',23,NEG,'start',500);
  b+=txt(x0+2*c,60,'View 2',23,MUTED);
  b+=`<text x="22" y="267" transform="rotate(-90 22 267)" font-size="23" fill="${MUTED}" text-anchor="middle">View 1</text>`;
  for(let i=0;i<4;i++){
   b+=txt(x0+(i+.5)*c,93,'v'+SUB[i],28,INK);
   b+=txt(51,y0+(i+.5)*c+10,'u'+SUB[i],28,INK);
   for(let j=0;j<4;j++){
    const x=x0+j*c,y=y0+i*c,positive=i===j,value=fmt(data.matrix[i][j]);
    const relation=positive?'Positive pair':'Negative pair';
    b+=`<g class="four-pair-cell ${positive?'four-pair-positive':'four-pair-negative'}" data-i="${i+1}" data-j="${j+1}" data-pair="${i+1}-${j+1}" tabindex="0" role="button" aria-label="${relation}, u${i+1} with v${j+1}: ${value}"><rect class="four-pair-cell-bg" x="${x+2}" y="${y+2}" width="${c-4}" height="${c-4}" rx="2" fill="${positive?POS_FILL:NEG_FILL}" stroke="${positive?POS:NEG}" stroke-width="${positive?2:1.15}"/>${txt(x+c/2,y+c/2+10,value,27,INK,'middle',400,'pointer-events="none"')}</g>`;
   }
  }
  return svg(410,430,'All sixteen similarities, with blue positive-pair diagonal cells and orange negative-pair off-diagonal cells',b);
 }

 const DIGITS={
  3:'M23 19 C45 4 79 7 77 29 C76 43 59 48 45 49 C64 45 85 59 75 78 C64 99 34 96 18 81',
  7:'M17 20 Q44 14 81 18 Q68 36 59 50 Q47 69 40 91',
  8:'M48 48 C12 45 12 9 47 9 C82 10 81 46 48 48 C7 50 5 94 47 95 C92 96 91 50 48 48',
  2:'M15 28 C26 0 76 2 81 29 C82 49 50 59 22 87 L83 87'
 };
 function card(cx,cy,n,color,w=86,h=74,view=0){
  const scale=Math.min(w/102,h/112),angle=view===1?-9:view===2?8:0;
  return `<rect x="${f(cx-w/2)}" y="${f(cy-h/2)}" width="${w}" height="${h}" rx="5" fill="white" stroke="${LINE}" stroke-width="1.6"/><g transform="translate(${cx} ${cy}) rotate(${angle}) scale(${scale}) translate(-48 -52)"><path d="${DIGITS[n]}" fill="none" stroke="${color}" stroke-width="8.5" stroke-linecap="round" stroke-linejoin="round"/></g>`;
 }
 function setupSvg(){
  let b='';const ys=[142,243,344,445];
  b+=txt(126,38,'n instances',28,INK,'middle',600)+txt(411,38,'2 views per instance',28,INK,'middle',600)+txt(760,38,'Encoder',28,INK,'middle',600)+txt(1176,38,'Unit embeddings',28,INK,'middle',600);
  b+=txt(126,78,'n = 4',25,MUTED)+txt(346,78,'View 1',25,MUTED)+txt(475,78,'View 2',25,MUTED);
  for(let i=0;i<4;i++){
   const y=ys[i],color=C[i],n=[3,7,8,2][i];
   b+=line(171,y,211,y,color,2,'opacity=".65"')+arrow(211,y,303,y-22,color,2,8,'opacity=".6"')+arrow(211,y,432,y+22,color,2,8,'opacity=".6"');
   b+=arrow(389,y-22,656,y-22,color,1.8,8,'opacity=".5"')+arrow(518,y+22,656,y+22,color,1.8,8,'opacity=".5"');
   b+=card(126,y,n,color,86,78)+card(346,y-22,n,color,76,61,1)+card(475,y+22,n,color,76,61,2);
  }
  b+=`<rect x="664" y="100" width="192" height="399" rx="7" fill="white" stroke="${LINE}" stroke-width="1.8"/>`+txt(760,253,'f',69)+arrow(760,279,760,312,INK,1.8,8)+txt(760,355,'ℓ₂ normalization',22);
  b+=arrow(875,300,985,300,INK,2.7,11)+legend(1170,79)+geometryBody(state('irregular'),1176,305,172,false);
  return svg(1425,535,'Four original instances produce eight normalized view embeddings',b);
 }
 function notationSvg(){
  let b='';b+=txt(146,46,'Instance',28,INK,'middle',600)+marker(296,37,INK,'u',7.5)+txt(316,46,'View 1',28,INK,'start',600)+marker(486,37,INK,'v',8)+txt(506,46,'View 2',28,INK,'start',600)+txt(1100,46,'Unit embeddings',28,INK,'middle',600);
  b+=line(35,78,617,78);
  for(let i=0;i<4;i++){
   const y=142+i*102;
   if(i)b+=line(35,y-48,617,y-48,'#edf0f5',1.2);
   b+=card(93,y,[3,7,8,2][i],C[i],76,70)+txt(202,y+10,'i = '+(i+1),28,C[i]);
   b+=line(361,y,529,y,C[i],2,'stroke-dasharray="5 6" opacity=".55"');
   b+=marker(350,y,C[i],'u',10)+marker(540,y,C[i],'v',10.5)+txt(350,y-24,'u'+SUB[i],31,C[i])+txt(540,y-24,'v'+SUB[i],31,C[i]);
  }
  b+=arrow(652,293,781,293,INK,2.5,12)+geometryBody(state('irregular'),1100,291,182,true);
  return svg(1425,550,'Instance indices and the two embeddings for each of four pairs',b);
 }
 function objectiveSvg(){
  const ys=[126,204,282,360];let b=line(712.5,10,712.5,452,LINE,1.4);
  for(let p=0;p<2;p++){
   const positive=p===0,cx=p?1069:356,l=cx-151,r=cx+151;
   b+=txt(cx,33,positive?'Positive pairs':'Negative pairs',31,INK,'middle',600)+txt(cx,72,positive?'Same instance · 4 pairs':'Different instances · 12 pairs',25,MUTED);
   for(let i=0;i<4;i++)for(let j=0;j<4;j++)if((i===j)===positive){
    b+=`<g class="intro-v8-pair" data-i="${i+1}" data-j="${j+1}" data-positive="${positive}">`;
    if(!positive)b+=line(l+12,ys[i],r-12,ys[j],'white',6);
    b+=line(l+12,ys[i],r-12,ys[j],positive?C[i]:C[1],positive?3.2:2.35)+'</g>';
   }
   for(let i=0;i<4;i++)b+=marker(l,ys[i],C[i],'u',10)+marker(r,ys[i],C[i],'v',10.5)+txt(l-25,ys[i]+10,'u'+SUB[i],29,C[i],'end')+txt(r+25,ys[i]+10,'v'+SUB[i],29,C[i],'start');
   b+=txt(cx,445,positive?'Similarity ↑ 1':'Similarity ↓ −1',31,positive?C[0]:C[1],'middle',600);
  }
  return svg(1425,460,'All four matching pairs and all twelve different-instance pairs',b);
 }

 function alignedState(amount=0){
  const t=Math.min(1,Math.max(0,Number(amount))),raw=[.2,.5,1],norm=Math.hypot(...raw),center=raw.map(x=>x/norm);
  const u=TETRA.map(w=>{const v=w.map((x,k)=>(1-t)*center[k]+t*x),l=Math.hypot(...v);return v.map(x=>x/l)});
  const matrix=u.map(a=>u.map(b=>clean(dot(a,b)))),negative=matrix.flatMap((r,i)=>r.filter((_,j)=>j!==i));
  const meanNegative=negative.reduce((a,b)=>a+b,0)/12;
  return {mode:t===1?'simplex':'aligned',amount:t,u,v:u.map(v=>v.slice()),matrix,positive:[1,1,1,1],negative,meanPositive:1,meanNegative,variancePositive:0,varianceNegative:negative.reduce((s,x)=>s+(x-meanNegative)**2,0)/12};
 }
 function objectiveAntipodalSvg(){
  return svg(700,410,'Negative similarities minimized without aligning the positives',geometryBody(state('antipodal'),350,216,150,true));
 }
 function alignedGeometrySvg(amount=0){
  const data=alignedState(amount),cx=350,cy=216,r=150,pts=data.u.map(v=>project(v,cx,cy,r));
  let b=sphere(cx,cy,r);
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)b+=line(...pts[i].slice(0,2),...pts[j].slice(0,2),'#ced9e8',1.5);
  for(let i=0;i<4;i++)b+=line(cx,cy,pts[i][0],pts[i][1],C[i],1.5,'opacity=".4"');
  if(data.amount===0){
   const pt=pts[0];
   for(let i=0;i<4;i++){
    const a=-Math.PI/2+i*Math.PI/2,e=a+Math.PI/2,rr=12,ri=7;
    b+=`<path d="M${f(pt[0]+rr*Math.cos(a))},${f(pt[1]+rr*Math.sin(a))}A${rr},${rr} 0 0 1 ${f(pt[0]+rr*Math.cos(e))},${f(pt[1]+rr*Math.sin(e))}" fill="none" stroke="${C[i]}" stroke-width="3" data-view="v" data-index="${i+1}"/>`;
    b+=`<path d="M${f(pt[0])},${f(pt[1])}L${f(pt[0]+ri*Math.cos(a))},${f(pt[1]+ri*Math.sin(a))}A${ri},${ri} 0 0 1 ${f(pt[0]+ri*Math.cos(e))},${f(pt[1]+ri*Math.sin(e))}Z" fill="${C[i]}" data-view="u" data-index="${i+1}"/>`;
   }
  }else for(let i=0;i<4;i++)b+=marker(pts[i][0],pts[i][1],C[i],'v',12.5,`data-view="v" data-index="${i+1}"`)+marker(pts[i][0],pts[i][1],C[i],'u',7,`data-view="u" data-index="${i+1}"`);
  for(const right of [false,true]){
   const group=pts.map((p,i)=>({p,i})).filter(o=>(o.p[0]>=cx)===right).sort((a,b)=>a.p[1]-b.p[1]);
   const slots=group.map(o=>Math.min(344,Math.max(103,o.p[1]+8)));
   for(let i=1;i<slots.length;i++)slots[i]=Math.max(slots[i],slots[i-1]+36);
   if(slots.length&&slots.at(-1)>350){const excess=slots.at(-1)-350;for(let i=0;i<slots.length;i++)slots[i]-=excess;}
   group.forEach((o,k)=>{const x=right?524:176,y=slots[k],lead=right?x-10:x+10;b+=line(o.p[0]+(right?14:-14),o.p[1],lead,y-8,C[o.i],1.1,'opacity=".6"')+txt(x,y,`u${SUB[o.i]} = v${SUB[o.i]}`,26,C[o.i],right?'start':'end');});
  }
  b+=circle(cx,cy,3.7,INK);
  return svg(700,410,'Four aligned positive pairs with freely changing negative similarities',b);
 }

 global.IntroV14=Object.freeze({state,geometrySvg,matrixSvg,compactGeometrySvg,compactMatrixSvg,setupSvg,notationSvg,objectiveSvg,alignedState,alignedGeometrySvg,objectiveAntipodalSvg,colors:C.slice(),camera:[EX,EY,EZ],tetra:TETRA.map(v=>v.slice())});
})(typeof window!=='undefined'?window:globalThis);

