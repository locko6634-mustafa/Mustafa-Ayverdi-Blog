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
if (typeof window !== 'undefined') {
  try {
    if (window.top !== window.self) {
      window.top.location.href = window.self.location.href;
    }
  } catch (error) {
    // Çapraz köken / sandbox kısıtlarında üst pencereye erişilemez; sessizce devam et.
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
