# Proje Talimatları (`gemini.md`)

> **Kural:** Bu projeyi geliştirirken her adımda `gemini.md` dosyasını da güncel tut. Proje ilerledikçe mimari kararları, klasör yapısını, kullanılan teknolojileri, kuralları ve yapılan değişiklikleri ekleyerek bu dosyanın içini adım adım doldur.

---

## 1. Tasarım Referansı Özeti (`https://relaycase.netlify.app/`)

> **Kesin Kural:** Referans sitedeki hiçbir metin, marka veya görsel kullanılmayacaktır. Yalnızca **renk paleti, tipografi hiyerarşisi, sayfa düzeni (layout) ve animasyon/etkileşim mekanizmaları** Mustafa Ayverdi kişisel portfolyo/blog projesine uyarlanacaktır.

### 1.1. Renk Paleti (`:root` Tasarım Tokenları)
- `--paper: #f3f2e9` — Ana sıcak parşömen/kağıt arka planı
- `--white: #fbfbf5` — Fildişi kart, navbar ve açık panel yüzeyleri
- `--ink: #1d352f` — Koyu orman yeşili birincil metin ve koyu vurgu
- `--forest: #24483d` — Koyu bölüm zeminleri (ör. interaktif alan ve final CTA)
- `--muted: #63716a` — İkincil/açıklama metinleri
- `--line: #ced3c7` — 1px kenarlıklar, yatay ayırıcılar ve kesikli çizgiler
- `--lime: #d1ee8b` — Birincil dinamik vurgu (CTA butonları, aktif adım/sinyal)
- `--clay: #a74c31` — İkincil vurgu (terakota tonu teknik etiketler ve mikro bağlantılar)
- **Geometri & Gölgeler:** `--radius: 8px` (bileşenlerde `4px`–`16px` ve `9999px` pill), katmanlı yumuşak gölgeler (`0 5px 16px #1d352f20` ve izometrik derinlik gölgeleri).

### 1.2. Tipografi
- **Ana Arayüz & Başlık:** `Manrope Variable` (`woff2`, weight 200–800)
- **Editoryal Vurgu:** `Georgia, Times New Roman, serif` (italik — başlıkların seçili vurgu öbeklerinde kontrast için)
- **Teknik / Meta Etiketler:** `ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", monospace` (all-caps etiketler, `FIG. 001` vb. sayaçlar)
- **Ölçek:**
  - `H1`: `clamp(3.4rem, 5.6vw, 5.5rem)`, `line-height: 1.035`, `letter-spacing: -0.065em`, `font-weight: 500`
  - `H2`: `clamp(2.3rem, 3.6vw, 3.7rem)`, `line-height: 1.08`, `letter-spacing: -0.055em`, `text-wrap: balance`
  - Gövde: `16px–17px`, `line-height: 1.5–1.65` (`var(--muted)`)

### 1.3. Teknik Mimari, Layout ve Responsive Yapı
- **Stil & İkonlar:** Harici CSS framework'ü olmadan saf modern CSS (nesting + native CSS değişkenleri), inline optimize SVG (`stroke-width="1.5"`, `stroke="currentColor"`), hafif Vanilla JS (~8.9 KB referans).
- **Konteyner & Izgara:** `.wrap` konteyneri (~`1200px–1280px`), Flexbox ve CSS Grid tabanlı asimetrik 2 kolonlu masaüstü düzeni (mobilde tek sütuna yığılma).
- **Kırılımlar (Breakpoints):** `<= 370px`, `<= 640px`, `<= 700px`, `<= 900px`, `<= 1150px`, `>= 1600px` ve `prefers-reduced-motion` / `prefers-contrast` desteği.
- **Sayfa Akışı (Yukarıdan Aşağıya):**
  1. Sticky fildişi navbar (masaüstünde linkler + CTA; mobilde hamburger menü)
  2. Asimetrik Hero (sol: mono rozet, karma fontlu H1, açıklama, çift CTA; sağ: koyu yeşil 3D izometrik kart sahnesi)
  3. 3 kolonlu özet/bento bandı
  4. Pastel tonlu yatay Seçilmiş İşler / Proje kartları
  5. Numaralı Akordiyon hizmet/yetkinlik listesi (`01 / 02 / 03`)
  6. Koyu yeşil interaktif süreç/demo alanı + adım akışı
  7. Hakkımda (monogram + prensip listesi + teknik/konum etiketleri)
  8. Yatay satırlı Notlar / Blog yazıları listesi + terakota ok bağlantıları
  9. Numaralı SSS (FAQ) akordiyonu
  10. Koyu yeşil Final CTA kartı + dev tipografik imzalı Footer (`Pause motion` kontrolü dahil)

### 1.4. Animasyonlar ve Etkileşimler
- **Easing:** `--ease: cubic-bezier(.22, .72, .2, 1)`
- **CSS Keyframes:** `page-entry` (`translateY(12px)` + opacity), `orbit`, `current` (SVG `stroke-dashoffset` akışı), `signal`/`signal-down`, `module-breathe` & `stack-breathe` (3D `rotateX`/`translateZ` salınımı).
- **JS Etkileşimleri:** `IntersectionObserver` ile `[data-reveal]` scroll girişleri, akordiyon yükseklik geçişleri (`0.4s var(--ease)`), `[data-reading-progress]` okuma çubuğu, `localStorage` destekli `motion-toggle` (`Pause motion`) ve `prefers-reduced-motion: reduce` uyumu.

### 1.5. Alınan Ekran Görüntüleri (Görsel Referanslar)
- **Masaüstü (1440×900):**
  - Üst (Hero & Navbar): `/home/mustafaayverdi/.gemini/antigravity/brain/b2dae6ec-6b51-41c3-aee7-bd557134ffe8/browser_sandbox/screenshots/step_37_shot_1.png`
  - Orta (Kartlar): `/home/mustafaayverdi/.gemini/antigravity/brain/b2dae6ec-6b51-41c3-aee7-bd557134ffe8/browser_sandbox/screenshots/step_37_shot_2.png`
  - Alt (Simülatör, CTA & Footer): `/home/mustafaayverdi/.gemini/antigravity/brain/b2dae6ec-6b51-41c3-aee7-bd557134ffe8/browser_sandbox/screenshots/step_37_shot_3.png`
- **Mobil (390×844):**
  - Üst: `/home/mustafaayverdi/.gemini/antigravity/brain/b2dae6ec-6b51-41c3-aee7-bd557134ffe8/browser_sandbox/screenshots/step_39_shot_1.png`
  - Orta: `/home/mustafaayverdi/.gemini/antigravity/brain/b2dae6ec-6b51-41c3-aee7-bd557134ffe8/browser_sandbox/screenshots/step_39_shot_2.png`
  - Alt: `/home/mustafaayverdi/.gemini/antigravity/brain/b2dae6ec-6b51-41c3-aee7-bd557134ffe8/browser_sandbox/screenshots/step_39_shot_3.png`
  - Doğrulanan son görünüm: `/home/mustafaayverdi/.gemini/antigravity/brain/863523b6-b0f3-4041-8539-80e09abb87be/browser_evidence/b2dae6ec-6b51-41c3-aee7-bd557134ffe8/final_step_39.png`


---

## 2. Profil & Proje Keşif Özeti

### 2.1. Kimlik ve Konumlandırma
- **Kimlik:** Mustafa Ayverdi — Marmara Üniversitesi Yapay Zeka Operatörlüğü öğrencisi (DGS ile YBS lisans hedefi). Full-stack web mühendisliği, multi-tenant n8n orkestrasyonu, LLM ajanları ve PostgreSQL/Prisma veri mimarisi odaklı.
- **Mühendislik Çizgisi:** Ağır runtime/framework şişkinliği yerine sıfır-bloat native web standartları (Vanilla ES Modules, `@layer` CSS, sıkı CSP/HSTS) ve üretime hazır arka plan sistemleri.

### 2.2. 3 Ana Proje (Vaka Çalışmaları)
1. **SalonZeka / Randevu-Paneli (`https://randevu.n8n-mustafa.me/`):**
   - **Ürün:** KOBİ, güzellik merkezi ve klinikler için 7/24 WhatsApp/Chatwoot AI Randevu Asistanı + Yönetim Paneli.
   - **Paneller & Yığın:** `dashboard.html` (sürükle-bırak/resize takvim, müşteri CRM, ciro grafikleri, `terminology.js` sektörel dil motoru, Obsidian/Ivory çift tema), Node.js 22 / TypeScript, Prisma ORM, PostgreSQL 17.
   - **n8n Akışları (7):** `CHATBOT_BASE`, `MUSAIT_SAATLER`, `RANDEVU_KAYDET`, `RANDEVU_SORGULA`, `RANDEVU_GUNCELLE`, `RANDEVU_IPTAL`, `RANDEVU_HATIRLATICI`.
2. **VitrinOS (`https://vitrinos.n8n-mustafa.me/`):**
   - **Ürün:** E-ticaret markaları ve ajanslar için marka kurallarına sadık AI Kreatif Tasarım Atölyesi (SaaS).
   - **Paneller & Yığın:** `index.html`, Auth/TOTP MFA (`login`, `mfa-challenge`), `dashboard.html` (brief formu, canlı **SSE** üretim takibi, onay/revizyon havuzu), `admin.html` (çoklu marka prompt kuralları, job kuyruğu, `audit_logs`), Node.js Express + Worker, PostgreSQL 17, S3/MinIO, dry-run migration & Playwright taşma testleri.
   - **n8n Akışları (5):** `VitrinOS_BASE` ve 4 alt üretim akışı (brief zenginleştirme, difüzyon görsel üretimi, S3/MinIO kaydı, SSE bildirimi).
3. **Yeşil Nesil The Garden (`https://yesilnesilthegarden.com/`):**
   - **Ürün:** Polonezköy'de 4 tematik kır bahçesi (Hayal, Kale, Masal, Rüya) için yüksek dönüşümlü dijital vitrin ve keşif hunisi.
   - **Öne Çıkanlar:** Sıfır harici bağımlılık (Vanilla ES Modules + Modern CSS), Canvas ambient parçacıklar, 3D tilt, fotoğraf/kına paket karşılaştırması, form sürtünmesiz WhatsApp keşif hattı, Nginx üzerinde sıkı CSP/HSTS/COOP, `EventVenue` JSON-LD `@graph` ve görsel/video XML sitemap.

---

## 3. Özgün Sayfa Mimarisi ve Uygulama Planı (`icerik-mimari`)

### 3.1. Referanstan Uyarlama Kararları (Kopya Değil, Özgün Kurgu)
- **Korunanlar:** `--paper` / `--white` / `--ink` / `--forest` / `--lime` / `--clay` renk sistemi, `Manrope Variable` + `Georgia` italik vurgu + `ui-monospace` tipografi kontrastı, `--ease` geçiş eğrisi, `IntersectionObserver` (`[data-reveal]`), SVG `stroke-dashoffset` akışları, `[data-reading-progress]` ve `Hareketi Duraklat` (`motion-toggle`) erişilebilirlik kontrolü.
- **Çıkarılanlar:** Relaycase marka metinleri, şablon/lisans satış barı ("Buy $49 USD"), sahte metrik ve müşteri yorumları.
- **Dönüştürülenler:**
  - Hero sağındaki 3D izometrik sahne -> **3 Katmanlı Otonom Sistem Yığını** (Kanal/Arayüz -> n8n & LLM Orkestrasyon -> PostgreSQL/MinIO/Nginx Güvenlik).
  - Koyu `--forest` interaktif alan -> **3 Gerçek Proje Simülatörü** (`SalonZeka`, `VitrinOS`, `Yeşil Nesil` gerçek veri/akış adımları).
  - Footer dev imza -> `MUSTAFA AYVERDİ`.

### 3.2. Sayfa ve Klasör Yapısı (Sıfır-Bloat Native)
- **Ana Sayfa (`index.html`):** Sticky Navbar -> Asimetrik Hero -> 3'lü Mühendislik Prensipleri Bandı -> 3 Proje Vaka Kartı -> İnteraktif Sistem Simülatörü -> `01/02/03` Çalışma Alanları Akordiyonu -> Hakkımda -> Teknik Notlar Listesi -> `01–04` SSS -> Final CTA -> Footer.
- **Alt Sayfalar:** `/projeler/{salonzeka,vitrinos,yesil-nesil}.html` (vaka detayları) ve `/notlar/{index,...}.html` (teknik blog yazıları).
- **Stil & Modüller:** `css/{tokens,base,components,sections,motion}.css` (`@layer` + CSS Nesting) ve `js/{main,reveal,accordion,simulator,motion-toggle,reading-bar}.js` (Vanilla ES Modules).
- **Tamamlanması Gereken Gerçek Bilgiler:** İletişim e-posta adresi, GitHub ve LinkedIn profil URL'leri (WhatsApp hattı: `wa.me/905510653051`).
