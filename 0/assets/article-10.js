
/* Native inline figures for the contrastive-learning blog.
 * Load build/sigmoid_v15.js first. All coordinates, optima and objectives
 * come from that verified general-bias model. Default example: n=3, b=1.
 * This module returns HTML/SVG only; controls and state updates belong to root.
 */
(function(global){
  'use strict';
  const C=['#245bd7','#c56a3e','#197f75'],INK='#172334',MUTED='#5e6b7d',LINE='#dce3ec';
  const SUB=['₁','₂','₃'],PI=Math.PI;
  const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const f=x=>Number(x.toFixed(4));
  const fmt=(x,d=3)=>(Math.abs(x)<.5/10**d?0:x).toFixed(d).replace('-','−');
  const text=(x,y,t,size=22,color=INK,anchor='middle',extra='')=>`<text x="${f(x)}" y="${f(y)}" font-size="${size}" fill="${color}" text-anchor="${anchor}" ${extra}>${esc(t)}</text>`;
  const line=(x1,y1,x2,y2,color=LINE,width=1.3,extra='')=>`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const circle=(x,y,r,fill,extra='')=>`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
  const marker=(x,y,color,view,r=6.5)=>circle(x,y,r,view==='u'?color:'white',`stroke="${color}" stroke-width="2.4"`);
  const svg=(w,h,title,description,body)=>`<svg class="bsg-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><desc>${esc(description)}</desc>${body}</svg>`;
  function theory(){if(!global.SigmoidV15)throw new Error('Load SigmoidV15 before BlogSigmoidV17.');return global.SigmoidV15;}
  function legend(){return '<div class="bsg-legend" aria-label="Filled markers are first-view u; hollow markers are second-view v"><span><i class="bsg-dot"></i>u</span><span><i class="bsg-dot bsg-hollow"></i>v</span></div>';}
  function metrics(g){
    return '<dl class="bsg-metrics">'+[['Positive',g.positive,C[0]],['Negative',g.negative,C[1]],['Modality gap',g.modalityGap,INK]].map(([label,value,color])=>`<div><dt>${label}</dt><dd style="color:${color}">${fmt(value)}</dd></div>`).join('')+'</dl>';
  }
  function ellipse(cx,cy,rx,ry,opacity=.7){
    return `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="#c3d0e2" stroke-width="1.2" opacity="${opacity}"/>`;
  }
  function triangle(points,opacity){return `<path d="M ${points.map(p=>f(p[0])+' '+f(p[1])).join(' L ')} Z" fill="#d7e4f5" fill-opacity="${opacity}" stroke="#afc1d8" stroke-width="1.2"/>`;}
  function cluster(x,y,view){
    let out='';const r=9;
    for(let i=0;i<3;i++){
      const a=-PI/2+2*PI*i/3,b=a+2*PI/3,x1=x+r*Math.cos(a),y1=y+r*Math.sin(a),x2=x+r*Math.cos(b),y2=y+r*Math.sin(b);
      const path=view==='u'?`M ${f(x)} ${f(y)} L ${f(x1)} ${f(y1)} A ${r} ${r} 0 0 1 ${f(x2)} ${f(y2)} Z`:`M ${f(x1)} ${f(y1)} A ${r} ${r} 0 0 1 ${f(x2)} ${f(y2)}`;
      out+=`<path d="${path}" fill="${view==='u'?C[i]:'none'}" stroke="${view==='u'?'white':C[i]}" stroke-width="${view==='u'?1:2.5}"/>`;
    }return out;
  }
  function geometrySvg(g,compact=false){
    const W=400,H=compact?245:300,cx=200,cy=compact?119:145,r=compact?83:106;
    const pos=p=>[cx+r*p[0],cy-r*p[1]],up=g.projectedU.map(pos),vp=g.projectedV.map(pos),uc=pos(g.projectedUMean),vc=pos(g.projectedVMean);
    const elevation=25*PI/180;
    let out=circle(cx,cy,r,'#fafcff','stroke="#cbd7e6" stroke-width="1.4"');
    out+=ellipse(cx,cy,r,r*Math.sin(elevation),.65)+circle(cx,cy,2.3,MUTED);
    if(g.q>1e-12){
      const rx=r*Math.sqrt(g.q),ry=rx*Math.sin(elevation);
      if(g.q<1-1e-12)out+=ellipse(...uc,rx,ry)+ellipse(...vc,rx,ry);
      out+=triangle(vp,.10);
      if(g.q<1-1e-12)out+=triangle(up,.16);
      for(let i=0;i<3;i++){
        out+=line(cx,cy,...up[i],C[i],1,'opacity=".21"');
        if(g.q<1-1e-12)out+=line(cx,cy,...vp[i],C[i],1,'opacity=".14"')+line(...up[i],...vp[i],C[i],1.2,'stroke-dasharray="3 4" opacity=".45"');
      }
    }
    if(g.modalityGap>1e-8){
      for(const p of [uc,vc])out+=line(p[0]-3.5,p[1],p[0]+3.5,p[1],INK,1.5)+line(p[0],p[1]-3.5,p[0],p[1]+3.5,INK,1.5);
      out+=line(cx,uc[1]+4,cx,vc[1]-4,INK,1.1,'opacity=".6"');
    }
    if(g.q===0){
      out+=cluster(...up[0],'u')+cluster(...vp[0],'v');
      for(let i=0;i<3;i++){
        out+=text(cx+(i-1)*54,up[0][1]-21,`u${SUB[i]}`,22,C[i]);
        out+=text(cx+(i-1)*54,vp[0][1]+32,`v${SUB[i]}`,22,C[i]);
      }
    }else{
      const depth=v=>-Math.cos(elevation)*v[1]+Math.sin(elevation)*v[2];
      const order=[];
      for(let i=0;i<3;i++)for(const view of ['v','u'])order.push({i,view,p:view==='u'?up[i]:vp[i],depth:depth(g[view][i])});
      order.sort((a,b)=>a.depth-b.depth);
      if(g.q===1){for(let i=0;i<3;i++)out+=marker(...up[i],C[i],'v',8.4)+marker(...up[i],C[i],'u',5.1);}
      else for(const a of order)out+=marker(...a.p,C[a.i],a.view,a.view==='u'?6.2:7.2);
      for(let i=0;i<3;i++){
        const [ux,uy]=up[i],[vx,vy]=vp[i],side=i===0?1:-1,anchor=side>0?'start':'end';
        if(g.q===1)out+=text(ux+side*14,uy+7,`u${SUB[i]} = v${SUB[i]}`,22,C[i],anchor);
        else if(g.q<.35){
          const lx=cx+[90,-90,0][i],yU=Math.max(...up.map(p=>p[1]))+31,yV=Math.min(...vp.map(p=>p[1]))-18;
          out+=line(ux,uy+8,lx,yU-20,C[i],1,'opacity=".6"')+line(vx,vy-8,lx,yV+5,C[i],1,'opacity=".6"');
          out+=text(lx,yU,`u${SUB[i]}`,22,C[i])+text(lx,yV,`v${SUB[i]}`,22,C[i]);
        }else if(Math.hypot(ux-vx,uy-vy)<30)out+=text((ux+vx)/2+side*14,(uy+vy)/2+7,`u${SUB[i]}, v${SUB[i]}`,22,C[i],anchor);
        else out+=text(ux+side*13,uy-10,`u${SUB[i]}`,22,C[i],anchor)+text(vx+side*13,vy+25,`v${SUB[i]}`,22,C[i],anchor);
      }
    }
    return svg(W,H,'Three paired unit embeddings',`Actual unit vectors in R3, orthographically projected. Colors identify instances; filled u and hollow v identify views. Positive similarity ${g.positive}; negative similarity ${g.negative}; view-centroid distance ${g.modalityGap}.`,out);
  }
  function renderTradeoff(positive=.6){
    const p=Number(positive);if(!Number.isFinite(p)||p< -1||p>1)throw new RangeError('Positive similarity must be in [-1,1].');
    const L=104,R=382,T=46,B=300,x=v=>L+(v+1)*(R-L)/2,y=v=>B-(v+1)*(B-T),negative=(p-3)/4;
    let out=`<path d="M ${L} ${T} H ${R} V ${y(-.5)} L ${L} ${B} Z" fill="#eff5ff"/><path d="M ${L} ${B} H ${R} V ${y(-.5)} Z" fill="#f3f5f8"/>`;
    for(const v of [-1,-.5,0])out+=line(L,y(v),R,y(v),'#e0e7ef',1)+text(L-13,y(v)+7,String(v).replace('-','−'),22,MUTED,'end');
    for(const v of [-1,0,1])out+=line(x(v),B,x(v),B+5,'#9fadc0',1)+text(x(v),B+31,String(v).replace('-','−'),22,MUTED);
    out+=line(L,T,L,B,'#9fadc0',1.3)+line(L,B,R,B,'#9fadc0',1.3);
    out+=line(L,B,R,y(-.5),C[1],3)+text(236,105,'Feasible',22,MUTED)+text(294,275,'Impossible',22,MUTED);
    out+=line(L,19,L+24,19,C[1],3)+text(L+34,26,'CCEM boundary',22,C[1],'start');
    out+=circle(R,y(-.5),6.8,'white',`stroke="${INK}" stroke-width="1.8"`);
    if(p>-1&&p<1)out+=line(x(p),T,x(p),y(negative),C[0],1.1,'stroke-dasharray="3 5" opacity=".6"');
    out+=circle(x(p),y(negative),6,C[0],'stroke="white" stroke-width="1.8"');
    out+=text((L+R)/2,364,'Mean positive similarity',22);
    out+=`<text x="20" y="173" transform="rotate(-90 20 173)" font-size="22" text-anchor="middle" fill="${INK}">Mean negative similarity</text>`;
    return svg(400,374,'The three-instance similarity trade-off',`For three paired unit embeddings, the mean negative similarity is at least (mean positive minus 3)/4. The CCEM family attains the entire boundary in R3. Selected positive ${p}; boundary negative ${negative}. The visible vertical range is -1 to 0.`,out);
  }
  const SUPER={'-':'⁻','0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹'};
  const power=p=>'10'+String(p).split('').map(c=>SUPER[c]||c).join('');
  function profileSvg(kind,tau,b,g){
    const base=theory(),L=75,R=381,T=18,B=182,opt=kind==='nce'?1:g.positive;
    const samples=Array.from({length:321},(_,i)=>{const p=i/320;return{p,z:base.logLoss(kind,p,tau,b)/Math.LN10};});
    const minZ=base.logLoss(kind,opt,tau,b)/Math.LN10,maxZ=Math.max(...samples.map(a=>a.z));
    const low=Math.floor(minZ)-.16,high=Math.ceil(maxZ)+.16,x=p=>L+p*(R-L),y=z=>B-(z-low)/(high-low)*(B-T);
    const powers=[Math.ceil(maxZ),Math.round((Math.ceil(maxZ)+Math.floor(minZ))/2),Math.floor(minZ)];
    let out='';
    for(const e of [...new Set(powers)])out+=line(L,y(e),R,y(e),'#e0e7ef',1)+text(L-11,y(e)+7,power(e),22,MUTED,'end');
    out+=line(L,T,L,B,'#9fadc0',1.2)+line(L,B,R,B,'#9fadc0',1.2);
    for(const p of [0,.5,1])out+=line(x(p),B,x(p),B+5,'#9fadc0',1)+text(x(p),B+31,String(p),22,MUTED);
    const color=kind==='nce'?C[0]:C[1],path=samples.map((a,i)=>(i?'L':'M')+' '+f(x(a.p))+' '+f(y(a.z))).join(' ');
    out+=`<path d="${path}" fill="none" stroke="${color}" stroke-width="2.7" stroke-linejoin="round"/>`;
    out+=line(x(opt),y(minZ),x(opt),B,color,1.3,'stroke-dasharray="3 4" opacity=".7"')+circle(x(opt),y(minZ),5.5,color,'stroke="white" stroke-width="1.5"');
    out+=text((L+R)/2,246,'Positive similarity',22);
    return svg(400,258,`${kind==='nce'?'InfoNCE':'Sigmoid'} loss profile`,`Actual objective along the three-instance CCEM boundary, using ordinary temperature ${tau} and fixed sigmoid bias ${b}. The horizontal domain is positive similarity from 0 to 1; the vertical axis is logarithmic. The minimum occurs at positive similarity ${opt}.`,out);
  }
  function renderGeometry(q=.8){const g=theory().configuration(q);return `<div class="bsg-geometry">${legend()}${geometrySvg(g)}${metrics(g)}</div>`;}
  function renderTemperaturePanel(kind,tau=.14,b=1){
    const k=['nce','infoNCE','infonce'].includes(kind)?'nce':kind;if(!['nce','sigmoid'].includes(k))throw new RangeError('kind must be nce or sigmoid.');
    const s=theory().state(tau,b),g=k==='nce'?s.infoNCE:s.sigmoid,title=k==='nce'?'InfoNCE':'Sigmoid';
    return `<section class="bsg-panel" aria-label="${title} at temperature ${esc(s.tau)}"><div class="bsg-panel-heading"><h4>${title}</h4><span class="bsg-phase">${g.phase}</span></div>${legend()}${geometrySvg(g,true)}${metrics(g)}<div class="bsg-profile-heading"><span>Loss <span class="bsg-muted">(log scale)</span></span><span class="bsg-minimum" style="color:${k==='nce'?C[0]:C[1]}">● minimum</span></div>${profileSvg(k,s.tau,s.b,g)}</section>`;
  }
  function renderComparison(tau=.14,b=1){return `<div class="bsg-comparison">${renderTemperaturePanel('nce',tau,b)}${renderTemperaturePanel('sigmoid',tau,b)}</div>`;}
  global.BlogSigmoidV17=Object.freeze({renderTradeoff,renderGeometry,renderTemperaturePanel,renderComparison});
})(typeof window!=='undefined'?window:globalThis);

