
(function(){
  'use strict';
  async function copyText(text){
    try{if(window.isSecureContext&&navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);return true;}}catch(error){}
    var buffer=document.createElement('textarea');buffer.value=text;buffer.readOnly=true;buffer.className='bibtex-copy-buffer';buffer.setAttribute('aria-hidden','true');
    var active=document.activeElement;document.body.appendChild(buffer);buffer.focus({preventScroll:true});buffer.select();buffer.setSelectionRange(0,text.length);
    var copied=false;try{copied=document.execCommand('copy');}catch(error){}buffer.remove();
    if(active&&active.focus)active.focus({preventScroll:true});return copied;
  }
  document.addEventListener('click',async function(event){
    var button=event.target.closest('[data-copy-bibtex]');if(!button)return;
    var code=document.getElementById(button.dataset.copyBibtex);if(!code)return;
    var status=button.parentElement.querySelector('.citation-status');
    var copied=await copyText(code.textContent);
    if(copied){status.textContent='Copied.';return;}
    var range=document.createRange();range.selectNodeContents(code);var selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
    status.textContent='Select and copy the BibTeX below.';
  });
})();
