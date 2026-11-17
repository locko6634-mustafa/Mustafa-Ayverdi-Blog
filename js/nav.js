/**
 * Mobil navigasyon çekmecesi kontrolcüsü.
 * [data-nav-toggle] ve #mobile-nav öğelerini erişilebilir şekilde yönetir.
 */
export function initNav() {
  const toggle = document.querySelector('[data-nav-toggle]');
  const drawer = document.getElementById('mobile-nav');

  if (!toggle || !drawer) {
    return;
  }

  // matchMedia yoksa (eski tarayıcı/test ortamı) masaüstü değil kabul edilir.
  const desktopQuery =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 901px)')
      : null;

  const setOpen = (isOpen, { restoreFocus = false } = {}) => {
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Menüyü kapat' : 'Menüyü aç');
    toggle.classList.toggle('is-active', isOpen);

    drawer.hidden = !isOpen;
    drawer.classList.toggle('is-open', isOpen);
    document.documentElement.classList.toggle('nav-open', isOpen);

    if (!isOpen && restoreFocus) {
      toggle.focus();
    }
  };

  // Başlangıç durumu senkronizasyonu
  setOpen(false);

  toggle.addEventListener('click', () => {
    const currentlyOpen = toggle.getAttribute('aria-expanded') === 'true';
    setOpen(!currentlyOpen);
  });

  // Çekmece içindeki linklere tıklanınca menüyü kapat
  drawer.addEventListener('click', (event) => {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (link) {
      setOpen(false);
    }
  });

  // ESC tuşu ile kapatma
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false, { restoreFocus: true });
    }
  });

  // Masaüstü genişliğine geçildiğinde açık çekmeceyi kapat
  const handleMediaChange = (event) => {
    if (event.matches && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
    }
  };

  if (desktopQuery && typeof desktopQuery.addEventListener === 'function') {
    desktopQuery.addEventListener('change', handleMediaChange);
  } else if (desktopQuery && typeof desktopQuery.addListener === 'function') {
    desktopQuery.addListener(handleMediaChange);
  }
}
