import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CONSTITUTIONS, validateGuides, filterRows, isGuideAsset } from '../dist/diet-model.mjs';

function pending() {
  return { version: 1, guides: CONSTITUTIONS.map(([id, name]) => ({ id, name, status: 'pending', reviewedAt: null, source: null, rows: [], image: null, pdf: null })) };
}
const sample = { category: '검증 분류', item: '검증용 항목 가', guidance: '예시 표기', note: '기능 검사 자료' };

test('all eight unpublished guides are valid and contain no dietary advice', () => assert.equal(validateGuides(pending()).guides.length, 8));
test('pending content cannot expose accidentally populated rows or files', () => {
  const data = pending(); data.guides[0].rows = [sample];
  assert.throws(() => validateGuides(data), /Unreviewed/);
  data.guides[0].rows = []; data.guides[0].pdf = 'assets/diet/example.pdf';
  assert.throws(() => validateGuides(data), /Unreviewed/);
});
test('publishing requires provenance, review date, and content together', () => {
  const data = pending(); const guide = data.guides[0]; guide.status = 'reviewed';
  assert.throws(() => validateGuides(data), /Review date/);
  guide.source = '기능 검증용 자료'; guide.reviewedAt = '2026-11-16';
  assert.throws(() => validateGuides(data), /empty/);
  guide.rows = [sample]; assert.equal(validateGuides(data).guides[0].rows.length, 1);
});
test('constitution names cannot be mismatched or duplicated', () => {
  const data = pending(); data.guides[0].name = data.guides[1].name;
  assert.throws(() => validateGuides(data), /constitution/);
  const duplicated = pending(); duplicated.guides[1] = duplicated.guides[0];
  assert.throws(() => validateGuides(duplicated), /constitution/);
});
test('guide assets must be local files in the dietary assets directory', () => {
  assert(isGuideAsset('assets/diet/목양 섭생표.jpg', 'jpg|png'));
  for (const file of ['https://example.com/table.pdf', 'assets/diet/../logo.pdf', 'assets/diet/%2e%2e/logo.pdf', 'assets/diet/a.pdf?x=1', 'assets/diet/a.svg', 'assets/diet/x%5cy.pdf']) assert.equal(isGuideAsset(file, 'pdf'), false, file);
});
test('query and category intersect; clearing them returns all rows', () => {
  const rows = [sample, { ...sample, category: '두번째 분류', item: '검증용 항목 나' }];
  assert.equal(filterRows(rows, '항목가', '검증 분류').length, 1);
  assert.equal(filterRows(rows, '항목가', '두번째 분류').length, 0);
  assert.equal(filterRows(rows, '', 'all').length, 2);
});
test('external references require a source link and preserve unknown grades', () => {
  const data = pending();
  Object.assign(data.guides[0], { status: 'reference', source: '외부 자료', sourceUrl: 'https://example.com/table', importedAt: '2026-11-16', rows: [{ ...sample, guidance: '' }] });
  assert.equal(validateGuides(data).guides[0].rows[0].guidance, '');
  data.guides[0].sourceUrl = 'javascript:alert(1)';
  assert.throws(() => validateGuides(data), /source URL/);
  data.guides[0].sourceUrl = 'https://example.com/table';
  data.guides[0].rows[0].guidance = 'OOO';
  assert.throws(() => validateGuides(data), /guide row/);
});
test('food spelling aliases match the original without changing stored wording', () => {
  const rows = [{ ...sample, item: '쇠고기' }, { ...sample, item: '페브리카' }, { ...sample, item: '염소고기(흑염소중탕)' }];
  assert.equal(filterRows(rows, '소고기')[0].item, '쇠고기');
  assert.equal(filterRows(rows, '소고기').length, 1);
  assert.equal(filterRows(rows, '파프리카')[0].item, '페브리카');
});
test('clinic-reviewed replacements support both graded tables and original documents', () => {
  const data = pending();
  Object.assign(data.guides[0], { status: 'reviewed', source: '옥토한의원', reviewedAt: '2026-11-16', gradeScale: 'five-level', rows: [{ ...sample, guidance: 'O' }, { ...sample, item: '미확정 항목', guidance: '' }] });
  assert.equal(validateGuides(data).guides[0].rows.length, 2);
  data.guides[0].rows = []; data.guides[0].image = 'assets/diet/mokyang.webp';
  assert.equal(validateGuides(data).guides[0].image, 'assets/diet/mokyang.webp');
});
test('all imported reference rows match the saved original table exactly', async () => {
  const data = JSON.parse(await readFile(new URL('../dist/data/diet-guides.json', import.meta.url), 'utf8'));
  const { originals } = JSON.parse(await readFile(new URL('../tests/fixtures/ireh-original.json', import.meta.url), 'utf8'));
  for (const guide of data.guides.filter(g => g.status === 'reference' && g.source === '이레한의원')) {
    const original = originals.find(o => o.id === guide.id);
    assert.equal(guide.sourceUrl, original.sourceUrl);
    assert.deepEqual(guide.rows.map(({ category, item, guidance }) => ({ category, item, guidance })), original.rows);
  }
});
