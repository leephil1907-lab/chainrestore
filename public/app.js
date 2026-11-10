document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.nav-inner').forEach(header=>{
    const nav=header.querySelector('.nav-links');
    if(!nav)return;
    let button=header.querySelector('.menu-btn');
    if(!button){
      button=document.createElement('button');
      button.className='menu-btn';
      button.type='button';
      button.setAttribute('aria-label','Open navigation');
      button.setAttribute('aria-expanded','false');
      button.innerHTML='<span aria-hidden="true">☰</span>';
      const actions=header.querySelector('.nav-actions');
      if(actions)actions.append(button);else header.append(button);
    }
    const close=()=>{nav.classList.remove('open');button.setAttribute('aria-expanded','false');button.setAttribute('aria-label','Open navigation');button.innerHTML='<span aria-hidden="true">☰</span>'};
    button.addEventListener('click',()=>{
      const open=!nav.classList.contains('open');
      nav.classList.toggle('open',open);
      button.setAttribute('aria-expanded',String(open));
      button.setAttribute('aria-label',open?'Close navigation':'Open navigation');
      button.innerHTML=open?'<span aria-hidden="true">✕</span>':'<span aria-hidden="true">☰</span>';
    });
    nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',close));
    document.addEventListener('keydown',event=>{if(event.key==='Escape')close()});
    document.addEventListener('click',event=>{if(!header.contains(event.target))close()});
  });
  document.querySelectorAll('[data-year]').forEach(element=>element.textContent=new Date().getFullYear());
});