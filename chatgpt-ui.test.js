const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

function element(options = {}) {
  const attributes = { ...(options.attributes || {}) };
  return {
    tagName: options.tagName || 'DIV',
    textContent: options.textContent || '',
    value: options.value || '',
    hidden: Boolean(options.hidden),
    disabled: Boolean(options.disabled),
    clicked: false,
    events: [],
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(attributes, name) ? attributes[name] : null;
    },
    getBoundingClientRect() {
      return options.rect || { width: 100, height: 40 };
    },
    closest(selector) {
      return selector === 'form' ? options.form || null : null;
    },
    focus() {},
    dispatchEvent(event) {
      this.events.push(event.type);
      return true;
    },
    click() {
      this.clicked = true;
    },
  };
}

function scope(entries, sendButton = null) {
  return {
    querySelectorAll(selector) {
      return entries.get(selector) || [];
    },
    querySelector(selector) {
      if (sendButton && /send-button|Send prompt|type="submit"/.test(selector)) return sendButton;
      return (entries.get(selector) || [])[0] || null;
    },
  };
}

function library() {
  const document = {
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createRange() { return { selectNodeContents() {}, collapse() {} }; },
    createDocumentFragment() { return { querySelector() { return null; } }; },
    documentElement: {},
  };
  const selection = { removeAllRanges() {}, addRange() {} };
  const window = {
    getComputedStyle(node) {
      return node.style || { display: 'block', visibility: 'visible' };
    },
    getSelection() { return selection; },
    HTMLTextAreaElement: function HTMLTextAreaElement() {},
  };
  class SyntheticEvent {
    constructor(type) { this.type = type; }
  }
  class MutationObserver {
    observe() {}
    disconnect() {}
  }
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, 'chatgpt-ui.js'), 'utf8'),
    {
      window,
      document,
      Event: SyntheticEvent,
      InputEvent: SyntheticEvent,
      MutationObserver,
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      console,
    },
    { filename: 'chatgpt-ui.js' },
  );
  return window.ChatGPTUI;
}

test('prefers the visible ProseMirror composer over its hidden textarea mirror', () => {
  const ui = library();
  const mirror = element({
    tagName: 'TEXTAREA',
    attributes: { 'aria-label': 'Chat with ChatGPT' },
    rect: { width: 0, height: 0 },
  });
  const editor = element({
    attributes: { contenteditable: 'true', role: 'textbox' },
    rect: { width: 368, height: 42 },
  });
  const entries = new Map([
    ['#prompt-textarea[contenteditable="true"]', [editor]],
    ['[contenteditable="true"][role="textbox"]', [editor]],
    ['textarea[aria-label]', [mirror]],
  ]);
  assert.equal(ui._getComposerField(scope(entries)), editor);
});

test('falls back to a visible textarea when contenteditable is stale', () => {
  const ui = library();
  const staleEditor = element({
    attributes: { contenteditable: 'true', role: 'textbox', 'aria-hidden': 'true' },
  });
  const textarea = element({
    tagName: 'TEXTAREA',
    attributes: { placeholder: 'Ask ChatGPT' },
  });
  const entries = new Map([
    ['#prompt-textarea[contenteditable="true"]', [staleEditor]],
    ['[contenteditable="true"][role="textbox"]', [staleEditor]],
    ['textarea[placeholder]', [textarea]],
  ]);
  assert.equal(ui._getComposerField(scope(entries)), textarea);
});

test('set, get, readiness, and submit use one active field', async () => {
  const ui = library();
  const mirror = element({
    tagName: 'TEXTAREA',
    attributes: { 'aria-label': 'Chat with ChatGPT' },
    rect: { width: 0, height: 0 },
  });
  const editor = element({ attributes: { contenteditable: 'true', role: 'textbox' } });
  const send = element({ tagName: 'BUTTON' });
  const entries = new Map([
    ['#prompt-textarea[contenteditable="true"]', [editor]],
    ['[contenteditable="true"][role="textbox"]', [editor]],
    ['textarea[aria-label]', [mirror]],
  ]);
  ui._getComposerRoot = () => scope(entries, send);

  assert.equal(ui.setComposerText('hello'), true);
  assert.equal(editor.textContent, 'hello');
  assert.equal(mirror.value, '');
  assert.equal(ui.getComposerText(), 'hello');
  assert.equal(await ui.waitForComposerReady({
    expectedText: 'hello',
    timeout: 100,
    quietPeriod: 1,
    pollInterval: 2,
  }), true);
  assert.equal(ui.submitComposer(), true);
  assert.equal(send.clicked, true);
});
