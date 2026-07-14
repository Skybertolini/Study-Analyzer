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

assert.strictEqual(api.parseWeekStart('27. JULI–2. AUGUST 2026'), '2026-07-27');
assert.strictEqual(api.parseWeekStart('27. juli - 2. august 2026'), '2026-07-27');
assert.strictEqual(api.parseWeekStart('27. JULI—2. AUGUST, 2026'), '2026-07-27');
assert.strictEqual(api.parseWeekStart('27. JULI 2026–2. AUGUST 2026'), '2026-07-27');
assert.strictEqual(api.parseWeekStart('29. DESEMBER 2025–4. JANUAR 2026'), '2025-12-29');
assert.strictEqual(api.parseWeekStart('ingen dato her'), '');
assert.strictEqual(api.detectWeekHeader('27. JULI–2. AUGUST 2026\nResten'), '27. JULI–2. AUGUST 2026');
assert.strictEqual(api.parseArticleText('27. JULI–2. AUGUST 2026\n1. Avsnittstekst her').week_start, '2026-07-27');

api.setDetectedAndEditableData({ week_start: '2026-07-27', para_lengths: [74, 12, 8] });
const before = api.buildBreakdown().inputs.wordCount;
assert.strictEqual(before, 94);
api.updateParagraphLengthAt(2, '82');
assert.strictEqual(JSON.stringify(api.getEditablePayload().para_lengths), JSON.stringify([74, 12, 82]));
assert.strictEqual(JSON.stringify(api.getEditablePayload().para_lengths.slice(0, 2)), JSON.stringify([74, 12]));
assert.strictEqual(api.buildBreakdown().inputs.wordCount, 168);
assert.strictEqual(JSON.parse(elements.get('#vt-json-preview').textContent).para_lengths[2], 82);

api.handleEditableFieldChange('week_start', '2026-08-03');
assert.strictEqual(api.getEditablePayload().week_start, '2026-08-03');

console.log('All Study Analyzer tests passed');
