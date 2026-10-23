
/* v15: Three-instance CCEM geometry and exact fixed-bias loss profiles.
 *
 * Unit vectors in R^3, n=3. Ordinary temperature tau > 0.
 * Sigmoid: softplus(-positive/tau + b) + 2 softplus(negative/tau - b).
 * Symmetric InfoNCE is averaged over its two directions (coefficient 1/(2n)).
 * Its restriction to CCEM is log(1 + 2 exp((negative-positive)/tau)).
 *
 * With fixed b >= 0, Corollary 2 of Lee, Chang & Sohn (AISTATS 2024)
 * reduces the global sigmoid optimization to this CCEM scalar problem.
 * The displayed general loss uses symbolic bias b; the example fixes b=1.
 * Bias is an independent parameter, held constant as tau changes.
 * No fetched assets, DOM mutation, display jitter, or fictitious coordinates.
 */
(function(global){
  'use strict';
  const INK='#172334',MUTED='#5e6b7d',LINE='#dce3ec';
  const COLORS=['#245bd7','#c56a3e','#197f75'];
  const SUB=['₁','₂','₃'],FONT='Deck,Arial,sans-serif';
  const PI=Math.PI,LN2=Math.log(2),LN10=Math.log(10);
  const f=x=>Number(x.toFixed(4));
  const esc=x=>String(x).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const text=(x,y,value,size=26,color=INK,anchor='middle',extra='')=>`<text x="${f(x)}" y="${f(y)}" font-size="${size}" fill="${color}" text-anchor="${anchor}" ${extra}>${esc(value)}</text>`;
  const line=(x1,y1,x2,y2,color=LINE,width=1.5,extra='')=>`<line x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}" stroke="${color}" stroke-width="${width}" ${extra}/>`;
  const circle=(x,y,r,fill,extra='')=>`<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}" ${extra}/>`;
  const marker=(x,y,color,view,r=8,extra='')=>circle(x,y,r,view==='u'?color:'white',`stroke="${color}" stroke-width="2.5" ${extra}`);
  const wrap=(w,h,title,description,body)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}" style="font-family:${FONT};display:block;width:100%;height:auto"><title>${esc(title)}</title><desc>${esc(description)}</desc><rect width="${w}" height="${h}" fill="white"/>${body}</svg>`;
  const dot=(a,b)=>a.reduce((sum,x,i)=>sum+x*b[i],0);
  const clamp=x=>Math.max(0,Math.min(1,x));
  const fixed=(x,digits=2)=>{const scale=10**digits;return(Math.abs(x)<.5/scale?0:x).toFixed(digits).replace('-','−')};
  const sp=x=>Math.max(x,0)+Math.log1p(Math.exp(-Math.abs(x)));
  const logSp=x=>x< -36?x:x>36?Math.log(x):Math.log(sp(x));
  const logAdd=(a,b)=>Math.max(a,b)+Math.log1p(Math.exp(-Math.abs(a-b)));
  const logistic=x=>x>=0?1/(1+Math.exp(-x)):Math.exp(x)/(1+Math.exp(x));

  // A genuine equilateral triangle, with three distinct projected abscissae.
  const TRIANGLE=[20,140,260].map(deg=>[Math.cos(deg*PI/180),Math.sin(deg*PI/180)]);
  const elevation=25*PI/180;
  const A=[1,0,0],B=[0,Math.sin(elevation),Math.cos(elevation)];
  const DEPTH=[0,-Math.cos(elevation),Math.sin(elevation)];
  const project=v=>[dot(v,A),dot(v,B)];

  function configuration(q){
    const raw=Number(q);
    if(!Number.isFinite(raw)||raw< -1e-12||raw>1+1e-12)throw new RangeError('q must be in [0,1].');
    const value=clamp(raw),radial=Math.sqrt(value),height=Math.sqrt(1-value);
    const u=TRIANGLE.map(w=>[radial*w[0],radial*w[1],height]);
    const v=TRIANGLE.map(w=>[radial*w[0],radial*w[1],-height]);
    const matrix=u.map(row=>v.map(col=>dot(row,col)));
    const uMean=Array.from({length:3},(_,j)=>u.reduce((sum,row)=>sum+row[j],0)/3);
    const vMean=Array.from({length:3},(_,j)=>v.reduce((sum,row)=>sum+row[j],0)/3);
    const positive=matrix.reduce((sum,row,i)=>sum+row[i],0)/3;
    const negative=matrix.reduce((sum,row,i)=>sum+row.reduce((s,x,j)=>s+(i===j?0:x),0),0)/6;
    const gap=Math.hypot(...uMean.map((x,j)=>x-vMean[j]));
    return {N:3,n:3,d:3,q:value,delta:value===0?Infinity:Math.sqrt((1-value)/value),
      w:TRIANGLE.map(row=>row.slice()),u,v,matrix,positive,negative,
      meanPositive:positive,meanNegative:negative,modalityGap:gap,centroidGap:gap,
      uMean,vMean,projectedU:u.map(project),projectedV:v.map(project),
      projectedUMean:project(uMean),projectedVMean:project(vMean),
      projectionRows:[A.slice(),B.slice()]};
  }

  function validate(tau,b){
    const temperature=Number(tau),bias=Number(b);
    if(!Number.isFinite(temperature)||temperature<=0||!Number.isFinite(1/temperature))throw new RangeError('tau must be positive and finite.');
    if(!Number.isFinite(bias)||bias<0)throw new RangeError('The global-theorem display requires b >= 0.');
    return [temperature,bias];
  }

  function sigmoidResidual(q,tau,b=1){
    // log(sigmoid(B)/sigmoid(A)) - log(2), stable in both tails.
    const a=-(2*q-1)/tau+b,c=(-1+q/2)/tau-b;
    return sp(-a)-sp(-c)-LN2;
  }

  function sigmoidOptimum(tau,b=1){
    [tau,b]=validate(tau,b);
    if(sigmoidResidual(1,tau,b)<=0)return 1;
    let left=0,right=1;
    for(let i=0;i<80;i++){
      const mid=(left+right)/2;
      if(sigmoidResidual(mid,tau,b)<0)left=mid;else right=mid;
    }
    return(left+right)/2;
  }

  function logLoss(kind,positive,tau=.08,b=1){
    const p=Number(positive),negative=(p-3)/4;
    if(!Number.isFinite(p)||p< -1||p>1)throw new RangeError('Positive similarity must lie in [-1,1].');
    [tau,b]=validate(tau,b);
    if(kind==='nce'||kind==='infoNCE')return logSp(LN2+(negative-p)/tau);
    if(kind==='sigmoid')return logAdd(logSp(-p/tau+b),LN2+logSp(negative/tau-b));
    throw new RangeError('Choose nce or sigmoid.');
  }

  function loss(kind,positive,tau=.08,b=1){return Math.exp(logLoss(kind,positive,tau,b));}

  function state(tau=.08,b=1){
    [tau,b]=validate(tau,b);
    const q=sigmoidOptimum(tau,b),sigmoid=configuration(q),infoNCE=configuration(1);
    sigmoid.loss=loss('sigmoid',sigmoid.positive,tau,b);
    sigmoid.logLoss=logLoss('sigmoid',sigmoid.positive,tau,b);
    sigmoid.phase=q===1?'Aligned':'Separated';
    infoNCE.loss=loss('nce',1,tau,b);
    infoNCE.logLoss=logLoss('nce',1,tau,b);
    infoNCE.phase='Aligned';
    const logCritical=2*b+Math.log1p(Math.sqrt(1+Math.exp(-3*b)));
    return {N:3,n:3,d:3,tau,b,bias:b,beta:1/tau,q,positive:sigmoid.positive,negative:sigmoid.negative,
      modalityGap:sigmoid.modalityGap,phase:sigmoid.phase,thresholdTau:1/(2*logCritical),
      sigmoid,infoNCE,assumptions:{unitNorm:true,allPairs:true,dAtLeast:3,fixedBias:true},
      normalization:{positivePairs:3,negativePairs:6,sigmoidLossDivisor:3,infoNCEDivisor:6,negativeMeanDivisor:6}};
  }

  function ellipsePath(cx,cy,rx,ry,start,end){
    const pts=[];
    for(let i=0;i<=48;i++){
      const theta=start+(end-start)*i/48;
      pts.push([cx+rx*Math.cos(theta),cy+ry*Math.sin(theta)]);
    }
    return pts.map((p,i)=>(i?'L':'M')+' '+f(p[0])+' '+f(p[1])).join(' ');
  }

  function planeCircle(cx,cy,rx,ry,opacity=.9){
    return `<path d="${ellipsePath(cx,cy,rx,ry,PI,2*PI)}" fill="none" stroke="#c6d3e5" stroke-width="1.4" stroke-dasharray="4 5" opacity="${opacity}"/>`
      +`<path d="${ellipsePath(cx,cy,rx,ry,0,PI)}" fill="none" stroke="#c6d3e5" stroke-width="1.4" opacity="${opacity}"/>`;
  }

  function trianglePath(points,color,opacity){
    return `<path d="M ${points.map(p=>f(p[0])+' '+f(p[1])).join(' L ')} Z" fill="${color}" fill-opacity="${opacity}" stroke="#aebed1" stroke-width="1.45"/>`;
  }

  function cluster(cx,cy,view,r=11){
    let out='';
    for(let i=0;i<3;i++){
      const start=-PI/2+2*PI*i/3,end=start+2*PI/3;
      const x1=cx+r*Math.cos(start),y1=cy+r*Math.sin(start),x2=cx+r*Math.cos(end),y2=cy+r*Math.sin(end);
      const d=view==='u'?`M ${cx} ${cy} L ${f(x1)} ${f(y1)} A ${r} ${r} 0 0 1 ${f(x2)} ${f(y2)} Z`:`M ${f(x1)} ${f(y1)} A ${r} ${r} 0 0 1 ${f(x2)} ${f(y2)}`;
      out+=`<path d="${d}" fill="${view==='u'?COLORS[i]:'none'}" stroke="${view==='u'?'white':COLORS[i]}" stroke-width="${view==='u'?1:3}" data-view="${view}" data-index="${i+1}"/>`;
    }
    return out;
  }

  function sphere(cx,cy,r,data,compact=false){
    const pos=p=>[cx+r*p[0],cy-r*p[1]],up=data.projectedU.map(pos),vp=data.projectedV.map(pos);
    const uc=pos(data.projectedUMean),vc=pos(data.projectedVMean);
    let out=circle(cx,cy,r,'#fafcff','stroke="#cbd6e5" stroke-width="1.6"');
    out+=planeCircle(cx,cy,r,r*Math.sin(elevation),.65);
    out+=line(cx,cy-r,cx,cy+r,'#e5ebf4',1,'stroke-dasharray="3 5"');
    out+=circle(cx,cy,2.5,MUTED);
    if(data.q>1e-12){
      const rx=r*Math.sqrt(data.q),ry=rx*Math.sin(elevation);
      if(data.q<1-1e-12){out+=planeCircle(...vc,rx,ry,.65)+planeCircle(...uc,rx,ry,.85);}
      out+=trianglePath(vp,'#d5e2f4',data.q===1?.15:.11);
      if(data.q<1-1e-12)out+=trianglePath(up,'#d5e2f4',.15);
      for(let i=0;i<3;i++){
        out+=line(cx,cy,...up[i],COLORS[i],1.2,'opacity=".21"');
        if(data.q<1-1e-12)out+=line(cx,cy,...vp[i],COLORS[i],1.2,'opacity=".16"')+line(...up[i],...vp[i],COLORS[i],1.45,'opacity=".47" stroke-dasharray="4 5"');
      }
    }
    if(data.modalityGap>1e-7){
      // These crosses are the two actual view centroids.
      for(const c of [uc,vc])out+=line(c[0]-4,c[1],c[0]+4,c[1],INK,1.6)+line(c[0],c[1]-4,c[0],c[1]+4,INK,1.6);
      out+=line(cx,uc[1]+5,cx,vc[1]-5,INK,1.25,'opacity=".7"');
    }
    const size=compact?22:26;
    if(data.q===0){
      out+=cluster(...up[0],'u',compact?9:11)+cluster(...vp[0],'v',compact?9:11);
      for(let i=0;i<3;i++){
        out+=text(cx+(i-1)*(compact?48:58),up[0][1]-20,`u${SUB[i]}`,size,COLORS[i]);
        out+=text(cx+(i-1)*(compact?48:58),vp[0][1]+35,`v${SUB[i]}`,size,COLORS[i]);
      }
    }else{
      // Sort actual 3-D points by depth before drawing; do not move points.
      const order=[];
      for(let i=0;i<3;i++)for(const view of ['v','u'])order.push({i,view,point:view==='u'?up[i]:vp[i],depth:dot(data[view][i],DEPTH)});
      order.sort((a,b)=>a.depth-b.depth);
      if(data.q===1){
        for(let i=0;i<3;i++)out+=marker(...up[i],COLORS[i],'v',compact?9:11,`data-view="v" data-index="${i+1}"`)+marker(...up[i],COLORS[i],'u',compact?5.4:6.5,`data-view="u" data-index="${i+1}"`);
      }else{
        for(const p of order)out+=marker(...p.point,COLORS[p.i],p.view,compact?(p.view==='u'?6.5:7.8):(p.view==='u'?7.5:9),`data-view="${p.view}" data-index="${p.i+1}"`);
      }
      for(let i=0;i<3;i++){
        const [ux,uy]=up[i],[vx,vy]=vp[i],side=i===0?1:-1,anchor=side>0?'start':'end';
        if(data.q===1){
          out+=text(ux+side*(compact?16:20),uy+8,`u${SUB[i]} = v${SUB[i]}`,size,COLORS[i],anchor);
        }else if(data.q<.4&&!compact){
          const lx=cx+[134,-134,0][i],topLabel=Math.max(...up.map(p=>p[1]))+41,bottomLabel=Math.min(...vp.map(p=>p[1]))-22;
          out+=line(ux,uy+10,lx,topLabel-25,COLORS[i],1.15,'opacity=".6"')+line(vx,vy-11,lx,bottomLabel+8,COLORS[i],1.15,'opacity=".6"');
          out+=text(lx,topLabel,`u${SUB[i]}`,size,COLORS[i])+text(lx,bottomLabel,`v${SUB[i]}`,size,COLORS[i]);
        }else if(Math.hypot(ux-vx,uy-vy)<(compact?30:40)){
          out+=text((ux+vx)/2+side*(compact?15:19),(uy+vy)/2+8,`u${SUB[i]}, v${SUB[i]}`,size,COLORS[i],anchor);
        }else{
          out+=text(ux+side*(compact?15:19),uy-12,`u${SUB[i]}`,size,COLORS[i],anchor);
          out+=text(vx+side*(compact?15:19),vy+27,`v${SUB[i]}`,size,COLORS[i],anchor);
        }
      }
    }
    return out;
  }

  function metrics(cx,data,labelY,valueY,compact=false){
    let out='';
    for(const [label,value,color,dx]of [['Positive',data.positive,COLORS[0],-205],['Negative',data.negative,COLORS[1],0],['Modality gap',data.modalityGap,INK,205]]){
      out+=text(cx+dx,labelY,label,compact?22:25,MUTED)+text(cx+dx,valueY,fixed(value),compact?29:33,color,'middle','font-weight="600"');
    }
    return out;
  }

  function powerLabel(x,y,power,anchor='end'){
    return `<text x="${f(x)}" y="${f(y)}" font-size="18" fill="${MUTED}" text-anchor="${anchor}">10<tspan baseline-shift="super" font-size="13">${esc(String(power).replace('-','−'))}</tspan></text>`;
  }

  function profile(cx,kind,tau,b=1,options={}){
    const top=options.top??379,bottom=options.bottom??469,left=cx-211,right=cx+237;
    const optimum=kind==='nce'?1:2*sigmoidOptimum(tau,b)-1;
    const samples=Array.from({length:401},(_,i)=>{const p=i/400;return{p,y:logLoss(kind,p,tau,b)/LN10}});
    const optimumLog=logLoss(kind,optimum,tau,b)/LN10;
    const maxLog=Math.max(...samples.map(p=>p.y));
    const lower=Math.floor(optimumLog)-.15,upper=Math.ceil(maxLog)+.15;
    const x=p=>left+p*(right-left),y=z=>bottom-(z-lower)/(upper-lower)*(bottom-top);
    const ticks=[Math.ceil(maxLog),Math.round((Math.ceil(maxLog)+Math.floor(optimumLog))/2),Math.floor(optimumLog)];
    let out=text(left,top-16,'Loss (log scale)',20,MUTED,'start');
    for(const t of [...new Set(ticks)])out+=line(left,y(t),right,y(t),'#e8edf4',1)+powerLabel(left-11,y(t)+6,t);
    out+=line(left,top,left,bottom,'#aab7c8',1.2)+line(left,bottom,right,bottom,'#aab7c8',1.2);
    for(const p of [0,.5,1])out+=line(x(p),bottom,x(p),bottom+5,'#aab7c8',1.2)+text(x(p),bottom+25,String(p).replace('-','−'),20,MUTED);
    const color=kind==='nce'?COLORS[0]:COLORS[1];
    const path=samples.map((p,i)=>(i?'L':'M')+' '+f(x(p.p))+' '+f(y(p.y))).join(' ');
    out+=`<path d="${path}" fill="none" stroke="${color}" stroke-width="2.9" stroke-linejoin="round" data-profile="${kind}"/>`;
    out+=line(x(optimum),y(optimumLog),x(optimum),bottom,color,1.3,'stroke-dasharray="3 4" opacity=".7"');
    out+=circle(x(optimum),y(optimumLog),5.7,color,'stroke="white" stroke-width="1.6" data-minimum="true"');
    out+=text(right,top-16,'● minimum',20,color,'end');
    out+=text((left+right)/2,bottom+57,'Positive similarity',23,INK);
    return out;
  }

  function comparisonSvg(tau=.08,b=1){
    const data=state(tau,b);
    let out=line(712.5,16,712.5,529,LINE,1.3);
    for(const [cx,kind,title,s]of [[356,'nce','InfoNCE',data.infoNCE],[1069,'sigmoid','Sigmoid',data.sigmoid]]){
      out+=text(cx-256,31,title,31,INK,'start','font-weight="600"')+text(cx+256,30,s.phase,24,MUTED,'end');
      out+=sphere(cx,161,112,s,true);
      out+=metrics(cx,s,292,332,true);
      out+=profile(cx,kind,tau,b);
    }
    return wrap(1425,536,'Temperature changes the sigmoid minimizer and preserves the InfoNCE endpoint',
      `Three paired unit embeddings in R3. Ordinary temperature tau=${tau}; sigmoid uses fixed b=${b}. Both profiles show actual objective values on logarithmic vertical axes and positive similarity from 0 to 1 on horizontal axes. InfoNCE is averaged over its two directions. Along CCEM, the negative similarity is (positive-3)/4. InfoNCE decreases strictly with positive similarity for every tau>0, so its minimum remains at positive=1. Sigmoid has positive=${data.positive}, negative=${data.negative}, and centroid gap=${data.modalityGap}. The fixed-b transition is tau=${data.thresholdTau}.`,out);
  }

  function geometrySvg(q=.8){
    const data=configuration(q);
    let out='';
    out+=marker(424,25,INK,'u',6)+text(440,33,'u',25,MUTED,'start')+marker(503,25,INK,'v',6.7)+text(521,33,'v',25,MUTED,'start');
    out+=sphere(356,249,166,data,false);
    out+=metrics(356,data,478,516);
    return wrap(712,550,'Three-instance CCEM on a unit sphere',
      `The three points in each view form parallel equilateral triangles in R3. Their corresponding embeddings are u_i=(sqrt(q) w_i,sqrt(1-q)) and v_i=(sqrt(q) w_i,-sqrt(1-q)). Here q=${data.q}, positive similarity=${data.positive}, negative similarity=${data.negative}, and view-centroid distance=${data.modalityGap}. All six vectors have norm one. This shows the sharp tradeoff family, not a temperature optimality claim.`,out);
  }

  function tradeoffSvg(positive=.6){
    const p=Number(positive);
    if(!Number.isFinite(p)||p< -1||p>1)throw new RangeError('Positive similarity must lie in [-1,1].');
    // Square plotting rectangle. The vertical range is the negative-similarity
    // half-plane of interest; the upper feasible boundary lies above this view.
    const left=148,top=62,side=400,right=left+side,bottom=top+side;
    const x=value=>left+(value+1)*side/2,y=value=>bottom-(value+1)*side;
    const minimum=(p-3)/4,endpoint=y(-.5),point=[x(p),y(minimum)];
    let out=`<path d="M ${left} ${top} H ${right} V ${endpoint} L ${left} ${bottom} Z" fill="#eff5ff"/><path d="M ${left} ${bottom} H ${right} V ${endpoint} Z" fill="#f2f4f7"/>`;
    for(const value of [-1,-.5,0])out+=line(left,y(value),right,y(value),'#e0e7f0',1)+text(left-17,y(value)+8,String(value).replace('-','−'),25,MUTED,'end');
    for(const value of [-1,0,1])out+=line(x(value),bottom,x(value),bottom+6,'#aab7c8',1.2)+text(x(value),bottom+38,String(value).replace('-','−'),25,MUTED);
    out+=line(left,top,left,bottom,'#aab7c8',1.4)+line(left,bottom,right,bottom,'#aab7c8',1.4);
    out+=line(left,bottom,right,endpoint,COLORS[1],3.5)+text(281,141,'Possible',26,MUTED)+text(438,420,'Impossible',26,MUTED);
    out+=line(left,25,left+43,25,COLORS[1],3.5)+text(left+57,33,'CCEM boundary',26,COLORS[1],'start');
    out+=circle(right,endpoint,8,'white',`stroke="${INK}" stroke-width="2"`)+text(right-13,endpoint-22,'Aligned simplex',25,INK,'end');
    if(p>-1&&p<1)out+=line(point[0],top,...point,COLORS[0],1.45,'stroke-dasharray="4 6" opacity=".65"');
    out+=circle(...point,7.5,COLORS[0],'stroke="white" stroke-width="2"');
    if(p===1)out+=circle(...point,11.3,'none',`stroke="${INK}" stroke-width="1.4"`);
    out+=text((left+right)/2,534,'Mean positive similarity',27);
    out+=`<text x="42" y="262" transform="rotate(-90 42 262)" font-size="27" text-anchor="middle" fill="${INK}">Mean negative similarity</text>`;
    return wrap(690,550,'The sharp three-instance similarity tradeoff',
      `A square plotting rectangle with horizontal mean positive similarity from -1 to 1 and vertical mean negative similarity from -1 to 0. The lower bound is mean negative >= (mean positive-3)/4. At positive=${p}, CCEM achieves the minimum ${minimum} with six unit vectors in R3.`,out);
  }

  function profileState(tau=.08,b=1){
    const data=state(tau,b);
    const samples=Array.from({length:201},(_,i)=>{
      const positive=-1+i/100;
      return{positive,negative:(positive-3)/4,infoNCE:loss('nce',positive,tau,b),sigmoid:loss('sigmoid',positive,tau,b),
        logInfoNCE:logLoss('nce',positive,tau,b),logSigmoid:logLoss('sigmoid',positive,tau,b)};
    });
    return {tau,b,samples,minimizers:{infoNCE:1,sigmoid:data.positive}};
  }

  global.SigmoidV15=Object.freeze({state,configuration,sigmoidOptimum,sigmoidResidual,loss,logLoss,profileState,comparisonSvg,geometrySvg,tradeoffSvg,colors:COLORS.slice()});
})(typeof window!=='undefined'?window:globalThis);

