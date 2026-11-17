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
        logSummary: 'Müşteri mesajı: “Merhaba, yarın öğleden sonra kaş laminasyonu için yeriniz var mı?”',
      },
      {
        code: '02 · UYGUN SAAT',
        title: 'Asistan Uygun Saati Önerir',
        detail: 'Sistem takviminizi ve uzman çalışma saatlerini kontrol edip saniyeler içinde uygun saatleri sunar.',
        status: 'Uygun Saat Bulundu',
        logSummary: 'Asistan yanıtı: “Yarın uzmanımız Elif Hanım’da 14:30 ve 16:00 saatleri uygun.”',
      },
      {
        code: '03 · TAKVİM KAYDI',
        title: 'Randevu Takvime İşlenir',
        detail: 'Müşteriniz saati onayladığı anda randevu çakışma olmadan işletme takviminize eklenir.',
        status: 'Onaylandı · 14:30',
        logSummary: 'Takvim güncellendi: Zeynep Hanım · Yarın 14:30 · Kaş Laminasyon (Onaylandı).',
      },
      {
        code: '04 · HATIRLATMA',
        title: 'Otomatik Hatırlatma Gider',
        detail: 'Randevu günü yaklaştığında müşterinize nazik bir hatırlatma mesajı gider, boş koltuk riski azalır.',
        status: 'Hatırlatma Planlandı',
        logSummary: 'WhatsApp Hatırlatma Planlandı · Randevudan 24 saat önce.',
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
        logSummary: 'Marka kimliği uygulandı: Marka Paleti, Tipografi ve Doğal Gün Işığı.',
      },
      {
        code: '03 · GÖRSEL ÜRETİMİ',
        title: 'Sosyal Medya Görselleri Hazırlanır',
        detail: 'Hem Instagram gönderisi hem de dikey hikaye ölçülerine uygun yüksek kaliteli görseller oluşturulur.',
        status: '2 Format Hazır',
        logSummary: '4:5 Instagram Gönderisi ve 9:16 Hikâye boyutlarında kampanya görselleri hazırlandı.',
      },
      {
        code: '04 · TEK TIKLA YAYIN',
        title: 'Yayına Hazır Hale Gelir',
        detail: 'Beğendiğiniz görseli panelden tek dokunuşla onaylar, tasarımcı beklemeden paylaşmaya başlarsınız.',
        status: 'Yayına Hazır',
        logSummary: 'Yayına Hazır · Tasarımcı beklemeden indirin.',
      },
    ],
  },
  yesilnesil: {
    id: 'yesilnesil',
    name: 'Yeşil Nesil · Google Keşfi & 0.4 sn Orijinal Vitrin',
    summary:
      'Google’da mekânınızı arayan çiftler ilk sırada sitenizi görür, tıklar ve 0.4 sn’de açılan orijinal vitrininizle doğrudan keşif talebine geçer.',
    steps: [
      {
        code: '01 · GOOGLE ARAMA',
        title: 'Çiftler Google’da Mekânınızı Arar',
        detail:
          '“Kır düğünü mekânları” aramasında Yeşil Nesil The Garden ilk sırada görünür.',
        status: 'İlk Sırada',
        logSummary:
          'Google aramasında “kır düğünü mekânları” sorgusuyla yesilnesilthegarden.com ilk sırada listelendi.',
      },
      {
        code: '02 · SONUCA TIKLAMA',
        title: 'Ziyaretçi İlk Sonuca Tıklar',
        detail:
          'Aracı veya komisyon sitelerine gitmeden doğrudan işletme sonucuna tıklanır.',
        status: 'Sonuca Tıklandı',
        logSummary:
          'Ziyaretçi Google sonuçlarında Yeşil Nesil The Garden bağlantısına tıkladı.',
      },
      {
        code: '03 · HIZLI AÇILIŞ',
        title: 'Orijinal Site 0.4 sn’de Açılır',
        detail:
          'yesilnesilthegarden.com tarayıcıda gecikmesiz açılır ve tüm vitrin anında yüklenir.',
        status: "0.4 sn'de Açıldı",
        logSummary:
          "yesilnesilthegarden.com 0.4 sn'de açıldı · Orijinal site vitrini ekrana geldi.",
      },
      {
        code: '04 · KEŞİF HAZIR',
        title: 'Doğrudan Keşif & Randevu Hazır',
        detail:
          'Sıfır aracı ve sıfır komisyonla çiftler doğrudan keşif ve randevu talebi oluşturur.',
        status: 'Keşif Hazır',
        logSummary:
          "0.4 sn'de açılan vitrin · Doğrudan keşif ve randevu talebi hazır.",
      },
    ],
  },
};

const LOOP_RESTART_DELAY_MS = 4000;
// buildStage geçerli bir son adım zamanı döndürmezse kullanılan güvenli varsayılan.
const DEFAULT_LAST_STEP_AT_MS = 8000;

function isMotionPaused() {
  const prefersReduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const paused = document.documentElement.dataset.motion === 'paused';
  return prefersReduced || paused;
}

/**
 * Görsel yüklenemezse kırık ikon yerine alt metni sade bir yer tutucuyla gösterir.
 */
function attachImageFallback(img) {
  img.addEventListener(
    'error',
    () => {
      img.classList.add('sim-img--broken');
    },
    { once: true },
  );
}

/** Modüle göreli görsel yolu üretir (sayfa alt dizinde olsa da doğru çözülür). */
const SIM_IMAGES = {
  vitrinosScene: () => new URL('../assets/img/vitrinos-scene.webp', import.meta.url).href,
  vitrinosReal: () => new URL('../assets/img/vitrinos-real.webp', import.meta.url).href,
  yesilnesilReal: () => new URL('../assets/img/yesilnesil-real.webp', import.meta.url).href,
};

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) {
    el.className = className;
  }
  if (text !== undefined) {
    el.textContent = text;
  }
  return el;
}

function buildDeviceFrame(title, tagText) {
  const head = createEl('div', 'sim-device-head');
  const titleEl = createEl('span', 'sim-device-title', title);
  const tagEl = createEl('span', 'sim-device-tag', tagText);
  head.append(titleEl, tagEl);

  const body = createEl('div', 'sim-device-body');
  return { head, body };
}

function createSvgIcon(pathDataList, viewBox = '0 0 24 24') {
  const svgNs = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('viewBox', viewBox);
  svg.setAttribute('width', '15');
  svg.setAttribute('height', '15');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  for (const d of pathDataList) {
    const path = document.createElementNS(svgNs, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

function createTypingIndicator() {
  const wrap = createEl('div', 'sim-wa-typing');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.append(
    createEl('span', 'sim-typing-dot'),
    createEl('span', 'sim-typing-dot'),
    createEl('span', 'sim-typing-dot'),
  );
  return wrap;
}

function createWhatsAppMessage(variant, text, timeText) {
  const msg = createEl('div', `sim-wa-msg sim-wa-msg--${variant}`);
  const p = createEl('p', '', text);
  const timeEl = createEl('span', 'sim-wa-time', timeText);
  if (variant === 'customer') {
    timeEl.append(createEl('span', 'sim-wa-ticks', ' ✓✓'));
  }
  msg.append(p, timeEl);
  return msg;
}

function buildWhatsAppShell() {
  const shell = createEl('div', 'sim-wa-shell');

  const header = createEl('div', 'sim-wa-header');
  const avatar = createEl('div', 'sim-wa-avatar', 'SZ');
  const headInfo = createEl('div', 'sim-wa-head-info');
  const titleEl = createEl('div', 'sim-wa-title', 'SalonZeka Asistan');
  const statusEl = createEl('div', 'sim-wa-status', 'çevrimiçi');
  headInfo.append(titleEl, statusEl);
  header.append(avatar, headInfo);

  const body = createEl('div', 'sim-wa-body');
  const dayPill = createEl('div', 'sim-wa-day', 'Bugün');
  body.append(dayPill);

  const inputBar = createEl('div', 'sim-wa-inputbar');
  const inputPill = createEl('div', 'sim-wa-input-pill', 'Mesaj yazın...');
  const sendDot = createEl('div', 'sim-wa-send-dot');
  sendDot.append(createSvgIcon(['M22 2L11 13', 'M22 2l-7 20-4-9-9-4 20-7z']));
  inputBar.append(inputPill, sendDot);

  shell.append(header, body, inputBar);
  return { shell, body, statusEl };
}

function buildRandevuPanelShell() {
  const shell = createEl('div', 'sim-rp-shell');

  const sidebar = createEl('div', 'sim-rp-sidebar');
  const navIcons = [
    ['M8 2v4', 'M16 2v4', 'M3 10h18', 'M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
    ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2', 'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'],
    ['M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'],
    ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.6.77 1.02 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z'],
  ];
  navIcons.forEach((paths, idx) => {
    const item = createEl('div', idx === 0 ? 'sim-rp-nav-item is-active' : 'sim-rp-nav-item');
    item.append(createSvgIcon(paths));
    sidebar.append(item);
  });

  const main = createEl('div', 'sim-rp-main');

  const topbar = createEl('div', 'sim-rp-topbar');
  const titleWrap = createEl('div', 'sim-rp-title-wrap');
  titleWrap.append(
    createEl('div', 'sim-rp-title', 'Randevu Paneli'),
    createEl('div', 'sim-rp-subtitle', '9 - 15 Kasım 2026'),
  );

  const stats = createEl('div', 'sim-rp-stats');
  const createStat = (label, initialVal) => {
    const stat = createEl('div', 'sim-rp-stat');
    const labelEl = createEl('span', 'sim-rp-stat-label', label);
    const valEl = createEl('span', 'sim-rp-stat-val', initialVal);
    stat.append(labelEl, valEl);
    return { stat, valEl };
  };
  const todayStat = createStat('BUGÜN', '4');
  const weeklyStat = createStat('HAFTALIK BAŞARI', '%0');
  const queueStat = createStat('KUYRUK', '0');
  stats.append(todayStat.stat, weeklyStat.stat, queueStat.stat);

  const addBtn = createEl('span', 'sim-rp-add-btn', '+ Yeni Ekle');
  topbar.append(titleWrap, stats, addBtn);

  const filters = createEl('div', 'sim-rp-filters');
  filters.append(createEl('span', 'sim-rp-filter-label', 'DURUM:'));
  ['Tümü', 'Bekliyor', 'Tamamlandı', 'İptal'].forEach((label, idx) => {
    filters.append(createEl('span', idx === 0 ? 'sim-rp-pill is-active' : 'sim-rp-pill', label));
  });

  const workspace = createEl('div', 'sim-rp-workspace');

  const grid = createEl('div', 'sim-rp-grid');
  const gridHead = createEl('div', 'sim-rp-grid-head');
  gridHead.append(createEl('div', 'sim-rp-hour', ''));
  const days = ['PER 12', 'CUM 13', 'CMT 14', 'PAZ 15'];
  days.forEach((day, idx) => {
    gridHead.append(createEl('div', idx === 2 ? 'sim-rp-day-col is-today' : 'sim-rp-day-col', day));
  });

  const existingEvents = {
    '12:00': ['Selin · Fön', 'Merve · Bakım', 'Selin · Fön', 'Ayşe · Kesim'],
    '13:00': ['Buse · Lazer', null, 'Derya · Boya', 'Naz · Protez'],
    '14:00': ['Merve · Bakım', 'Ceren · Cilt', null, 'Ece · Manikür'],
    '15:00': [null, 'Ayşe · Kesim', 'Ece · Manikür', 'Buse · Lazer'],
    '16:00': ['Derya · Boya', 'Naz · Protez', null, null],
    '17:00': ['Ece · Manikür', 'Buse · Lazer', 'Ceren · Cilt', 'Selin · Fön'],
  };

  const gridBody = createEl('div', 'sim-rp-grid-body');
  const hours = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
  const cellMap = {};
  for (const hour of hours) {
    const row = createEl('div', 'sim-rp-row');
    row.append(createEl('div', 'sim-rp-hour', hour));
    const cellsWrap = createEl('div', 'sim-rp-cells');
    const rowCells = [];
    for (let d = 0; d < days.length; d += 1) {
      const cell = createEl('div', 'sim-rp-cell');
      const existingLabel = existingEvents[hour]?.[d];
      if (existingLabel) {
        cell.append(createEl('div', 'sim-rp-event sim-rp-event--existing', existingLabel));
      }
      cellsWrap.append(cell);
      rowCells.push(cell);
    }
    cellMap[hour] = rowCells;
    row.append(cellsWrap);
    gridBody.append(row);
  }
  grid.append(gridHead, gridBody);

  const agenda = createEl('div', 'sim-rp-agenda');
  const agendaHead = createEl('div', 'sim-rp-agenda-head');
  const agendaTitle = createEl('span', '', 'BUGÜNÜN AKIŞI');
  const agendaBadge = createEl('span', 'sim-rp-agenda-badge', 'GÜNLÜK BAŞARI: %0');
  agendaHead.append(agendaTitle, agendaBadge);

  const agendaEmpty = createEl('div', 'sim-rp-empty', 'Harika! Bugün için randevu bulunmuyor.');
  agenda.append(agendaHead, agendaEmpty);

  workspace.append(grid, agenda);
  main.append(topbar, filters, workspace);
  shell.append(sidebar, main);

  return {
    shell,
    todayValEl: todayStat.valEl,
    weeklyValEl: weeklyStat.valEl,
    cell1400: cellMap['14:00'][2],
    cell1600: cellMap['16:00'][2],
    agenda,
    agendaBadge,
    agendaEmpty,
  };
}

/**
 * SalonZeka: Sol WhatsApp <-> Sağ Randevu Paneli otonom sahnesini kurar.
 */
function setupSalonZekaStage(leftEl, rightEl, instantComplete, schedule) {
  const wa = buildWhatsAppShell();
  leftEl.replaceChildren(wa.shell);

  const rp = buildRandevuPanelShell();
  rightEl.replaceChildren(rp.shell);

  const appendWaMessage = (variant, text, timeText) => {
    wa.body.append(createWhatsAppMessage(variant, text, timeText));
    wa.body.scrollTop = wa.body.scrollHeight;
  };

  const applyStep0 = () => {
    appendWaMessage(
      'customer',
      'Merhaba, yarın öğleden sonra kaş laminasyonu için yeriniz var mı?',
      '23:40',
    );
  };

  const applyStep1Scan = () => {
    rp.cell1400.classList.add('is-scanning');
    rp.cell1600.classList.add('is-scanning');
  };

  const applyStep1Msg = () => {
    wa.statusEl.textContent = 'çevrimiçi';
    appendWaMessage(
      'ai',
      "Merhaba! Yarın uzmanımız Elif Hanım'da 14:30 ve 16:00 saatleri uygun. Hangisini ayıralım?",
      '23:40',
    );
  };

  const applyStep2 = () => {
    appendWaMessage('customer', '14:30 süper olur, adım Zeynep.', '23:41');
  };

  const applyStep3 = () => {
    wa.statusEl.textContent = 'çevrimiçi';
    appendWaMessage(
      'ai',
      'Tamamdır Zeynep Hanım, yarın 14:30 için randevunuz oluşturuldu. 24 saat önce hatırlatma göndereceğiz.',
      '23:41',
    );

    rp.cell1400.classList.remove('is-scanning');
    rp.cell1400.classList.add('is-booked');
    rp.cell1400.append(createEl('div', 'sim-rp-event', '14:30 · Zeynep'));

    rp.cell1600.classList.remove('is-scanning');

    rp.todayValEl.textContent = '5';
    rp.weeklyValEl.textContent = '%100';
    rp.agendaBadge.textContent = 'GÜNLÜK BAŞARI: %100';

    rp.agendaEmpty.remove();
    rp.agenda.append(
      createEl('div', 'sim-rp-booked-card', '14:30 · Zeynep Hanım · Kaş Laminasyon · Onaylandı'),
      createEl('div', 'sim-rp-reminder', '24 saat önce WhatsApp hatırlatma planlandı'),
    );
  };

  if (instantComplete) {
    applyStep0();
    applyStep1Msg();
    applyStep2();
    applyStep3();
    return 0;
  }

  let typingEl = createTypingIndicator();
  wa.body.append(typingEl);

  schedule(0, 850, () => {
    typingEl.remove();
    applyStep0();
  });

  schedule(1, 2000, () => {
    applyStep1Scan();
    wa.statusEl.textContent = 'yazıyor...';
    typingEl = createTypingIndicator();
    wa.body.append(typingEl);
  });

  schedule(1, 3000, () => {
    typingEl.remove();
    applyStep1Msg();
  });

  schedule(2, 4300, () => {
    typingEl = createTypingIndicator();
    wa.body.append(typingEl);
  });

  schedule(2, 5200, () => {
    typingEl.remove();
    applyStep2();
  });

  schedule(3, 5800, () => {
    wa.statusEl.textContent = 'yazıyor...';
    typingEl = createTypingIndicator();
    wa.body.append(typingEl);
  });

  schedule(3, 6700, () => {
    typingEl.remove();
    applyStep3();
  });

  return 6700;
}

/**
 * VitrinOS: Sol Koyu Stüdyo Üretim Emri <-> Sağ Canlı Kreatif Çıktı otonom sahnesini kurar.
 */
function setupVitrinOSStage(leftEl, rightEl, instantComplete, schedule) {
  const BRIEF_TEXT =
    'Yeni sezon keten elbise — hafta sonuna özel %20 indirimli tanıtım görseli.';

  /* --- SOL PANEL: .sim-vo-panel --- */
  const leftPanel = createEl('div', 'sim-vo-panel');

  const leftHeader = createEl('div', 'sim-vo-header');
  const leftTitleGroup = createEl('div', 'sim-vo-title-group');
  const leftEyebrow = createEl('span', 'sim-vo-eyebrow', 'YENİ ÜRETİM EMRİ');
  const leftTitle = createEl('h4', 'sim-vo-title', 'Görsel Önizlemesi Üret');
  leftTitleGroup.append(leftEyebrow, leftTitle);
  const enginePill = createEl('span', 'sim-vo-pill', 'VitrinOS Motoru');
  leftHeader.append(leftTitleGroup, enginePill);

  /* Hızlı Öneri çipleri */
  const chipsSection = createEl('div', 'sim-vo-field');
  const chipsLabel = createEl('span', 'sim-vo-label', 'Hızlı Öneri:');
  const chipsWrap = createEl('div', 'sim-vo-chips');
  const chipLabels = ['İndirim Banner', 'Lansman Post', 'Flaş Kampanya Story'];
  const chipEls = chipLabels.map((label) => createEl('span', 'sim-vo-chip', label));
  chipsWrap.append(...chipEls);
  chipsSection.append(chipsLabel, chipsWrap);

  /* Brief Açıklaması */
  const briefSection = createEl('div', 'sim-vo-field');
  const briefLabel = createEl('span', 'sim-vo-label', 'Brief Açıklaması');
  const textareaBox = createEl('div', 'sim-vo-textarea');
  const briefTextEl = createEl(
    'span',
    'sim-vo-textarea-text is-placeholder',
    'Kampanya notu bekleniyor...',
  );
  textareaBox.append(briefTextEl);
  briefSection.append(briefLabel, textareaBox);

  /* Referans Ürün Görseli (Dropzone) */
  const dropSection = createEl('div', 'sim-vo-field');
  const dropLabel = createEl('span', 'sim-vo-label', 'Referans Ürün Görseli');
  const dropzone = createEl('div', 'sim-vo-dropzone');
  const dropEmpty = createEl(
    'span',
    'sim-vo-dropzone-empty',
    'Ham ürün fotoğrafı bekleniyor...',
  );
  const dropPreview = createEl('div', 'sim-vo-dropzone-preview');
  const photo = createEl('img', 'sim-vo-thumb');
  attachImageFallback(photo);
  photo.src = SIM_IMAGES.vitrinosScene();
  photo.alt = 'VitrinOS ham ürün fotoğrafı';
  const dropMeta = createEl('div', 'sim-vo-dropzone-meta');
  const dropFile = createEl('span', 'sim-vo-dropzone-file', 'keten-elbise-ham.jpg');
  const dropHint = createEl('span', 'sim-vo-dropzone-hint', 'Referans görsel yüklendi');
  dropMeta.append(dropFile, dropHint);
  dropPreview.append(photo, dropMeta);
  dropzone.append(dropEmpty);
  dropSection.append(dropLabel, dropzone);

  /* Alt 2'li seçim */
  const selectsGrid = createEl('div', 'sim-vo-selects');
  const formatBox = createEl('div', 'sim-vo-select-box');
  const formatLabel = createEl('span', 'sim-vo-select-label', 'Çıktı Formatı');
  const formatVal = createEl('span', 'sim-vo-select-value', 'Otomatik Tespit Et');
  formatBox.append(formatLabel, formatVal);

  const brandBox = createEl('div', 'sim-vo-select-box');
  const brandLabel = createEl('span', 'sim-vo-select-label', 'Uygulanacak Marka');
  const brandVal = createEl('span', 'sim-vo-select-value', 'Seçili Marka Kimliği');
  brandBox.append(brandLabel, brandVal);
  selectsGrid.append(formatBox, brandBox);

  /* Alt tam genişlik lime buton */
  const submitBtn = createEl('div', 'sim-vo-submit', 'Üretimi Başlat');

  leftPanel.append(
    leftHeader,
    chipsSection,
    briefSection,
    dropSection,
    selectsGrid,
    submitBtn,
  );
  leftEl.replaceChildren(leftPanel);

  /* --- SAĞ PANEL: .sim-vo-output-panel --- */
  const rightPanel = createEl('div', 'sim-vo-output-panel');

  const rightHeader = createEl('div', 'sim-vo-header');
  const rightTitleGroup = createEl('div', 'sim-vo-title-group');
  const rightEyebrow = createEl('span', 'sim-vo-eyebrow', 'CANLI KREATİF ÇIKTI');
  const rightTitle = createEl('h4', 'sim-vo-title', 'Kreatif Hazırlanıyor');
  rightTitleGroup.append(rightEyebrow, rightTitle);
  const statusBadge = createEl('span', 'sim-vo-badge', 'BEKLİYOR');
  rightHeader.append(rightTitleGroup, statusBadge);

  /* İnce ızgara desenli koyu sahne alanı */
  const canvas = createEl('div', 'sim-vo-canvas');

  const progressWrap = createEl('div', 'sim-vo-progress-wrap');
  const progressLabel = createEl('span', 'sim-vo-progress-label', 'Stüdyo Sahnesi Bekleniyor');
  const progressTrack = createEl('div', 'sim-vo-progress');
  const progressBar = createEl('div', 'sim-vo-progress-bar');
  progressBar.style.width = '12%';
  progressTrack.append(progressBar);
  progressWrap.append(progressLabel, progressTrack);

  const resultStage = createEl('div', 'sim-vo-result');
  canvas.append(progressWrap, resultStage);

  const readyBanner = createEl(
    'div',
    'sim-vo-ready-banner',
    'Yayına Hazır · Tasarımcı beklemeden indirin',
  );

  rightPanel.append(rightHeader, canvas, readyBanner);
  rightEl.replaceChildren(rightPanel);

  /* --- ADIM UYGULAYICILARI --- */
  const applyStep0 = () => {
    chipEls[0].classList.add('is-active');
    briefTextEl.classList.remove('is-placeholder');
    briefTextEl.textContent = BRIEF_TEXT;
    textareaBox.classList.add('is-filled');
    progressBar.style.width = '24%';
  };

  const applyStep1 = () => {
    if (!dropzone.contains(dropPreview)) {
      dropzone.replaceChildren(dropPreview);
      dropzone.classList.add('is-filled');
    }
    formatBox.classList.add('is-active');
    brandBox.classList.add('is-active');
    submitBtn.classList.add('is-active');
    statusBadge.textContent = 'HAZIRLANIYOR';
    statusBadge.classList.add('is-working');
    progressLabel.textContent = 'Marka kimliği & ışık sahnesi işleniyor...';
    progressBar.style.width = '64%';
  };

  const applyStep2 = () => {
    progressLabel.textContent = 'Kreatif render tamamlandı';
    progressBar.style.width = '100%';
    progressWrap.classList.add('is-done');

    if (resultStage.childElementCount === 0) {
      const previewCard = createEl('div', 'sim-vo-preview-card');
      const img = createEl('img', 'sim-vo-result-img');
      attachImageFallback(img);
      img.src = SIM_IMAGES.vitrinosReal();
      img.alt = 'VitrinOS üretilen kampanya görseli';

      const formatTags = createEl('div', 'sim-vo-format-tags');
      const tagPost = createEl('span', 'sim-vo-format-tag', '4:5 Gönderi');
      const tagSep = createEl('span', 'sim-vo-format-sep', '&');
      const tagStory = createEl('span', 'sim-vo-format-tag', '9:16 Hikâye');
      formatTags.append(tagPost, tagSep, tagStory);

      previewCard.append(img, formatTags);
      resultStage.append(previewCard);
    }
    resultStage.classList.add('is-visible');
  };

  const applyStep3 = () => {
    rightTitle.textContent = 'Kreatif Hazır';
    statusBadge.textContent = 'HAZIR';
    statusBadge.classList.remove('is-working');
    statusBadge.classList.add('is-ready');
    readyBanner.classList.add('is-visible');
  };

  if (instantComplete) {
    applyStep0();
    applyStep1();
    applyStep2();
    applyStep3();
    return 0;
  }

  schedule(0, 300, () => {
    chipEls[0].classList.add('is-active');
    progressBar.style.width = '18%';
  });

  schedule(0, 750, () => {
    applyStep0();
  });

  schedule(1, 1450, () => {
    if (!dropzone.contains(dropPreview)) {
      dropzone.replaceChildren(dropPreview);
      dropzone.classList.add('is-filled');
    }
    progressBar.style.width = '42%';
  });

  schedule(1, 2000, () => {
    formatBox.classList.add('is-active');
    brandBox.classList.add('is-active');
    statusBadge.textContent = 'HAZIRLANIYOR';
    statusBadge.classList.add('is-working');
    progressLabel.textContent = 'Marka kimliği & ışık sahnesi işleniyor...';
    progressBar.style.width = '58%';
  });

  schedule(1, 2550, () => {
    submitBtn.classList.add('is-active');
    progressBar.style.width = '74%';
  });

  schedule(2, 3400, () => {
    applyStep2();
  });

  schedule(3, 5000, () => {
    applyStep3();
  });

  return 5000;
}

/**
 * Yeşil Nesil: Sol Gerçekçi Google Arama <-> Sağ Açılan Orijinal Site sahnesini kurar.
 */
function setupYesilNesilStage(leftEl, rightEl, instantComplete, schedule) {
  const googleShell = createEl('div', 'sim-google-shell');

  const googleTop = createEl('div', 'sim-google-top');
  const googleLogo = createEl('div', 'sim-google-logo');
  const logoLetters = [
    ['G', '#4285F4'],
    ['o', '#EA4335'],
    ['o', '#FBBC05'],
    ['g', '#4285F4'],
    ['l', '#34A853'],
    ['e', '#EA4335'],
  ];
  for (const [ch, color] of logoLetters) {
    const span = createEl('span', 'sim-google-letter', ch);
    span.style.color = color;
    googleLogo.append(span);
  }

  const googleBar = createEl('div', 'sim-google-bar');
  const searchIcon = createEl('span', 'sim-google-search-icon');
  searchIcon.append(createSvgIcon(['M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16z', 'M21 21l-4.35-4.35']));
  const googleQuery = createEl('span', 'sim-google-query', "Google'da ara...");
  googleBar.append(searchIcon, googleQuery);
  googleTop.append(googleLogo, googleBar);

  const googleResults = createEl('div', 'sim-google-results');

  const primaryResult = createEl('div', 'sim-google-result');
  const primaryUrl = createEl('span', 'sim-google-url', 'https://yesilnesilthegarden.com');
  const primaryTitle = createEl(
    'strong',
    'sim-google-title',
    'Yeşil Nesil The Garden · Kır Düğünü ve Davet Mekânı',
  );
  const primaryDesc = createEl(
    'p',
    'sim-google-desc',
    'Doğayla iç içe 350 kişilik kır bahçesi, açık hava nikâh alanı ve hızlı keşif randevusu.',
  );
  const clickBadge = createEl('span', 'sim-google-click-badge', 'Sonuca tıklandı');
  primaryResult.append(primaryUrl, primaryTitle, primaryDesc, clickBadge);

  const secondaryResult = createEl('div', 'sim-google-result sim-google-result--muted');
  secondaryResult.append(
    createEl('span', 'sim-google-url', 'https://dugun-rehberi.example › kir-dugunu'),
    createEl('strong', 'sim-google-title', 'İstanbul Kır Düğünü Mekânları Listesi'),
    createEl(
      'p',
      'sim-google-desc',
      'Komisyonlu listeleme portalları ve uzun teklif bekleme formları...',
    ),
  );

  googleResults.append(primaryResult, secondaryResult);
  googleShell.append(googleTop, googleResults);
  leftEl.replaceChildren(googleShell);

  const siteShell = createEl('div', 'sim-site-shell');
  const siteBar = createEl('div', 'sim-site-bar');
  const siteDots = createEl('div', 'sim-site-dots');
  siteDots.append(
    createEl('span', 'sim-site-dot'),
    createEl('span', 'sim-site-dot'),
    createEl('span', 'sim-site-dot'),
  );
  const siteAddress = createEl('div', 'sim-site-address');
  siteAddress.append(
    createSvgIcon(['M7 11V7a5 5 0 0 1 10 0v4', 'M5 11h14v10H5z']),
    createEl('span', '', 'yesilnesilthegarden.com'),
  );
  const speedBadge = createEl('span', 'sim-speed-badge', "0.4 sn'de açıldı");
  siteBar.append(siteDots, siteAddress, speedBadge);

  const siteViewport = createEl('div', 'sim-site-viewport');
  const sitePlaceholder = createEl(
    'div',
    'sim-site-placeholder',
    'Google sonucuna tıklanması bekleniyor...',
  );
  const siteImg = createEl('img', 'sim-site-img');
  attachImageFallback(siteImg);
  siteImg.src = SIM_IMAGES.yesilnesilReal();
  siteImg.alt = 'Yeşil Nesil The Garden orijinal web sitesi ekran görüntüsü';
  siteViewport.append(sitePlaceholder, siteImg);

  siteShell.append(siteBar, siteViewport);
  rightEl.replaceChildren(siteShell);

  const applyStep0 = () => {
    googleQuery.textContent = 'kır düğünü mekânları';
    googleQuery.classList.add('is-typed');
    googleResults.classList.add('is-visible');
  };

  const applyStep1 = () => {
    primaryResult.classList.add('is-active');
  };

  const applyStep2 = () => {
    sitePlaceholder.remove();
    siteImg.classList.add('is-visible');
    speedBadge.classList.add('is-active');
  };

  const applyStep3 = () => {
    const banner = createEl(
      'div',
      'sim-ready-banner',
      "0.4 sn'de açılan vitrin · Doğrudan keşif ve randevu talebi hazır",
    );
    siteShell.append(banner);
  };

  if (instantComplete) {
    applyStep0();
    applyStep1();
    applyStep2();
    applyStep3();
    return 0;
  }

  schedule(0, 650, () => {
    applyStep0();
  });

  schedule(1, 2000, () => {
    applyStep1();
  });

  schedule(2, 3400, () => {
    applyStep2();
  });

  schedule(3, 4900, () => {
    applyStep3();
  });

  return 4900;
}

/** Önceki initSimulator çağrısının dinleyici/zamanlayıcılarını temizler (tekrar çağrıda katlanmayı önler). */
let teardownPrevious = null;

const STAGE_BUILDERS = {
  salonzeka: setupSalonZekaStage,
  vitrinos: setupVitrinOSStage,
  yesilnesil: setupYesilNesilStage,
};

// Object.hasOwn Safari <15.4'te yok; aynı davranış eski tarayıcılarda da çalışsın.
const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Yalnız SIMULATOR_SCENARIOS'un kendi anahtarlarını kabul eder; `constructor`, `toString`
 * gibi prototip anahtarları ve string olmayan değerler null döner.
 * @param {unknown} key
 */
export function getScenario(key) {
  return typeof key === 'string' && hasOwn(SIMULATOR_SCENARIOS, key) ? SIMULATOR_SCENARIOS[key] : null;
}

function getStageBuilder(key) {
  return typeof key === 'string' && hasOwn(STAGE_BUILDERS, key) ? STAGE_BUILDERS[key] : null;
}

/**
 * Sıfır tıklamalı Tam Otonom Çift Ekranlı Canlı Deneyim Motorunu başlatır.
 */
export function initSimulator() {
  if (typeof teardownPrevious === 'function') {
    teardownPrevious();
    teardownPrevious = null;
  }

  const root = document.querySelector('[data-simulator]');
  if (!root) {
    return;
  }

  /** @type {Array<() => void>} */
  const cleanups = [];
  const listen = (target, type, handler) => {
    target.addEventListener(type, handler);
    cleanups.push(() => target.removeEventListener(type, handler));
  };

  const tabs = Array.from(root.querySelectorAll('[data-sim-tab]'));
  const replayButton = root.querySelector('[data-sim-replay]');
  const stepElements = Array.from(root.querySelectorAll('[data-sim-step]'));
  const leftEl = root.querySelector('[data-sim-left]');
  const rightEl = root.querySelector('[data-sim-right]');
  const summaryEl = root.querySelector('[data-sim-summary]');
  const statusTextEl = root.querySelector('[data-sim-status-text]');

  // WAI-ARIA Tabs: sekme id'leri ve aria-controls'un gerçekten var olan tabpanel'i göstermesi
  const controlsId = tabs[0]?.getAttribute('aria-controls');
  const panelEl = (controlsId && document.getElementById(controlsId)) || root.querySelector('[role="tabpanel"]');
  if (panelEl && !panelEl.id) {
    panelEl.id = 'sim-panel';
  }
  for (const tab of tabs) {
    const key = tab.getAttribute('data-sim-tab');
    if (!tab.id && key) {
      tab.id = `sim-tab-${key}`;
    }
    if (panelEl) {
      tab.setAttribute('aria-controls', panelEl.id);
    }
  }

  let activeKey =
    tabs.find((tab) => tab.classList.contains('is-active') || tab.getAttribute('aria-selected') === 'true')
      ?.getAttribute('data-sim-tab') || 'salonzeka';

  if (!getScenario(activeKey)) {
    activeKey = 'salonzeka';
  }

  // Roving tabindex başlangıcı: yalnız aktif sekme Tab sırasında
  for (const tab of tabs) {
    const isSelected = tab.getAttribute('data-sim-tab') === activeKey;
    tab.setAttribute('tabindex', isSelected ? '0' : '-1');
    if (isSelected && panelEl && tab.id) {
      panelEl.setAttribute('aria-labelledby', tab.id);
    }
  }

  let timers = [];
  let runToken = 0;
  let isInView = typeof window.IntersectionObserver !== 'function';

  const clearTimers = () => {
    for (const id of timers) {
      window.clearTimeout(id);
    }
    timers = [];
  };

  // Teardown, dinleyici/zamanlayıcı kaydı başlamadan atanır: init ortasında istisna olsa da
  // o ana kadar kaydedilenler bir sonraki initSimulator çağrısında temizlenir.
  teardownPrevious = () => {
    runToken += 1;
    clearTimers();
    for (const cleanup of cleanups.splice(0)) {
      cleanup();
    }
  };

  const setActiveTimelineStep = (stepIndex) => {
    stepElements.forEach((el, elIdx) => {
      const isCurrent = elIdx === stepIndex;
      const isPast = elIdx < stepIndex;
      el.classList.toggle('is-active', isCurrent);
      el.classList.toggle('is-done', isPast);
      if (isCurrent) {
        el.setAttribute('aria-current', 'step');
      } else {
        el.removeAttribute('aria-current');
      }
    });
  };

  const renderScenarioBase = (scenarioKey) => {
    const scenario = getScenario(scenarioKey);
    if (!scenario) {
      return;
    }

    for (const tab of tabs) {
      const isSelected = tab.getAttribute('data-sim-tab') === scenarioKey;
      tab.classList.toggle('is-active', isSelected);
      tab.setAttribute('aria-selected', String(isSelected));
      tab.setAttribute('tabindex', isSelected ? '0' : '-1');
      if (isSelected && panelEl && tab.id) {
        panelEl.setAttribute('aria-labelledby', tab.id);
      }
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
    const scenario = getScenario(scenarioKey);
    const buildStage = getStageBuilder(scenarioKey);
    if (!scenario || !buildStage || !leftEl || !rightEl) {
      return;
    }

    clearTimers();
    runToken += 1;
    const currentToken = runToken;

    // Senkron kurulum hatası yarım zamanlayıcı/durum bırakmasın: kuyruğu boşalt, token'ı geçersiz kıl.
    const abortRun = (phase, error) => {
      console.error(`[simulator] "${scenarioKey}" ${phase} kurulamadı:`, error);
      runToken += 1;
      clearTimers();
    };

    try {
      renderScenarioBase(scenarioKey);
    } catch (error) {
      abortRun('temel görünüm', error);
      return;
    }

    const paused = isMotionPaused();
    if (statusTextEl) {
      statusTextEl.textContent = paused ? 'DURAKLATILDI · TAM GÖRÜNÜM' : 'CANLI OTONOM AKIŞ';
    }

    if (paused) {
      try {
        buildStage(leftEl, rightEl, true, () => {});
        setActiveTimelineStep(scenario.steps.length - 1);
      } catch (error) {
        abortRun('statik sahne', error);
      }
      return;
    }

    setActiveTimelineStep(0);

    const schedule = (stepIdx, delayMs, fn) => {
      const id = window.setTimeout(() => {
        if (currentToken !== runToken || isMotionPaused()) {
          return;
        }
        try {
          setActiveTimelineStep(stepIdx);
          fn();
        } catch (error) {
          // Tek bir adımın hatası zaman çizelgesinin kalanını bozmasın
          console.error(`[simulator] "${scenarioKey}" adım ${stepIdx} çalıştırılamadı:`, error);
        }
      }, delayMs);
      timers.push(id);
    };

    let lastStepAt;
    try {
      lastStepAt = buildStage(leftEl, rightEl, false, schedule);
    } catch (error) {
      abortRun('canlı sahne', error);
      return;
    }
    // Sayı döndürmeyen builder anında tekrar eden döngü yaratmasın.
    if (!Number.isFinite(lastStepAt) || lastStepAt < 0) {
      lastStepAt = DEFAULT_LAST_STEP_AT_MS;
    }

    const loopId = window.setTimeout(() => {
      if (currentToken !== runToken || !isInView || isMotionPaused()) {
        return;
      }
      runSimulation(activeKey);
    }, lastStepAt + LOOP_RESTART_DELAY_MS);
    timers.push(loopId);
  };

  const activateTab = (tab) => {
    const nextKey = tab.getAttribute('data-sim-tab');
    if (!nextKey || !getScenario(nextKey)) {
      return;
    }
    activeKey = nextKey;
    runSimulation(activeKey);
  };

  tabs.forEach((tab, index) => {
    listen(tab, 'click', () => activateTab(tab));
    listen(tab, 'keydown', (event) => {
      let targetIndex = null;
      switch (event.key) {
        case 'ArrowRight':
          targetIndex = (index + 1) % tabs.length;
          break;
        case 'ArrowLeft':
          targetIndex = (index - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          targetIndex = 0;
          break;
        case 'End':
          targetIndex = tabs.length - 1;
          break;
        default:
          return;
      }
      event.preventDefault();
      const target = tabs[targetIndex];
      if (target) {
        target.focus();
        activateTab(target);
      }
    });
  });

  if (replayButton) {
    listen(replayButton, 'click', () => {
      runSimulation(activeKey);
    });
  }

  // Ekran dışındayken yeniden kurulum yapılmaz; görünüme girişte IntersectionObserver kurar.
  listen(window, 'ma:motion-change', () => {
    if (isInView) {
      runSimulation(activeKey);
    }
  });

  if (typeof window.matchMedia === 'function') {
    const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedChange = () => {
      if (isInView) {
        runSimulation(activeKey);
      }
    };
    if (typeof reducedQuery.addEventListener === 'function') {
      listen(reducedQuery, 'change', handleReducedChange);
    } else if (typeof reducedQuery.addListener === 'function') {
      // Eski Safari (<14) için MediaQueryList fallback'i
      reducedQuery.addListener(handleReducedChange);
      cleanups.push(() => reducedQuery.removeListener(handleReducedChange));
    }
  }

  if (typeof window.IntersectionObserver === 'function') {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target !== root) {
            continue;
          }
          if (entry.isIntersecting) {
            isInView = true;
            runSimulation(activeKey);
          } else {
            isInView = false;
            clearTimers();
          }
        }
      },
      { threshold: 0.18 },
    );
    observer.observe(root);
    cleanups.push(() => observer.disconnect());
  } else {
    runSimulation(activeKey);
  }

}
