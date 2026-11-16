const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const mobileNav = document.querySelector('.mobile-nav');
const media = matchMedia('(max-width: 680px)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

function setMenu(open, restoreFocus = false) {
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
  mobileNav.hidden = !open;
  document.body.classList.toggle('menu-open', open);
  document.querySelector('main').inert = open;
  document.querySelector('.site-footer').inert = open;
  document.querySelector('.mobile-contact-bar').inert = open;
  if (restoreFocus) toggle.focus();
}
toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
document.querySelector('.site-header .brand').addEventListener('click', () => setMenu(false));
media.addEventListener('change', () => setMenu(false));
document.addEventListener('keydown', event => {
  if (mobileNav.hidden) return;
  if (event.key === 'Escape') setMenu(false, true);
  if (event.key === 'Tab') {
    const focusable = [document.querySelector('.brand'), toggle, ...mobileNav.querySelectorAll('a')];
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});

let scrollQueued = false;
function updateHeader() { header.classList.toggle('scrolled', scrollY > 25); scrollQueued = false; }
addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateHeader); } }, { passive: true });
updateHeader();

if ('IntersectionObserver' in window) {
  const sections = [...document.querySelectorAll('main > section[id]')];
  const navLinks = [...document.querySelectorAll('.desktop-nav a')].filter(link => link.hash && link.pathname === location.pathname);
  const activeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(link => {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    });
  }, { rootMargin: '-10% 0px -55% 0px', threshold: 0 });
  sections.forEach(section => activeObserver.observe(section));
  if (!reducedMotion.matches) {
    document.documentElement.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
  }
}

document.querySelectorAll('.care-item').forEach(item => {
  item.addEventListener('toggle', () => {
    if (item.open) document.querySelectorAll('.care-item').forEach(other => { if (other !== item) other.open = false; });
  });
});

const address = '경기도 부천시 원미구 중동로254번길 104, 호정프라자 504호';
const toast = document.querySelector('.toast');
let toastTimer;
function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3500);
}
document.querySelector('.copy-address')?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(address); showToast('주소를 복사했습니다.'); }
  catch { showToast('주소를 길게 누르거나 선택하여 복사해 주세요.'); }
});

const sourceDialog = document.querySelector('.sources-dialog');
document.querySelector('.sources-button')?.addEventListener('click', () => sourceDialog?.showModal());
document.querySelector('.dialog-close')?.addEventListener('click', () => sourceDialog?.close());
sourceDialog?.addEventListener('click', event => { if (event.target === sourceDialog) { const rect = sourceDialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) sourceDialog.close(); } });
