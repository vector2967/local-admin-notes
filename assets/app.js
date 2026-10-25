// Sidebar TOC (built from headings), mobile drawer, scrollspy, cloze toggle.
(function () {
  const body = document.body;
  const toc = document.querySelector('.toc');
  const openNav = (on) => {
    body.classList.toggle('nav-open', on);
    document.querySelector('.menu-btn')?.setAttribute('aria-expanded', on);
    if (on) document.querySelector('.toc a.active')?.scrollIntoView({ block: 'center' });
  };
  document.querySelector('.menu-btn')?.addEventListener('click', () => openNav(!body.classList.contains('nav-open')));
  document.querySelector('.scrim')?.addEventListener('click', () => openNav(false));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') openNav(false); });
  document.querySelector('.sidebar').addEventListener('click', (e) => { if (e.target.closest('a')) openNav(false); });

  if (toc) {
    const links = new Map();
    const root = document.createElement('ul');
    document.querySelectorAll('.chapter').forEach((sec) => {
      const h2 = sec.querySelector('h2');
      if (!h2) return;
      const li = document.createElement('li');
      li.innerHTML = `<a href="#${sec.id}">${h2.textContent}</a>`;
      links.set(sec.id, li.firstChild);
      const subs = sec.querySelectorAll('h3[id]');
      if (subs.length) {
        const ul = document.createElement('ul');
        subs.forEach((h3) => {
          const a = document.createElement('a');
          a.href = '#' + h3.id;
          a.textContent = h3.textContent;
          links.set(h3.id, a);
          ul.appendChild(document.createElement('li')).appendChild(a);
        });
        li.appendChild(ul);
      }
      root.appendChild(li);
    });
    toc.appendChild(root);

    // scrollspy: last heading above the 30% line wins
    const heads = [...document.querySelectorAll('.chapter[id], .chapter h3[id]')];
    let current;
    const spy = () => {
      const line = innerHeight * 0.3;
      let hit = heads[0];
      for (const h of heads) { if (h.getBoundingClientRect().top < line) hit = h; else break; }
      if (!hit || hit === current) return;
      links.get(current?.id)?.classList.remove('active');
      current = hit;
      const a = links.get(hit.id);
      a?.classList.add('active');
      if (!body.classList.contains('nav-open')) a?.scrollIntoView({ block: 'nearest' });
    };
    addEventListener('scroll', spy, { passive: true });
    spy();
  }

  const clozeBtn = document.querySelector('.cloze-toggle');
  if (clozeBtn) {
    clozeBtn.addEventListener('click', () => {
      const on = body.classList.toggle('cloze-on');
      clozeBtn.setAttribute('aria-pressed', on);
      clozeBtn.textContent = on ? '가리기 끄기' : '핵심어 가리기';
      document.querySelectorAll('.cloze.shown').forEach((c) => c.classList.remove('shown'));
      document.querySelector('.cloze-reveal').hidden = !on;
    });
    document.querySelector('.cloze-reveal')?.addEventListener('click', () =>
      document.querySelectorAll('.cloze').forEach((c) => c.classList.add('shown')));
    document.addEventListener('click', (e) => {
      const c = e.target.closest('.cloze');
      if (c && body.classList.contains('cloze-on')) c.classList.toggle('shown');
    });
  }
})();
