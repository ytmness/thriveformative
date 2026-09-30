# Graph Report - thriveformative-git  (2026-09-30)

## Corpus Check
- 291 files · ~928,944 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1231 nodes · 3044 edges · 82 communities (62 shown, 20 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ca5f8889`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- CmsVisualPreview.tsx
- ThemeProvider.tsx
- ContactSection.tsx
- Locale
- route.ts
- devDependencies
- dependencies
- Logo3DCanvas.tsx
- compilerOptions
- bookingAvailability.ts
- middleware.ts
- import-healthvape-store.mjs
- copy-standalone-assets.js
- emailTemplate.ts
- page.tsx
- crop-recurso6.js
- ConvergenceScroll.tsx
- PremiumScrollScene.tsx
- apply-migration-016.mjs
- apply-nginx-no-cache-errors.sh
- r3f-react19.d.ts
- isAdminAuthenticated
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
- ecosystem.config.cjs
- WHATSAPP_PHONE_E164
- CmsPanel.tsx
- page.tsx
- Header.tsx
- Thrive Formative
- ContactForm.tsx
- pabau.ts
- NewsSection.tsx
- server.ts
- bookingConfig.ts
- setup-thrive-db.sh
- CmsProvider.tsx
- CmsVisualPreview.tsx
- resolveDisplay.ts
- LanguageSwitcher.tsx
- CmsImageField.tsx
- appointments.ts
- v1Handlers.ts
- Modules.tsx
- api
- PatientScreens.tsx
- CalendarBoard.tsx
- migrate.mjs
- session.ts
- NewsArticleView.tsx
- types.ts
- NewsArticleView.tsx
- seed-demo.mjs
- useStoreAdmin.ts
- CatalogPanel.tsx
- page.tsx
- SalesOverview.tsx
- CmsProvider.tsx

## God Nodes (most connected - your core abstractions)
1. `query()` - 125 edges
2. `toErrorResponse()` - 90 edges
3. `isSession()` - 82 edges
4. `requirePermission()` - 76 edges
5. `readJson()` - 61 edges
6. `writeAudit()` - 44 edges
7. `api()` - 32 edges
8. `requestMeta()` - 31 edges
9. `Locale` - 26 edges
10. `decryptPhi()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `StorePanel()` --calls--> `useStoreAdmin()`  [EXTRACTED]
  components/admin/StorePanel.tsx → hooks/useStoreAdmin.ts
- `useCmsAdmin()` --indirect_call--> `saveService()`  [INFERRED]
  hooks/useCmsAdmin.ts → lib/domain/settings.ts
- `PanelLayout()` --calls--> `getStaffSession()`  [EXTRACTED]
  app/[locale]/admin/(panel)/layout.tsx → lib/auth/session.ts
- `ProductDetailContent()` --calls--> `fetchStoreProductByRef()`  [EXTRACTED]
  app/[locale]/tienda/[ref]/page.tsx → lib/store/fetch.ts
- `PATCH()` --calls--> `updateAppointment()`  [EXTRACTED]
  app/api/admin/appointments/[id]/route.ts → lib/domain/appointments.ts

## Import Cycles
- 2-file cycle: `lib/cms/mergePreviewLists.ts -> lib/cms/resolveDisplay.ts -> lib/cms/mergePreviewLists.ts`

## Communities (82 total, 20 thin omitted)

### Community 0 - "CmsVisualPreview.tsx"
Cohesion: 0.13
Nodes (21): asLang(), cardBox(), CreateOffer(), FOCUS, GuideId, GUIDES, ICONS, Lang (+13 more)

### Community 1 - "ThemeProvider.tsx"
Cohesion: 0.12
Nodes (9): api(), Catalog, Item, loadStripe(), Method, PosScreen(), ManageBooking(), Field (+1 more)

### Community 2 - "ContactSection.tsx"
Cohesion: 0.29
Nodes (6): ThemeContext, ThemeId, THEMES, useTheme(), useThemes(), ThemeSwitcher()

### Community 3 - "Locale"
Cohesion: 0.06
Nodes (51): GET(), PATCH(), POST(), requireAdmin(), GET(), LOCALES, POST(), requireAdmin() (+43 more)

### Community 4 - "route.ts"
Cohesion: 0.10
Nodes (36): POST(), RATE_LIMIT, deliverMail(), EmailKind, getTransport(), isValidEmail(), sendClinicEmail(), sendEmailPayload() (+28 more)

### Community 5 - "devDependencies"
Cohesion: 0.05
Nodes (40): autoprefixer, eslint, eslint-config-next, devDependencies, autoprefixer, eslint, eslint-config-next, postcss (+32 more)

### Community 6 - "dependencies"
Cohesion: 0.04
Nodes (49): bcryptjs, date-fns, date-fns-tz, @dnd-kit/core, @dnd-kit/utilities, exceljs, framer-motion, gsap (+41 more)

### Community 7 - "Logo3DCanvas.tsx"
Cohesion: 0.12
Nodes (6): Logo3DCanvas(), Logo3DCanvasProps, Logo3DErrorBoundary, Logo3DPreset, PRESETS, useAdaptiveDprCap()

### Community 8 - "compilerOptions"
Cohesion: 0.07
Nodes (27): dom, dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, supabase/functions, **/*.ts (+19 more)

### Community 9 - "bookingAvailability.ts"
Cohesion: 0.17
Nodes (16): BlockedDateRow, BookingSettings, dateKeyFromDate(), dateKeyFromParts(), DAY_LABELS_ES, DEFAULT_SETTINGS, formatMinutes(), generateTimeSlotsForDay() (+8 more)

### Community 10 - "middleware.ts"
Cohesion: 0.43
Nodes (4): routing, config, handleI18nRouting, middleware()

### Community 11 - "import-healthvape-store.mjs"
Cohesion: 0.18
Nodes (16): __dirname, fetchAllProducts(), fetchPage(), importToSupabase(), isDryRun, loadEnvFile(), LOCALES, main() (+8 more)

### Community 13 - "copy-standalone-assets.js"
Cohesion: 0.15
Nodes (11): fs, missing, path, publicDest, publicSrc, REQUIRED_IN_PUBLIC, root, serverJs (+3 more)

### Community 14 - "emailTemplate.ts"
Cohesion: 0.30
Nodes (10): RESEND_API_KEY, WebhookPayload, ASSETS, assetUrl(), buildThriveEmailHtml(), emailParagraph(), emailSignOff(), escapeHtml() (+2 more)

### Community 15 - "page.tsx"
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

### Community 22 - "isAdminAuthenticated"
Cohesion: 0.06
Nodes (92): GET(), KINDS, POST(), GET(), POST(), GET(), POST(), appointmentsGET() (+84 more)

### Community 23 - "next.config.js"
Cohesion: 0.50
Nodes (3): nextConfig, SUPABASE_HOST, withNextIntl

### Community 24 - "dev-clean.js"
Cohesion: 0.50
Nodes (3): fs, nextDir, path

### Community 41 - "ecosystem.config.cjs"
Cohesion: 0.40
Nodes (3): fs, path, rootEnv

### Community 45 - "CmsPanel.tsx"
Cohesion: 0.19
Nodes (10): CmsPanel(), LOCALE_LABELS, Props, SubTab, ViewMode, mergeWithPendingDrafts(), useCmsAdmin(), mutateCms() (+2 more)

### Community 46 - "page.tsx"
Cohesion: 0.16
Nodes (4): CmsProvider(), DoctorNoticiasPage(), LoadingScreenLogo3D, ScrollProgress()

### Community 48 - "Header.tsx"
Cohesion: 0.19
Nodes (12): Header(), HeaderPreviewConfig, HeaderProps, isNavLinkActive(), NavItem, normalizePath(), useLocationHash(), LanguageSwitcherProps (+4 more)

### Community 50 - "Thrive Formative"
Cohesion: 0.20
Nodes (9): Agenda (Pabau), Base de datos, Desarrollo, Embeds, Quién entra dónde, Requisitos, Scripts, Thrive Formative (+1 more)

### Community 51 - "ContactForm.tsx"
Cohesion: 0.32
Nodes (3): Props, BrandCtaButton(), Props

### Community 53 - "NewsSection.tsx"
Cohesion: 0.29
Nodes (4): metadata, playfair, poppins, locales

### Community 59 - "CmsProvider.tsx"
Cohesion: 0.07
Nodes (75): PATCH(), GET(), POST(), DELETE(), GET(), POST(), GET(), GET() (+67 more)

### Community 60 - "CmsVisualPreview.tsx"
Cohesion: 0.14
Nodes (12): GET(), LOCALES, CmsEditDrawer(), Props, CmsAdminApi, fetchCmsBundleFromDb(), parsePlanItems(), TPlans (+4 more)

### Community 61 - "resolveDisplay.ts"
Cohesion: 0.16
Nodes (22): CmsEditTarget, CmsPreviewDoctorSection(), CmsPreviewFaqSection(), SectionProps, ARTICLE_KEYS, CmsVisualPreview(), MESSAGES_BY_LOCALE, Props (+14 more)

### Community 63 - "LanguageSwitcher.tsx"
Cohesion: 0.12
Nodes (10): cellsOf(), DAYS, detailOf(), GROUPS, labelOf(), MAP, Row, SECTIONS (+2 more)

### Community 64 - "CmsImageField.tsx"
Cohesion: 0.38
Nodes (3): ContactLocationMap(), Props, CLINIC_MAPS_QUERY

### Community 65 - "appointments.ts"
Cohesion: 0.07
Nodes (64): authorized(), POST(), POST(), POST(), GET(), GET(), limited(), POST() (+56 more)

### Community 66 - "v1Handlers.ts"
Cohesion: 0.24
Nodes (7): BookingWizard(), Catalog, dateKey(), Group, pad(), PublicCalendar(), Slot

### Community 67 - "Modules.tsx"
Cohesion: 0.18
Nodes (6): CommsAdmin(), formatReport(), FormBuilder(), InvoiceCenter(), ReportView(), statusLabel()

### Community 68 - "api"
Cohesion: 0.09
Nodes (16): ClinicLocation, ClinicScopeProvider(), Ctx, Scope, ScopeBar(), useClinicScope(), DashboardHome(), money() (+8 more)

### Community 69 - "PatientScreens.tsx"
Cohesion: 0.11
Nodes (12): EMPTY, Patient, PatientChart(), PatientList(), TAB_ALIAS, TABS, Button(), CloseButton() (+4 more)

### Community 70 - "CalendarBoard.tsx"
Cohesion: 0.23
Nodes (9): Appt, CalendarBoard(), clinicWall(), localKey(), nextClinicSlot(), Opt, pad(), STATUSES (+1 more)

### Community 73 - "migrate.mjs"
Cohesion: 0.47
Nodes (5): bootstrapAdmin(), __dirname, loadEnv(), main(), root

### Community 74 - "session.ts"
Cohesion: 0.12
Nodes (28): GET(), POST(), POST(), PanelLayout(), hashPassword(), verifyPassword(), clearStaffSession(), createStaffSession() (+20 more)

### Community 75 - "NewsArticleView.tsx"
Cohesion: 0.14
Nodes (14): AnimatedSection(), AnimatedSectionProps, BookingSection(), useCmsContext(), CmsText(), Props, CardVariant, GiantScrollCard() (+6 more)

### Community 76 - "types.ts"
Cohesion: 0.43
Nodes (5): Props, ALLOWED_TYPES, CmsImageFolder, uploadCmsImage(), validateCmsImageFile()

### Community 77 - "NewsArticleView.tsx"
Cohesion: 0.22
Nodes (8): Props, NewsArticleView(), Props, ITEM_KEYS, NewsSectionAdminEditable, Props, CmsArticle, formatArticleBody()

### Community 79 - "seed-demo.mjs"
Cohesion: 0.19
Nodes (18): at(), clearDemo(), clinicDate(), contactHash(), context(), encryptPhi(), insertLead(), insertMessages() (+10 more)

### Community 82 - "useStoreAdmin.ts"
Cohesion: 0.25
Nodes (6): LOCALE_LABELS, ProductForm(), Props, slugifyInput(), StorePanel(), CMS_LOCALES

### Community 83 - "CatalogPanel.tsx"
Cohesion: 0.12
Nodes (8): SECTIONS, CatalogPanel(), cellsOf(), columnsOf(), hintOf(), Named, Row, SECTIONS

### Community 85 - "page.tsx"
Cohesion: 0.18
Nodes (3): opacityMap, WaveDivider(), WaveDividerProps

### Community 94 - "SalesOverview.tsx"
Cohesion: 0.28
Nodes (6): formatDay(), IncomeRow, money(), Sale, SalesOverview(), Summary

### Community 95 - "CmsProvider.tsx"
Cohesion: 0.29
Nodes (8): CmsContext, CmsContextValue, CmsProviderFetched(), Props, fetchCmsBundle(), CmsBundle, EMPTY, useCms()

## Knowledge Gaps
- **290 isolated node(s):** `extends`, `next/core-web-vitals`, `SECTIONS`, `poppins`, `playfair` (+285 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `isAdminAuthenticated` to `appointments.ts`, `Locale`, `session.ts`, `CmsProvider.tsx`, `CmsVisualPreview.tsx`?**
  _High betweenness centrality (0.178) - this node is a cross-community bridge._
- **Why does `api()` connect `ThemeProvider.tsx` to `v1Handlers.ts`, `Modules.tsx`, `api`, `PatientScreens.tsx`, `CalendarBoard.tsx`, `CatalogPanel.tsx`, `SalesOverview.tsx`, `LanguageSwitcher.tsx`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **Why does `Locale` connect `Locale` to `types.ts`, `CmsPanel.tsx`, `NewsArticleView.tsx`, `useStoreAdmin.ts`, `NewsSection.tsx`, `CmsVisualPreview.tsx`, `resolveDisplay.ts`, `CmsProvider.tsx`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `SECTIONS` to the rest of the system?**
  _290 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CmsVisualPreview.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Should `ThemeProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11857707509881422 - nodes in this community are weakly interconnected._
- **Should `Locale` be split into smaller, more focused modules?**
  _Cohesion score 0.06393606393606394 - nodes in this community are weakly interconnected._