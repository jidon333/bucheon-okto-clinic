import { REFERENCE_GRADES, validateGuides, filterRows } from './diet-model.mjs';

const buttons = [...document.querySelectorAll('[data-constitution]')];
const sheet = document.querySelector('.guide-sheet');
const heading = document.querySelector('#guide-heading');
const update = document.querySelector('#guide-update');
const status = document.querySelector('#guide-status');
const content = document.querySelector('#guide-content');
const origin = document.querySelector('#guide-origin');
const fileActions = document.querySelector('#guide-file-actions');
const original = document.querySelector('#guide-original');
const foods = document.querySelector('#guide-foods');
const search = document.querySelector('#food-search');
const category = document.querySelector('#food-category');
const resultCount = document.querySelector('#guide-result-count');
const tableWrap = document.querySelector('.guide-table-wrap');
const tableBody = document.querySelector('#guide-table-body');
const noResults = document.querySelector('#guide-no-results');
let collection = null;
let selected = null;
let page = 0;
const pageSize = 20;
const pagination = document.querySelector('#guide-pagination');
const previousPage = document.querySelector('#previous-page');
const nextPage = document.querySelector('#next-page');
const legend = document.querySelector('#guide-legend');

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function showStatus(title, description, retry = false) {
  status.replaceChildren();
  const symbol = element('span', '八', 'sheet-symbol');
  symbol.setAttribute('aria-hidden', 'true');
  status.append(symbol, element('h3', title), element('p', description));
  if (retry) {
    const button = element('button', '다시 불러오기 ↻', 'text-link');
    button.type = 'button';
    button.addEventListener('click', loadGuides);
    status.append(button);
  } else if (selected) {
    const link = element('a', '섭생표 문의 032-322-8575 ↗', 'text-link');
    link.href = 'tel:0323228575';
    status.append(link);
  }
  status.hidden = false;
  content.hidden = true;
}

function renderRows() {
  if (!selected || selected.status === 'pending') return;
  const rows = filterRows(selected.rows, search.value, category.value);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  page = Math.min(page, totalPages - 1);
  tableBody.replaceChildren();
  const fragment = document.createDocumentFragment();
  rows.slice(page * pageSize, (page + 1) * pageSize).forEach(row => {
    const tr = element('tr');
    tr.setAttribute('role', 'row');
    tr.append(element('td', row.category), element('td', row.item));
    const gradeCell = element('td');
    if (selected.status === 'reference' || selected.gradeScale === 'five-level') {
      const [code, label, tone] = REFERENCE_GRADES[row.guidance];
      const badge = element('span', undefined, `grade-badge grade-${tone}`);
      badge.append(element('b', code), element('span', label));
      gradeCell.append(badge);
    } else gradeCell.textContent = row.guidance;
    tr.append(gradeCell, element('td', row.note));
    tr.querySelectorAll('td').forEach(cell => cell.setAttribute('role', 'cell'));
    fragment.append(tr);
  });
  tableBody.append(fragment);
  resultCount.textContent = `${selected.name} · 전체 ${selected.rows.length}개 중 ${rows.length}개 항목`;
  tableWrap.hidden = rows.length === 0;
  noResults.hidden = rows.length !== 0;
  pagination.hidden = rows.length <= pageSize;
  previousPage.disabled = page === 0;
  nextPage.disabled = page === totalPages - 1;
  document.querySelector('#page-label').textContent = `${page + 1} / ${totalPages} 페이지`;
}

function addFileLink(label, file, download = false) {
  const link = element('a', label, 'text-link');
  link.href = file;
  if (download) link.download = '';
  else { link.target = '_blank'; link.rel = 'noopener'; }
  fileActions.append(link);
}

function selectGuide(id, updateUrl = false) {
  selected = collection?.guides.find(guide => guide.id === id) || null;
  buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.constitution === selected?.id)));
  if (updateUrl) history.replaceState(null, '', selected ? `#${selected.id}` : location.pathname);
  heading.textContent = selected ? `${selected.name} 섭생표` : '체질별 섭생 자료';
  update.hidden = true;
  content.hidden = true;
  fileActions.replaceChildren();
  original.replaceChildren();
  search.value = '';
  page = 0;
  category.replaceChildren(new Option('전체', 'all'));
  foods.hidden = true;
  if (!selected) {
    showStatus('위에서 나의 체질을 선택해 주세요.', '진료에서 안내받은 체질의 섭생 자료를 확인하실 수 있습니다. 체질이 궁금하다면 진료 시 상담해 주세요.');
    return;
  }
  if (selected.status === 'pending') {
    showStatus('온라인 섭생표를 준비하고 있습니다.', '현재는 진료실에서 받으신 안내 자료를 참고해 주세요. 섭생표가 필요하시면 한의원으로 문의해 주세요.');
    return;
  }
  status.hidden = true;
  content.hidden = false;
  const isReference = selected.status === 'reference';
  const isGraded = isReference || selected.gradeScale === 'five-level';
  update.textContent = isReference ? '진료 시 개별 안내 우선' : `자료 확인 · ${selected.reviewedAt.replaceAll('-', '.')}`;
  update.hidden = false;
  // Provenance stays in data/evidence for editing; not shown in the design.
  origin.replaceChildren();
  origin.hidden = true;
  legend.hidden = !isGraded;
  document.querySelector('#guidance-column').textContent = isGraded ? '섭생 기준' : '안내';
  if (selected.image) {
    addFileLink('원본 이미지 크게 보기 ↗', selected.image);
    const image = element('img');
    image.src = selected.image;
    image.alt = `${selected.name} 섭생표 원본. 상세 안내는 자료 원본을 참고해 주세요.`;
    image.addEventListener('error', () => {
      image.replaceWith(element('p', '원본 이미지를 표시할 수 없습니다. 위의 원본 보기 또는 한의원 문의를 이용해 주세요.'));
    }, { once: true });
    original.append(image);
  }
  if (selected.pdf) {
    addFileLink('문서 원본 새 창에서 보기 ↗', selected.pdf);
    addFileLink('문서 원본 내려받기 ↓', selected.pdf, true);
    if (!selected.image) {
      const frame = element('iframe');
      frame.src = selected.pdf;
      frame.title = `${selected.name} 섭생표 원본 문서`;
      frame.loading = 'lazy';
      original.append(frame, element('p', '문서가 보이지 않으면 위의 원본 보기 또는 내려받기를 이용해 주세요.', 'guide-origin'));
    }
  }
  if (selected.rows.length) {
    foods.hidden = false;
    [...new Set(selected.rows.map(row => row.category))].forEach(name => category.append(new Option(name, name)));
    document.querySelector('#guide-table-caption').textContent = `${selected.name} 음식·생활 섭생 안내`;
    renderRows();
  }
}

async function loadGuides() {
  sheet.setAttribute('aria-busy', 'true');
  buttons.forEach(button => { button.disabled = true; });
  showStatus('섭생 자료를 불러오고 있습니다.', '잠시만 기다려 주세요.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('data/diet-guides.json', { cache: 'no-cache', signal: controller.signal });
    if (!response.ok) throw new Error('Guide request failed');
    collection = validateGuides(await response.json());
    document.querySelector('#reference-intro').hidden = !collection.guides.some(guide => guide.status === 'reference');
    buttons.forEach(button => { button.disabled = false; });
    selectGuide(location.hash.slice(1));
  } catch {
    collection = null;
    selected = null;
    heading.textContent = '체질별 섭생 자료';
    update.hidden = true;
    buttons.forEach(button => button.setAttribute('aria-pressed', 'false'));
    showStatus('자료를 불러오지 못했습니다.', '잠시 후 다시 시도하거나 한의원으로 문의해 주세요. 032-322-8575', true);
  } finally {
    clearTimeout(timeout);
    sheet.setAttribute('aria-busy', 'false');
  }
}

buttons.forEach(button => button.addEventListener('click', () => selectGuide(button.dataset.constitution, true)));
search.addEventListener('input', () => { page = 0; renderRows(); });
category.addEventListener('change', () => { page = 0; renderRows(); });
document.querySelector('#reset-filters').addEventListener('click', () => { search.value = ''; category.value = 'all'; page = 0; renderRows(); search.focus(); });
function changePage(delta) {
  page += delta; renderRows();
  // Keep the first row in sight after paging without moving keyboard focus.
  tableWrap.scrollIntoView({ behavior: 'auto', block: 'start' });
}
previousPage.addEventListener('click', () => changePage(-1));
nextPage.addEventListener('click', () => changePage(1));
addEventListener('hashchange', () => {
  const id = location.hash.slice(1);
  if (collection?.guides.some(guide => guide.id === id)) selectGuide(id);
});
loadGuides();
