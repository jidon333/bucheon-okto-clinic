export const CONSTITUTIONS = Object.freeze([
  ['mokyang', '목양체질'], ['mokeum', '목음체질'], ['toyang', '토양체질'], ['toeum', '토음체질'],
  ['geumyang', '금양체질'], ['geumeum', '금음체질'], ['suyang', '수양체질'], ['sueum', '수음체질'],
]);

export const REFERENCE_GRADES = Object.freeze({ OO: ['OO', '반드시 필요', 'best'], O: ['O', '유익', 'good'], 'Δ': ['△', '자주 먹으면 해로움', 'caution'], X: ['X', '해로움', 'avoid'], XX: ['XX', '금함', 'avoid'], '': ['—', '확인 필요', 'unknown'] });

export function isSourceUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}

function text(value, max = 500) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

export function isGuideAsset(value, extension) {
  if (typeof value !== 'string' || !value.startsWith('assets/diet/')) return false;
  if (/[?#\\]/.test(value) || /(^|\/)\.\.?($|\/)/.test(value)) return false;
  try {
    const decoded = decodeURIComponent(value);
    if (/[\\?#]/.test(decoded) || /(^|\/)\.\.?($|\/)/.test(decoded)) return false;
    return new RegExp(`\\.(${extension})$`, 'i').test(decoded);
  } catch { return false; }
}

export function validateGuides(data) {
  if (data?.version !== 1 || !Array.isArray(data.guides) || data.guides.length !== CONSTITUTIONS.length) throw new Error('Invalid guide collection');
  const seen = new Set();
  data.guides.forEach(guide => {
    if (!CONSTITUTIONS.some(([id, name]) => guide.id === id && guide.name === name) || seen.has(guide.id)) throw new Error('Invalid constitution');
    seen.add(guide.id);
    if (!['pending', 'reviewed', 'reference'].includes(guide.status) || !Array.isArray(guide.rows)) throw new Error('Invalid guide status');
    if (guide.gradeScale && guide.gradeScale !== 'five-level') throw new Error('Invalid grade scale');
    if (guide.sourceUrl && !isSourceUrl(guide.sourceUrl)) throw new Error('Invalid source URL');
    if (guide.image && !isGuideAsset(guide.image, 'jpg|jpeg|png|webp')) throw new Error('Invalid guide image');
    if (guide.pdf && !isGuideAsset(guide.pdf, 'pdf')) throw new Error('Invalid guide document');
    if (guide.status === 'pending' && (guide.rows.length || guide.image || guide.pdf)) throw new Error('Unreviewed content must not be exposed');
    if (guide.status === 'reviewed') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(guide.reviewedAt || '') || !text(guide.source, 200)) throw new Error('Review date and source are required');
      if (!guide.rows.length && !guide.image && !guide.pdf) throw new Error('Reviewed guide is empty');
    }
    if (guide.status === 'reference' && (!text(guide.source, 200) || !isSourceUrl(guide.sourceUrl) || !/^\d{4}-\d{2}-\d{2}$/.test(guide.importedAt || '') || !guide.rows.length)) throw new Error('External reference provenance is required');
    guide.rows.forEach(row => {
      const validGuidance = guide.status === 'reference' || guide.gradeScale === 'five-level' ? Object.hasOwn(REFERENCE_GRADES, row.guidance) : text(row.guidance, 100);
      if (!text(row.category, 50) || !text(row.item, 100) || !validGuidance || typeof row.note !== 'string' || row.note.length > 1000) throw new Error('Invalid guide row');
    });
  });
  return data;
}

export function filterRows(rows, query = '', category = 'all') {
  const normalize = value => value.normalize('NFKC').toLocaleLowerCase('ko').replace(/\s+/g, '').replace(/(?<!염)소고기/g, '쇠고기').replaceAll('파프리카', '페브리카').replaceAll('강낭콩', '강남콩').replaceAll('초콜릿', '초코렛').replaceAll('멜론', '메론');
  const needle = normalize(query);
  return rows.filter(row => (category === 'all' || row.category === category) && (!needle || normalize(`${row.item} ${row.note}`).includes(needle)));
}
