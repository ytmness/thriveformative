# Graph Report - thriveformative-git  (2026-09-28)

## Corpus Check
- 278 files · ~909,446 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1099 nodes · 2695 edges · 78 communities (55 shown, 23 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `7402f19b`
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
- emailServer.ts
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
- PortalApp.tsx
- PosScreen.tsx
- migrate.mjs
- LeadBoard.tsx
- NewsArticleView.tsx
- GiantScrollCard.tsx

## God Nodes (most connected - your core abstractions)
1. `query()` - 114 edges
2. `toErrorResponse()` - 87 edges
3. `isSession()` - 77 edges
4. `requirePermission()` - 75 edges
5. `readJson()` - 59 edges
6. `writeAudit()` - 40 edges
7. `requestMeta()` - 31 edges
8. `api()` - 27 edges
9. `Locale` - 26 edges
10. `DomainError` - 21 edges

## Surprising Connections (you probably didn't know these)
- `POST()` --calls--> `query()`  [EXTRACTED]
  app/api/contact/route.ts → lib/db.ts
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

## Communities (78 total, 23 thin omitted)

### Community 0 - "CmsVisualPreview.tsx"
Cohesion: 0.10
Nodes (19): BookingSection(), CmsContext, CmsContextValue, CmsProviderFetched(), Props, useCmsContext(), CmsText(), Props (+11 more)

### Community 1 - "ThemeProvider.tsx"
Cohesion: 0.22
Nodes (8): CmsProvider(), DoctorNoticiasPage(), ThemeContext, ThemeId, THEMES, useTheme(), useThemes(), ThemeSwitcher()

### Community 2 - "ContactSection.tsx"
Cohesion: 0.22
Nodes (13): GET(), LOCALES, Locale, fetchCmsBundleFromDb(), parsePlanItems(), fetchCmsBundle(), mutateCms(), CmsArticle (+5 more)

### Community 3 - "Locale"
Cohesion: 0.05
Nodes (55): GET(), PATCH(), POST(), requireAdmin(), GET(), LOCALES, POST(), requireAdmin() (+47 more)

### Community 4 - "route.ts"
Cohesion: 0.09
Nodes (39): POST(), RATE_LIMIT, EmailKind, getTransport(), isValidEmail(), sendEmailPayload(), ASSETS, assetUrl() (+31 more)

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

### Community 12 - "emailServer.ts"
Cohesion: 0.29
Nodes (4): AdminDashboard(), AdminTab, ContactRequestRow, NAV_ITEMS

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
Nodes (88): GET(), POST(), POST(), GET(), KINDS, POST(), POST(), GET() (+80 more)

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
Cohesion: 0.18
Nodes (10): CmsPanel(), LOCALE_LABELS, Props, SubTab, ViewMode, mergeWithPendingDrafts(), useCmsAdmin(), ALL_CMS_TEXT_KEYS (+2 more)

### Community 46 - "page.tsx"
Cohesion: 0.24
Nodes (3): opacityMap, WaveDivider(), WaveDividerProps

### Community 48 - "Header.tsx"
Cohesion: 0.19
Nodes (11): Header(), HeaderPreviewConfig, HeaderProps, isNavLinkActive(), NavItem, normalizePath(), useLocationHash(), LanguageSwitcherProps (+3 more)

### Community 50 - "Thrive Formative"
Cohesion: 0.20
Nodes (9): Agenda (Pabau), Base de datos, Desarrollo, Embeds, Quién entra dónde, Requisitos, Scripts, Thrive Formative (+1 more)

### Community 51 - "ContactForm.tsx"
Cohesion: 0.28
Nodes (3): Props, BrandCtaButton(), Props

### Community 52 - "pabau.ts"
Cohesion: 0.18
Nodes (5): ContactLocationMap(), Props, BrandCtaLink(), Props, CLINIC_MAPS_QUERY

### Community 53 - "NewsSection.tsx"
Cohesion: 0.29
Nodes (4): metadata, playfair, poppins, locales

### Community 59 - "CmsProvider.tsx"
Cohesion: 0.06
Nodes (84): PATCH(), GET(), POST(), DELETE(), GET(), POST(), GET(), GET() (+76 more)

### Community 60 - "CmsVisualPreview.tsx"
Cohesion: 0.15
Nodes (14): CmsEditDrawer(), CmsEditTarget, Props, CmsPreviewDoctorSection(), CmsPreviewFaqSection(), SectionProps, ARTICLE_KEYS, CmsVisualPreview() (+6 more)

### Community 61 - "resolveDisplay.ts"
Cohesion: 0.44
Nodes (9): PreviewPlanRow, PreviewServiceRow, isEphemeralCmsId(), isFallbackId(), mergeBySortOrderSlot(), resolveArticlesForDisplay(), resolvePlansForDisplay(), resolveServicesForDisplay() (+1 more)

### Community 63 - "LanguageSwitcher.tsx"
Cohesion: 0.15
Nodes (8): DAYS, detailOf(), formFrom(), labelOf(), MAP, Row, SECTIONS, SettingsPanel()

### Community 64 - "CmsImageField.tsx"
Cohesion: 0.43
Nodes (5): Props, ALLOWED_TYPES, CmsImageFolder, uploadCmsImage(), validateCmsImageFile()

### Community 65 - "appointments.ts"
Cohesion: 0.10
Nodes (37): POST(), authorized(), POST(), createPool(), getPool(), TxQuery, withTx(), AppointmentInput (+29 more)

### Community 66 - "v1Handlers.ts"
Cohesion: 0.14
Nodes (25): POST(), appointmentsGET(), appointmentsPOST(), auth(), denied(), leadsGET(), leadsPOST(), patientsGET() (+17 more)

### Community 67 - "Modules.tsx"
Cohesion: 0.15
Nodes (7): CommsAdmin(), formatReport(), FormBuilder(), InvoiceCenter(), ProductAdmin(), ReportView(), statusLabel()

### Community 68 - "api"
Cohesion: 0.14
Nodes (8): api(), DashboardHome(), Stats, Lead, LeadBoard(), NAV, BookingWizard(), SlotGroup

### Community 69 - "PatientScreens.tsx"
Cohesion: 0.19
Nodes (5): EMPTY, Patient, PatientChart(), PatientList(), TABS

### Community 70 - "CalendarBoard.tsx"
Cohesion: 0.22
Nodes (5): Appt, CalendarBoard(), dayKey(), Opt, STATUSES

### Community 72 - "PosScreen.tsx"
Cohesion: 0.33
Nodes (4): Catalog, Item, loadStripe(), PosScreen()

### Community 73 - "migrate.mjs"
Cohesion: 0.47
Nodes (5): bootstrapAdmin(), __dirname, loadEnv(), main(), root

### Community 75 - "NewsArticleView.tsx"
Cohesion: 0.21
Nodes (9): Props, NewsArticleView(), Props, ITEM_KEYS, NewsSection(), NewsSectionAdminEditable, Props, buildFallbackArticles() (+1 more)

## Knowledge Gaps
- **254 isolated node(s):** `extends`, `next/core-web-vitals`, `poppins`, `playfair`, `metadata` (+249 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `isAdminAuthenticated` to `appointments.ts`, `v1Handlers.ts`, `Locale`, `ContactSection.tsx`, `CmsProvider.tsx`?**
  _High betweenness centrality (0.191) - this node is a cross-community bridge._
- **Why does `Locale` connect `ContactSection.tsx` to `CmsImageField.tsx`, `Locale`, `NewsArticleView.tsx`, `CmsPanel.tsx`, `CmsVisualPreview.tsx`, `resolveDisplay.ts`?**
  _High betweenness centrality (0.083) - this node is a cross-community bridge._
- **Why does `api()` connect `api` to `Modules.tsx`, `PatientScreens.tsx`, `CalendarBoard.tsx`, `PortalApp.tsx`, `PosScreen.tsx`, `GiantScrollCard.tsx`, `LanguageSwitcher.tsx`?**
  _High betweenness centrality (0.055) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `poppins` to the rest of the system?**
  _254 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CmsVisualPreview.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10080645161290322 - nodes in this community are weakly interconnected._
- **Should `Locale` be split into smaller, more focused modules?**
  _Cohesion score 0.05378151260504202 - nodes in this community are weakly interconnected._
- **Should `route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08843537414965986 - nodes in this community are weakly interconnected._