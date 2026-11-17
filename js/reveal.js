/**
 * Scroll görünürlük animasyonları için IntersectionObserver kontrolcüsü.
 * Reduced-motion veya data-motion="paused" durumunda öğeleri anında görünür yapar.
 */
export function initReveal() {
  const targets = Array.from(document.querySelectorAll('[data-reveal]'));

  if (targets.length === 0) {
    return;
  }

  const revealAll = () => {
    for (const el of targets) {
      el.classList.add('is-visible');
    }
  };

  const prefersReduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isPaused = document.documentElement.getAttribute('data-motion') === 'paused';

  if (prefersReduced || isPaused || typeof window.IntersectionObserver !== 'function') {
    revealAll();
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      }
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px',
    },
  );

  for (const el of targets) {
    observer.observe(el);
  }

  // Duraklatınca tüm öğeler kalıcı olarak görünür olur ve gözlem biter. Yeniden başlatıldığında
  // gizlenecek/izlenecek öğe kalmadığından observer yeniden kurulmaz; dinleyici de artık gereksizdir.
  const handleMotionChange = (event) => {
    if (event.detail?.paused) {
      revealAll();
      observer.disconnect();
      window.removeEventListener('ma:motion-change', handleMotionChange);
    }
  };
  window.addEventListener('ma:motion-change', handleMotionChange);
}
