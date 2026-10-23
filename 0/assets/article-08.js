
/*
 * v16 label-only wrappers. No pair membership, geometry, loss, or optimizer
 * changes. Load after class_pairs_v13.js and class_alpha_v13.js.
 * Symbols use the same LaTeX mathcal L and lowercase upright subscripts as
 * the mixture formula. All paths are embedded; no external assets load.
 */
(function(global){
  'use strict';
  const SYMBOLS = {"self": {"math": "\\mathcal L_{\\mathrm{self}}", "url": "assets/figure-b099f2f13fae.svg", "ratio": 1.837611767339575}, "sup": {"math": "\\mathcal L_{\\mathrm{sup}}", "url": "assets/figure-98e385ddd9d1.svg", "ratio": 1.6467403965336649}};
  const TITLE_WIDTH = {'Self-supervised loss':311.2319984436035,'Supervised loss':245.43999862670898};
  const f=n=>Number(n.toFixed(3));
  function addLossSymbol(svg,title,key){
    const re=new RegExp('<text([^>]*)>'+title+'</text>');
    let changed=false;
    const result=svg.replace(re,(full,attrs)=>{
      const xMatch=attrs.match(/\bx="([^"]+)"/);
      if(!xMatch)throw new Error('Missing loss-heading x coordinate.');
      const center=+xMatch[1],h=35,w=SYMBOLS[key].ratio*h,gap=14;
      const x=center-(w+gap)/2;
      const symbolX=center-(TITLE_WIDTH[title]+gap+w)/2+TITLE_WIDTH[title]+gap;
      const adjusted=attrs.replace(/\bx="[^"]+"/,'x="'+f(x)+'"');
      changed=true;
      return '<g class="class-loss-heading-v16" data-loss="'+key+'">'
        +'<text'+adjusted+'>'+title+'</text>'
        +'<image class="class-loss-symbol-v16" data-loss-symbol="'+key+'" x="'+f(symbolX)
        +'" y="7" width="'+f(w)+'" height="'+h+'" href="'+SYMBOLS[key].url
        +'" role="math" aria-label="L_'+key+'"/></g>';
    });
    if(!changed)throw new Error('Could not find the '+title+' heading.');
    return result;
  }
  function tensionSvg(options){
    if(!global.ClassPairsV13)throw new Error('Load ClassPairsV13 before ClassLabelsV16.');
    let svg=global.ClassPairsV13.tensionSvg(options);
    svg=addLossSymbol(svg,'Self-supervised loss','self');
    return addLossSymbol(svg,'Supervised loss','sup');
  }
  function lossSvg(alpha,options){
    if(!global.ClassAlphaV13)throw new Error('Load ClassAlphaV13 before ClassLabelsV16.');
    const original=global.ClassAlphaV13.lossSvg(alpha,options);
    const re=/<text([^>]*)>W<\/text>/;
    let changed=false;
    let svg=original.replace(re,(full,attrs)=>{
      const xMatch=attrs.match(/\bx="([^"]+)"/);
      if(!xMatch)throw new Error('Missing variance-axis x coordinate.');
      changed=true;
      return '<g class="class-variance-caption-v16">'
        +'<text'+attrs+'>Within-class variance</text>'
        +'<text x="'+xMatch[1]+'" y="435" font-size="22" fill="#647184" text-anchor="middle">'
        +'mean squared distance to the class center</text></g>';
    });
    if(!changed)throw new Error('Could not find the W axis label.');
    return svg.replace(/Minimum · W = [^<]+/g,'Minimum').replace('viewBox="0 0 700 420"','viewBox="0 0 700 456"');
  }
  global.ClassLabelsV16={tensionSvg,lossSvg};
})(window);

