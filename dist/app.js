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

const contactDialog = document.createElement('dialog');
if (typeof contactDialog.showModal === 'function') {
  contactDialog.className = 'contact-dialog';
  contactDialog.setAttribute('aria-labelledby', 'contact-title');
  contactDialog.setAttribute('aria-describedby', 'contact-description');
  contactDialog.innerHTML = `
    <div class="dialog-heading"><h2 id="contact-title" tabindex="-1" autofocus>전화 · 예약 문의</h2><button type="button" class="dialog-close contact-dialog-close" aria-label="문의 안내 닫기">×</button></div>
    <p id="contact-description">예약과 상담 문의는 전화로 안내해 드립니다.<br>궁금한 점과 원하시는 방문 일시를 말씀해 주세요.</p>
    <div class="contact-number"><span>부천 옥토한의원</span><strong>032-322-8575</strong></div>
    <div class="contact-dialog-actions"><a class="button button-primary" href="tel:0323228575">전화 걸기 <span aria-hidden="true">↗</span></a><button class="button copy-phone" type="button">번호 복사 <span aria-hidden="true">⧉</span></button></div>
    <p class="contact-copy-status" role="status" aria-live="polite"></p>
    <a class="text-link contact-visit-link" href="index.html#visit">진료시간 · 오시는 길 <span aria-hidden="true">→</span></a>`;
  const visitLink = contactDialog.querySelector('.contact-visit-link');
  if (document.querySelector('#visit')) visitLink.href = '#visit';
  const inquirySelector = 'a[data-contact-topic], a[href="tel:0323228575"]';
  document.querySelectorAll(inquirySelector).forEach(link => link.setAttribute('aria-haspopup', 'dialog'));
  document.body.append(contactDialog);
  const copyStatus = contactDialog.querySelector('.contact-copy-status');
  const phoneNumber = contactDialog.querySelector('.contact-number strong').textContent;
  let returnFocus;
  // Delegation also covers inquiry links rendered later by the dietary page.
  document.addEventListener('click', event => {
    const link = event.target.closest(inquirySelector);
    if (!link || contactDialog.contains(link) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    returnFocus = link.closest('.mobile-nav') ? toggle : link;
    contactDialog.querySelector('#contact-title').textContent = link.dataset.contactTopic || '전화 · 예약 문의';
    copyStatus.textContent = '';
    contactDialog.showModal();
  });
  contactDialog.querySelector('.contact-dialog-close').addEventListener('click', () => contactDialog.close());
  contactDialog.addEventListener('close', () => returnFocus?.focus({ preventScroll: true }));
  contactDialog.addEventListener('click', event => {
    if (event.target !== contactDialog) return;
    const rect = contactDialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) contactDialog.close();
  });
  contactDialog.querySelector('.copy-phone').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber);
      copyStatus.textContent = '전화번호를 복사했습니다.';
    } catch {
      copyStatus.textContent = '위 전화번호를 길게 누르거나 선택하여 복사해 주세요.';
    }
  });
  visitLink.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    returnFocus = null;
    contactDialog.close();
  });
}
