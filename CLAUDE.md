# Mustafa Ayverdi Blog — Proje Bağlamı

## Kimlik, Dil ve Canlı Ürünler
- **Amaç:** Kartvizitten gelen son müşterilere (işletme, marka ve mekân sahiplerine) yönelik görsel anlatımlı kişisel tanıtım ve ürün vitrini.
- **Dil ve Ton:** CV, okul veya teknik geliştirici jargonu (`FIG.`, `01 /`, veritabanı/altyapı/kod terimleri) kullanılmaz; doğrudan **"İşletmenize ne kazandırır?"** odağında sade Türkçe yazılır.
- **Vitrindeki 3 Canlı Ürün:**
  - **SalonZeka:** `https://randevu.n8n-mustafa.me/` — 7/24 WhatsApp randevu asistanı ve yönetim paneli
  - **VitrinOS:** `https://vitrinos.n8n-mustafa.me/` — Markaya özel hızlı görsel üretim stüdyosu
  - **Yeşil Nesil The Garden:** `https://yesilnesilthegarden.com/` — Prestijli kır bahçesi web vitrini ve keşif hattı

## Tasarım Sistemi ve Modüller
- **CSS (`@layer`):** `css/{tokens,base,components,sections,motion,main}.css` + yalnız `/kart` için `css/kart.css` (`@layer sections` içine yazar, sabit renk yok, tokenları kullanır)
- **JS (ES Modules):** `js/{main,nav,reveal,accordion,simulator,motion-toggle,reading-bar}.js`
- **Renk Tokenları (`css/tokens.css`):** `--paper: #f3f2e9`, `--white: #fbfbf5`, `--ink: #1d352f`, `--forest: #24483d`, `--muted: #63716a`, `--line: #ced3c7`, `--lime: #d1ee8b`, `--clay: #a74c31`.
- **Tipografi & Hareket:** `Manrope` (ana arayüz) + `Georgia` italik vurgu (`em`) + `ui-monospace` etiketler; `--ease: cubic-bezier(.22, .72, .2, 1)`, `prefers-reduced-motion` ve `Hareketi Duraklat` (`[data-motion-toggle]`, `localStorage: "ma-motion"`).

## Sayfa ve Klasör Haritası
- `index.html` — Ana vitrin (Hero, 3'lü fayda bandı, örnek iş kartları, `#simulator` canlı deneyim sahnesi, Çözümler & S.S.S. akordiyonları, Tanışalım, Rehberler, CTA, Footer).
- `projeler/{salonzeka,vitrinos,yesil-nesil}.html` — 2'li görsel galerili (`.visual-showcase-grid`) ürün vitrin sayfaları.
- `kart.html` — `/kart` kartvizit QR sayfası; Mustafa'nın onayladığı maket düzeni ve 2026-11-20 ek kararları (mobil öncelikli tek sütun, max 480px): ortalı büyük editoryal yazı logosu h1 olarak ("Mustafa" + `<em>Ayverdi</em>` limon şerit; monogram/rozet/fotoğraf yok, isim bir kez) ve altında italik serif tanıtım cümlesi (şehir satırı yok); hap butonlar inline SVG ikonlu (hepsi `aria-hidden`, `.kart-icon`): koyu yeşil "WhatsApp'tan yazın" (resmi WhatsApp glifi, `currentColor`; `wa.me/905510653051?text=` kodlanmış "Merhaba, kartvizitinizden ulaşıyorum.") ve çerçeveli "Rehbere kaydet" (kişi ekle ikonu; `assets/mustafa-ayverdi.vcf`, `download`, vCard 3.0, CRLF); SalonZeka ve VitrinOS kartları aynı yapıda (başlık satırı → orijinal site ekran görüntüsü `*-real.webp`, kırpmasız → açıklama → yan yana iki buton; 370px altında alt alta): SalonZeka kalın `--forest` çerçeve + "14 gün ücretsiz" rozeti, "Demoyu dene" (oynat) ve "Nasıl çalışır" (bilgi) ikisi de `projeler/salonzeka`ya gider (randevu demosuna bağlantı yok); VitrinOS ince çerçeve, rozetsiz, "Demoyu dene" (oynat ikonu, SalonZeka ile aynı) yeni sekmede `vitrinos.n8n-mustafa.me`, "Nasıl çalışır" (bilgi) `projeler/vitrinos`; Yeşil Nesil kartı (`--slate-surface` bölüm, kartın kendisi bağlantı değil; `yesilnesil-real.webp`, lime "Ziyaret et" (dış bağlantı ikonu) yeni sekmede `yesilnesilthegarden.com`, beyaz dolgulu `--forest` kenarlı "İşi inceleyin" (bilgi) `projeler/yesil-nesil`; alt satır `--forest`, slate zeminde 8,0:1 kontrast); üst çizgili liste (Yazılarım, GitHub, `iletisim@mustafaayverdi.dev`) ve "mustafaayverdi.dev · 2026" altbilgi. `og:image` ve `twitter:*` (index.html kalıbı, og ile aynı değerler) = `assets/img/salonzeka-real.jpg` (1024×640, `salonzeka-real.webp`'den üretildi; og testi JPEG boyutu okur). Kökte `kart.html` seçildi: nginx `try_files $uri.html` ve yerel sunucu `/kart`'ı buna çözer, göreli `./` yollar `/kart?k=kart` ile de çalışır. `noindex, follow`, canonical yok, sitemap'te yok (QR iniş sayfası; aramada ana sayfa öne çıksın). Deploy ve `sunucu_baslat.sh` beyaz listesinde; deploy sağlık kontrolü `/kart` ve `.vcf` için 200 bekler.
- `404.html` — Kökte özel "sayfa bulunamadı" sayfası (`noindex`, kök-mutlak yollar, sitemap'te yok).
- `notlar/{index,...}.html` — İşletme sahiplerine yönelik jargonsuz 4 rehber yazısı.
- `assets/img/` — Her proje için `*-real.webp` ve `*-scene.webp` (sayfa görselleri) + paylaşım önizlemesi için küçültülmüş `*-scene.jpg` (`og:image`/`twitter:image`) + `salonzeka-real.jpg` (yalnız `/kart` og:image) + `favicon.svg` ("MA" monogramı, 9 sayfada `rel="icon"`).
- Diğer: `robots.txt`, `sitemap.xml`, `tests/smoke.test.mjs`.
- **Temiz URL:** İç bağlantılar, canonical/og:url ve sitemap `<loc>` adresleri `.html` uzantısız yazılır (`projeler/vitrinos`, index → `./`, `../`, `notlar/`); dosya adları `.html` kalır, sunucu nginx `try_files $uri $uri.html $uri/` ile çözer.

## İletişim ve Doğrulama
- **İletişim:** `mailto:locko6634@gmail.com`, `https://github.com/locko6634-mustafa`, `https://wa.me/905510653051` (LinkedIn hesabı henüz yok). İstisna: `/kart` sayfası ve vCard'da e-posta olarak Mustafa'nın seçtiği `iletisim@mustafaayverdi.dev` kullanılır (adres henüz açık değil).
- **Doğrulama Komutu:** `(for f in js/*.js; do node --check --input-type=module < "$f" || exit 1; done) && node --test tests/smoke.test.mjs` (`50/50` test geçmeli; "Kartvizit Sayfası (/kart)" grubu 12 test).
