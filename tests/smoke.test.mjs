import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SIMULATOR_SCENARIOS } from '../js/simulator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

function walkFiles(dir, extFilter, acc = []) {
  if (!fs.existsSync(dir)) {
    return acc;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, extFilter, acc);
    } else if (!extFilter || entry.name.endsWith(extFilter)) {
      acc.push(fullPath);
    }
  }
  return acc;
}

function isExternalOrHash(url) {
  return (
    !url ||
    url.startsWith('#') ||
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('mailto:') ||
    url.startsWith('tel:') ||
    url.startsWith('data:')
  );
}

describe('JS Modülleri ve Güvenlik Sözleşmesi', () => {
  it('tüm zorunlu ES modülleri mevcut olmalı', () => {
    const expectedModules = [
      'main.js',
      'nav.js',
      'reveal.js',
      'accordion.js',
      'simulator.js',
      'motion-toggle.js',
      'reading-bar.js',
    ];

    for (const mod of expectedModules) {
      const target = path.join(ROOT_DIR, 'js', mod);
      assert.ok(fs.existsSync(target), `Eksik JS modülü: js/${mod}`);
    }
  });

  it('hiçbir JS dosyasında yasaklı innerHTML veya güvensiz DOM API kullanılmamalı', () => {
    const jsFiles = walkFiles(path.join(ROOT_DIR, 'js'), '.js');
    assert.ok(jsFiles.length >= 7, 'JS dosyaları bulunamadı');

    const forbiddenPatterns = [
      { name: 'innerHTML', regex: /\.innerHTML\b|\[\s*['"`]innerHTML['"`]\s*\]/ },
      { name: 'outerHTML', regex: /\.outerHTML\b|\[\s*['"`]outerHTML['"`]\s*\]/ },
      {
        name: 'insertAdjacentHTML',
        regex: /\.insertAdjacentHTML\b|\[\s*['"`]insertAdjacentHTML['"`]\s*\]/,
      },
      { name: 'document.write', regex: /document\.write\b/ },
      { name: 'eval()', regex: /\beval\s*\(/ },
    ];

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const rel = path.relative(ROOT_DIR, file);
      for (const { name, regex } of forbiddenPatterns) {
        assert.equal(regex.test(content), false, `${rel} içinde yasaklı ${name} tespit edildi`);
      }
    }
  });
});

describe('Simülatör Veri Bütünlüğü', () => {
  it('salonzeka, vitrinos ve yesilnesil senaryoları eksiksiz 4 adımlı olmalı', () => {
    const keys = ['salonzeka', 'vitrinos', 'yesilnesil'];
    for (const key of keys) {
      const scenario = SIMULATOR_SCENARIOS[key];
      assert.ok(scenario, `Eksik senaryo: ${key}`);
      assert.equal(scenario.id, key);
      assert.ok(typeof scenario.name === 'string' && scenario.name.length > 0);
      assert.ok(typeof scenario.summary === 'string' && scenario.summary.length > 0);
      assert.ok(Array.isArray(scenario.steps), `${key}.steps dizi olmalı`);
      assert.equal(scenario.steps.length, 4, `${key} tam 4 adım içermeli`);

      scenario.steps.forEach((step, idx) => {
        assert.ok(typeof step.code === 'string' && step.code.length > 0, `${key}[${idx}].code eksik`);
        assert.ok(typeof step.title === 'string' && step.title.length > 0, `${key}[${idx}].title eksik`);
        assert.ok(typeof step.detail === 'string' && step.detail.length > 0, `${key}[${idx}].detail eksik`);
        assert.ok(typeof step.status === 'string' && step.status.length > 0, `${key}[${idx}].status eksik`);
        assert.ok(
          typeof step.logSummary === 'string' && step.logSummary.length > 0,
          `${key}[${idx}].logSummary eksik`,
        );
        assert.equal(step.payload, undefined, `${key}[${idx}] teknik payload içermemeli`);
      });
    }
  });
});

describe('HTML Sözleşme ve Link Kontrolleri', () => {
  it('tüm HTML dosyalarındaki yerel CSS/JS/sayfa linkleri geçerli dosyalara işaret etmeli', () => {
    const htmlFiles = walkFiles(ROOT_DIR, '.html');
    assert.ok(htmlFiles.length > 0, 'Hiç HTML dosyası bulunamadı');

    const attrRegex = /\b(?:href|src)\s*=\s*"([^"]+)"/g;

    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf8');
      const dir = path.dirname(htmlFile);
      const relHtml = path.relative(ROOT_DIR, htmlFile);

      for (const match of content.matchAll(attrRegex)) {
        const rawUrl = match[1].trim();
        if (isExternalOrHash(rawUrl)) {
          continue;
        }

        const cleanUrl = rawUrl.split('#')[0].split('?')[0];
        if (!cleanUrl) {
          continue;
        }

        const resolved = cleanUrl.startsWith('/')
          ? path.join(ROOT_DIR, cleanUrl.slice(1))
          : path.resolve(dir, cleanUrl);

        assert.ok(
          fs.existsSync(resolved),
          `${relHtml} içinde kırık yerel yol: "${rawUrl}" -> ${path.relative(ROOT_DIR, resolved)}`,
        );
      }
    }
  });

  it('target="_blank" kullanılan tüm bağlantılarda rel="noopener noreferrer" bulunmalı', () => {
    const htmlFiles = walkFiles(ROOT_DIR, '.html');
    assert.ok(htmlFiles.length > 0, 'Hiç HTML dosyası bulunamadı');

    const anchorRegex = /<a\b[^>]*\btarget\s*=\s*"_blank"[^>]*>/gi;

    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf8');
      const relHtml = path.relative(ROOT_DIR, htmlFile);

      for (const match of content.matchAll(anchorRegex)) {
        const tag = match[0];
        const relMatch = tag.match(/\brel\s*=\s*"([^"]*)"/i);
        assert.ok(relMatch, `${relHtml} içinde rel niteliği eksik target="_blank" linki: ${tag}`);
        const relTokens = relMatch[1].toLowerCase().split(/\s+/);
        assert.ok(
          relTokens.includes('noopener') && relTokens.includes('noreferrer'),
          `${relHtml} içinde noopener/noreferrer eksik: ${tag}`,
        );
      }
    }
  });

  it('index.html simülatör kancaları (data-simulator, çift ekran ve timeline) sözleşmeye uymalı', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

    assert.match(indexHtml, /\bdata-simulator\b/);
    for (const key of ['salonzeka', 'vitrinos', 'yesilnesil']) {
      assert.match(indexHtml, new RegExp(`\\bdata-sim-tab="${key}"`));
    }
    assert.match(indexHtml, /\bdata-sim-left\b/);
    assert.match(indexHtml, /\bdata-sim-right\b/);
    assert.match(indexHtml, /\bdata-sim-replay\b/);
    for (let i = 0; i < 4; i += 1) {
      assert.match(indexHtml, new RegExp(`\\bdata-sim-step="${i}"`));
    }
    assert.match(indexHtml, /\bdata-sim-step-code\b/);
    assert.match(indexHtml, /\bdata-sim-step-title\b/);
  });

  it('HTML dosyalarında kullanılan tüm CSS sınıfları css/*.css içinde tanımlı olmalı', () => {
    const cssFiles = walkFiles(path.join(ROOT_DIR, 'css'), '.css');
    assert.ok(cssFiles.length > 0, 'CSS dosyaları bulunamadı');

    const definedClasses = new Set();
    const cssClassRegex = /(?:^|[^0-9a-zA-Z_-])\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;

    for (const cssFile of cssFiles) {
      const css = fs.readFileSync(cssFile, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
      for (const match of css.matchAll(cssClassRegex)) {
        definedClasses.add(match[1]);
      }
    }

    const htmlFiles = walkFiles(ROOT_DIR, '.html');
    const htmlClassAttrRegex = /\bclass\s*=\s*"([^"]+)"/g;
    const missing = new Set();

    for (const htmlFile of htmlFiles) {
      const html = fs.readFileSync(htmlFile, 'utf8');
      const relHtml = path.relative(ROOT_DIR, htmlFile);
      for (const match of html.matchAll(htmlClassAttrRegex)) {
        for (const cls of match[1].trim().split(/\s+/)) {
          if (cls && !definedClasses.has(cls)) {
            missing.add(`${relHtml}: .${cls}`);
          }
        }
      }
    }

    assert.deepEqual(
      Array.from(missing),
      [],
      `CSS dosyalarında tanımlı olmayan HTML sınıfları tespit edildi:\n${Array.from(missing).join('\n')}`,
    );
  });

  it('index.html demo numaralandırması ve teknik jargon ifadeleri içermemeli', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    const forbiddenTerms = [
      'FIG. 0',
      '01 /',
      '02 /',
      '03 /',
      'PostgreSQL',
      'Prisma',
      'MinIO',
      'Vanilla ES',
      'TOTP MFA',
    ];

    for (const term of forbiddenTerms) {
      assert.equal(
        indexHtml.includes(term),
        false,
        `index.html içinde yasaklı demo/teknik ifade tespit edildi: "${term}"`,
      );
    }
  });
});

describe('JS Sözdizimi (dosya bazında node --check)', () => {
  it('her js/*.js dosyası ayrı ayrı node --check denetiminden geçmeli', () => {
    const jsFiles = walkFiles(path.join(ROOT_DIR, 'js'), '.js');
    assert.ok(jsFiles.length >= 7, 'JS dosyaları bulunamadı');

    // Not: Node 22'de `node --check dosya.js`, ES modül sözdizimi içeren .js dosyalarında
    // (package.json "type" olmadan) sözdizimi hatasını sessizce geçebiliyor. Bu yüzden
    // kaynak stdin'den --input-type=module ile denetlenir.
    for (const file of jsFiles) {
      const result = spawnSync(process.execPath, ['--check', '--input-type=module'], {
        input: fs.readFileSync(file, 'utf8'),
        encoding: 'utf8',
      });
      assert.equal(
        result.status,
        0,
        `${path.relative(ROOT_DIR, file)} sözdizimi hatalı:\n${result.stderr}`,
      );
    }
  });
});

// --- Minimal DOM stub'ları (jsdom olmadan çalışma zamanı testleri için) ---

class FakeClassList {
  constructor() {
    this.set = new Set();
  }
  add(...names) {
    names.forEach((n) => this.set.add(n));
  }
  remove(...names) {
    names.forEach((n) => this.set.delete(n));
  }
  contains(name) {
    return this.set.has(name);
  }
  toggle(name, force) {
    const next = force === undefined ? !this.set.has(name) : Boolean(force);
    if (next) {
      this.set.add(name);
    } else {
      this.set.delete(name);
    }
    return next;
  }
}

class FakeElement {
  constructor(attrs = {}) {
    this.attrs = new Map(Object.entries(attrs));
    this.classList = new FakeClassList();
    this.listeners = new Map();
    this.hidden = false;
    this.nextElementSibling = null;
    this.focused = false;
  }
  getAttribute(name) {
    return this.attrs.has(name) ? this.attrs.get(name) : null;
  }
  setAttribute(name, value) {
    this.attrs.set(name, String(value));
  }
  hasAttribute(name) {
    return this.attrs.has(name);
  }
  addEventListener(type, fn) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(fn);
  }
  dispatch(type, event = {}) {
    for (const fn of this.listeners.get(type) ?? []) {
      fn({ type, target: this, preventDefault() {}, ...event });
    }
  }
  closest() {
    return null;
  }
  querySelector() {
    return null;
  }
  querySelectorAll() {
    return [];
  }
  focus() {
    this.focused = true;
  }
}

function installGlobals({ document, window }) {
  const previous = {
    document: Object.getOwnPropertyDescriptor(globalThis, 'document'),
    window: Object.getOwnPropertyDescriptor(globalThis, 'window'),
  };
  Object.defineProperty(globalThis, 'document', { value: document, configurable: true, writable: true });
  Object.defineProperty(globalThis, 'window', { value: window, configurable: true, writable: true });
  return () => {
    for (const key of ['document', 'window']) {
      if (previous[key]) {
        Object.defineProperty(globalThis, key, previous[key]);
      } else {
        delete globalThis[key];
      }
    }
  };
}

function importJs(name) {
  return import(pathToFileURL(path.join(ROOT_DIR, 'js', name)).href);
}

describe('Çalışma Zamanı Davranışı (stub DOM)', () => {
  it('initNav window.matchMedia yokken hata fırlatmamalı ve menüyü yönetebilmeli', async () => {
    const toggle = new FakeElement({ 'data-nav-toggle': '' });
    const drawer = new FakeElement({ id: 'mobile-nav' });
    const documentStub = {
      documentElement: new FakeElement(),
      querySelector: (sel) => (sel === '[data-nav-toggle]' ? toggle : null),
      getElementById: (id) => (id === 'mobile-nav' ? drawer : null),
      addEventListener() {},
    };
    const restore = installGlobals({ document: documentStub, window: {} });
    try {
      const { initNav } = await importJs('nav.js');
      assert.doesNotThrow(() => initNav());
      assert.equal(toggle.getAttribute('aria-expanded'), 'false');
      assert.equal(drawer.hidden, true);

      toggle.dispatch('click');
      assert.equal(toggle.getAttribute('aria-expanded'), 'true');
      assert.equal(drawer.hidden, false);
      assert.equal(documentStub.documentElement.classList.contains('nav-open'), true);
    } finally {
      restore();
    }
  });

  it('main.js bootstrap bir başlatıcı hata fırlatsa da sonrakileri çalıştırmalı', async (t) => {
    // document tanımsızken import: otomatik bootstrap tetiklenmemeli.
    const { bootstrap, safeInit, INITIALIZERS } = await importJs('main.js');
    const errorMock = t.mock.method(console, 'error', () => {});

    assert.ok(Array.isArray(INITIALIZERS) && INITIALIZERS.length === 6, '6 modül başlatıcısı bekleniyor');

    const calls = [];
    bootstrap([
      ['ilk', () => calls.push('ilk')],
      [
        'bozuk',
        () => {
          throw new Error('kasıtlı hata');
        },
      ],
      ['son', () => calls.push('son')],
    ]);

    assert.deepEqual(calls, ['ilk', 'son']);
    assert.equal(errorMock.mock.callCount(), 1, 'hata console.error ile raporlanmalı');
    assert.equal(safeInit('ok', () => {}), true);
    assert.equal(
      safeInit('fail', () => {
        throw new Error('x');
      }),
      false,
    );
  });

  it('initAccordion tıklamada aria-expanded ve panel görünürlüğünü değiştirmeli', async () => {
    const panelA = new FakeElement({ id: 'panel-a', 'data-accordion-panel': '' });
    const panelB = new FakeElement({ id: 'panel-b', 'data-accordion-panel': '' });
    const triggerA = new FakeElement({
      'data-accordion-trigger': '',
      'aria-controls': 'panel-a',
      'aria-expanded': 'false',
    });
    const triggerB = new FakeElement({
      'data-accordion-trigger': '',
      'aria-controls': 'panel-b',
      'aria-expanded': 'true',
    });
    const accordion = new FakeElement({ 'data-accordion': '' });
    accordion.querySelectorAll = (sel) => (sel === '[data-accordion-trigger]' ? [triggerA, triggerB] : []);

    const panels = { 'panel-a': panelA, 'panel-b': panelB };
    const documentStub = {
      querySelectorAll: (sel) => (sel === '[data-accordion]' ? [accordion] : []),
      getElementById: (id) => panels[id] ?? null,
    };
    const restore = installGlobals({ document: documentStub, window: {} });
    try {
      const { initAccordion } = await importJs('accordion.js');
      initAccordion();

      assert.equal(panelA.hidden, true, 'kapalı panel başlangıçta gizli olmalı');
      assert.equal(panelB.hidden, false, 'açık panel başlangıçta görünür olmalı');

      triggerA.dispatch('click');
      assert.equal(triggerA.getAttribute('aria-expanded'), 'true');
      assert.equal(panelA.hidden, false);
      assert.equal(triggerB.getAttribute('aria-expanded'), 'false', 'tekli modda diğer öğe kapanmalı');
      assert.equal(panelB.hidden, true);

      triggerA.dispatch('click');
      assert.equal(triggerA.getAttribute('aria-expanded'), 'false');
      assert.equal(panelA.hidden, true);
    } finally {
      restore();
    }
  });
});

describe('HTML Güvenlik Başlıkları (meta)', () => {
  it('her sayfa <head> içinde CSP ve referrer meta etiketi taşımalı; script-src unsafe-* içermemeli', () => {
    const htmlFiles = [
      path.join(ROOT_DIR, 'index.html'),
      ...walkFiles(path.join(ROOT_DIR, 'projeler'), '.html'),
      ...walkFiles(path.join(ROOT_DIR, 'notlar'), '.html'),
    ];
    assert.ok(htmlFiles.length > 1, 'HTML sayfaları bulunamadı');

    const problems = [];
    for (const file of htmlFiles) {
      const rel = path.relative(ROOT_DIR, file);
      const html = fs.readFileSync(file, 'utf8');
      const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
      if (!head) {
        problems.push(`${rel}: <head> bulunamadı`);
        continue;
      }

      const cspTag = head.match(/<meta\b[^>]*http-equiv\s*=\s*["']Content-Security-Policy["'][^>]*>/i)?.[0];
      if (!cspTag) {
        problems.push(`${rel}: CSP meta etiketi eksik`);
      } else {
        const policy = cspTag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ?? cspTag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1];
        if (!policy) {
          problems.push(`${rel}: CSP content boş`);
        } else {
          const directives = new Map(
            policy
              .split(';')
              .map((d) => d.trim().split(/\s+/))
              .filter((parts) => parts[0])
              .map(([name, ...values]) => [name.toLowerCase(), values]),
          );
          const scriptSources = directives.get('script-src') ?? directives.get('default-src');
          if (!scriptSources) {
            problems.push(`${rel}: CSP script-src (veya default-src) direktifi yok`);
          }
          for (const name of ['script-src', 'script-src-elem', 'script-src-attr', 'default-src']) {
            const values = directives.get(name) ?? [];
            for (const bad of ["'unsafe-inline'", "'unsafe-eval'"]) {
              if (values.includes(bad) && (name !== 'default-src' || !directives.has('script-src'))) {
                problems.push(`${rel}: ${name} içinde ${bad}`);
              }
            }
          }
        }
      }

      if (!/<meta\b[^>]*\bname\s*=\s*["']referrer["'][^>]*>/i.test(head)) {
        problems.push(`${rel}: referrer meta etiketi eksik`);
      }
    }

    assert.deepEqual(problems, [], `Güvenlik meta sorunları:\n${problems.join('\n')}`);
  });
});
