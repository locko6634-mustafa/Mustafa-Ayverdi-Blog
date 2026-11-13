# Proje Talimatları (`gemini.md`)

> **Kural:** Projede anlamlı bir mimari, tasarım veya kural değişikliği yapıldığında bu dosyayı güncel tut.

---

## 1. Proje Kimliği ve Konumlandırma
- **Amaç:** Mustafa Ayverdi'nin kartvizitten gelen son müşterilere (işletme, marka ve mekân sahiplerine) yönelik, görsel anlatım ağırlıklı kişisel tanıtım ve ürün vitrini.
- **Dil ve Ton:** CV, okul veya teknik geliştirici jargonu (`FIG.`, `01 /`, veritabanı/altyapı/kod terimleri) kullanılmaz; doğrudan **"İşletmenize ne kazandırır?"** odağında sade Türkçe ile yazılır.
- **Vitrindeki 3 Canlı Ürün:**
  - **SalonZeka** (`https://randevu.n8n-mustafa.me/`) — 7/24 WhatsApp randevu asistanı ve yönetim paneli
  - **VitrinOS** (`https://vitrinos.n8n-mustafa.me/`) — Markaya özel hızlı görsel üretim stüdyosu
  - **Yeşil Nesil The Garden** (`https://yesilnesilthegarden.com/`) — Prestijli kır bahçesi web vitrini ve keşif hattı

---

## 2. Tasarım Sistemi ve Teknik Mimari
- **Yığın:** Sıfır harici bağımlılıklı Vanilla HTML5 + CSS `@layer` (`css/{tokens,base,components,sections,motion,main}.css`) + Vanilla ES Modules (`js/{main,nav,reveal,accordion,simulator,motion-toggle,reading-bar}.js`).
- **Renk Tokenları (`css/tokens.css`):**
  - `--paper: #f3f2e9` (ana zemin), `--white: #fbfbf5` (yüzey/kart), `--ink: #1d352f` (ana metin), `--forest: #24483d` (koyu bölüm), `--muted: #63716a` (ikincil metin), `--line: #ced3c7` (kenarlık), `--lime: #d1ee8b` (birincil CTA/vurgu), `--clay: #a74c31` (ikincil vurgu).
- **Tipografi & Hareket:** `Manrope` (ana arayüz) + `Georgia` italik vurgu (`em`) + `ui-monospace` etiketler; `--ease: cubic-bezier(.22, .72, .2, 1)`, `prefers-reduced-motion` ve `Hareketi Duraklat` (`[data-motion-toggle]`, `localStorage: "ma-motion"`) desteği.

---

## 3. Klasör Yapısı ve Sözleşmeler
- `index.html` — Ana tanıtım vitrini (Hero, 3'lü fayda bandı, görselli örnek iş kartları, `[data-simulator]`, Çözümler & S.S.S. akordiyonları, Tanışalım, Rehberler, CTA, Footer).
- `projeler/{salonzeka,vitrinos,yesil-nesil}.html` — 2'li görsel galerili (`.visual-showcase-grid`) ürün vitrin sayfaları.
- `notlar/{index,...}.html` — İşletme sahiplerine yönelik jargonsuz 4 rehber yazısı.
- `assets/img/` — Her proje için canlı ekran görüntüsü (`*-real.png`) ve gerçek arayüze sadık sahne görseli (`*-scene.jpg`).
- `robots.txt`, `sitemap.xml`, `tests/smoke.test.mjs`.

### Güvenlik ve İletişim Kuralları
- **İletişim:** `mailto:locko6634@gmail.com`, `https://github.com/locko6634-mustafa`, `https://wa.me/905510653051` (LinkedIn hesabı henüz yok).
- **Kod Hijyeni:** `innerHTML` yasak (`textContent` kullanılır), inline `<script>` / `style=` yok, tüm `target="_blank"` bağlantılarda `rel="noopener noreferrer"` zorunlu.
- **Doğrulama Komutu:** Değişiklik sonrası `node --check js/*.js && node --test tests/smoke.test.mjs` (`8/8` test geçmeli).
