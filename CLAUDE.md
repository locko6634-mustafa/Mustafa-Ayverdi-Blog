# Mustafa Ayverdi Blog — Proje Bağlamı

## Kimlik, Dil ve Canlı Ürünler
- **Amaç:** Kartvizitten gelen son müşterilere (işletme, marka ve mekân sahiplerine) yönelik görsel anlatımlı kişisel tanıtım ve ürün vitrini.
- **Dil ve Ton:** CV, okul veya teknik geliştirici jargonu (`FIG.`, `01 /`, veritabanı/altyapı/kod terimleri) kullanılmaz; doğrudan **"İşletmenize ne kazandırır?"** odağında sade Türkçe yazılır.
- **Vitrindeki 3 Canlı Ürün:**
  - **SalonZeka:** `https://randevu.n8n-mustafa.me/` — 7/24 WhatsApp randevu asistanı ve yönetim paneli
  - **VitrinOS:** `https://vitrinos.n8n-mustafa.me/` — Markaya özel hızlı görsel üretim stüdyosu
  - **Yeşil Nesil The Garden:** `https://yesilnesilthegarden.com/` — Prestijli kır bahçesi web vitrini ve keşif hattı

## Tasarım Sistemi ve Modüller
- **CSS (`@layer`):** `css/{tokens,base,components,sections,motion,main}.css`
- **JS (ES Modules):** `js/{main,nav,reveal,accordion,simulator,motion-toggle,reading-bar}.js`
- **Renk Tokenları (`css/tokens.css`):** `--paper: #f3f2e9`, `--white: #fbfbf5`, `--ink: #1d352f`, `--forest: #24483d`, `--muted: #63716a`, `--line: #ced3c7`, `--lime: #d1ee8b`, `--clay: #a74c31`.
- **Tipografi & Hareket:** `Manrope` (ana arayüz) + `Georgia` italik vurgu (`em`) + `ui-monospace` etiketler; `--ease: cubic-bezier(.22, .72, .2, 1)`, `prefers-reduced-motion` ve `Hareketi Duraklat` (`[data-motion-toggle]`, `localStorage: "ma-motion"`).

## Sayfa ve Klasör Haritası
- `index.html` — Ana vitrin (Hero, 3'lü fayda bandı, örnek iş kartları, `#simulator` canlı deneyim sahnesi, Çözümler & S.S.S. akordiyonları, Tanışalım, Rehberler, CTA, Footer).
- `projeler/{salonzeka,vitrinos,yesil-nesil}.html` — 2'li görsel galerili (`.visual-showcase-grid`) ürün vitrin sayfaları.
- `notlar/{index,...}.html` — İşletme sahiplerine yönelik jargonsuz 4 rehber yazısı.
- `assets/img/` — Her proje için `*-real.png` ve `*-scene.jpg` (paylaşım görseli `og:image`/`twitter:image` olarak `*-scene.jpg`) + `favicon.svg` ("MA" monogramı, 9 sayfada `rel="icon"`).
- Diğer: `robots.txt`, `sitemap.xml`, `tests/smoke.test.mjs`.

## İletişim ve Doğrulama
- **İletişim:** `mailto:locko6634@gmail.com`, `https://github.com/locko6634-mustafa`, `https://wa.me/905510653051` (LinkedIn hesabı henüz yok).
- **Doğrulama Komutu:** `(for f in js/*.js; do node --check --input-type=module < "$f" || exit 1; done) && node --test tests/smoke.test.mjs` (`24/24` test geçmeli).
