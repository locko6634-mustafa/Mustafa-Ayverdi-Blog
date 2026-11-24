import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { SIMULATOR_SCENARIOS, getScenario } from '../js/simulator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const SITE_ORIGIN = 'https://mustafaayverdi.com';

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

// --- Küçük HTML nitelik ayrıştırıcısı (çift, tek ve tırnaksız değerleri tanır) ---

/**
 * Bir başlangıç etiketinin nitelik metnini ayrıştırır.
 * Ad küçük harfe çevrilir; HTML kuralına uygun olarak yinelenen nitelikte ilk değer kazanır.
 * Değersiz (boolean) nitelikler '' döner.
 * @param {string} attrText
 * @returns {Map<string, string>}
 */
function parseAttributes(attrText) {
  const attrs = new Map();
  const attrRegex = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const m of attrText.matchAll(attrRegex)) {
    const name = m[1].toLowerCase();
    if (attrs.has(name)) {
      continue;
    }
    attrs.set(name, m[2] ?? m[3] ?? m[4] ?? '');
  }
  return attrs;
}

/**
 * HTML içindeki başlangıç etiketlerini (yorumlar hariç) ayrıştırılmış nitelikleriyle döndürür.
 * Tırnak içindeki '>' karakterleri etiketi erken bitirmez.
 * @param {string} html
 * @param {string[]} [names] yalnız bu etiket adları (küçük harf)
 */
function findTags(html, names) {
  const wanted = names ? new Set(names) : null;
  const stripped = html.replace(/<!--[\s\S]*?-->/g, '');
  const tagRegex = /<([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  const tags = [];
  for (const m of stripped.matchAll(tagRegex)) {
    const name = m[1].toLowerCase();
    if (wanted && !wanted.has(name)) {
      continue;
    }
    tags.push({ name, attrs: parseAttributes(m[2]), raw: m[0] });
  }
  return tags;
}

/**
 * target="_blank" güvenlik ihlallerini döndürür:
 * - <a>, <area>, <form> target=_blank ise rel içinde noopener ve noreferrer zorunlu
 * - <base target=_blank> tamamen yasak (tüm sayfayı etkiler)
 * @param {string} html
 * @returns {string[]}
 */
function findBlankTargetViolations(html) {
  const violations = [];
  for (const { name, attrs, raw } of findTags(html, ['a', 'area', 'form', 'base'])) {
    if (!attrs.has('target') || attrs.get('target').trim().toLowerCase() !== '_blank') {
      continue;
    }
    if (name === 'base') {
      violations.push(`<base target="_blank"> yasak: ${raw}`);
      continue;
    }
    if (!attrs.has('rel')) {
      violations.push(`rel niteliği eksik target="_blank" <${name}>: ${raw}`);
      continue;
    }
    const relTokens = attrs.get('rel').toLowerCase().split(/\s+/);
    if (!relTokens.includes('noopener') || !relTokens.includes('noreferrer')) {
      violations.push(`noopener/noreferrer eksik <${name}>: ${raw}`);
    }
  }
  return violations;
}

/**
 * srcset değerindeki aday URL'leri döndürür (HTML srcset ayrıştırma kuralına yakın:
 * URL boşluğa kadar okunur, sondaki virgüller atılır, tanımlayıcılar virgüle kadar atlanır).
 * @param {string} value
 * @returns {string[]}
 */
function parseSrcset(value) {
  const urls = [];
  let i = 0;
  while (i < value.length) {
    while (i < value.length && /[\s,]/.test(value[i])) i += 1;
    if (i >= value.length) break;
    const start = i;
    while (i < value.length && !/\s/.test(value[i])) i += 1;
    let url = value.slice(start, i);
    if (url.endsWith(',')) {
      url = url.replace(/,+$/, '');
    } else {
      let depth = 0;
      while (i < value.length) {
        const c = value[i];
        if (c === '(') depth += 1;
        else if (c === ')') depth = Math.max(0, depth - 1);
        else if (c === ',' && depth === 0) break;
        i += 1;
      }
    }
    if (url) urls.push(url);
  }
  return urls;
}

/**
 * HTML içindeki href/src/poster nitelik değerlerini ve srcset adaylarını (tüm tırnak biçimleriyle) döndürür.
 * @param {string} html
 * @returns {string[]}
 */
function collectLinkValues(html) {
  const values = [];
  for (const { attrs } of findTags(html)) {
    for (const attr of ['href', 'src', 'poster']) {
      if (attrs.has(attr)) {
        values.push(attrs.get(attr));
      }
    }
    if (attrs.has('srcset')) {
      values.push(...parseSrcset(attrs.get('srcset')));
    }
  }
  return values;
}

/**
 * CSS içindeki url(...) ve @import "..." yollarını (yorumlar hariç) döndürür.
 * @param {string} css
 * @returns {string[]}
 */
function collectCssUrls(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const values = [];
  for (const m of stripped.matchAll(/\burl\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi)) {
    values.push(m[1] ?? m[2] ?? m[3] ?? '');
  }
  for (const m of stripped.matchAll(/@import\s+(?:"([^"]*)"|'([^']*)')/gi)) {
    values.push(m[1] ?? m[2]);
  }
  return values;
}

/**
 * Yerel bir referansı dosya yoluna çözer; harici/#/mailto/data: vb. ve boş yollar için null döner.
 * Temiz URL'ler sunucudaki nginx `try_files $uri $uri.html $uri/` sırasıyla çözülür:
 * dosya varsa kendisi, yoksa `x` → `x.html`; `dir/` dizin olarak döner (index.html kontrolü çağırana aittir).
 * @param {string} value
 * @param {string} baseDir
 * @returns {string | null}
 */
function resolveLocalRef(value, baseDir) {
  const rawUrl = value.trim();
  if (isExternalOrHash(rawUrl)) {
    return null;
  }
  const cleanUrl = rawUrl.split('#')[0].split('?')[0];
  if (!cleanUrl) {
    return null;
  }
  const resolved = cleanUrl.startsWith('/') ? path.join(ROOT_DIR, cleanUrl.slice(1)) : path.resolve(baseDir, cleanUrl);
  if (!cleanUrl.endsWith('/') && !(fs.existsSync(resolved) && fs.statSync(resolved).isFile())) {
    if (fs.existsSync(`${resolved}.html`)) {
      return `${resolved}.html`;
    }
  }
  return resolved;
}

/**
 * Bir adres değerinin yol kısmı (fragment/query öncesi) .html ile bitiyor mu?
 * @param {string} value
 * @returns {boolean}
 */
function pathEndsWithHtml(value) {
  return /\.html$/i.test(value.trim().split('#')[0].split('?')[0]);
}

/**
 * CSS içinde tanımlı sınıf adlarını döndürür. Yorumlar ve string literal içerikleri
 * ('...' / "...") önce temizlenir; böylece content: ".x" veya url("./a.css") sahte sınıf üretmez.
 * @param {string} css
 * @returns {Set<string>}
 */
function collectCssClasses(css) {
  const stripped = css.replace(/\/\*[\s\S]*?\*\/|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*'/g, (m) =>
    m.startsWith('/') ? '' : '""',
  );
  const classes = new Set();
  for (const match of stripped.matchAll(/(?:^|[^0-9a-zA-Z_-])\.([a-zA-Z_][a-zA-Z0-9_-]*)/g)) {
    classes.add(match[1]);
  }
  return classes;
}

/**
 * sitemap.xml içindeki <url> girdilerini { loc, lastmod } olarak döndürür.
 * @param {string} xml
 * @returns {{ loc: string | null, lastmod: string | null, locCount: number }[]}
 */
function parseSitemap(xml) {
  return Array.from(xml.matchAll(/<url>([\s\S]*?)<\/url>/g), ([, body]) => {
    const locs = Array.from(body.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g), (m) => m[1]);
    return {
      loc: locs[0] ?? null,
      locCount: locs.length,
      lastmod: body.match(/<lastmod>\s*([^<]*?)\s*<\/lastmod>/)?.[1] ?? null,
    };
  });
}

/**
 * Site URL'sini yerel HTML dosya yoluna çözer ('/' ile biten → index.html, uzantısız temiz URL → .html);
 * ORIGIN dışıysa null.
 * @param {string} url
 * @returns {string | null}
 */
function siteUrlToLocalFile(url) {
  if (!url.startsWith(`${SITE_ORIGIN}/`)) {
    return null;
  }
  let rel = url.slice(SITE_ORIGIN.length + 1);
  if (rel === '' || rel.endsWith('/')) {
    rel += 'index.html';
  } else if (!path.posix.extname(rel)) {
    rel += '.html';
  }
  return path.join(ROOT_DIR, rel);
}

/** Arama motorlarına kapalı (noindex) olması beklenen sayfalar; sitemap ve paylaşım etiketlerinden muaftır. */
const NOINDEX_PAGES = ['404.html', 'kart.html'];

/**
 * Sayfanın <head> bölümünde robots meta etiketi noindex içeriyor mu?
 * @param {string} html
 * @returns {boolean}
 */
function hasNoindex(html) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  return findTags(head, ['meta']).some(
    ({ attrs }) =>
      (attrs.get('name') ?? '').trim().toLowerCase() === 'robots' &&
      (attrs.get('content') ?? '').toLowerCase().split(/[\s,]+/).includes('noindex'),
  );
}

/**
 * JPEG dosyasının genişlik/yüksekliğini SOF (Start Of Frame) başlığından okur; bağımlılık gerektirmez.
 * @param {Buffer} buf
 * @returns {{ width: number, height: number } | null}
 */
function readJpegSize(buf) {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) {
    return null;
  }
  // SOF0-SOF15; DHT (C4), JPG (C8) ve DAC (CC) SOF değildir.
  const SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let i = 2;
  while (i + 4 <= buf.length) {
    if (buf[i] !== 0xff) {
      return null;
    }
    const marker = buf[i + 1];
    if (marker === 0xff) {
      i += 1; // dolgu baytı
      continue;
    }
    const segLen = buf.readUInt16BE(i + 2);
    if (SOF_MARKERS.has(marker)) {
      if (i + 9 > buf.length) {
        return null;
      }
      return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    }
    if (marker === 0xda || segLen < 2) {
      return null; // tarama verisi başladı veya bozuk segment
    }
    i += 2 + segLen;
  }
  return null;
}

/** Yasaklı JS kalıpları (tüm js/ dosyalarına uygulanır). */
const FORBIDDEN_JS_PATTERNS = [
  { name: 'innerHTML', regex: /\.innerHTML\b|\[\s*['"`]innerHTML['"`]\s*\]/ },
  { name: 'outerHTML', regex: /\.outerHTML\b|\[\s*['"`]outerHTML['"`]\s*\]/ },
  {
    name: 'insertAdjacentHTML',
    regex: /\.insertAdjacentHTML\b|\[\s*['"`]insertAdjacentHTML['"`]\s*\]/,
  },
  {
    name: 'köşeli parantezde string birleştirmeli üye erişimi (ör. el[\'inner\'+\'HTML\'])',
    regex: /\[\s*['"`][^'"`\]]*['"`]\s*\+/,
  },
  { name: 'document.write', regex: /document\.write\b|\[\s*['"`]write(?:ln)?['"`]\s*\]/ },
  // eval( , (0, eval)(x), window.eval(x), window['eval'](x)
  { name: 'eval', regex: /(?<![\w$])eval\b|\[\s*['"`]eval['"`]\s*\]/ },
  // new Function(..), Function(..)(), window['Function'](..)
  { name: 'Function()', regex: /(?<![\w$.])Function\s*\(|\[\s*['"`]Function['"`]\s*\]/ },
  {
    name: 'string argümanlı setTimeout/setInterval',
    regex: /\bset(?:Timeout|Interval)\s*\(\s*['"`]/,
  },
  { name: 'javascript: URL', regex: /javascript\s*:/i },
];

/** @param {string} source @returns {string[]} eşleşen yasaklı kalıp adları */
function findForbiddenJs(source) {
  return FORBIDDEN_JS_PATTERNS.filter(({ regex }) => regex.test(source)).map(({ name }) => name);
}

// --- CSP politika denetimi ---

const REQUIRED_CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'none'"],
};

function parseCsp(policy) {
  return new Map(
    policy
      .split(';')
      .map((d) => d.trim().split(/\s+/))
      .filter((parts) => parts[0])
      .map(([name, ...values]) => [name.toLowerCase(), values]),
  );
}

/**
 * CSP politikasındaki sorunları döndürür (boş dizi = geçerli).
 * @param {string} policy
 * @returns {string[]}
 */
function analyzeCsp(policy) {
  const problems = [];
  const directives = parseCsp(policy);
  for (const [name, expected] of Object.entries(REQUIRED_CSP_DIRECTIVES)) {
    const actual = directives.get(name);
    if (!actual) {
      problems.push(`${name} direktifi eksik`);
    } else if (actual.join(' ') !== expected.join(' ')) {
      problems.push(`${name} "${expected.join(' ')}" olmalı, bulunan: "${actual.join(' ')}"`);
    }
  }
  const forbiddenKeywords = new Set(["'unsafe-inline'", "'unsafe-eval'", "'unsafe-hashes'"]);
  // Site sıfır harici bağımlılıklı: tüm getirme direktiflerinde yalnız 'self' / 'none' kabul edilir.
  const fetchDirective = /-src(?:-elem|-attr)?$/;
  const allowedFetchSources = new Set(["'self'", "'none'"]);
  for (const [name, values] of directives) {
    for (const raw of values) {
      const value = raw.toLowerCase();
      if (fetchDirective.test(name) && !allowedFetchSources.has(value)) {
        problems.push(`${name} içinde izin verilmeyen kaynak (yalnız 'self'/'none'): ${raw}`);
      } else if (forbiddenKeywords.has(value)) {
        problems.push(`${name} içinde ${raw}`);
      } else if (value.includes('*')) {
        problems.push(`${name} içinde joker (*) kaynak: ${raw}`);
      } else if (value === 'http:' || value.startsWith('http://')) {
        problems.push(`${name} içinde güvensiz http: kaynağı: ${raw}`);
      } else if (value === 'data:') {
        problems.push(`${name} içinde data: kaynağı`);
      }
    }
  }
  return problems;
}

describe('Test Yardımcıları (sentetik negatif kontroller)', () => {
  it('nitelik ayrıştırıcısı çift, tek ve tırnaksız target=_blank ihlallerini yakalamalı', () => {
    const attrs = parseAttributes(` href='https://x' target=_blank data-a="1 > 2" hidden rel="a" REL="b"`);
    assert.equal(attrs.get('href'), 'https://x');
    assert.equal(attrs.get('target'), '_blank');
    assert.equal(attrs.get('data-a'), '1 > 2');
    assert.equal(attrs.get('hidden'), '');
    assert.equal(attrs.get('rel'), 'a', 'yinelenen nitelikte ilk değer kazanmalı');

    const mustFail = [
      `<a href='https://x' target='_blank'>x</a>`,
      `<a href=https://x target=_blank>x</a>`,
      `<a href="https://x" target="_blank">x</a>`,
      `<a href="https://x" TARGET="_BLANK" rel='noopener'>x</a>`,
      `<a target=_blank rel=noopener href=/x>x</a>`,
      `<a data-x="a > b" target='_blank'>x</a>`,
      `<area href="/x" target=_blank alt="x">`,
      `<form action="/x" target='_blank'></form>`,
      `<base target="_blank">`,
      `<base href="/" target=_blank>`,
    ];
    for (const sample of mustFail) {
      assert.equal(findBlankTargetViolations(sample).length, 1, `İhlal yakalanmadı: ${sample}`);
    }

    const mustPass = [
      `<a href='https://x' target='_blank' rel='noopener noreferrer'>x</a>`,
      `<a href=https://x target=_blank rel="noreferrer noopener external">x</a>`,
      `<a href="/x" target="_self">x</a>`,
      `<a href="/x">x</a>`,
      `<!-- <a href="https://x" target="_blank"> -->`,
      `<base href="/">`,
    ];
    for (const sample of mustPass) {
      assert.deepEqual(findBlankTargetViolations(sample), [], `Yanlış pozitif: ${sample}`);
    }

    assert.deepEqual(
      collectLinkValues(`<link href="a.css"><img src='b.png'><script src=c.js></script><a href=#top>t</a>`),
      ['a.css', 'b.png', 'c.js', '#top'],
    );
    assert.deepEqual(
      collectLinkValues(
        `<img src="a.png" srcset="a-1x.png 1x, a-2x.png 2x,a-3x.png 3x"><video poster='p.jpg'></video>` +
          `<source srcset=s.webp>`,
      ),
      ['a.png', 'a-1x.png', 'a-2x.png', 'a-3x.png', 'p.jpg', 's.webp'],
    );
    assert.deepEqual(parseSrcset('x.png 100w, y.png 200w'), ['x.png', 'y.png']);
    assert.deepEqual(
      collectCssUrls(
        `@import url("./a.css"); @import 'b.css'; /* url(yorum.png) */ .x { background: url(img/c.png) } ` +
          `.y { mask: url( 'd.svg#m' ) } .z { background: url(data:image/png;base64,AA) }`,
      ),
      ['./a.css', 'img/c.png', 'd.svg#m', 'data:image/png;base64,AA', 'b.css'],
    );
    assert.equal(resolveLocalRef('data:image/png;base64,AA', ROOT_DIR), null);
    assert.equal(resolveLocalRef('https://x/y.png', ROOT_DIR), null);
    assert.equal(resolveLocalRef('img/c.png?v=1#a', '/k'), path.resolve('/k', 'img/c.png'));
    assert.deepEqual(
      Array.from(
        collectCssClasses(
          `@import url("./tokens.css"); .a { } .b::after { content: ".sahte"; } /* .yorum */ ` +
            `.c[data-x='.tek'] { background: url('img/x.png') } .d{content:"a\\".kacis"}`,
        ),
      ),
      ['a', 'b', 'c', 'd'],
    );
    assert.equal(siteUrlToLocalFile(`${SITE_ORIGIN}/`), path.join(ROOT_DIR, 'index.html'));
    assert.equal(siteUrlToLocalFile(`${SITE_ORIGIN}/notlar/`), path.join(ROOT_DIR, 'notlar', 'index.html'));
    assert.equal(
      siteUrlToLocalFile(`${SITE_ORIGIN}/projeler/randevuzeka`),
      path.join(ROOT_DIR, 'projeler', 'randevuzeka.html'),
    );
    assert.equal(siteUrlToLocalFile('https://baska.example/x.html'), null);
    // Temiz URL çözümlemesi: x → x.html, dir/ → dizin (index.html çağıranda), fragment korunur.
    assert.equal(resolveLocalRef('projeler/vitrinos#a', ROOT_DIR), path.join(ROOT_DIR, 'projeler', 'vitrinos.html'));
    assert.equal(path.resolve(resolveLocalRef('/notlar/', ROOT_DIR)), path.join(ROOT_DIR, 'notlar'));
    assert.equal(resolveLocalRef('./css/main.css', ROOT_DIR), path.join(ROOT_DIR, 'css', 'main.css'));
    assert.equal(pathEndsWithHtml('../index.html#simulator'), true);
    assert.equal(pathEndsWithHtml('../#simulator'), false);
    assert.equal(pathEndsWithHtml('./vitrinos?x=.html'), false);
  });

  it('yasaklı JS kalıpları dolaylı eval/Function/innerHTML biçimlerini de yakalamalı', () => {
    const mustFail = [
      `el.innerHTML = x;`,
      `el['innerHTML'] = x;`,
      `el['inner' + 'HTML'] = x;`,
      `el["inner"+"HTML"] = x;`,
      `eval(x);`,
      `(0, eval)(x);`,
      `window.eval(x);`,
      `window['eval'](x);`,
      `new Function('return 1')();`,
      `Function('return 1')();`,
      `window['Function']('x')();`,
      `setTimeout('alert(1)', 10);`,
      `document.write(x);`,
      `document['write'](x);`,
      `location.href = 'javascript:void(0)';`,
    ];
    for (const sample of mustFail) {
      assert.ok(findForbiddenJs(sample).length > 0, `Yasaklı kalıp yakalanmadı: ${sample}`);
    }

    const mustPass = [
      `el.textContent = x;`,
      `const evaluate = (v) => v; evaluate(1);`,
      `myFunction(1); obj.Function = 1;`,
      `cellMap['14:00'][2];`,
      `setTimeout(() => {}, 10);`,
      `typeof fn === 'function';`,
    ];
    for (const sample of mustPass) {
      assert.deepEqual(findForbiddenJs(sample), [], `Yanlış pozitif: ${sample}`);
    }
  });

  it('CSP analizcisi zayıf politikaları reddetmeli, güçlü politikayı kabul etmeli', () => {
    const strong =
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'";
    assert.deepEqual(analyzeCsp(strong), []);

    const weakVariants = [
      strong.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"),
      strong.replace("style-src 'self'", "style-src 'self' 'unsafe-inline'"),
      strong.replace("img-src 'self'", "img-src 'self' 'unsafe-hashes'"),
      strong.replace("img-src 'self'", "img-src 'self' 'unsafe-eval'"),
      strong.replace("img-src 'self'", "img-src 'self' data:"),
      strong.replace("img-src 'self'", 'img-src *'),
      strong.replace("img-src 'self'", 'img-src https://*.example.com'),
      strong.replace("img-src 'self'", 'img-src http:'),
      strong.replace("img-src 'self'", 'img-src http://cdn.example.com'),
      strong.replace("; object-src 'none'", ''),
      strong.replace("base-uri 'self'", 'base-uri *'),
      strong.replace("form-action 'none'", "form-action 'self'"),
      strong.replace("default-src 'self'", "default-src 'self' https:"),
      strong.replace("img-src 'self'", 'img-src https:'),
      `${strong}; connect-src https://evil.example`,
      `${strong}; script-src-elem https://evil.example`,
      `${strong}; style-src-attr 'self' https://cdn.example`,
      `${strong}; font-src 'self' data:`,
      `${strong}; frame-src evil.example`,
    ];
    for (const policy of weakVariants) {
      assert.ok(analyzeCsp(policy).length > 0, `Zayıf CSP kabul edildi: ${policy}`);
    }
  });
});

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

    for (const file of jsFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const rel = path.relative(ROOT_DIR, file);
      for (const { name, regex } of FORBIDDEN_JS_PATTERNS) {
        assert.equal(regex.test(content), false, `${rel} içinde yasaklı ${name} tespit edildi`);
      }
    }
  });
});

describe('Simülatör Veri Bütünlüğü', () => {
  it('randevuzeka, vitrinos ve yesilnesil senaryoları eksiksiz 4 adımlı olmalı', () => {
    const keys = ['randevuzeka', 'vitrinos', 'yesilnesil'];
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

describe('Simülatör Anahtar Sertleştirmesi (prototip anahtarları)', () => {
  it('getScenario yalnız kendi senaryo anahtarlarını kabul etmeli', () => {
    for (const key of Object.keys(SIMULATOR_SCENARIOS)) {
      assert.equal(getScenario(key), SIMULATOR_SCENARIOS[key]);
    }
    for (const key of ['constructor', 'toString', '__proto__', 'hasOwnProperty', 'valueOf', '', undefined, null, 1]) {
      assert.equal(getScenario(key), null, `Prototip/geçersiz anahtar kabul edildi: ${String(key)}`);
    }
  });

  it('initSimulator prototip anahtarlı sekmede TypeError fırlatmamalı ve geçerli senaryoya düşmeli', async () => {
    const tabs = ['constructor', 'randevuzeka', 'toString'].map(
      (key) => new FakeElement({ 'data-sim-tab': key }),
    );
    tabs[0].classList.add('is-active');
    const step = new FakeElement({ 'data-sim-step': '0' });
    const left = new FakeElement({ 'data-sim-left': '' });
    const right = new FakeElement({ 'data-sim-right': '' });
    const root = new FakeElement({ 'data-simulator': '' });
    root.querySelectorAll = (sel) => {
      if (sel === '[data-sim-tab]') return tabs;
      if (sel === '[data-sim-step]') return [step];
      return [];
    };
    root.querySelector = (sel) => ({ '[data-sim-left]': left, '[data-sim-right]': right })[sel] ?? null;

    const documentStub = {
      querySelector: (sel) => (sel === '[data-simulator]' ? root : null),
      getElementById: () => null,
    };
    // IntersectionObserver geri çağrısı tetiklenmez: sahne kurulumu çalışmaz, yalnız anahtar mantığı test edilir.
    class FakeObserver {
      observe() {}
      disconnect() {}
    }
    const windowStub = { addEventListener() {}, removeEventListener() {}, IntersectionObserver: FakeObserver };
    const restoreGlobals = installGlobals({ document: documentStub, window: windowStub });
    const previousObserver = Object.getOwnPropertyDescriptor(globalThis, 'IntersectionObserver');
    Object.defineProperty(globalThis, 'IntersectionObserver', { value: FakeObserver, configurable: true, writable: true });
    const restore = () => {
      if (previousObserver) {
        Object.defineProperty(globalThis, 'IntersectionObserver', previousObserver);
      } else {
        delete globalThis.IntersectionObserver;
      }
      restoreGlobals();
    };
    try {
      const { initSimulator } = await importJs('simulator.js');
      assert.doesNotThrow(() => initSimulator());
      assert.equal(tabs[1].getAttribute('tabindex'), '0', 'geçersiz aktif anahtarda randevuzeka seçilmeli');
      assert.equal(tabs[0].getAttribute('tabindex'), '-1');
      assert.doesNotThrow(() => tabs[0].dispatch('click'));
      assert.doesNotThrow(() => tabs[2].dispatch('click'));
    } finally {
      restore();
    }
  });
});

describe('HTML Sözleşme ve Link Kontrolleri', () => {
  it('tüm HTML dosyalarındaki yerel CSS/JS/sayfa linkleri geçerli dosyalara işaret etmeli', () => {
    const htmlFiles = walkFiles(ROOT_DIR, '.html');
    assert.ok(htmlFiles.length > 0, 'Hiç HTML dosyası bulunamadı');

    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf8');
      const dir = path.dirname(htmlFile);
      const relHtml = path.relative(ROOT_DIR, htmlFile);

      for (const value of collectLinkValues(content)) {
        const resolved = resolveLocalRef(value, dir);
        if (!resolved) {
          continue;
        }
        assert.ok(
          fs.existsSync(resolved),
          `${relHtml} içinde kırık yerel yol: "${value.trim()}" -> ${path.relative(ROOT_DIR, resolved)}`,
        );
        if (fs.statSync(resolved).isDirectory()) {
          assert.ok(
            fs.existsSync(path.join(resolved, 'index.html')),
            `${relHtml} içinde index.html içermeyen dizine link: "${value.trim()}" -> ${path.relative(ROOT_DIR, resolved)}`,
          );
        }
      }
    }
  });

  it('css/*.css içindeki yerel url(...) ve @import yolları geçerli dosyalara işaret etmeli', () => {
    const cssFiles = walkFiles(path.join(ROOT_DIR, 'css'), '.css');
    assert.ok(cssFiles.length > 0, 'CSS dosyaları bulunamadı');

    let checked = 0;
    for (const cssFile of cssFiles) {
      const relCss = path.relative(ROOT_DIR, cssFile);
      for (const value of collectCssUrls(fs.readFileSync(cssFile, 'utf8'))) {
        const resolved = resolveLocalRef(value, path.dirname(cssFile));
        if (!resolved) {
          continue;
        }
        checked += 1;
        assert.ok(
          fs.existsSync(resolved),
          `${relCss} içinde kırık yerel yol: "${value.trim()}" -> ${path.relative(ROOT_DIR, resolved)}`,
        );
      }
    }
    assert.ok(checked > 0, 'CSS içinde denetlenecek yerel url()/@import bulunamadı');
  });

  it('target="_blank" kullanılan tüm <a>/<area>/<form> etiketlerinde rel="noopener noreferrer" bulunmalı; <base target="_blank"> yasak', () => {
    const htmlFiles = walkFiles(ROOT_DIR, '.html');
    assert.ok(htmlFiles.length > 0, 'Hiç HTML dosyası bulunamadı');

    const problems = [];
    for (const htmlFile of htmlFiles) {
      const content = fs.readFileSync(htmlFile, 'utf8');
      const relHtml = path.relative(ROOT_DIR, htmlFile);
      for (const violation of findBlankTargetViolations(content)) {
        problems.push(`${relHtml}: ${violation}`);
      }
    }

    assert.deepEqual(problems, [], `target="_blank" ihlalleri:\n${problems.join('\n')}`);
  });

  it('index.html simülatör kancaları (data-simulator, çift ekran ve timeline) sözleşmeye uymalı', () => {
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');

    assert.match(indexHtml, /\bdata-simulator\b/);
    for (const key of ['randevuzeka', 'vitrinos', 'yesilnesil']) {
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
    for (const cssFile of cssFiles) {
      for (const cls of collectCssClasses(fs.readFileSync(cssFile, 'utf8'))) {
        definedClasses.add(cls);
      }
    }

    const htmlFiles = walkFiles(ROOT_DIR, '.html');
    const missing = new Set();
    let inspectedClasses = 0;

    for (const htmlFile of htmlFiles) {
      const html = fs.readFileSync(htmlFile, 'utf8');
      const relHtml = path.relative(ROOT_DIR, htmlFile);
      // parseAttributes çift/tek/tırnaksız class değerlerini okur; data-class gibi nitelikler ayrı addır.
      for (const { attrs } of findTags(html)) {
        for (const cls of (attrs.get('class') ?? '').trim().split(/\s+/)) {
          if (!cls) {
            continue;
          }
          inspectedClasses += 1;
          if (!definedClasses.has(cls)) {
            missing.add(`${relHtml}: .${cls}`);
          }
        }
      }
    }

    assert.ok(inspectedClasses > 0, 'HTML dosyalarında incelenecek class değeri bulunamadı');

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
  const htmlPages = walkFiles(ROOT_DIR, '.html');

  /** @returns {{ rel: string, policy: string | null, problems: string[] }} */
  function readPageCsp(file) {
    const rel = path.relative(ROOT_DIR, file);
    const html = fs.readFileSync(file, 'utf8');
    const problems = [];
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
    if (!head) {
      return { rel, policy: null, problems: [`${rel}: <head> bulunamadı`] };
    }

    const cspTags = findTags(head, ['meta']).filter(
      ({ attrs }) => (attrs.get('http-equiv') ?? '').trim().toLowerCase() === 'content-security-policy',
    );
    if (cspTags.length !== 1) {
      problems.push(`${rel}: <head> içinde tam 1 CSP meta etiketi olmalı (bulunan: ${cspTags.length})`);
    }
    const policy = cspTags[0]?.attrs.get('content')?.trim() || null;
    if (cspTags.length > 0 && !policy) {
      problems.push(`${rel}: CSP content boş`);
    }

    const hasReferrer = findTags(head, ['meta']).some(
      ({ attrs }) => (attrs.get('name') ?? '').trim().toLowerCase() === 'referrer',
    );
    if (!hasReferrer) {
      problems.push(`${rel}: referrer meta etiketi eksik`);
    }
    return { rel, policy, problems };
  }

  it('her sayfa <head> içinde CSP ve referrer meta etiketi taşımalı; CSP zorunlu direktifleri içermeli ve unsafe-*/*/http:/data: barındırmamalı', () => {
    assert.ok(htmlPages.length > 1, 'HTML sayfaları bulunamadı');

    const problems = [];
    for (const file of htmlPages) {
      const { rel, policy, problems: pageProblems } = readPageCsp(file);
      problems.push(...pageProblems);
      if (policy) {
        for (const p of analyzeCsp(policy)) {
          problems.push(`${rel}: ${p}`);
        }
      }
    }

    assert.deepEqual(problems, [], `Güvenlik meta sorunları:\n${problems.join('\n')}`);
  });

  it('kökteki tüm HTML sayfalarının CSP politikası birebir aynı olmalı', () => {
    assert.ok(htmlPages.length > 1, 'HTML sayfaları bulunamadı');

    const byPolicy = new Map();
    for (const file of htmlPages) {
      const { rel, policy } = readPageCsp(file);
      const key = policy ?? '<CSP yok>';
      if (!byPolicy.has(key)) {
        byPolicy.set(key, []);
      }
      byPolicy.get(key).push(rel);
    }

    assert.equal(
      byPolicy.size,
      1,
      `Sayfalar arasında farklı CSP politikaları var:\n${Array.from(byPolicy)
        .map(([policy, pages]) => `- "${policy}" → ${pages.join(', ')}`)
        .join('\n')}`,
    );
  });

  it('HTML sayfalarında javascript: URL ve satır içi on* olay öznitelikleri bulunmamalı', () => {
    assert.ok(htmlPages.length > 1, 'HTML sayfaları bulunamadı');
    const urlAttrs = ['href', 'src', 'action', 'formaction', 'data', 'xlink:href', 'srcdoc'];
    const problems = [];
    for (const file of htmlPages) {
      const rel = path.relative(ROOT_DIR, file);
      for (const { name, attrs } of findTags(fs.readFileSync(file, 'utf8'))) {
        for (const attr of urlAttrs) {
          const value = (attrs.get(attr) ?? '').replace(/[\s\u0000-\u001f]/g, '').toLowerCase();
          if (value.startsWith('javascript:')) {
            problems.push(`${rel}: <${name} ${attr}> javascript: URL içeriyor`);
          }
        }
        for (const attrName of attrs.keys()) {
          if (/^on[a-z]+$/.test(attrName)) {
            problems.push(`${rel}: <${name}> satır içi ${attrName} olay özniteliği içeriyor`);
          }
        }
      }
    }
    assert.deepEqual(problems, [], `Yasaklı HTML kalıpları:\n${problems.join('\n')}`);
  });

  it('her sayfa favicon, og:* ve twitter:* paylaşım etiketlerini canonical ile tutarlı taşımalı', () => {
    assert.ok(htmlPages.length > 1, 'HTML sayfaları bulunamadı');
    const ORIGIN = 'https://mustafaayverdi.com/';
    const requiredOg = ['og:type', 'og:locale', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:alt'];
    const requiredTw = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'];
    const problems = [];

    for (const file of htmlPages) {
      const rel = path.relative(ROOT_DIR, file);
      const html = fs.readFileSync(file, 'utf8');
      if (hasNoindex(html)) {
        // noindex sayfaların kümesi ayrı testte NOINDEX_PAGES ile birebir doğrulanır.
        continue;
      }
      const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1];
      if (!head) {
        problems.push(`${rel}: <head> bulunamadı`);
        continue;
      }
      const metas = findTags(head, ['meta']);
      const links = findTags(head, ['link']);
      const metaValue = (attr, key) =>
        metas.find(({ attrs }) => (attrs.get(attr) ?? '').trim() === key)?.attrs.get('content')?.trim() ?? '';

      for (const key of requiredOg) {
        if (!metaValue('property', key)) problems.push(`${rel}: ${key} eksik`);
      }
      for (const key of requiredTw) {
        if (!metaValue('name', key)) problems.push(`${rel}: ${key} eksik`);
      }

      const canonical = links.find(({ attrs }) => attrs.get('rel') === 'canonical')?.attrs.get('href') ?? '';
      if (!canonical.startsWith(ORIGIN)) problems.push(`${rel}: canonical ${ORIGIN} ile başlamalı`);
      if (metaValue('property', 'og:url') !== canonical) problems.push(`${rel}: og:url canonical ile aynı olmalı`);

      for (const [attr, key] of [['property', 'og:image'], ['name', 'twitter:image']]) {
        const url = metaValue(attr, key);
        if (!url.startsWith(`${ORIGIN}assets/img/`)) {
          problems.push(`${rel}: ${key} ${ORIGIN}assets/img/ altında mutlak URL olmalı`);
          continue;
        }
        const local = path.join(ROOT_DIR, url.slice(ORIGIN.length));
        if (!fs.existsSync(local)) problems.push(`${rel}: ${key} yerelde olmayan dosyaya işaret ediyor`);
      }

      const icon = links.find(({ attrs }) => (attrs.get('rel') ?? '').split(/\s+/).includes('icon'));
      if (!icon) {
        problems.push(`${rel}: favicon <link rel="icon"> eksik`);
      } else {
        if (icon.attrs.get('type') !== 'image/svg+xml') problems.push(`${rel}: favicon type image/svg+xml olmalı`);
        const target = path.resolve(path.dirname(file), icon.attrs.get('href') ?? '');
        if (!fs.existsSync(target)) problems.push(`${rel}: favicon dosyası bulunamadı`);
      }
    }

    assert.deepEqual(problems, [], `Paylaşım/favicon sorunları:\n${problems.join('\n')}`);
  });
});

describe('SEO: sitemap.xml ve robots.txt', () => {
  // Sabit sayfa sayısı yerine sitemap ile iki yönlü küme eşitliği aranır: walkFiles sayfa kaçırırsa
  // da, yeni sayfa sitemap'e eklenmezse de test düşer; yeni not eklemek sabit güncellemesi gerektirmez.
  it('sitemap.xml yayınlanan tüm HTML sayfalarını canonical ile birebir ve geçerli lastmod ile listelemeli', () => {
    const entries = parseSitemap(fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8'));
    assert.ok(entries.length > 0, 'sitemap.xml içinde <url> girdisi bulunamadı');

    const problems = [];
    const fileToLoc = new Map();
    for (const { loc, locCount, lastmod } of entries) {
      if (locCount !== 1 || !loc) {
        problems.push(`<url> girdisinde tam 1 <loc> olmalı (bulunan: ${locCount})`);
        continue;
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod ?? '') || Number.isNaN(Date.parse(`${lastmod}T00:00:00Z`))) {
        problems.push(`${loc}: lastmod YYYY-MM-DD olmalı (bulunan: ${lastmod})`);
      }
      const local = siteUrlToLocalFile(loc);
      if (!local) {
        problems.push(`${loc}: ${SITE_ORIGIN}/ ile başlamalı`);
        continue;
      }
      if (!local.endsWith('.html') || !fs.existsSync(local)) {
        problems.push(`${loc}: yerel HTML dosyasına çözülmüyor (${path.relative(ROOT_DIR, local)})`);
        continue;
      }
      const rel = path.relative(ROOT_DIR, local);
      if (fileToLoc.has(rel)) {
        problems.push(`${rel}: sitemap'te birden fazla kez listelenmiş`);
      }
      fileToLoc.set(rel, loc);
    }

    // noindex sayfalar (ör. 404.html) sitemap'e girmez; küme ayrı testte NOINDEX_PAGES ile kilitlenir.
    const htmlPages = walkFiles(ROOT_DIR, '.html')
      .filter((file) => !hasNoindex(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(ROOT_DIR, file));
    for (const rel of htmlPages) {
      const loc = fileToLoc.get(rel);
      if (!loc) {
        problems.push(`${rel}: sitemap.xml içinde yok`);
        continue;
      }
      const head = fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8').match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
      const canonical = findTags(head, ['link']).find(({ attrs }) => attrs.get('rel') === 'canonical')?.attrs.get('href');
      if (canonical !== loc) {
        problems.push(`${rel}: canonical (${canonical}) sitemap loc (${loc}) ile aynı olmalı`);
      }
    }
    assert.equal(htmlPages.length, fileToLoc.size, 'HTML sayfa sayısı sitemap girdi sayısıyla eşleşmeli');

    assert.deepEqual(problems, [], `sitemap.xml sorunları:\n${problems.join('\n')}`);
  });

  it('robots.txt Sitemap satırı sitenin sitemap.xml adresini göstermeli', () => {
    const robots = fs.readFileSync(path.join(ROOT_DIR, 'robots.txt'), 'utf8');
    const sitemapLines = robots
      .split(/\r?\n/)
      .filter((line) => /^\s*sitemap\s*:/i.test(line))
      .map((line) => line.replace(/^\s*sitemap\s*:\s*/i, '').trim());
    assert.deepEqual(sitemapLines, [`${SITE_ORIGIN}/sitemap.xml`]);
  });
});

describe('Aşamalı Geliştirme Sözleşmesi (JS yoksa içerik görünür kalmalı)', () => {
  it('css/motion.css içinde opacity: 0 içeren [data-reveal] kuralları .js sınıfına bağlı olmalı', () => {
    const css = fs.readFileSync(path.join(ROOT_DIR, 'css', 'motion.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

    // En içteki "seçici { gövde }" bloklarını yakala (@layer/@media sarmalayıcıları atlanır).
    const ruleRegex = /([^{}]+)\{([^{}]*)\}/g;
    const hidingSelectors = [];
    for (const m of css.matchAll(ruleRegex)) {
      const body = m[2];
      if (!/(^|[;\s])opacity\s*:\s*0(?![.\d])/.test(body)) {
        continue;
      }
      for (const selector of m[1].split(',').map((s) => s.trim())) {
        if (selector.includes('[data-reveal]')) {
          hidingSelectors.push(selector);
        }
      }
    }

    assert.ok(hidingSelectors.length > 0, 'opacity: 0 içeren [data-reveal] kuralı bulunamadı');
    const unguarded = hidingSelectors.filter((s) => !/^(?:html)?\.js\s+\[data-reveal\]/.test(s));
    assert.deepEqual(
      unguarded,
      [],
      `[data-reveal] gizleme kuralı .js sınıfına bağlı değil (JS yüklenmezse içerik görünmez kalır):\n${unguarded.join('\n')}`,
    );
  });

  it("js/main.js document.documentElement.classList.add('js') çağırmalı", () => {
    const mainJs = fs.readFileSync(path.join(ROOT_DIR, 'js', 'main.js'), 'utf8');
    assert.match(
      mainJs,
      /document\.documentElement\.classList\.add\(\s*(['"`])js\1\s*\)/,
      "js/main.js içinde document.documentElement.classList.add('js') bulunamadı",
    );
  });
});

// --- Yayın beyaz listesi: deploy.yml, yerel_sunucu.py ve sitedeki referanslar aynı kümeyi kullanmalı ---

const PRUNED_EXTENSIONS = ['.md', '.sh', '.pem', '.key', '.bak'];

function parseDeployWhitelist(yml) {
  const files = yml.match(/for f in ([\w. -]+); do/); // glob içeren "js/*.js" döngüsü hariç
  const dirs = yml.match(/for d in ([\w. -]+); do/);
  return {
    files: new Set(files ? files[1].trim().split(/\s+/) : []),
    dirs: new Set(dirs ? dirs[1].trim().split(/\s+/) : []),
  };
}

function parsePythonSet(source, name) {
  const m = source.match(new RegExp(`${name}\\s*=\\s*\\{([^}]*)\\}`));
  return new Set(m ? Array.from(m[1].matchAll(/"([^"]+)"/g), (x) => x[1]) : []);
}

/** Kök dizine göreli yol canlıya gönderilen (budanmayan) beyaz listede mi? */
function isPublishedPath(relPath, { files, dirs }) {
  const parts = relPath.split(/[\\/]/);
  if (parts.some((p) => p.startsWith('.') || p === '')) {
    return false;
  }
  if (PRUNED_EXTENSIONS.some((ext) => relPath.endsWith(ext))) {
    return false;
  }
  return parts.length === 1 ? files.has(parts[0]) : dirs.has(parts[0]);
}

describe('Yayın Beyaz Listesi (deploy ile site referansları uyumu)', () => {
  const deploy = parseDeployWhitelist(fs.readFileSync(path.join(ROOT_DIR, '.github/workflows/deploy.yml'), 'utf8'));

  it('deploy.yml ve yerel_sunucu.py aynı dosya/dizin listesini kullanmalı', () => {
    assert.ok(deploy.files.size > 0 && deploy.dirs.size > 0, 'deploy.yml beyaz listesi ayrıştırılamadı');
    const script = fs.readFileSync(path.join(ROOT_DIR, 'yerel_sunucu.py'), 'utf8');
    assert.deepEqual([...parsePythonSet(script, 'ALLOWED_FILES')].sort(), [...deploy.files].sort());
    assert.deepEqual([...parsePythonSet(script, 'ALLOWED_DIRS')].sort(), [...deploy.dirs].sort());
  });

  it('isPublishedPath beyaz liste dışını ve budanan dosyaları reddetmeli (sentetik)', () => {
    const wl = { files: new Set(['index.html']), dirs: new Set(['css']) };
    assert.equal(isPublishedPath('index.html', wl), true);
    assert.equal(isPublishedPath('css/main.css', wl), true);
    assert.equal(isPublishedPath('404.html', wl), false);
    assert.equal(isPublishedPath('docs/x.png', wl), false);
    assert.equal(isPublishedPath('css/notlar.md', wl), false);
    assert.equal(isPublishedPath('css/.gizli', wl), false);
  });

  it('HTML, CSS ve sitemap içindeki tüm yerel hedefler canlıya gönderilen dosyalar arasında olmalı', () => {
    const problems = [];
    const check = (relSource, resolved) => {
      let rel = path.relative(ROOT_DIR, resolved);
      if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        rel = path.join(rel, 'index.html');
      }
      if (!isPublishedPath(rel, deploy)) {
        problems.push(`${relSource} -> ${rel} deploy beyaz listesinde değil`);
      }
    };

    for (const htmlFile of walkFiles(ROOT_DIR, '.html')) {
      const relHtml = path.relative(ROOT_DIR, htmlFile);
      check('(sayfa)', htmlFile);
      for (const value of collectLinkValues(fs.readFileSync(htmlFile, 'utf8'))) {
        const resolved = resolveLocalRef(value, path.dirname(htmlFile));
        if (resolved) {
          check(relHtml, resolved);
        }
      }
    }
    for (const cssFile of walkFiles(path.join(ROOT_DIR, 'css'), '.css')) {
      for (const value of collectCssUrls(fs.readFileSync(cssFile, 'utf8'))) {
        const resolved = resolveLocalRef(value, path.dirname(cssFile));
        if (resolved) {
          check(path.relative(ROOT_DIR, cssFile), resolved);
        }
      }
    }
    for (const { loc } of parseSitemap(fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8'))) {
      if (loc && loc.startsWith(SITE_ORIGIN)) {
        check('sitemap.xml', siteUrlToLocalFile(loc) ?? path.join(ROOT_DIR, loc.slice(SITE_ORIGIN.length)));
      }
    }
    assert.deepEqual(problems, []);
  });
});

describe('Temiz URL (iç adreslerde .html uzantısı yok)', () => {
  const isInternal = (value) => {
    const raw = value.trim();
    return raw.startsWith(`${SITE_ORIGIN}/`) || raw === SITE_ORIGIN || resolveLocalRef(raw, ROOT_DIR) !== null;
  };

  it('HTML dosyalarındaki iç href, canonical ve og:url/twitter:url değerleri .html ile bitmemeli', () => {
    const problems = [];
    let checked = 0;
    for (const file of walkFiles(ROOT_DIR, '.html')) {
      const rel = path.relative(ROOT_DIR, file);
      const html = fs.readFileSync(file, 'utf8');
      const values = [];
      for (const { attrs } of findTags(html)) {
        if (attrs.has('href')) {
          values.push(attrs.get('href'));
        }
        const key = (attrs.get('property') ?? attrs.get('name') ?? '').trim();
        if ((key === 'og:url' || key === 'twitter:url') && attrs.has('content')) {
          values.push(attrs.get('content'));
        }
      }
      for (const value of values) {
        if (!isInternal(value)) {
          continue;
        }
        checked += 1;
        if (pathEndsWithHtml(value)) {
          problems.push(`${rel}: "${value.trim()}" uzantısız (temiz URL) olmalı`);
        }
      }
    }
    assert.ok(checked > 0, 'Hiç iç adres denetlenmedi');
    assert.deepEqual(problems, [], `.html uzantılı iç adresler:\n${problems.join('\n')}`);
  });

  it('sitemap.xml <loc> adresleri .html ile bitmemeli', () => {
    const locs = parseSitemap(fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8')).map(({ loc }) => loc ?? '');
    assert.ok(locs.length > 0, 'sitemap.xml içinde <loc> bulunamadı');
    assert.deepEqual(locs.filter((loc) => pathEndsWithHtml(loc)), []);
  });
});

describe('Özel 404 Sayfası', () => {
  const file404 = path.join(ROOT_DIR, '404.html');

  it('404.html kökte bulunmalı, noindex taşımalı; canonical ve og:* içermemeli', () => {
    assert.ok(fs.existsSync(file404), '404.html kökte bulunamadı');
    const html = fs.readFileSync(file404, 'utf8');
    assert.ok(hasNoindex(html), '404.html <head> içinde robots noindex taşımalı');
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
    const canonical = findTags(head, ['link']).filter(({ attrs }) => attrs.get('rel') === 'canonical');
    assert.equal(canonical.length, 0, '404.html canonical içermemeli');
    const og = findTags(head, ['meta']).filter(({ attrs }) => (attrs.get('property') ?? '').startsWith('og:'));
    assert.equal(og.length, 0, '404.html og:* etiketi içermemeli');
    const icon = findTags(head, ['link']).find(({ attrs }) => (attrs.get('rel') ?? '').split(/\s+/).includes('icon'));
    assert.ok(icon, '404.html favicon <link rel="icon"> içermeli');
  });

  it('404.html içindeki tüm yerel yollar kök-mutlak olmalı ve var olan dosyalara işaret etmeli', () => {
    const html = fs.readFileSync(file404, 'utf8');
    const problems = [];
    let localCount = 0;
    for (const value of collectLinkValues(html)) {
      const raw = value.trim();
      if (isExternalOrHash(raw)) {
        continue;
      }
      localCount += 1;
      if (!raw.startsWith('/') || raw.startsWith('//')) {
        problems.push(`kök-mutlak değil: "${raw}"`);
        continue;
      }
      let resolved = resolveLocalRef(raw, ROOT_DIR);
      if (resolved && fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
        resolved = path.join(resolved, 'index.html');
      }
      if (!resolved || !fs.existsSync(resolved) || !fs.statSync(resolved).isFile()) {
        problems.push(`dosya bulunamadı: "${raw}"`);
      }
    }
    assert.ok(localCount > 0, '404.html içinde yerel bağlantı bulunamadı');
    for (const required of ['/css/main.css', '/js/main.js', '/assets/img/favicon.svg', '/']) {
      assert.ok(collectLinkValues(html).some((v) => v.trim() === required), `404.html ${required} referansı içermeli`);
    }
    assert.deepEqual(problems, [], `404.html yol sorunları:\n${problems.join('\n')}`);
  });

  it("404.html sitemap.xml'de listelenmemeli", () => {
    const locs = parseSitemap(fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8')).map(({ loc }) => loc ?? '');
    assert.deepEqual(
      locs.filter((loc) => /\/404(\.html)?$/.test(loc)),
      [],
      'sitemap.xml 404 sayfasını içermemeli',
    );
  });

  it('noindex taşıyan sayfalar yalnızca NOINDEX_PAGES listesindekiler olmalı', () => {
    const noindex = walkFiles(ROOT_DIR, '.html')
      .filter((file) => hasNoindex(fs.readFileSync(file, 'utf8')))
      .map((file) => path.relative(ROOT_DIR, file))
      .sort();
    assert.deepEqual(noindex, [...NOINDEX_PAGES].sort());
  });

  it('deploy.yml dosya beyaz listesi 404.html içermeli', () => {
    const { files } = parseDeployWhitelist(fs.readFileSync(path.join(ROOT_DIR, '.github/workflows/deploy.yml'), 'utf8'));
    assert.ok(files.has('404.html'), 'deploy.yml "for f in ..." listesinde 404.html yok');
  });
});

describe('Paylaşım Görseli Boyutları (og:image:width/height)', () => {
  it('readJpegSize sentetik SOF başlığını doğru okumalı ve JPEG olmayanı reddetmeli', () => {
    // SOI + APP0 (uzunluk 4, 2 bayt veri) + SOF2 (h=670, w=1200)
    const sample = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc2, 0x00, 0x11, 0x08, 0x02, 0x9e, 0x04, 0xb0, 0x03,
    ]);
    assert.deepEqual(readJpegSize(sample), { width: 1200, height: 670 });
    assert.equal(readJpegSize(Buffer.from([0x89, 0x50, 0x4e, 0x47])), null);
  });

  it('og:image içeren her sayfa gerçek görsel boyutuyla eşleşen og:image:width/height taşımalı', () => {
    const ORIGIN = `${SITE_ORIGIN}/`;
    const problems = [];
    let checked = 0;
    for (const file of walkFiles(ROOT_DIR, '.html')) {
      const rel = path.relative(ROOT_DIR, file);
      const head = fs.readFileSync(file, 'utf8').match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
      const metas = findTags(head, ['meta']);
      const metaValue = (key) =>
        metas.find(({ attrs }) => (attrs.get('property') ?? '').trim() === key)?.attrs.get('content')?.trim() ?? '';
      const image = metaValue('og:image');
      if (!image) {
        continue;
      }
      checked += 1;
      if (!image.startsWith(ORIGIN)) {
        problems.push(`${rel}: og:image ${ORIGIN} ile başlamalı`);
        continue;
      }
      const local = path.join(ROOT_DIR, image.slice(ORIGIN.length));
      const size = fs.existsSync(local) ? readJpegSize(fs.readFileSync(local)) : null;
      if (!size) {
        problems.push(`${rel}: og:image boyutu okunamadı (${path.relative(ROOT_DIR, local)})`);
        continue;
      }
      const width = metaValue('og:image:width');
      const height = metaValue('og:image:height');
      if (width !== String(size.width)) {
        problems.push(`${rel}: og:image:width "${width}" gerçek genişlik ${size.width} ile eşleşmeli`);
      }
      if (height !== String(size.height)) {
        problems.push(`${rel}: og:image:height "${height}" gerçek yükseklik ${size.height} ile eşleşmeli`);
      }
    }
    assert.ok(checked > 0, 'og:image içeren sayfa bulunamadı');
    assert.deepEqual(problems, [], `og:image boyut sorunları:\n${problems.join('\n')}`);
  });
});

// --- /kart: kartvizit QR sayfası sözleşmesi (Mustafa'nın onayladığı maket düzeni + 2026-11-20 ek kararları) ---

describe('Kartvizit Sayfası (/kart)', () => {
  const fileKart = path.join(ROOT_DIR, 'kart.html');
  const fileVcf = path.join(ROOT_DIR, 'assets', 'mustafa-ayverdi.vcf');
  // /kart için izinli iletişim: Mustafa bu sayfada iletisim@mustafaayverdi.com adresini seçti (2026-11-20).
  const ALLOWED_EMAIL = 'iletisim@mustafaayverdi.com';
  const ALLOWED_PHONE = '905510653051';
  const ALLOWED_GITHUB = 'https://github.com/locko6634-mustafa';
  // İki "Demoyu dene" ana sayfadaki Canlı Deneyim bölümüne iner (js/simulator.js URL'den sahne seçimini desteklemiyor).
  const LIVE_DEMO = './#simulator';
  const YESILNESIL_SITE = 'https://yesilnesilthegarden.com/';
  const WA_MESSAGE = 'Merhaba, kartvizitinizden ulaşıyorum.';
  const WA_HREF = `https://wa.me/${ALLOWED_PHONE}?text=${encodeURIComponent(WA_MESSAGE)}`;
  const VCF_HREF = './assets/mustafa-ayverdi.vcf';
  // İkon imzaları (inline SVG path başlangıçları): resmi WhatsApp glifi, kişi ekle, oynat, bilgi, dış bağlantı.
  const ICON = {
    whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967',
    addContact: 'M19 8v6M16 11h6',
    play: 'M10 8.5l5.5 3.5-5.5 3.5z',
    info: 'M12 11v5',
    external: 'M20 4l-9 9',
  };

  const readKart = () => fs.readFileSync(fileKart, 'utf8');
  const anchors = (html) => findTags(html, ['a']).map(({ attrs }) => attrs);
  /** Etiketleri ve script/style içeriğini atıp görünen metni döndürür. */
  const visibleText = (html) =>
    (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? '')
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ');
  /** class listesinde verilen sınıfı taşıyan ilk öğenin iç HTML'i (iç içe aynı etiket olmadığı varsayılır). */
  const blockByClass = (html, tag, cls) =>
    html.match(new RegExp(`<${tag}\\b[^>]*class="[^"]*\\b${cls}(?![\\w-])[^"]*"[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))?.[1];
  /** aria-labelledby ile bağlı <section>: { attrs, inner } */
  const sectionByLabel = (html, id) => {
    const m = html.match(new RegExp(`<section\\b([^>]*\\baria-labelledby="${id}"[^>]*)>([\\s\\S]*?)<\\/section>`, 'i'));
    return m ? { attrs: parseAttributes(m[1]), inner: m[2] } : null;
  };
  const textOf = (fragment) => (fragment ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  /** Bir parçadaki <a> öğeleri: nitelikler, görünen metin ve iç HTML (ikon denetimi için). */
  const buttonsIn = (fragment) =>
    Array.from((fragment ?? '').matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi), (m) => ({
      attrs: parseAttributes(m[1]),
      text: textOf(m[2]),
      inner: m[2],
    }));
  /** Butonun iç HTML'i verilen imzayı taşıyan, aria-hidden inline SVG ikon içermeli. */
  const assertIcon = (button, signature, label) => {
    const svg = button.inner.match(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/i);
    assert.ok(svg, `${label}: inline SVG ikon yok`);
    const attrs = parseAttributes(svg[1]);
    assert.equal(attrs.get('aria-hidden'), 'true', `${label}: ikon aria-hidden="true" olmalı`);
    assert.match(attrs.get('class') ?? '', /\bkart-icon\b/, `${label}: ikon .kart-icon sınıfı taşımalı`);
    assert.ok(svg[2].includes(signature), `${label}: beklenen ikon (${signature}) değil`);
  };
  /** Ürün kartının yapısı: başlık satırı → görsel → açıklama → iki butonlu satır (bu sırayla). */
  const assertFeatureOrder = (inner, label) => {
    const order = ['kart-feature-head', '<img', 'kart-feature-text', 'kart-feature-actions'].map((k) => inner.indexOf(k));
    assert.ok(order.every((i) => i !== -1), `${label}: başlık/görsel/açıklama/buton satırı eksik`);
    assert.deepEqual([...order].sort((a, b) => a - b), order, `${label}: sıra başlık → görsel → açıklama → butonlar olmalı`);
  };

  it("kart.html kökte olmalı; lang=\"tr\", tek <h1>, noindex taşımalı, canonical içermemeli ve sitemap'te olmamalı", () => {
    assert.ok(fs.existsSync(fileKart), 'kart.html kökte bulunamadı (/kart adresi kart.html dosyasına çözülür)');
    const html = readKart();
    assert.match(html, /<html\b[^>]*\blang="tr"/);
    assert.equal(findTags(html, ['h1']).length, 1, 'kart.html tam 1 <h1> içermeli');
    assert.ok(hasNoindex(html), 'kart.html robots noindex taşımalı');
    const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
    assert.equal(
      findTags(head, ['link']).filter(({ attrs }) => attrs.get('rel') === 'canonical').length,
      0,
      'noindex sayfa canonical taşımamalı',
    );
    const locs = parseSitemap(fs.readFileSync(path.join(ROOT_DIR, 'sitemap.xml'), 'utf8')).map(({ loc }) => loc ?? '');
    assert.deepEqual(locs.filter((loc) => /\/kart(\.html)?\/?$/.test(loc)), []);
    const og = findTags(head, ['meta']).find(({ attrs }) => attrs.get('property') === 'og:image')?.attrs.get('content');
    assert.match(og ?? '', /\/assets\/img\/(randevuzeka|vitrinos|yesilnesil)-real\.jpg$/, 'og:image orijinal *-real ekran görüntüsü olmalı');
    // Site geneliyle (index.html) aynı twitter:* kalıbı; değerler og:* ile tutarlı olmalı.
    const metas = findTags(head, ['meta']);
    const metaBy = (attr, key) => metas.find(({ attrs }) => (attrs.get(attr) ?? '').trim() === key)?.attrs.get('content')?.trim();
    assert.equal(metaBy('name', 'twitter:card'), 'summary_large_image');
    assert.equal(metaBy('name', 'twitter:title'), metaBy('property', 'og:title'), 'twitter:title og:title ile aynı olmalı');
    assert.equal(metaBy('name', 'twitter:description'), metaBy('property', 'og:description'), 'twitter:description og:description ile aynı olmalı');
    assert.equal(metaBy('name', 'twitter:image'), og, 'twitter:image og:image ile aynı olmalı');
    assert.equal(metaBy('name', 'twitter:image:alt'), metaBy('property', 'og:image:alt'), 'twitter:image:alt og:image:alt ile aynı olmalı');
  });

  it('üst bölüm: h1 editoryal yazı logosu (monogram/rozet/fotoğraf yok), isim bir kez, italik tanıtım cümlesi, şehir satırı yok', () => {
    const html = readKart();
    const head = blockByClass(html, 'header', 'kart-head');
    assert.ok(head, '.kart-head bulunamadı');
    const h1 = head.match(/<h1\b([^>]*)>([\s\S]*?)<\/h1>/i);
    assert.ok(h1, 'üst bölümde h1 yok');
    assert.match(parseAttributes(h1[1]).get('class') ?? '', /\bkart-logo\b/, 'h1 yazı logosu (.kart-logo) olmalı');
    assert.equal(h1[2].trim(), 'Mustafa <em>Ayverdi</em>', 'logo "Mustafa" + <em>Ayverdi</em> biçiminde olmalı');
    assert.equal(/<svg|<img|monogram|kart-avatar/i.test(head), false, 'üst bölümde monogram, rozet veya fotoğraf olmamalı');
    assert.equal((visibleText(html).match(/Mustafa Ayverdi/g) ?? []).length, 1, 'isim sayfada yalnız bir kez (logo) yazılmalı');
    assert.equal(textOf(blockByClass(head, 'p', 'kart-tagline')), 'İşletmeler için yapay zekâ otomasyonları geliştiriyorum.');
    assert.equal(/İstanbul|yüz yüze/i.test(visibleText(html)), false, 'şehir/kurulum satırı olmamalı');
  });

  it('birincil eylem WhatsApp logolu koyu hap butonu, ikincisi kişi ekleme ikonlu ve download öznitelikli vCard (bu sırayla)', () => {
    const html = readKart();
    const buttons = buttonsIn(blockByClass(html, 'div', 'kart-actions'));
    assert.equal(buttons.length, 2, 'eylem alanında tam 2 bağlantı olmalı');
    const [wa, vcf] = buttons;
    assert.deepEqual(buttons.map((b) => b.text), ["WhatsApp'tan yazın", 'Rehbere kaydet']);
    assert.equal(wa.attrs.get('href'), WA_HREF, `WhatsApp bağlantısı birebir "${WA_HREF}" olmalı`);
    assert.match(wa.attrs.get('class') ?? '', /\bkart-btn--solid\b/, 'WhatsApp butonu koyu (kart-btn--solid) olmalı');
    assert.equal(wa.attrs.get('target'), '_blank');
    assert.equal(wa.attrs.get('rel'), 'noopener noreferrer');
    assertIcon(wa, ICON.whatsapp, 'WhatsApp butonu');
    assert.match(wa.inner, /<svg\b[^>]*\bfill="currentColor"/, 'WhatsApp logosu koyu zeminde okunur kalmak için currentColor ile dolmalı');
    assert.equal(vcf.attrs.get('href'), VCF_HREF);
    assert.match(vcf.attrs.get('class') ?? '', /\bkart-btn--outline\b/);
    assert.equal(vcf.attrs.get('download'), 'mustafa-ayverdi.vcf', 'Rehbere kaydet bağlantısı download özniteliği taşımalı');
    assertIcon(vcf, ICON.addContact, 'Rehbere kaydet butonu');
    const hrefs = anchors(html).map((a) => (a.get('href') ?? '').trim()).filter((h) => h !== '#main-content');
    assert.equal(hrefs[0], WA_HREF, 'sayfadaki ilk içerik bağlantısı WhatsApp olmalı');
  });

  it('vCard 3.0 dosyası ad, unvan, telefon, e-posta ve site adresini CRLF satırlarla taşımalı', () => {
    assert.ok(fs.existsSync(fileVcf), 'assets/mustafa-ayverdi.vcf bulunamadı');
    const raw = fs.readFileSync(fileVcf, 'utf8');
    assert.ok(raw.startsWith('BEGIN:VCARD\r\n'), 'vCard BEGIN:VCARD ile başlamalı');
    assert.ok(raw.trimEnd().endsWith('END:VCARD'), 'vCard END:VCARD ile bitmeli');
    assert.equal(/(^|[^\r])\n/.test(raw), false, 'vCard satır sonları CRLF olmalı');
    const lines = raw.split('\r\n');
    for (const expected of [
      'VERSION:3.0',
      'N:Ayverdi;Mustafa;;;',
      'FN:Mustafa Ayverdi',
      'TITLE:Yapay Zekâ & Otomasyon Geliştirici',
      `TEL;TYPE=CELL:+${ALLOWED_PHONE}`,
      `EMAIL;TYPE=INTERNET:${ALLOWED_EMAIL}`,
      `URL:${SITE_ORIGIN}/`,
    ]) {
      assert.ok(lines.includes(expected), `vCard satırı eksik: ${expected}`);
    }
  });

  it('kart.html ve vCard yalnız izinli iletişim adreslerini içermeli (LinkedIn, tel:, başka e-posta/numara yok)', () => {
    const html = readKart();
    const vcf = fs.readFileSync(fileVcf, 'utf8');
    const problems = [];
    for (const attrs of anchors(html)) {
      const href = (attrs.get('href') ?? '').trim();
      const lower = href.toLowerCase();
      if (lower.startsWith('mailto:') && href !== `mailto:${ALLOWED_EMAIL}`) problems.push(`izinsiz e-posta: ${href}`);
      if (lower.startsWith('tel:') || lower.startsWith('sms:')) problems.push(`izinsiz arama bağlantısı: ${href}`);
      if (/wa\.me|whatsapp\.com/.test(lower) && !href.startsWith(`https://wa.me/${ALLOWED_PHONE}`)) {
        problems.push(`izinsiz WhatsApp: ${href}`);
      }
      if (lower.includes('github.com') && href !== ALLOWED_GITHUB) problems.push(`izinsiz GitHub: ${href}`);
      if (/linkedin|instagram|twitter\.com|x\.com|facebook/.test(lower)) problems.push(`izinsiz sosyal bağlantı: ${href}`);
    }
    // SVG path koordinatları sahte numara üretmesin: HTML'de görünen metin + href değerleri taranır.
    const htmlSurface = `${visibleText(html)} ${anchors(html).map((a) => a.get('href') ?? '').join(' ')}`;
    for (const [name, source] of [['kart.html', htmlSurface], ['vcf', vcf]]) {
      for (const email of source.match(/[\w.+-]+@[\w-]+\.[\w.-]+/g) ?? []) {
        if (email !== ALLOWED_EMAIL) problems.push(`${name}: izinsiz e-posta ${email}`);
      }
      for (const phone of source.match(/\+?\d[\d ]{9,}\d/g) ?? []) {
        if (phone.replace(/\D/g, '') !== ALLOWED_PHONE) problems.push(`${name}: izinsiz numara ${phone}`);
      }
    }
    assert.ok(html.includes(`href="mailto:${ALLOWED_EMAIL}"`), 'e-posta bağlantısı eksik');
    assert.ok(html.includes(`href="${ALLOWED_GITHUB}"`), 'GitHub bağlantısı eksik');
    assert.deepEqual(problems, [], `İletişim kuralı ihlalleri:\n${problems.join('\n')}`);
  });

  it('görünen metin teknik jargon ve demo numarası içermemeli', () => {
    const text = visibleText(readKart());
    const forbidden = [
      'FIG.', '01 /', '02 /', '03 /', 'PostgreSQL', 'Prisma', 'MinIO', 'Vanilla', 'TOTP', 'n8n', 'API',
      'webhook', 'workflow', 'veritabanı', 'altyapı', 'sunucu', 'backend', 'frontend', 'SaaS', 'LLM', 'prompt',
    ];
    const hits = forbidden.filter((term) => new RegExp(`(^|[^\\p{L}])${term.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}`, 'iu').test(text));
    assert.deepEqual(hits, [], `kart.html yasaklı ifadeler: ${hits.join(', ')}`);
  });

  it('RandevuZeka kartı: kalın çerçeve, "14 gün ücretsiz" rozeti, orijinal ekran görüntüsü, açıklama; "Demoyu dene" (oynat) Canlı Deneyim bölümüne, "Nasıl çalışır" (bilgi) proje sayfasına gitmeli', () => {
    const html = readKart();
    const card = sectionByLabel(html, 'kart-randevuzeka');
    assert.ok(card, 'RandevuZeka kartı bulunamadı');
    assert.match(card.attrs.get('class') ?? '', /\bkart-feature\b/);
    assert.match(card.attrs.get('class') ?? '', /\bkart-feature--primary\b/, 'RandevuZeka kartı öne çıkan (kalın çerçeve) olmalı');
    assert.ok(html.indexOf('aria-labelledby="kart-randevuzeka"') < html.indexOf('aria-labelledby="kart-vitrinos"'), 'RandevuZeka kartı VitrinOS kartından önce gelmeli');
    assertFeatureOrder(card.inner, 'RandevuZeka');
    assert.equal(textOf(blockByClass(card.inner, 'h2', 'kart-card-title')), 'RandevuZeka');
    assert.equal(textOf(blockByClass(card.inner, 'span', 'kart-badge')), '14 gün ücretsiz', 'RandevuZeka rozeti birebir "14 gün ücretsiz" olmalı');
    const img = findTags(card.inner, ['img'])[0]?.attrs;
    assert.ok(img, 'RandevuZeka görseli yok');
    assert.equal(img.get('src'), './assets/img/randevuzeka-real.webp');
    assert.equal(img.get('width'), '1024');
    assert.equal(img.get('height'), '640');
    assert.equal(img.get('alt'), 'RandevuZeka tanıtım sayfası ekranı');
    assert.notEqual(img.get('loading'), 'lazy', 'ilk karttaki RandevuZeka görseli lazy olmamalı');
    assert.equal(
      textOf(blockByClass(card.inner, 'p', 'kart-feature-text')),
      "Müşterileriniz WhatsApp'tan 7/24 randevu alsın, hatırlatmalar kendiliğinden gitsin.",
    );
    const buttons = buttonsIn(blockByClass(card.inner, 'div', 'kart-feature-actions'));
    assert.deepEqual(buttons.map((b) => b.text), ['Demoyu dene', 'Nasıl çalışır']);
    assert.match(buttons[0].attrs.get('class') ?? '', /\bkart-btn--lime\b/);
    assert.match(buttons[1].attrs.get('class') ?? '', /\bkart-btn--outline\b/);
    assert.equal(buttons[0].attrs.get('href'), LIVE_DEMO, 'RandevuZeka Demoyu dene ana sayfadaki Canlı Deneyim bölümüne gitmeli');
    assert.equal(buttons[0].attrs.has('target'), false, 'site içi demo bağlantısı aynı sekmede açılmalı');
    assert.equal(buttons[1].attrs.get('href'), './projeler/randevuzeka', 'Nasıl çalışır proje sayfasına gitmeli');
    assertIcon(buttons[0], ICON.play, 'RandevuZeka Demoyu dene');
    assertIcon(buttons[1], ICON.info, 'RandevuZeka Nasıl çalışır');
    assert.equal(/randevu\.n8n-mustafa\.me/.test(html), false, 'esnafa açık RandevuZeka demosu bağlantısı olmamalı');
    const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    assert.match(indexHtml, /<section\b[^>]*\bid="simulator"[^>]*\bdata-simulator\b/, 'index.html Canlı Deneyim bölümü id="simulator" ile korunmalı');
  });

  it('VitrinOS kartı RandevuZeka ile aynı yapıda: ince çerçeve, rozetsiz başlık, orijinal görsel, açıklama; "Demoyu dene" (oynat, aynı sekmede Canlı Deneyim bölümü) ve "Nasıl çalışır" (bilgi)', () => {
    const html = readKart();
    const card = sectionByLabel(html, 'kart-vitrinos');
    assert.ok(card, 'VitrinOS kartı bulunamadı');
    assert.match(card.attrs.get('class') ?? '', /\bkart-feature\b/);
    assert.match(card.attrs.get('class') ?? '', /\bkart-feature--secondary\b/, 'VitrinOS kartı ince çerçeveli (secondary) olmalı');
    assert.equal(/kart-feature--primary/.test(card.attrs.get('class') ?? ''), false);
    assertFeatureOrder(card.inner, 'VitrinOS');
    assert.equal(textOf(blockByClass(card.inner, 'h2', 'kart-card-title')), 'VitrinOS');
    assert.equal(/kart-badge/.test(card.inner), false, 'VitrinOS kartında uydurma teklif rozeti olmamalı');
    const img = findTags(card.inner, ['img'])[0]?.attrs;
    assert.ok(img, 'VitrinOS görseli yok');
    assert.equal(img.get('src'), './assets/img/vitrinos-real.webp');
    assert.equal(img.get('width'), '1024');
    assert.equal(img.get('height'), '640');
    assert.equal(img.get('alt'), 'VitrinOS tanıtım sayfası ekranı');
    assert.notEqual(img.get('loading'), 'lazy', 'VitrinOS görseli lazy olmamalı');
    assert.equal(textOf(blockByClass(card.inner, 'p', 'kart-feature-text')), 'Ürünleriniz için yapay zekâ ile reklam görselleri.');
    const buttons = buttonsIn(blockByClass(card.inner, 'div', 'kart-feature-actions'));
    assert.deepEqual(buttons.map((b) => b.text), ['Demoyu dene', 'Nasıl çalışır']);
    const [demo, how] = buttons;
    assert.match(demo.attrs.get('class') ?? '', /\bkart-btn--lime\b/);
    assert.equal(demo.attrs.get('href'), LIVE_DEMO, 'VitrinOS Demoyu dene ana sayfadaki Canlı Deneyim bölümüne gitmeli');
    assert.equal(demo.attrs.has('target'), false, 'VitrinOS Demoyu dene aynı sekmede açılmalı');
    assert.equal(demo.attrs.has('rel'), false, 'site içi bağlantıda rel gerekmez');
    assertIcon(demo, ICON.play, 'VitrinOS Demoyu dene');
    assert.equal(demo.inner.includes(ICON.external), false, 'VitrinOS Demoyu dene dış bağlantı ikonu taşımamalı (RandevuZeka ile aynı oynat ikonu)');
    assert.match(how.attrs.get('class') ?? '', /\bkart-btn--outline\b/);
    assert.equal(how.attrs.get('href'), './projeler/vitrinos');
    assertIcon(how, ICON.info, 'VitrinOS Nasıl çalışır');
  });

  it('Yeşil Nesil kartı bağlantı değil bölüm olmalı (iç içe bağlantı yok); orijinal görsel, "Ziyaret et" (lime, dış bağlantı, yeni sekme) ve "İşi inceleyin" (bilgi); alt liste ve altbilgi maketle aynı olmalı', () => {
    const html = readKart();
    assert.equal(/<a\b[^>]*class="kart-ref"/.test(html), false, 'Yeşil Nesil kartının tamamı bağlantı olmamalı (iç içe bağlantı)');
    const card = sectionByLabel(html, 'kart-yesilnesil');
    assert.ok(card, 'Yeşil Nesil kartı (<section aria-labelledby="kart-yesilnesil">) bulunamadı');
    assert.match(card.attrs.get('class') ?? '', /\bkart-ref\b/);
    assert.equal(textOf(blockByClass(card.inner, 'span', 'kart-ref-label')), 'Gerçek müşteri işi');
    assert.equal(textOf(blockByClass(card.inner, 'h2', 'kart-card-title')), 'Yeşil Nesil The Garden');
    assert.equal(textOf(blockByClass(card.inner, 'span', 'kart-ref-meta')), 'Mekân web sitesi · yayında');
    const img = findTags(card.inner, ['img'])[0]?.attrs;
    assert.ok(img, 'Yeşil Nesil görseli yok');
    assert.equal(img.get('src'), './assets/img/yesilnesil-real.webp');
    assert.equal(img.get('width'), '1024');
    assert.equal(img.get('height'), '640');
    assert.equal(img.get('alt'), 'Yeşil Nesil The Garden web sitesi ekranı');
    assert.ok(card.inner.indexOf('<img') < card.inner.indexOf('kart-feature-actions'), 'butonlar görselden sonra gelmeli');
    const buttons = buttonsIn(blockByClass(card.inner, 'div', 'kart-feature-actions'));
    assert.deepEqual(buttons.map((b) => b.text), ['Ziyaret et', 'İşi inceleyin']);
    const [visit, review] = buttons;
    assert.match(visit.attrs.get('class') ?? '', /\bkart-btn--lime\b/, 'Ziyaret et diğer kartlardaki lime butonlarla aynı stilde olmalı');
    assert.equal(visit.attrs.get('href'), YESILNESIL_SITE);
    assert.equal(visit.attrs.get('target'), '_blank');
    assert.equal(visit.attrs.get('rel'), 'noopener noreferrer');
    assertIcon(visit, ICON.external, 'Yeşil Nesil Ziyaret et');
    assert.match(review.attrs.get('class') ?? '', /\bkart-btn--outline\b/);
    assert.equal(review.attrs.get('href'), './projeler/yesil-nesil');
    assertIcon(review, ICON.info, 'Yeşil Nesil İşi inceleyin');

    const rows = buttonsIn(blockByClass(html, 'ul', 'kart-list')).map((b) => [b.attrs.get('href'), b.text]);
    assert.deepEqual(rows, [
      ['./notlar/', 'Yazılarım'],
      [ALLOWED_GITHUB, 'GitHub'],
      [`mailto:${ALLOWED_EMAIL}`, ALLOWED_EMAIL],
    ]);
    assert.equal(textOf(blockByClass(html, 'footer', 'kart-foot')), 'mustafaayverdi.com · 2026');
  });

  it('kart.html içindeki tüm SVG ikonlar aria-hidden olmalı; harici ikon kütüphanesi/görseli kullanılmamalı', () => {
    const html = readKart();
    const svgs = findTags(html, ['svg']);
    assert.equal(svgs.length, 8, 'WhatsApp, kişi ekle, 2 oynat, 3 bilgi ve 1 dış bağlantı ikonu: tam 8 inline ikon beklenir');
    const count = (sig) => html.split(sig).length - 1;
    assert.deepEqual(
      Object.fromEntries(Object.entries(ICON).map(([k, sig]) => [k, count(sig)])),
      { whatsapp: 1, addContact: 1, play: 2, info: 3, external: 1 },
      'ikon dağılımı birebir olmalı',
    );
    for (const { attrs } of svgs) {
      assert.equal(attrs.get('aria-hidden'), 'true');
    }
    assert.equal(/<(use|i)\b|\.svg"[^>]*class="kart-icon"/i.test(html), false, 'ikonlar inline olmalı');
  });

  it('kart.html deploy.yml ve yerel_sunucu.py beyaz listesinde olmalı; vCard ve kart.css yayınlanan dizinlerde kalmalı', () => {
    const wl = parseDeployWhitelist(fs.readFileSync(path.join(ROOT_DIR, '.github/workflows/deploy.yml'), 'utf8'));
    assert.ok(wl.files.has('kart.html'), 'deploy.yml "for f in ..." listesinde kart.html yok');
    const script = fs.readFileSync(path.join(ROOT_DIR, 'yerel_sunucu.py'), 'utf8');
    assert.ok(parsePythonSet(script, 'ALLOWED_FILES').has('kart.html'), 'yerel_sunucu.py ALLOWED_FILES içinde kart.html yok');
    for (const rel of ['kart.html', 'assets/mustafa-ayverdi.vcf', 'css/kart.css']) {
      assert.ok(isPublishedPath(rel, wl), `${rel} yayın beyaz listesinde değil`);
    }
  });

  it('kart.css yalnız "sections" katmanına yazmalı, renkleri tokenlardan almalı, odak çerçevesini kapatmamalı, görselleri kırpmamalı ve çerçeve önceliğini korumalı', () => {
    const css = fs.readFileSync(path.join(ROOT_DIR, 'css', 'kart.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    const layers = Array.from(css.matchAll(/@layer\s+([\w-]+)/g), (m) => m[1]);
    assert.deepEqual(layers, ['sections']);
    assert.deepEqual(css.match(/#[0-9a-f]{3,8}\b|rgba?\(/gi) ?? [], [], 'kart.css sabit renk yerine tokens.css değişkenlerini kullanmalı');
    assert.equal(/outline\s*:\s*(none|0)\b/.test(css), false, 'kart.css odak çerçevesini kapatmamalı');
    assert.equal(/object-fit|aspect-ratio|object-position/.test(css), false, 'orijinal ekran görüntüleri kırpılmadan tam gösterilmeli');
    assert.match(css.match(/\.kart-feature--primary\s*\{([^}]*)\}/)?.[1] ?? '', /border:\s*2px solid var\(--forest\)/);
    assert.match(css.match(/\.kart-feature--secondary\s*\{([^}]*)\}/)?.[1] ?? '', /border:\s*1px solid var\(--line\)/);
    // Slate zeminli Yeşil Nesil kartı: alt satır --muted ile 4,04:1 kalıyordu (WCAG AA 4.5:1 altı); --forest 8,0:1.
    assert.match(css.match(/\.kart-ref-meta\s*\{([^}]*)\}/)?.[1] ?? '', /color:\s*var\(--forest\)/, '.kart-ref-meta slate zeminde --forest olmalı');
    const tokens = fs.readFileSync(path.join(ROOT_DIR, 'css', 'tokens.css'), 'utf8');
    const hex = (name) => tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'))?.[1];
    const lum = (h) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
    assert.ok(ratio(hex('forest'), hex('slate-surface')) >= 4.5, '--forest / --slate-surface kontrastı en az 4.5:1 olmalı');
    assert.ok(ratio(hex('muted'), hex('slate-surface')) < 4.5, 'sentetik kontrol: --muted / --slate-surface 4.5:1 altında ölçülmeli');
    const refOutline = css.match(/\.kart-ref \.kart-btn--outline\s*\{([^}]*)\}/)?.[1] ?? '';
    assert.match(refOutline, /background-color:\s*var\(--white\)/, 'slate zemindeki çerçeveli buton beyaz dolgulu olmalı');
    assert.match(refOutline, /border:\s*1px solid var\(--forest\)/, 'slate zemindeki çerçeveli butonun kenarı --forest olmalı');
    assert.ok(readKart().includes('href="./css/kart.css"'), 'kart.html kart.css bağlamalı');
  });
});

describe('Meta İşletme Doğrulaması Hazırlığı', () => {
  // Meta "Henüz kayıtlı değil" doğrulaması: işletme adı Mustafa Ayverdi, alternatif ad RandevuZeka, alan adı mustafaayverdi.com.
  const SITE_EMAIL = 'iletisim@mustafaayverdi.com';
  const SITE_PHONE_TEL = 'tel:+905510653051';
  const read = (rel) => fs.readFileSync(path.join(ROOT_DIR, rel), 'utf8');
  const bodyText = (html) =>
    (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? '')
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ');
  const metaContent = (html, key) =>
    findTags(html, ['meta']).find(({ attrs }) => attrs.get('property') === key || attrs.get('name') === key)?.attrs.get('content');
  const indexablePages = walkFiles(ROOT_DIR, '.html')
    .map((f) => path.relative(ROOT_DIR, f).split(path.sep).join('/'))
    .filter((rel) => !rel.startsWith('tests/') && !NOINDEX_PAGES.includes(rel));

  it('iletisim.html ve gizlilik.html kökte olmalı, tek <h1> taşımalı ve noindex olmamalı', () => {
    for (const rel of ['index.html', 'iletisim.html', 'gizlilik.html']) {
      assert.ok(fs.existsSync(path.join(ROOT_DIR, rel)), `${rel} yok`);
      const html = read(rel);
      assert.equal(findTags(html, ['h1']).length, 1, `${rel} tam 1 <h1> içermeli`);
      assert.equal(hasNoindex(html), false, `${rel} noindex olmamalı (Meta tarayıcısı okuyabilmeli)`);
    }
  });

  it('ana sayfa, iletişim ve gizlilik sayfalarında og:title/description/url/image doğru olmalı', () => {
    const expected = { 'index.html': '/', 'iletisim.html': '/iletisim', 'gizlilik.html': '/gizlilik' };
    for (const [rel, urlPath] of Object.entries(expected)) {
      const html = read(rel);
      assert.equal(metaContent(html, 'og:url'), `${SITE_ORIGIN}${urlPath}`, `${rel} og:url`);
      assert.ok(metaContent(html, 'og:title')?.includes('Mustafa Ayverdi'), `${rel} og:title "Mustafa Ayverdi" içermeli`);
      assert.ok((metaContent(html, 'og:description') ?? '').length > 30, `${rel} og:description boş/kısa`);
      assert.match(metaContent(html, 'og:image') ?? '', new RegExp(`^${SITE_ORIGIN}/assets/img/.+\.jpg$`), `${rel} og:image`);
    }
  });

  it('iletişim sayfası işletme adını, RandevuZeka ilişkisini, alan adı e-postasını ve telefonu göstermeli; ev adresi olmamalı', () => {
    const html = read('iletisim.html');
    const text = bodyText(html);
    assert.ok(text.includes('Mustafa Ayverdi'), 'Mustafa Ayverdi adı görünmüyor');
    assert.ok(text.includes("RandevuZeka'nın geliştiricisi ve sağlayıcısı"), 'RandevuZeka ilişkisi yazmıyor');
    assert.ok(html.includes(`href="mailto:${SITE_EMAIL}"`) && text.includes(SITE_EMAIL), 'iletisim@ e-postası yok');
    assert.ok(html.includes(`href="${SITE_PHONE_TEL}"`), 'telefon bağlantısı yok');
    assert.doesNotMatch(text, /\b(mah\.|mahalle|sokak|sk\.|cadde|cad\.|apt|daire|no:)/i, 'sayfada açık adres olmamalı');
  });

  it('ana sayfa ve RandevuZeka sayfası RandevuZeka\'nın Mustafa Ayverdi tarafından geliştirildiğini açıkça söylemeli', () => {
    assert.ok(bodyText(read('index.html')).includes("RandevuZeka'nın geliştiricisi ve sağlayıcısı benim"), 'ana sayfada sahiplik cümlesi yok');
    assert.ok(
      bodyText(read('projeler/randevuzeka.html')).includes('RandevuZeka, Mustafa Ayverdi tarafından geliştirilen ve sunulan bir hizmettir.'),
      'RandevuZeka sayfasında sahiplik cümlesi yok',
    );
  });

  it('gizlilik politikası onaylı başlıkları ve dürüst veri beyanını içermeli', () => {
    const text = bodyText(read('gizlilik.html'));
    for (const phrase of ['Veri sorumlusu', 'Sitede form, üyelik veya giriş yok', 'takip çerezi yok', 'Sunucu kayıtları', 'KVKK', SITE_EMAIL]) {
      assert.ok(text.toLowerCase().includes(phrase.toLowerCase()), `gizlilik metninde eksik: ${phrase}`);
    }
  });

  it('indekslenen her sayfa ana menüde ve mobil menüde İletişim, alt bilgide İletişim ve Gizlilik bağlantısı taşımalı', () => {
    const problems = [];
    for (const rel of indexablePages) {
      const html = read(rel);
      const navLinks = html.match(/<div class="nav-links">([\s\S]*?)<\/div>/)?.[1] ?? '';
      const drawer = html.match(/<div id="mobile-nav"[\s\S]*?<\/header>/)?.[0] ?? '';
      const footer = html.match(/<footer class="site-footer">([\s\S]*?)<\/footer>/)?.[1] ?? '';
      if (!/href="(\.\/|\.\.\/|\/)iletisim"[^>]*>İletişim</.test(navLinks)) problems.push(`${rel}: ana menüde İletişim yok`);
      if (!/href="(\.\/|\.\.\/|\/)iletisim"[^>]*>İletişim</.test(drawer)) problems.push(`${rel}: mobil menüde İletişim yok`);
      if (!/href="(\.\/|\.\.\/|\/)iletisim">İletişim</.test(footer)) problems.push(`${rel}: alt bilgide İletişim yok`);
      if (!/href="(\.\/|\.\.\/|\/)gizlilik">Gizlilik Politikası</.test(footer)) problems.push(`${rel}: alt bilgide Gizlilik yok`);
    }
    assert.deepEqual(problems, [], problems.join('\n'));
  });

  it('robots.txt Meta tarayıcılarını (facebookexternalhit, Facebot) engellememeli', () => {
    const groups = [];
    let current = null;
    for (const raw of read('robots.txt').split(/\r?\n/)) {
      const line = raw.replace(/#.*/, '').trim();
      const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
      if (!m) continue;
      const key = m[1].toLowerCase();
      if (key === 'user-agent') {
        if (!current || current.rules.length) groups.push((current = { agents: [], rules: [] }));
        current.agents.push(m[2].toLowerCase());
      } else if (current) {
        current.rules.push([key, m[2]]);
      }
    }
    for (const bot of ['facebookexternalhit', 'facebot']) {
      const group = groups.find((g) => g.agents.includes(bot)) ?? groups.find((g) => g.agents.includes('*'));
      assert.ok(group, `${bot} için geçerli kural grubu yok`);
      const blocked = group.rules.some(([k, v]) => k === 'disallow' && ['/', '/iletisim', '/gizlilik'].includes(v.trim()));
      assert.equal(blocked, false, `${bot} robots.txt ile engelleniyor`);
    }
  });

  it('yayın dosyalarında .dev alan adı ve eski gmail adresi kalmamalı', () => {
    const files = [
      ...walkFiles(ROOT_DIR, '.html'),
      path.join(ROOT_DIR, 'robots.txt'),
      path.join(ROOT_DIR, 'sitemap.xml'),
      path.join(ROOT_DIR, 'assets', 'mustafa-ayverdi.vcf'),
    ];
    const problems = [];
    for (const f of files) {
      const s = fs.readFileSync(f, 'utf8');
      // Sosyal hesap adresleri (Instagram/TikTok kullanıcı adı) `.dev` ile biter; alan adı denetimi onları hariç tutar.
      const sansSosyal = s.replace(/https:\/\/www\.(?:instagram|tiktok)\.com\/@?mustafaayverdi\.dev\/?/g, '');
      if (sansSosyal.includes('mustafaayverdi.dev')) problems.push(`${path.relative(ROOT_DIR, f)}: mustafaayverdi.dev`);
      if (s.includes('locko6634@gmail.com')) problems.push(`${path.relative(ROOT_DIR, f)}: gmail adresi`);
    }
    assert.deepEqual(problems, [], problems.join('\n'));
  });
});

// --- Sosyal medya linkleri sözleşmesi (Mustafa'nın kişisel hesapları; 2026-11-24) ---

describe('Sosyal Medya Linkleri', () => {
  const SOCIAL = [
    ['Instagram', 'https://www.instagram.com/mustafaayverdi.dev/'],
    ['TikTok', 'https://www.tiktok.com/@mustafaayverdi.dev'],
    ['YouTube', 'https://www.youtube.com/@mustafaayverdidev'],
  ];
  const pages = () => {
    const out = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (e.name.endsWith('.html') && e.name !== 'kart.html') out.push(p);
      }
    };
    walk(ROOT_DIR);
    return out;
  };

  it('alt bilgideki İLETİŞİM grubunda üç sosyal link güvenli rel ve etiketle bulunmalı (kart hariç tüm sayfalar, iletisim ve 404 dahil)', () => {
    const files = pages();
    assert.ok(files.length >= 10, 'sayfalar bulunamadı');
    for (const f of files) {
      const html = fs.readFileSync(f, 'utf8');
      const footer = html.match(/<footer\b[\s\S]*?<\/footer>/i)?.[0] ?? '';
      for (const [name, url] of SOCIAL) {
        const attrs = findTags(footer, ['a']).find((t) => t.attrs.get('href') === url)?.attrs;
        assert.ok(attrs, `${path.relative(ROOT_DIR, f)}: footer'da ${name} linki yok`);
        assert.equal(attrs.get('target'), '_blank', `${name} target`);
        assert.equal(attrs.get('rel'), 'me noopener noreferrer', `${name} rel`);
        assert.equal(attrs.get('aria-label'), name, `${name} aria-label`);
      }
    }
  });

  it('ana sayfa Person şemasında sameAs üç sosyal adresi içermeli', () => {
    const html = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8');
    for (const [name, url] of SOCIAL) {
      assert.ok(html.includes(`<link itemprop="sameAs" href="${url}">`), `${name} sameAs eksik`);
    }
  });
});
