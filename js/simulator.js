/**
 * İşletme sahiplerinin gözünden 3 gerçek çözümün çalışma akışını gösteren simülatör senaryoları.
 * @type {Record<string, { id: string, name: string, summary: string, steps: Array<{ code: string, title: string, detail: string, status: string, logSummary: string }> }>}
 */
export const SIMULATOR_SCENARIOS = {
  salonzeka: {
    id: 'salonzeka',
    name: 'SalonZeka · 7/24 WhatsApp Randevu Asistanı',
    summary:
      'Siz uyurken bile WhatsApp’tan gelen randevu taleplerini karşılar, takvime işler ve müşterinize hatırlatma gönderir.',
    steps: [
      {
        code: '01 · GECE MESAJI',
        title: 'Müşteri WhatsApp’tan Yazar',
        detail: 'Saat 23:40’ta bir müşteriniz yarın için kaş laminasyonu randevusu olup olmadığını sorar.',
        status: 'Mesaj Alındı · 23:40',
        logSummary: 'Müşteri mesajı: “Merhaba, yarın 14:30 için kaş laminasyon randevunuz müsait mi?”',
      },
      {
        code: '02 · UYGUN SAAT',
        title: 'Asistan Uygun Saati Önerir',
        detail: 'Sistem takviminizi ve uzman çalışma saatlerini kontrol edip saniyeler içinde uygun saatleri sunar.',
        status: 'Uygun Saat Bulundu',
        logSummary: 'Asistan yanıtı: “Yarın 14:30 ve 15:15 saatlerimiz uygun. Hangisini sizin için ayıralım?”',
      },
      {
        code: '03 · TAKVİM KAYDI',
        title: 'Randevu Takvime İşlenir',
        detail: 'Müşteriniz saati onayladığı anda randevu çakışma olmadan işletme takviminize eklenir.',
        status: 'Onaylandı · 14:30',
        logSummary: 'Takvim güncellendi: Elif Hanım · Yarın 14:30 · Kaş Laminasyon (Onay mesajı gönderildi).',
      },
      {
        code: '04 · HATIRLATMA',
        title: 'Otomatik Hatırlatma Gider',
        detail: 'Randevu günü yaklaştığında müşterinize nazik bir hatırlatma mesajı gider, boş koltuk riski azalır.',
        status: 'Hatırlatma Planlandı',
        logSummary: 'Randevudan 24 saat önce müşteriye otomatik WhatsApp hatırlatması gönderilmek üzere sıraya alındı.',
      },
    ],
  },
  vitrinos: {
    id: 'vitrinos',
    name: 'VitrinOS · Markaya Özel Görsel Stüdyosu',
    summary:
      'Tek bir ürün fotoğrafı ve kısa bir notla markanızın diline uygun kampanya görselleri saniyeler içinde hazırlanır.',
    steps: [
      {
        code: '01 · FOTOĞRAF & NOT',
        title: 'Fotoğraf ve Not Girilir',
        detail: 'Telefonla çektiğiniz ürün fotoğrafını yükleyip kampanya hakkında tek cümlelik bir not yazarsınız.',
        status: 'Kayıt Alındı',
        logSummary: 'Kampanya notu: “Yeni sezon keten elbise — hafta sonuna özel %20 indirim.”',
      },
      {
        code: '02 · MARKA TARZI',
        title: 'Marka Renk ve Tarzınız Uygulanır',
        detail: 'Sistem logonuzu, renk paletinizi ve vitrin dilinizi otomatik tanıyarak uyumlu bir sahne kurar.',
        status: 'Marka Uyumu Tamam',
        logSummary: 'Marka kimliği uygulandı: Doğal gün ışığı, sıcak bej arka plan ve kurumsal yazı tipi seçildi.',
      },
      {
        code: '03 · GÖRSEL ÜRETİMİ',
        title: 'Sosyal Medya Görselleri Hazırlanır',
        detail: 'Hem Instagram gönderisi hem de dikey hikaye ölçülerine uygun yüksek kaliteli görseller oluşturulur.',
        status: '2 Format Hazır',
        logSummary: 'Gönderi (4:5) ve Hikaye (9:16) boyutlarında net, filigransız kampanya görselleri hazırlandı.',
      },
      {
        code: '04 · TEK TIKLA YAYIN',
        title: 'Tek Tıkla Onaylanıp Yayına Alınır',
        detail: 'Beğendiğiniz görseli panelden tek dokunuşla onaylar, tasarımcı beklemeden paylaşmaya başlarsınız.',
        status: 'Yayına Hazır',
        logSummary: 'Görsel onaylandı ve indirmeye hazır hale geldi. Ekibiniz doğrudan paylaşıma geçebilir.',
      },
    ],
  },
  yesilnesil: {
    id: 'yesilnesil',
    name: 'Yeşil Nesil · Hızlı Tanıtım ve Randevu Vitrini',
    summary:
      'Mekânınızı Google’da bulan çiftler sayfayı anında açar, bahçeleri inceler ve tek tıkla WhatsApp’tan randevu ister.',
    steps: [
      {
        code: '01 · İLK KEŞİF',
        title: 'Müşteri Google’da Mekânınızı Bulur',
        detail: 'Kır düğünü veya davet arayan çiftler Google aramalarında mekânınıza güvenilir bilgilerle ulaşır.',
        status: 'Mekân Görüntülendi',
        logSummary: 'Ziyaretçi “kır düğünü mekânları” aramasından doğrudan tanıtım sayfanıza giriş yaptı.',
      },
      {
        code: '02 · HIZLI AÇILIŞ',
        title: 'Sayfa Saniyeler İçinde Açılır',
        detail: 'Ağır yüklemeler veya bekleten ekranlar olmadan fotoğraflar ve bilgiler mobilde anında açılır.',
        status: 'Anında Açıldı',
        logSummary: 'Mobil bağlantıda bile tüm galeri ve mekân bilgileri beklemeden, akıcı şekilde yüklendi.',
      },
      {
        code: '03 · BAHÇE & PAKET',
        title: 'Paket ve Bahçeleri İnceler',
        detail: 'Çiftler bahçe kapasitelerini, konseptleri ve hizmet paketlerini karmaşa yaşamadan karşılaştırır.',
        status: 'Kale Bahçesi Seçildi',
        logSummary: 'Seçilen ilgi alanı: Kale Bahçesi (250–350 kişi) · Yaz sezonu ve dış çekim paketi.',
      },
      {
        code: '04 · WHATSAPP TALEBİ',
        title: 'Tek Tıkla WhatsApp’tan Randevu İster',
        detail: 'Uzun iletişim formlarıyla uğraşmadan, seçtiği bahçe bilgisi hazır halde tek tıkla size yazar.',
        status: 'Randevu İstendi',
        logSummary: 'WhatsApp mesajı hazırlandı: “Kale Bahçesi için 250-350 kişilik yaz dönemi görüşmesi almak istiyoruz.”',
      },
    ],
  },
};

function isMotionReduced() {
  const prefersReduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paused = document.documentElement.getAttribute('data-motion') === 'paused';
  return prefersReduced || paused;
}

function appendLogEntry(logContainer, step) {
  const entry = document.createElement('div');
  entry.className = 'sim-log-entry';

  const meta = document.createElement('div');
  meta.className = 'sim-log-meta';

  const codeEl = document.createElement('span');
  codeEl.className = 'sim-log-code';
  codeEl.textContent = step.code;

  const statusEl = document.createElement('span');
  statusEl.className = 'sim-log-status';
  statusEl.textContent = step.status;

  meta.append(codeEl, statusEl);

  const summaryEl = document.createElement('p');
  summaryEl.className = 'sim-log-summary';
  summaryEl.textContent = step.logSummary;

  entry.append(meta, summaryEl);
  logContainer.append(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

/**
 * İnteraktif Sistem Simülatörünü başlatır.
 */
export function initSimulator() {
  const root = document.querySelector('[data-simulator]');
  if (!root) {
    return;
  }

  const tabs = Array.from(root.querySelectorAll('[data-sim-tab]'));
  const runButton = root.querySelector('[data-sim-run]');
  const stepElements = Array.from(root.querySelectorAll('[data-sim-step]'));
  const logContainer = root.querySelector('[data-sim-log]');
  const summaryEl = root.querySelector('[data-sim-summary]');

  let activeKey =
    tabs.find((tab) => tab.classList.contains('is-active') || tab.getAttribute('aria-selected') === 'true')
      ?.getAttribute('data-sim-tab') || 'salonzeka';

  if (!SIMULATOR_SCENARIOS[activeKey]) {
    activeKey = 'salonzeka';
  }

  let timers = [];
  let runToken = 0;

  const clearTimers = () => {
    for (const id of timers) {
      window.clearTimeout(id);
    }
    timers = [];
  };

  const renderScenarioBase = (scenarioKey) => {
    const scenario = SIMULATOR_SCENARIOS[scenarioKey];
    if (!scenario) {
      return;
    }

    for (const tab of tabs) {
      const isSelected = tab.getAttribute('data-sim-tab') === scenarioKey;
      tab.classList.toggle('is-active', isSelected);
      tab.setAttribute('aria-selected', String(isSelected));
    }

    if (summaryEl) {
      summaryEl.textContent = scenario.summary;
    }

    stepElements.forEach((stepEl, idx) => {
      const stepData = scenario.steps[idx];
      stepEl.classList.remove('is-active', 'is-done');
      stepEl.removeAttribute('aria-current');

      if (!stepData) {
        return;
      }

      const codeEl = stepEl.querySelector('[data-sim-step-code]');
      const titleEl = stepEl.querySelector('[data-sim-step-title]');
      const descEl = stepEl.querySelector('[data-sim-step-desc]');

      if (codeEl) codeEl.textContent = stepData.code;
      if (titleEl) titleEl.textContent = stepData.title;
      if (descEl) descEl.textContent = stepData.detail;
    });
  };

  const runSimulation = (scenarioKey) => {
    const scenario = SIMULATOR_SCENARIOS[scenarioKey];
    if (!scenario) {
      return;
    }

    clearTimers();
    runToken += 1;
    const currentToken = runToken;

    renderScenarioBase(scenarioKey);

    if (logContainer) {
      logContainer.replaceChildren();
    }

    if (runButton) {
      runButton.setAttribute('aria-busy', 'true');
    }

    const delayMs = isMotionReduced() ? 0 : 420;

    scenario.steps.forEach((step, idx) => {
      const timerId = window.setTimeout(() => {
        if (currentToken !== runToken) {
          return;
        }

        stepElements.forEach((el, elIdx) => {
          const isCurrent = elIdx === idx;
          const isPast = elIdx < idx;
          el.classList.toggle('is-active', isCurrent);
          el.classList.toggle('is-done', isPast);
          if (isCurrent) {
            el.setAttribute('aria-current', 'step');
          } else {
            el.removeAttribute('aria-current');
          }
        });

        if (logContainer) {
          appendLogEntry(logContainer, step);
        }

        if (idx === scenario.steps.length - 1) {
          if (runButton) {
            runButton.removeAttribute('aria-busy');
          }
        }
      }, delayMs * idx);

      timers.push(timerId);
    });
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      const nextKey = tab.getAttribute('data-sim-tab');
      if (!nextKey || !SIMULATOR_SCENARIOS[nextKey]) {
        return;
      }
      activeKey = nextKey;
      runSimulation(activeKey);
    });
  }

  if (runButton) {
    runButton.addEventListener('click', () => {
      runSimulation(activeKey);
    });
  }

  // İlk yüklemede varsayılan senaryoyu çalıştır
  runSimulation(activeKey);
}
