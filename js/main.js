import { initNav } from './nav.js';
import { initMotionToggle } from './motion-toggle.js';
import { initReveal } from './reveal.js';
import { initAccordion } from './accordion.js';
import { initSimulator } from './simulator.js';
import { initReadingBar } from './reading-bar.js';

function bootstrap() {
  initMotionToggle();
  initNav();
  initReveal();
  initAccordion();
  initSimulator();
  initReadingBar();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
