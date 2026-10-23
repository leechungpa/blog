
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const fmt=(v,d=3)=>(Math.abs(v)<.5/10**d?0:v).toFixed(d).replace('-','−');
  let introMode='irregular';
  function intro(selected=null){
    const s=IntroV14.state(introMode);
    $('intro-geometry').innerHTML=IntroV14.compactGeometrySvg(introMode,selected);
    if(!selected)$('intro-matrix').innerHTML=IntroV14.compactMatrixSvg(introMode);
    $('intro-mean-positive').textContent=fmt(s.meanPositive);
    $('intro-mean-negative').textContent=fmt(s.meanNegative);
    $('fig-pairs').dataset.mode=introMode;
  }
  $('intro-mode').addEventListener('click',e=>{
    const b=e.target.closest('[data-intro-mode]');if(!b)return;
    introMode=b.dataset.introMode;
    for(const button of $('intro-mode').querySelectorAll('button'))button.setAttribute('aria-pressed',String(button===b));
    intro();
  });
  for(const type of ['pointerover','focusin','click'])$('intro-matrix').addEventListener(type,e=>{
    const cell=e.target.closest('.four-pair-cell');if(!cell)return;
    intro({i:+cell.dataset.i,j:+cell.dataset.j});
  });
  $('intro-matrix').addEventListener('pointerleave',()=>intro());
  $('intro-matrix').addEventListener('focusout',e=>{if(!$('intro-matrix').contains(e.relatedTarget))intro();});
  intro();

  $('loss-component').innerHTML=BlogLossV17.render();
  BlogLossV17.bind($('loss-component'));

  function reference(){
    const t=+$('reference-range').value;
    $('reference-negative').innerHTML=BlogReferenceV17.renderNegative();
    $('reference-aligned').innerHTML=BlogReferenceV17.renderAligned(t);
    $('reference-value').value=t===0?'One point':t===1?'Simplex ETF':'Intermediate';
    $('fig-reference').dataset.amount=t;
  }
  $('reference-range').addEventListener('input',reference);reference();
  $('reference-presets').addEventListener('click',e=>{const b=e.target.closest('[data-reference]');if(b){$('reference-range').value=b.dataset.reference;reference();}});

  function ccem(){
    const p=+$('ccem-range').value;
    $('ccem-value').value=fmt(p,2);
    $('ccem-tradeoff').innerHTML=BlogSigmoidV17.renderTradeoff(p);
    $('ccem-geometry').innerHTML=BlogSigmoidV17.renderGeometry((p+1)/2);
    $('fig-ccem').dataset.positive=p;
  }
  $('ccem-range').addEventListener('input',ccem);ccem();

  function temperature(){
    const tau=+$('temperature-range').value;
    $('temperature-value').value=fmt(tau,3);
    $('temperature-comparison').innerHTML=BlogSigmoidV17.renderComparison(tau,1);
    $('fig-temperature').dataset.temperature=tau;
  }
  $('temperature-range').addEventListener('input',temperature);temperature();

  let pointerActive=false,pointerStart=0,detentLocked=false;
  const range=$('batch-range');
  function batch(){
    let p=+range.value;
    if(pointerActive){
      if(detentLocked)p=1;
      else if((pointerStart<1&&p>=1)||(pointerStart>1&&p<=1)){p=1;detentLocked=true;}
      range.value=p;
    }
    const reveal=$('batch-reveal').checked;
    $('batch-geometry').innerHTML=BlogBatchV17.renderGeometry(p);
    $('batch-matrix').innerHTML=BlogBatchV17.renderMatrix(p,reveal);
    $('batch-moments').innerHTML=BlogBatchV17.renderMoments(p);
    $('batch-stage').textContent=p<=1?'1 · Relative rotation':'2 · Deformation toward a simplex ETF';
    $('batch-value').value=p<=1?`${Math.round(90*p)}°`:`${Math.round(100*(p-1))}%`;
    $('fig-batch').dataset.progress=p;
    $('batch-reveal').disabled=p>1;
    for(const b of $('batch-presets').querySelectorAll('button'))b.setAttribute('aria-pressed',String(Math.abs(+b.dataset.batchValue-p)<1e-6));
  }
  range.addEventListener('pointerdown',()=>{pointerActive=true;pointerStart=+range.value;detentLocked=false;});
  for(const event of ['pointerup','pointercancel'])window.addEventListener(event,()=>{pointerActive=false;detentLocked=false;});
  range.addEventListener('input',batch);$('batch-reveal').addEventListener('change',batch);
  $('batch-presets').addEventListener('click',e=>{const b=e.target.closest('[data-batch-value]');if(b){pointerActive=false;range.value=b.dataset.batchValue;batch();}});
  batch();

  $('class-pair-component').innerHTML=BlogPairsV19.render();
  BlogPairsV19.bind($('class-pair-component'));
  $('class-optimum-component').innerHTML=BlogClassV17.renderOptimum(.4,{includeVarianceDefinition:true});
  BlogClassV17.bind($('class-optimum-component'));
  function alpha(){
    const a=+$('class-alpha').value;
    $('class-alpha-value').value=fmt(a,2);
    BlogClassV17.updateOptimum($('class-optimum-component'),a);
    $('fig-class-optimum').dataset.alpha=a;
  }
  $('class-alpha').addEventListener('input',alpha);alpha();
  document.documentElement.dataset.articleReady='true';
})();

