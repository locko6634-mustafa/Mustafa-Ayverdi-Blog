import { initNav } from './nav.js';
import { initMotionToggle } from './motion-toggle.js';
import { initReveal } from './reveal.js';
import { initAccordion } from './accordion.js';
import { initSimulator } from './simulator.js';
import { initReadingBar } from './reading-bar.js';

// Modül grafiği başarıyla yüklendi: JS'e bağlı gizleme kuralları (ör. .js [data-reveal]) artık devreye girebilir.
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('js');
}

// Clickjacking için savunma derinliği: sayfa bir iframe içinde açıldıysa üst pencereye taşı.
// Taşıma engellenirse (sandbox'lı iframe vb.) içerik CSS ile gizli kalır (html.is-framed).
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  let framed = false;
  try {
    framed = window.top !== window.self;
  } catch (error) {
    framed = true;
  }
  if (framed) {
    // Önce gizle: bazı tarayıcılar engellenen yönlendirmede hata fırlatmadan sessizce durur.
    document.documentElement.classList.add('is-framed');
    try {
      window.top.location.href = window.self.location.href;
    } catch (error) {
      // Üst pencere yönlendirilemedi; sayfa gizli kalır.
    }
  }
}

export const INITIALIZERS = [
  ['motion-toggle', initMotionToggle],
  ['nav', initNav],
  ['reveal', initReveal],
  ['accordion', initAccordion],
  ['simulator', initSimulator],
  ['reading-bar', initReadingBar],
];

/**
 * Tek bir modül başlatıcısını izole çalıştırır; hata diğer modülleri durdurmaz.
 * @returns {boolean} başarılıysa true
 */
export function safeInit(name, fn) {
  try {
    fn();
    return true;
  } catch (error) {
    console.error(`[init] "${name}" başlatılamadı:`, error);
    return false;
  }
}

/** reveal başlatılamazsa .js altında gizlenen içerik görünmez kalmasın. */
function revealFallback() {
  if (typeof document === 'undefined') {
    return;
  }
  for (const el of document.querySelectorAll('[data-reveal]')) {
    el.classList.add('is-visible');
  }
}

export function bootstrap(initializers = INITIALIZERS) {
  for (const [name, fn] of initializers) {
    const ok = safeInit(name, fn);
    if (!ok && name === 'reveal') {
      revealFallback();
    }
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootstrap(), { once: true });
  } else {
    bootstrap();
  }
}
