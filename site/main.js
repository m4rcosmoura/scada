/* ============================================
   INSTITUTO SÃO JOÃO BOSCO — main.js
   ============================================ */

/* ---- Header scroll ---- */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 20);
}, { passive: true });

/* ---- Hamburger ---- */
const hamburger = document.getElementById('hamburger');
const mainNav   = document.getElementById('main-nav');
if (hamburger && mainNav) {
  hamburger.addEventListener('click', () => {
    const open = mainNav.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
  });
  mainNav.querySelectorAll('a').forEach(l => l.addEventListener('click', () => {
    mainNav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
  }));
}

/* ---- Reveal on scroll ---- */
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    setTimeout(() => e.target.classList.add('visible'), Number(e.target.dataset.delay || 0));
    revealObs.unobserve(e.target);
  });
}, { threshold: 0.1 });
document.querySelectorAll('[data-reveal]').forEach(el => revealObs.observe(el));

/* ---- Counter ---- */
document.querySelectorAll('[data-count]').forEach(el => {
  new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    const target = parseInt(el.dataset.count, 10), t0 = performance.now();
    const run = now => {
      const p = Math.min((now - t0) / 1400, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * target);
      if (p < 1) requestAnimationFrame(run);
    };
    requestAnimationFrame(run);
  }, { threshold: .5 }).observe(el);
});

/* ---- Banner ---- */
const banner = document.getElementById('meu-banner-flutuante');
if (banner) {
  const K = 'isjb_banner_v2';
  if (!sessionStorage.getItem(K)) setTimeout(() => banner.classList.add('visivel'), 3500);
  const bye = () => { banner.classList.remove('visivel'); sessionStorage.setItem(K, '1'); };
  document.getElementById('fechar-banner')?.addEventListener('click', bye);
  banner.querySelector('.botao-cta')?.addEventListener('click', bye);
}

/* ---- Form cadastro ---- */
const cadastroForm = document.getElementById('form-cadastro');
if (cadastroForm) {
  cadastroForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = cadastroForm.querySelector('button[type="submit"]'), orig = btn.textContent;
    btn.textContent = 'Enviando...'; btn.disabled = true;
    setTimeout(() => {
      btn.textContent = '✓ Cadastro enviado!';
      btn.style.cssText = 'background:#166534;color:#fff';
      cadastroForm.reset();
      setTimeout(() => { btn.textContent = orig; btn.style.cssText = ''; btn.disabled = false; }, 4000);
    }, 1200);
  });
}

/* ============================================================
   PÁGINA DE PROJETOS
   ============================================================ */
const ICONS_LOCAL = `<svg width="12" height="12" viewBox="0 0 13 13" fill="none"><path d="M6.5 1C4.3 1 2.5 2.8 2.5 5c0 3 4 7 4 7s4-4 4-7c0-2.2-1.8-4-4-4Z" stroke="currentColor" stroke-width="1.4"/><circle cx="6.5" cy="5" r="1.3" stroke="currentColor" stroke-width="1.3"/></svg>`;

/* ---- Spinner ---- */
function showGridSpinner() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;
  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:5rem 0;color:#aaa;font-family:'Roboto',sans-serif;font-size:.9rem;">
      <div style="width:36px;height:36px;border:3px solid #e8ecf5;border-top-color:#1f356e;border-radius:50%;margin:0 auto 1.2rem;animation:_spin .7s linear infinite;"></div>
      Carregando projetos...
    </div>
    <style>@keyframes _spin{to{transform:rotate(360deg)}}</style>`;
}

/* ---- Cria um card DOM ---- */
function createCard(p) {
  const card = document.createElement('article');
  card.className = 'blog-card';
  card.tabIndex  = 0;
  card.setAttribute('role',        'button');
  card.setAttribute('aria-label',  `Ver projeto: ${p.titulo}`);
  card.dataset.slug = p.slug;

  const coverHtml = p.capa
    ? `<img src="${p.capa}" alt="${p.titulo}" loading="lazy"/>`
    : `<div style="position:absolute;inset:0;background:linear-gradient(135deg,#1f356e,#4a72b8)"></div>`;

  card.innerHTML = `
    <div class="blog-card-cover">
      ${coverHtml}
      <span class="blog-card-status status--${p.status}">${p.statusLabel}</span>
    </div>
    <div class="blog-card-body">
      <h3>${p.titulo}</h3>
      <p>${p.resumo}</p>
    </div>
    <div class="blog-card-footer">
      <span class="blog-card-meta">${ICONS_LOCAL} ${p.local || ''}</span>
      <span class="blog-card-cta">
        Saiba mais
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </div>`;

  /* começa invisível — animação de scroll vai revelar */
  card.style.cssText = 'opacity:0;transform:translateY(28px) scale(.97)';

  const open = () => openModal(p.slug);
  card.addEventListener('click', open);
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
  });

  return card;
}

/* ---- Renderiza todos os cards ---- */
function renderCards(projetos) {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (!projetos.length) {
    grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;padding:3rem;color:#aaa;font-family:'Roboto',sans-serif;">Nenhum projeto encontrado.</p>`;
    return;
  }

  projetos.forEach(p => grid.appendChild(createCard(p)));
  animateCardsOnScroll();
  applyTilt();
}

/* ---- Animação de entrada escalonada por coluna ---- */
function animateCardsOnScroll() {
  const grid  = document.getElementById('blog-grid');
  const cards = [...grid.querySelectorAll('.blog-card')];
  if (!cards.length) return;

  const obs = new IntersectionObserver(entries => {
    const cols = Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(' ').length);
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const col   = cards.indexOf(entry.target) % cols;
      const delay = col * 85;
      setTimeout(() => {
        entry.target.style.transition =
          'opacity .5s ease, transform .58s cubic-bezier(.22,1,.36,1), box-shadow .35s ease, border-color .35s ease';
        entry.target.style.opacity   = '1';
        entry.target.style.transform = 'translateY(0) scale(1)';
      }, delay);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.07, rootMargin: '0px 0px -30px 0px' });

  cards.forEach(c => obs.observe(c));
}

/* ---- Efeito tilt 3D no hover ---- */
function applyTilt() {
  document.querySelectorAll('.blog-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.boxShadow   = '0 14px 40px rgba(31,53,110,.18)';
      card.style.borderColor = 'rgba(31,53,110,.16)';
      card.style.zIndex      = '2';
    });
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      card.style.transform       = `perspective(700px) rotateX(${-dy*5}deg) rotateY(${dx*5}deg) translateZ(6px)`;
      card.style.backgroundImage = `radial-gradient(circle at ${((e.clientX-r.left)/r.width*100).toFixed()}% ${((e.clientY-r.top)/r.height*100).toFixed()}%, rgba(224,174,3,.08) 0%, transparent 65%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition      = 'all .45s cubic-bezier(.22,1,.36,1)';
      card.style.transform       = 'perspective(700px) rotateX(0) rotateY(0) translateZ(0)';
      card.style.boxShadow       = '0 2px 12px rgba(31,53,110,.07)';
      card.style.borderColor     = 'rgba(31,53,110,.06)';
      card.style.backgroundImage = 'none';
      card.style.zIndex          = '';
    });
  });
}

/* ============================================================
   LIGHTBOX CARROSSEL
   ============================================================ */
const lb = {
  el:       document.getElementById('lightbox'),
  img:      document.getElementById('lb-img'),
  counter:  document.getElementById('lb-counter'),
  thumbsEl: document.getElementById('lb-thumbs'),
  srcs: [], cur: 0,

  open(srcs, idx) {
    if (!srcs.length || !this.el) return;
    this.srcs = srcs; this.cur = idx;
    this.renderThumbs();
    this.show(idx, false);
    this.el.classList.add('open');
    document.body.style.overflow = 'hidden';
  },
  close() { this.el?.classList.remove('open'); document.body.style.overflow = ''; },
  show(idx, anim = true) {
    this.cur = (idx + this.srcs.length) % this.srcs.length;
    if (anim) {
      this.img.classList.add('fading');
      setTimeout(() => { this.img.src = this.srcs[this.cur]; this.img.classList.remove('fading'); }, 180);
    } else {
      this.img.src = this.srcs[this.cur];
    }
    if (this.counter) this.counter.textContent = `${this.cur + 1} / ${this.srcs.length}`;
    this.updateThumbs();
  },
  prev() { this.show(this.cur - 1); },
  next() { this.show(this.cur + 1); },
  renderThumbs() {
    if (!this.thumbsEl) return;
    this.thumbsEl.innerHTML = this.srcs.map((s, i) =>
      `<div class="lb-thumb${i === this.cur ? ' active' : ''}" data-i="${i}">
        <img src="${s}" loading="lazy"/>
      </div>`
    ).join('');
    this.thumbsEl.querySelectorAll('.lb-thumb').forEach(t =>
      t.addEventListener('click', () => this.show(+t.dataset.i))
    );
  },
  updateThumbs() {
    this.thumbsEl?.querySelectorAll('.lb-thumb').forEach((t, i) =>
      t.classList.toggle('active', i === this.cur)
    );
    this.thumbsEl?.querySelector('.lb-thumb.active')
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  },
};

document.getElementById('lb-close')?.addEventListener('click',  () => lb.close());
document.getElementById('lb-prev')?.addEventListener('click',   () => lb.prev());
document.getElementById('lb-next')?.addEventListener('click',   () => lb.next());
document.getElementById('lightbox')?.addEventListener('click',  e => { if (e.target.id === 'lightbox') lb.close(); });
document.addEventListener('keydown', e => {
  if (!lb.el?.classList.contains('open')) return;
  if (e.key === 'ArrowLeft')  lb.prev();
  if (e.key === 'ArrowRight') lb.next();
  if (e.key === 'Escape')     lb.close();
});
let _tx = 0;
document.getElementById('lightbox')?.addEventListener('touchstart', e => { _tx = e.touches[0].clientX; }, { passive: true });
document.getElementById('lightbox')?.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - _tx;
  if (Math.abs(dx) > 40) dx < 0 ? lb.next() : lb.prev();
}, { passive: true });

/* ============================================================
   MODAL — fetch projetos/<slug>.html e injeta no painel
   ============================================================ */
const modal        = document.getElementById('post-modal');
const modalContent = document.getElementById('modal-content');
const modalClose   = document.getElementById('modal-close');
const modalOverlay = document.getElementById('modal-overlay');

async function openModal(slug) {
  if (!modal) return;

  modalContent.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:320px;">
      <div style="width:36px;height:36px;border:3px solid #e8ecf5;border-top-color:#1f356e;
                  border-radius:50%;animation:_spin .7s linear infinite;"></div>
    </div>`;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  modalClose?.focus();

  try {
    const res = await fetch(`projetos/${slug}.html`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    /* injeta o HTML — imagens já são base64, nada para reescrever */
    modalContent.innerHTML = html;

    /* executa o script inline do post (define __LB_SRCS__ para o lightbox) */
    const scriptEl = modalContent.querySelector('script');
    if (scriptEl) {
      try { eval(scriptEl.textContent); } catch(err) { console.warn(err); }
      scriptEl.remove();
    }
    const lbSrcs = window.__LB_SRCS__ || [];
    delete window.__LB_SRCS__;

    if (lbSrcs.length) {
      modalContent.querySelectorAll('.post-galeria img').forEach(img => {
        img.addEventListener('click', () => lb.open(lbSrcs, +(img.dataset.lbIdx || 0)));
      });
    }

  } catch (err) {
    modalContent.innerHTML = `
      <div style="padding:3rem;text-align:center;color:#aaa;font-family:'Roboto',sans-serif;">
        Não foi possível carregar este projeto.<br><small>${err.message}</small>
      </div>`;
    console.error('openModal error:', err);
  }
}

function closeModal() {
  modal?.classList.remove('open');
  document.body.style.overflow = '';
}
modalClose?.addEventListener('click',  closeModal);
modalOverlay?.addEventListener('click', closeModal);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !lb.el?.classList.contains('open')) closeModal();
});

/* ============================================================
   INIT PROJETOS — lê index.json e renderiza os cards
   ============================================================ */
if (document.getElementById('blog-grid')) {
  showGridSpinner();
  fetch('projetos/index.json')
    .then(r => {
      if (!r.ok) throw new Error(`Não encontrei projetos/index.json (${r.status})`);
      return r.json();
    })
    .then(projetos => renderCards(projetos))
    .catch(err => {
      const grid = document.getElementById('blog-grid');
      if (grid) grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#bbb;font-family:'Roboto',sans-serif;font-size:.9rem;">
          Erro ao carregar projetos.<br>
          <small style="color:#ddd;">${err.message}</small>
        </div>`;
      console.error(err);
    });
}

/* ============================================================
   ADMIN — gera <slug>.html + zip para salvar em projetos/
   ============================================================ */
function initAdmin() {
  if (!document.getElementById('admin-page')) return;

  const loginSection = document.getElementById('admin-login');
  const panel        = document.getElementById('admin-panel');
  const loginError   = document.getElementById('login-error');
  const ADMIN_PASS   = 'isjb2025';

  const checkAuth = () => {
    const ok = sessionStorage.getItem('isjb_admin_auth') === '1';
    loginSection.style.display = ok ? 'none' : 'flex';
    panel.style.display        = ok ? 'block'  : 'none';
  };

  document.getElementById('admin-login-form')?.addEventListener('submit', e => {
    e.preventDefault();
    if (document.getElementById('admin-password').value === ADMIN_PASS) {
      sessionStorage.setItem('isjb_admin_auth', '1');
      loginError.style.display = 'none';
      checkAuth();
    } else {
      loginError.style.display = 'block';
    }
  });

  document.getElementById('admin-logout')?.addEventListener('click', () => {
    sessionStorage.removeItem('isjb_admin_auth'); checkAuth();
  });

  /* Rich text toolbar */
  document.querySelectorAll('[data-cmd]').forEach(btn => {
    btn.addEventListener('mousedown', e => {
      e.preventDefault();
      document.getElementById('rich-editor')?.focus();
      document.execCommand(btn.dataset.cmd, false, btn.dataset.val || null);
    });
  });

  /* Preview capa */
  document.getElementById('pf-capa')?.addEventListener('change', function () {
    const file = this.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => {
      document.getElementById('capa-preview').innerHTML =
        `<img src="${ev.target.result}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-top:.5rem"/>`;
    };
    r.readAsDataURL(file);
  });

  /* Preview galeria */
  document.getElementById('pf-galeria')?.addEventListener('change', function () {
    const prev = document.getElementById('galeria-preview');
    prev.innerHTML = '';
    [...this.files].forEach(file => {
      const r = new FileReader();
      r.onload = ev => {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.style.cssText = 'width:100%;height:60px;object-fit:cover;border-radius:6px';
        prev.appendChild(img);
      };
      r.readAsDataURL(file);
    });
  });

  /* ---- GERAR ZIP ---- */
  document.getElementById('projeto-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Gerando...'; btn.disabled = true;

    try {
      const titulo        = document.getElementById('pf-titulo').value.trim();
      const resumo        = document.getElementById('pf-resumo').value.trim();
      const status        = document.getElementById('pf-status').value;
      const local         = document.getElementById('pf-local').value.trim()         || 'Brasília / DF';
      const periodicidade = document.getElementById('pf-periodicidade').value.trim() || 'A definir';
      const publico       = document.getElementById('pf-publico').value.trim()       || 'Comunidade';
      const conteudo      = document.getElementById('rich-editor').innerHTML.trim();
      const slug          = slugify(titulo);

      const statusMap   = { ativo: 'Em andamento', breve: 'Em breve', realizado: 'Realizado' };
      const statusLabel = statusMap[status] || status;

      const capaFile = document.getElementById('pf-capa').files[0];
      const galFiles = [...(document.getElementById('pf-galeria')?.files || [])];

      /* Converte arquivo para base64 */
      const toBase64 = file => new Promise((res, rej) => {
        const r = new FileReader();
        r.onload  = ev => res(ev.target.result); /* resultado já é data:mime;base64,... */
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      /* Capa → base64 */
      const capaB64   = capaFile ? await toBase64(capaFile) : null;
      const coverHtml = capaB64
        ? `<div class="post-header-cover"><img src="${capaB64}" alt="${titulo}"/></div>`
        : `<div class="post-header-cover" style="background:linear-gradient(135deg,#1f356e,#4a72b8)"></div>`;

      /* Galeria → base64 */
      const galB64 = await Promise.all(galFiles.map(toBase64));

      const galeriaHtml = galB64.length
        ? `<div class="post-galeria">${galB64.map((src, i) =>
            `<img src="${src}" alt="${titulo} foto ${i+1}" loading="lazy" data-lb-idx="${i}" style="cursor:zoom-in"/>`
          ).join('')}</div>` : '';

      const lbScript = galB64.length
        ? `<script>window.__LB_SRCS__=[${galB64.map(s=>`"${s}"`).join(',')}];<\/script>` : '';

      /* ---- HTML DO POST — autocontido, imagens em base64 ---- */
      const postHtml = `<!-- POST:${slug} -->
<div class="post-header">
  ${coverHtml}
  <div class="post-header-overlay"></div>
  <div class="post-header-info">
    <div class="post-header-tags">
      <span class="post-tag post-tag--status-${status}">${statusLabel}</span>
    </div>
    <h2>${titulo}</h2>
  </div>
</div>
<div class="post-body">
  ${conteudo}
  ${galeriaHtml}
  <div class="post-info-chips">
    <span class="post-chip">${periodicidade}</span>
    <span class="post-chip">${local}</span>
    <span class="post-chip">${publico}</span>
  </div>
  <div class="post-cta">
    <p>Quer apoiar este projeto?</p>
    <a href="index.html#cadastrese" class="btn-primary"
       style="font-size:.88rem;padding:.65rem 1.5rem;">Entrar em contato</a>
  </div>
</div>
${lbScript}`;

      /* ---- DOWNLOAD direto — apenas o .html, sem zip ---- */
      const blob = new Blob([postHtml], { type: 'text/html;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `${slug}.html`; a.click();
      URL.revokeObjectURL(url);

      /* mostra instruções */
      const box = document.getElementById('instrucoes-pos');
      if (box) {
        document.querySelectorAll('.i-slug').forEach(el => el.textContent = slug);
        document.getElementById('i-json').textContent = JSON.stringify({
          slug,
          titulo,
          resumo,
          status,
          statusLabel,
          local,
          capa: null,
        }, null, 2);
        box.style.display = 'block';
        box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }

      /* reset form */
      e.target.reset();
      document.getElementById('rich-editor').innerHTML    = '';
      document.getElementById('capa-preview').innerHTML   = '';
      document.getElementById('galeria-preview').innerHTML = '';

    } catch (err) {
      alert('Erro ao gerar o arquivo: ' + err.message);
      console.error(err);
    }

    btn.textContent = orig; btn.disabled = false;
  });

  checkAuth();
}

function slugify(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

initAdmin();
