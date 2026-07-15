const assert = require('assert');
const fs = require('fs');
const vm = require('vm');

class FakeElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = {};
    this.style = {};
    this.className = '';
    this.id = '';
    this.value = '';
    this.textContent = '';
    this.hidden = false;
    this.__listeners = {};
    this.classList = { contains: (name) => String(this.className).split(/\s+/).includes(name), toggle(){}, add(){}, remove(){} };
  }
  setAttribute(name, value) { this.attributes[name] = String(value); if (name === 'id') this.id = String(value); if (name === 'class') this.className = String(value); }
  getAttribute(name) { return this.attributes[name] || ''; }
  appendChild(child) { this.children.push(child); return child; }
  prepend(child) { this.children.unshift(child); return child; }
  addEventListener(type, cb) { this.__listeners[type] = cb; }
  querySelector(sel) {
    if (sel === '.vt-para-length-input') return this.children.find((c) => c.classList.contains('vt-para-length-input')) || null;
    return null;
  }
  querySelectorAll() { return []; }
  set innerHTML(html) {
    this._innerHTML = String(html);
    this.children = [];
    const inputMatch = this._innerHTML.match(/<input\s+([^>]+)>/);
    if (inputMatch) {
      const input = new FakeElement('input');
      for (const [, name, value] of inputMatch[1].matchAll(/([\w-]+)="([^"]*)"/g)) input.setAttribute(name, value);
      input.className = input.attributes.class || '';
      input.id = input.attributes.id || '';
      input.value = input.attributes.value || '';
      this.children.push(input);
    }
  }
  get innerHTML() { return this._innerHTML || ''; }
}

const elements = new Map();
function register(selector, element) { elements.set(selector, element); return element; }
const document = {
  readyState: 'loading',
  head: new FakeElement('head'),
  body: new FakeElement('body'),
  querySelector(sel) { return elements.get(sel) || null; },
  querySelectorAll() { return []; },
  createElement: (tag) => new FakeElement(tag),
  createDocumentFragment: () => new FakeElement('fragment'),
  addEventListener(type, cb) { if (type === 'DOMContentLoaded') this._domReady = cb; }
};
register('#vt-para-length-grid', new FakeElement('div'));
register('#vt-json-preview', new FakeElement('pre'));
register('#vt-locked-result', new FakeElement('div'));
register('#vt-parse-debug', new FakeElement('pre'));

const context = {
  window: {}, document, console,
  Intl, Date, Number, String, Array, Object, Math, RegExp, Set, Map, JSON,
  MutationObserver: class { observe(){} },
  requestAnimationFrame: () => {},
  navigator: {}, Blob: class {}, URL: { createObjectURL(){ return ''; }, revokeObjectURL(){} }
};
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('index.js', 'utf8'), context);
const api = context.window.__VT_TEST_API;


assert.strictEqual(api.parseWeekStart('13.–19. JULI 2026'), '2026-07-13');
assert.strictEqual(api.parseWeekStart('13.-19. juli 2026'), '2026-07-13');
assert.strictEqual(api.parseWeekStart('13–19 JULI 2026'), '2026-07-13');
assert.strictEqual(api.parseWeekStart('13. – 19. JULI 2026'), '2026-07-13');
assert.strictEqual(api.parseWeekStart('27. JULI–2. AUGUST 2026'), '2026-07-27');
assert.strictEqual(api.parseWeekStart('27. juli - 2. august 2026'), '2026-07-27');
assert.strictEqual(api.parseWeekStart('27. JULI—2. AUGUST, 2026'), '2026-07-27');
assert.strictEqual(api.parseWeekStart('27. JULI 2026–2. AUGUST 2026'), '2026-07-27');
assert.strictEqual(api.parseWeekStart('29. DESEMBER 2025–4. JANUAR 2026'), '2025-12-29');
assert.strictEqual(api.parseWeekStart('ingen dato her'), '');
assert.strictEqual(api.detectWeekHeader('27. JULI–2. AUGUST 2026\nResten'), '27. JULI–2. AUGUST 2026');
assert.strictEqual(api.parseArticleText('27. JULI–2. AUGUST 2026\n1. Avsnittstekst her').week_start, '2026-07-27');

const pastedArticleWithSameMonthHeader = `13.–19. JULI 2026
SANG 101
En faktisk innlimt artikkel
FOKUS
Fokus her.
1. Første avsnitt i artikkelen har tekst.
2. Andre avsnitt i artikkelen har mer tekst.
REPETISJONSSPØRSMÅL
1. Hva husker du?`;
assert.strictEqual(api.parseArticleText(pastedArticleWithSameMonthHeader).week_start, '2026-07-13');

api.setDetectedAndEditableData({ week_start: '2026-07-27', para_lengths: [74, 12, 8] });
const before = api.buildBreakdown().inputs.wordCount;
assert.strictEqual(before, 94);
api.updateParagraphLengthAt(2, '82');
assert.strictEqual(JSON.stringify(api.getEditablePayload().para_lengths), JSON.stringify([74, 12, 82]));
assert.strictEqual(JSON.stringify(api.getEditablePayload().para_lengths.slice(0, 2)), JSON.stringify([74, 12]));
assert.strictEqual(api.buildBreakdown().inputs.wordCount, 168);
assert.strictEqual(JSON.parse(elements.get('#vt-json-preview').textContent).para_lengths[2], 82);

api.setDetectedAndEditableData({ week_start: '2026-07-27', para_lengths: [131, 12, 8] });
api.updateParagraphLengthAt(0, '140');
assert.strictEqual(api.getEditablePayload().para_lengths[0], 140);
assert.strictEqual(JSON.parse(elements.get('#vt-json-preview').textContent).para_lengths[0], 140);
assert.strictEqual(api.buildBreakdown().inputs.paraLengths[0], 140);
assert.strictEqual(api.buildBreakdown().inputs.wordCount, 160);
assert.strictEqual(api.countWords('Dette er markert tekst'), 4);
assert.strictEqual(api.countWords(''), 0);
function makeImplicitFirstArticle(lastNumber, skipNumber) {
  const lines = [
    '27. JULI–2. AUGUST 2026',
    'SANG 1',
    'Testartikkel',
    'FOKUS',
    'Fokus her.',
    '1, 2. Hva skjedde? Svaret ditt',
    'DET han sier er viktig for alle nå'
  ];
  for (let i = 2; i <= lastNumber; i += 1) {
    if (i === skipNumber) continue;
    lines.push(`${i} Dette er tekst for avsnitt ${i}`);
  }
  lines.push('REPETISJONSSPØRSMÅL');
  lines.push('1. Hva lærte vi?');
  lines.push('SANG 2');
  return lines.join('\n');
}

const implicitTo20 = api.parseArticleText(makeImplicitFirstArticle(20));
assert.strictEqual(implicitTo20.para_lengths.length, 20);
assert.strictEqual(implicitTo20.para_lengths[0], 8);
assert.strictEqual(implicitTo20.para_lengths[1], 6);
assert.strictEqual(JSON.stringify(api.getParseDebugInfo().missingNumbers), JSON.stringify([]));

const implicitTo18 = api.parseArticleText(makeImplicitFirstArticle(18));
assert.strictEqual(implicitTo18.para_lengths.length, 18);
assert.strictEqual(implicitTo18.para_lengths[0], 8);
assert.strictEqual(JSON.stringify(api.getParseDebugInfo().missingNumbers), JSON.stringify([]));

const questionLineOnly = api.parseArticleText('27. JULI–2. AUGUST 2026\nTestartikkel\nFOKUS\nFokus her.\n1, 2. Hva skjedde? Svaret ditt\nDET han sier er viktig for alle nå\n2 Dette er tekst for avsnitt 2');
assert.strictEqual(questionLineOnly.para_lengths.length, 2);
assert.strictEqual(JSON.stringify(api.getParseDebugInfo().keptParagraphNumbers), JSON.stringify([1, 2]));

api.parseArticleText(makeImplicitFirstArticle(5, 4));
assert.strictEqual(JSON.stringify(api.getParseDebugInfo().missingNumbers), JSON.stringify([4]));
assert.match(api.getParseDebugInfo().validationWarnings.join('\n'), /Hull i avsnittsnummerrekken: mangler avsnitt 4/);


api.handleEditableFieldChange('week_start', '2026-08-03');
assert.strictEqual(api.getEditablePayload().week_start, '2026-08-03');

api.setDetectedAndEditableData({ week_start: '2026-07-27' });
assert.strictEqual(api.hasActiveArticleData(), true);
api.setDetectedAndEditableData({ para_lengths: [12, 18] });
assert.strictEqual(api.hasActiveArticleData(), true);
api.handleEditableFieldChange('para_lengths', '');
api.handleEditableFieldChange('week_start', '');
api.handleEditableFieldChange('title', '');
api.handleEditableFieldChange('groups', '');
api.handleEditableFieldChange('reads', '');
api.handleEditableFieldChange('frames', '');
api.handleEditableFieldChange('images', '');
assert.strictEqual(api.hasActiveArticleData(), true);
api.setDetectedAndEditableData({});
assert.strictEqual(api.hasActiveArticleData(), false);

function articleWithQuestion(questionBlock, answerBlock = 'Dette er svartekst for artikkelen.') {
  return `27. JULI–2. AUGUST 2026
Testartikkel
FOKUS
Fokus her.
${questionBlock}
${answerBlock}`;
}

function parsedImages(text) {
  api.setDetectedAndEditableData(api.parseArticleText(text));
  return JSON.stringify(api.getEditablePayload().images);
}

assert.strictEqual(parsedImages(articleWithQuestion(`7, 8. (a) Hva kan hjelpe oss?
(b) Hvordan kan bibelske prinsipper hjelpe oss?
(Se også bildet.)

Svarene dine`, `7 Svar for avsnitt sju.
8 Svar for avsnitt åtte.`)), JSON.stringify([8]));

assert.strictEqual(parsedImages(articleWithQuestion(`7, 8. (a) Hva kan hjelpe oss?
(Se også bildet.)
(b) Hvordan kan bibelske prinsipper hjelpe oss?

Svarene dine`, `7 Svar for avsnitt sju.
8 Svar for avsnitt åtte.`)), JSON.stringify([7]));

assert.strictEqual(parsedImages(articleWithQuestion(`5. Når bør man begynne å tenke på dette? (Se også bildet.)

Svaret ditt`, `5 Svar for avsnitt fem.`)), JSON.stringify([5]));

assert.strictEqual(parsedImages(articleWithQuestion(`5. Når bør man begynne å tenke på dette? (Se også bildene.)

Svaret ditt`, `5 Svar for avsnitt fem.`)), JSON.stringify([5]));

assert.strictEqual(parsedImages(articleWithQuestion(`7, 8. (a) Hva kan hjelpe oss
når vi har det vanskelig?
(b) Hvordan kan bibelske prinsipper
hjelpe oss?   (  Se   også   bildet  . )

Svarene dine`, `7 Svar for avsnitt sju.
8 Svar for avsnitt åtte.`)), JSON.stringify([8]));

assert.strictEqual(parsedImages(articleWithQuestion(`5. Når bør man begynne å tenke på dette?

Svaret ditt`, `5 Svar for avsnitt fem.
Bildetekst: (Se også bildet.)
REPETISJONSSPØRSMÅL
1. Hva lærte du? (Se også bildet.)`)), JSON.stringify([]));

assert.strictEqual(parsedImages(articleWithQuestion(`5. Når bør man begynne? (Se også bildet.)
Hva mer bør man tenke på? (Se også bildene.)

Svaret ditt`, `5 Svar for avsnitt fem.`)), JSON.stringify([5]));

assert.strictEqual(parsedImages(articleWithQuestion(`8, 9. Hva bør du gjøre hvis du begynner å tvile? (Se også bildet.)

Svarene dine`, `8 Svar for avsnitt åtte.
9 Svar for avsnitt ni.`)), JSON.stringify([8]));

assert.strictEqual(parsedImages(articleWithQuestion(`8–9. Hva bør du gjøre hvis du begynner å tvile? (Se også bildet.)

Svarene dine`, `8 Svar for avsnitt åtte.
9 Svar for avsnitt ni.`)), JSON.stringify([8]));

assert.strictEqual(parsedImages(articleWithQuestion(`7, 8. Hvorfor er dette viktig? (Se også bildet.)

Svarene dine`, `7 Svar for avsnitt sju.
8 Svar for avsnitt åtte.`)), JSON.stringify([7]));

assert.strictEqual(parsedImages(articleWithQuestion(`7–8. (a) Hva kan hjelpe oss? (Se også bildet.)
(b) Hvordan kan prinsipper hjelpe oss?

Svarene dine`, `7 Svar for avsnitt sju.
8 Svar for avsnitt åtte.`)), JSON.stringify([7]));

console.log('All Study Analyzer tests passed');
