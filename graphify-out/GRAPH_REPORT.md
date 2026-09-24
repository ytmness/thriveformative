# Graph Report - thriveformative-git  (2026-09-23)

## Corpus Check
- 172 files · ~872,749 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 682 nodes · 1204 edges · 59 communities (39 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d56e7fa9`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CmsVisualPreview.tsx
- ThemeProvider.tsx
- page.tsx
- useStoreAdmin.ts
- route.ts
- devDependencies
- dependencies
- Logo3DCanvas.tsx
- compilerOptions
- bookingAvailability.ts
- createClient
- import-healthvape-store.mjs
- emailServer.ts
- copy-standalone-assets.js
- emailTemplate.ts
- ShapeScaleStorySection.tsx
- crop-recurso6.js
- ConvergenceScroll.tsx
- PremiumScrollScene.tsx
- apply-migration-016.mjs
- apply-nginx-no-cache-errors.sh
- r3f-react19.d.ts
- LoadingScreen.tsx
- next.config.js
- dev-clean.js
- .eslintrc.json
- test-rpc.mjs
- lateralAnimation.ts
- apply-nginx-proxy-only.sh
- deploy-next-pm2.sh
- deploy-ubuntu.sh
- fix-production-static.sh
- git-sync-main.sh
- nginx-audit.sh
- update-site.sh
- verify-standalone-assets.sh
- wait-for-app-health.sh
- WHATSAPP_PHONE_E164
- AdminDashboard.tsx
- page.tsx
- page.tsx
- Header.tsx
- Agenda (Pabau)
- ContactForm.tsx
- HeroQuestionsRotator.tsx
- PABAU_WIDGET_URL
- server.ts
- bookingConfig.ts
- setup-thrive-db.sh

## God Nodes (most connected - your core abstractions)
1. `Locale` - 26 edges
2. `isAdminAuthenticated()` - 23 edges
3. `compilerOptions` - 16 edges
4. `Header()` - 15 edges
5. `query()` - 14 edges
6. `POST()` - 11 edges
7. `POST()` - 10 edges
8. `sendEmailPayload()` - 10 edges
9. `jsonError()` - 10 edges
10. `StoreProduct` - 10 edges

## Surprising Connections (you probably didn't know these)
- `StorePanel()` --calls--> `useStoreAdmin()`  [EXTRACTED]
  components/admin/StorePanel.tsx → hooks/useStoreAdmin.ts
- `AdminPage()` --calls--> `isAdminAuthenticated()`  [EXTRACTED]
  app/[locale]/admin/page.tsx → lib/adminSession.ts
- `ProductDetailContent()` --calls--> `fetchStoreProductByRef()`  [EXTRACTED]
  app/[locale]/tienda/[ref]/page.tsx → lib/store/fetch.ts
- `GET()` --calls--> `isAdminAuthenticated()`  [EXTRACTED]
  app/api/admin/login/route.ts → lib/adminSession.ts
- `GET()` --calls--> `isAdminAuthenticated()`  [EXTRACTED]
  app/api/admin/me/route.ts → lib/adminSession.ts

## Import Cycles
- 2-file cycle: `lib/cms/mergePreviewLists.ts -> lib/cms/resolveDisplay.ts -> lib/cms/mergePreviewLists.ts`

## Communities (59 total, 20 thin omitted)

### Community 0 - "CmsVisualPreview.tsx"
Cohesion: 0.05
Nodes (61): Props, CmsEditDrawer(), CmsEditTarget, Props, CmsPreviewDoctorSection(), CmsPreviewFaqSection(), SectionProps, ARTICLE_KEYS (+53 more)

### Community 1 - "ThemeProvider.tsx"
Cohesion: 0.26
Nodes (6): ThemeContext, ThemeId, THEMES, useTheme(), useThemes(), ThemeSwitcher()

### Community 2 - "page.tsx"
Cohesion: 0.38
Nodes (3): ContactLocationMap(), Props, CLINIC_MAPS_QUERY

### Community 3 - "useStoreAdmin.ts"
Cohesion: 0.09
Nodes (39): GET(), LOCALES, POST(), requireAdmin(), GET(), LOCALES, GET(), LOCALES (+31 more)

### Community 4 - "route.ts"
Cohesion: 0.11
Nodes (34): POST(), RATE_LIMIT, POST(), RATE_LIMIT, log, LogLevel, redact(), shouldLog() (+26 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (37): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+29 more)

### Community 6 - "dependencies"
Cohesion: 0.06
Nodes (33): framer-motion, gsap, lucide-react, next, next-intl, nodemailer, dependencies, framer-motion (+25 more)

### Community 7 - "Logo3DCanvas.tsx"
Cohesion: 0.08
Nodes (12): metadata, playfair, poppins, ComingSoonLogo3D(), ComingSoonScreen(), Logo3DCanvas(), Logo3DCanvasProps, Logo3DErrorBoundary (+4 more)

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, supabase/functions, **/*.ts (+19 more)

### Community 9 - "bookingAvailability.ts"
Cohesion: 0.17
Nodes (16): BlockedDateRow, BookingSettings, dateKeyFromDate(), dateKeyFromParts(), DAY_LABELS_ES, DEFAULT_SETTINGS, formatMinutes(), generateTimeSlotsForDay() (+8 more)

### Community 10 - "createClient"
Cohesion: 0.43
Nodes (4): routing, config, handleI18nRouting, middleware()

### Community 11 - "import-healthvape-store.mjs"
Cohesion: 0.18
Nodes (16): __dirname, fetchAllProducts(), fetchPage(), importToSupabase(), isDryRun, loadEnvFile(), LOCALES, main() (+8 more)

### Community 12 - "emailServer.ts"
Cohesion: 0.34
Nodes (12): EmailKind, getTransport(), isValidEmail(), sendEmailPayload(), ASSETS, assetUrl(), buildThriveEmailHtml(), emailParagraph() (+4 more)

### Community 13 - "copy-standalone-assets.js"
Cohesion: 0.15
Nodes (11): fs, missing, path, publicDest, publicSrc, REQUIRED_IN_PUBLIC, root, serverJs (+3 more)

### Community 14 - "emailTemplate.ts"
Cohesion: 0.30
Nodes (10): RESEND_API_KEY, WebhookPayload, ASSETS, assetUrl(), buildThriveEmailHtml(), emailParagraph(), emailSignOff(), escapeHtml() (+2 more)

### Community 15 - "ShapeScaleStorySection.tsx"
Cohesion: 0.25
Nodes (4): STEP_IDS, STEP_IMAGES, StepContent, StepId

### Community 16 - "crop-recurso6.js"
Cohesion: 0.29
Nodes (6): dir, fs, inputPath, path, sharp, tempPath

### Community 20 - "apply-nginx-no-cache-errors.sh"
Cohesion: 0.80
Nodes (4): apply-nginx-no-cache-errors.sh script, write_http_redirect_server(), write_https_server(), write_proxy_location()

### Community 21 - "r3f-react19.d.ts"
Cohesion: 0.40
Nodes (4): IntrinsicElements, JSX, react, react/jsx-runtime

### Community 22 - "LoadingScreen.tsx"
Cohesion: 0.11
Nodes (27): GET(), PATCH(), GET(), POST(), POST(), GET(), GET(), LOCALES (+19 more)

### Community 23 - "next.config.js"
Cohesion: 0.50
Nodes (3): nextConfig, SUPABASE_HOST, withNextIntl

### Community 24 - "dev-clean.js"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 45 - "AdminDashboard.tsx"
Cohesion: 0.09
Nodes (24): AdminDashboard(), AdminTab, ContactRequestRow, NAV_ITEMS, Props, CmsPanel(), LOCALE_LABELS, Props (+16 more)

### Community 46 - "page.tsx"
Cohesion: 0.18
Nodes (3): opacityMap, WaveDivider(), WaveDividerProps

### Community 47 - "page.tsx"
Cohesion: 0.16
Nodes (4): CmsProvider(), DoctorNoticiasPage(), LoadingScreenLogo3D, ScrollProgress()

### Community 48 - "Header.tsx"
Cohesion: 0.18
Nodes (11): Header(), HeaderPreviewConfig, HeaderProps, isNavLinkActive(), NavItem, normalizePath(), useLocationHash(), LanguageSwitcherProps (+3 more)

### Community 50 - "Agenda (Pabau)"
Cohesion: 0.20
Nodes (9): Agenda (Pabau), Base de datos, Desarrollo, Embeds, Quién entra dónde, Requisitos, Scripts, Thrive Formative (+1 more)

### Community 51 - "ContactForm.tsx"
Cohesion: 0.28
Nodes (3): Props, BrandCtaButton(), Props

### Community 53 - "PABAU_WIDGET_URL"
Cohesion: 0.29
Nodes (3): PABAU_LOCATIONS, PabauBookingUrlOptions, PabauLocation

## Knowledge Gaps
- **215 isolated node(s):** `extends`, `next/core-web-vitals`, `poppins`, `playfair`, `metadata` (+210 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Locale` connect `useStoreAdmin.ts` to `CmsVisualPreview.tsx`, `Logo3DCanvas.tsx`, `AdminDashboard.tsx`, `HeroQuestionsRotator.tsx`, `LoadingScreen.tsx`?**
  _High betweenness centrality (0.053) - this node is a cross-community bridge._
- **Why does `isAdminAuthenticated()` connect `LoadingScreen.tsx` to `Header.tsx`, `useStoreAdmin.ts`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `Header()` connect `Header.tsx` to `CmsVisualPreview.tsx`, `ThemeProvider.tsx`, `page.tsx`, `page.tsx`, `HeroQuestionsRotator.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `poppins` to the rest of the system?**
  _215 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CmsVisualPreview.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05016797312430011 - nodes in this community are weakly interconnected._
- **Should `useStoreAdmin.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08959899749373433 - nodes in this community are weakly interconnected._
- **Should `route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10570824524312897 - nodes in this community are weakly interconnected._