import { initNav } from './nav.js';
import { initMotionToggle } from './motion-toggle.js';
import { initReveal } from './reveal.js';
import { initAccordion } from './accordion.js';
import { initSimulator } from './simulator.js';
import { initReadingBar } from './reading-bar.js';

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

export function bootstrap(initializers = INITIALIZERS) {
  for (const [name, fn] of initializers) {
    safeInit(name, fn);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bootstrap(), { once: true });
  } else {
    bootstrap();
  }
}
