import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
      { name: 'innerHTML', regex: /\.innerHTML\b/ },
      { name: 'outerHTML', regex: /\.outerHTML\b/ },
      { name: 'insertAdjacentHTML', regex: /\.insertAdjacentHTML\b/ },
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

  it('index.html simülatör kancaları (data-sim-step-* ve blok data-sim-log) sözleşmeye uymalı', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

    assert.match(indexHtml, /\bdata-simulator\b/);
    for (const key of ['salonzeka', 'vitrinos', 'yesilnesil']) {
      assert.match(indexHtml, new RegExp(`\\bdata-sim-tab="${key}"`));
    }
    for (let i = 0; i < 4; i += 1) {
      assert.match(indexHtml, new RegExp(`\\bdata-sim-step="${i}"`));
    }
    assert.match(indexHtml, /\bdata-sim-step-code\b/);
    assert.match(indexHtml, /\bdata-sim-step-title\b/);
    assert.match(indexHtml, /\bdata-sim-step-desc\b/);
    assert.match(
      indexHtml,
      /<div\b[^>]*\bdata-sim-log\b/i,
      'data-sim-log geçerli bir <div> blok kapsayıcı üzerinde olmalı (<pre><code> içinde değil)',
    );
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
