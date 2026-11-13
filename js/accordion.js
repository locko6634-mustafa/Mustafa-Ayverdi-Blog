function resolvePanel(trigger) {
  const controlsId = trigger.getAttribute('aria-controls');
  if (controlsId) {
    const byId = document.getElementById(controlsId);
    if (byId) {
      return byId;
    }
  }

  const item = trigger.closest('.accordion-item, [data-accordion-item]');
  if (item) {
    const inside = item.querySelector('[data-accordion-panel]');
    if (inside) {
      return inside;
    }
  }

  const next = trigger.nextElementSibling;
  if (next && next.hasAttribute('data-accordion-panel')) {
    return next;
  }

  return null;
}

function setItemState(trigger, panel, expanded) {
  trigger.setAttribute('aria-expanded', String(expanded));
  const item = trigger.closest('.accordion-item, [data-accordion-item]');
  if (item) {
    item.classList.toggle('is-open', expanded);
  }
  if (panel) {
    panel.hidden = !expanded;
    panel.classList.toggle('is-open', expanded);
  }
}

/**
 * Erişilebilir akordiyon bileşenlerini başlatır.
 * WAI-ARIA Accordion pattern (aria-expanded, hidden, ArrowUp/ArrowDown/Home/End).
 */
export function initAccordion() {
  const accordions = Array.from(document.querySelectorAll('[data-accordion]'));

  for (const accordion of accordions) {
    const allowMultiple = accordion.hasAttribute('data-accordion-multiple');
    const triggers = Array.from(accordion.querySelectorAll('[data-accordion-trigger]'));

    if (triggers.length === 0) {
      continue;
    }

    const pairs = triggers.map((trigger) => ({
      trigger,
      panel: resolvePanel(trigger),
    }));

    // Başlangıç durumunu HTML'deki aria-expanded değerine göre senkronize et
    for (const { trigger, panel } of pairs) {
      const initialExpanded = trigger.getAttribute('aria-expanded') === 'true';
      setItemState(trigger, panel, initialExpanded);
    }

    pairs.forEach(({ trigger, panel }, index) => {
      trigger.addEventListener('click', () => {
        const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
        const nextExpanded = !isExpanded;

        if (!allowMultiple && nextExpanded) {
          for (const other of pairs) {
            if (other.trigger !== trigger) {
              setItemState(other.trigger, other.panel, false);
            }
          }
        }

        setItemState(trigger, panel, nextExpanded);
      });

      trigger.addEventListener('keydown', (event) => {
        let targetIndex = null;

        switch (event.key) {
          case 'ArrowDown':
            targetIndex = (index + 1) % pairs.length;
            break;
          case 'ArrowUp':
            targetIndex = (index - 1 + pairs.length) % pairs.length;
            break;
          case 'Home':
            targetIndex = 0;
            break;
          case 'End':
            targetIndex = pairs.length - 1;
            break;
          default:
            return;
        }

        event.preventDefault();
        pairs[targetIndex]?.trigger.focus();
      });
    });
  }
}
