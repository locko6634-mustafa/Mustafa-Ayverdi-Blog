/**
 * Makale ve vaka çalışması sayfaları için okuma ilerleme çubuğu.
 * [data-reading-progress] öğesini scroll oranına göre scaleX(0..1) ile ölçekler.
 */
export function initReadingBar() {
  const bar = document.querySelector('[data-reading-progress]');

  if (!bar) {
    return;
  }

  let ticking = false;

  const update = () => {
    ticking = false;
    const doc = document.documentElement;
    const maxScroll = doc.scrollHeight - window.innerHeight;
    const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;

    bar.style.transform = `scaleX(${ratio.toFixed(4)})`;
    if (bar.hasAttribute('aria-valuenow')) {
      bar.setAttribute('aria-valuenow', String(Math.round(ratio * 100)));
    }
  };

  const requestUpdate = () => {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(update);
    }
  };

  update();
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
}
