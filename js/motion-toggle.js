const STORAGE_KEY = 'ma-motion';

function readStoredMotion() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredMotion(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Gizli sekme veya kısıtlı depolama ortamlarında sessizce devam et
  }
}

function updateToggleButton(button, paused) {
  button.setAttribute('aria-pressed', String(paused));
  button.setAttribute(
    'aria-label',
    paused ? 'Hareket ve animasyonları yeniden başlat' : 'Hareket ve animasyonları duraklat',
  );
  button.classList.toggle('is-active', paused);

  const labelText = paused ? 'Hareketi Başlat' : 'Hareketi Duraklat';
  const labelTarget = button.querySelector('[data-motion-label]');

  if (labelTarget) {
    labelTarget.textContent = labelText;
    return;
  }

  // Buton içinde SVG varsa ikonu koruyup yalnızca metin düğümünü güncelle
  if (button.querySelector('svg')) {
    const textNode = Array.from(button.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0,
    );
    if (textNode) {
      textNode.textContent = ` ${labelText}`;
    }
    return;
  }

  button.textContent = labelText;
}

/**
 * Hareketi Duraklat / Başlat erişilebilirlik anahtarını başlatır.
 * @returns {{ isPaused: () => boolean }}
 */
export function initMotionToggle() {
  const root = document.documentElement;
  const buttons = Array.from(document.querySelectorAll('[data-motion-toggle]'));

  let paused = readStoredMotion() === 'paused';

  const applyState = (nextPaused, { persist = false, notify = false } = {}) => {
    paused = Boolean(nextPaused);

    if (paused) {
      root.setAttribute('data-motion', 'paused');
    } else {
      root.removeAttribute('data-motion');
    }

    for (const button of buttons) {
      updateToggleButton(button, paused);
    }

    if (persist) {
      writeStoredMotion(paused ? 'paused' : 'active');
    }

    if (notify) {
      window.dispatchEvent(
        new CustomEvent('ma:motion-change', {
          detail: { paused },
        }),
      );
    }
  };

  applyState(paused);

  for (const button of buttons) {
    button.addEventListener('click', () => {
      applyState(!paused, { persist: true, notify: true });
    });
  }

  return {
    isPaused: () => paused,
  };
}
