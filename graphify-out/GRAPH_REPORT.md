# Graph Report - thriveformative-git  (2026-09-30)

## Corpus Check
- 295 files · ~932,204 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1252 nodes · 3094 edges · 94 communities (72 shown, 22 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0f6f801e`
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
- query
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
- db.ts
- Header.tsx
- Thrive Formative
- ContactForm.tsx
- pabau.ts
- NewsSection.tsx
- server.ts
- bookingConfig.ts
- http.ts
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
- catalog.ts
- db.ts
- migrate.mjs
- session.ts
- NewsArticleView.tsx
- types.ts
- NewsArticleView.tsx
- seed-demo.mjs
- resolveDisplay.ts
- query
- useStoreAdmin.ts
- CatalogPanel.tsx
- appointments.ts
- page.tsx
- portal.ts
- forms.ts
- FormStudio.tsx
- DoctorNoticiasPage.tsx
- SalesOverview.tsx

## God Nodes (most connected - your core abstractions)
1. `query()` - 126 edges
2. `toErrorResponse()` - 90 edges
3. `isSession()` - 82 edges
4. `requirePermission()` - 76 edges
5. `readJson()` - 61 edges
6. `writeAudit()` - 44 edges
7. `api()` - 34 edges
8. `requestMeta()` - 31 edges
9. `Locale` - 26 edges
10. `decryptPhi()` - 23 edges

## Surprising Connections (you probably didn't know these)
- `useCmsAdmin()` --indirect_call--> `saveService()`  [INFERRED]
  hooks/useCmsAdmin.ts → lib/domain/settings.ts
- `PanelLayout()` --calls--> `getStaffSession()`  [EXTRACTED]
  app/[locale]/admin/(panel)/layout.tsx → lib/auth/session.ts
- `ProductDetailContent()` --calls--> `fetchStoreProductByRef()`  [EXTRACTED]
  app/[locale]/tienda/[ref]/page.tsx → lib/store/fetch.ts
- `PATCH()` --calls--> `updateAppointment()`  [EXTRACTED]
  app/api/admin/appointments/[id]/route.ts → lib/domain/appointments.ts
- `GET()` --calls--> `listAppointments()`  [EXTRACTED]
  app/api/admin/appointments/route.ts → lib/domain/appointments.ts

## Import Cycles
- 2-file cycle: `lib/cms/mergePreviewLists.ts -> lib/cms/resolveDisplay.ts -> lib/cms/mergePreviewLists.ts`

## Communities (94 total, 22 thin omitted)

### Community 0 - "CmsVisualPreview.tsx"
Cohesion: 0.13
Nodes (21): asLang(), cardBox(), CreateOffer(), FOCUS, GuideId, GUIDES, ICONS, Lang (+13 more)

### Community 1 - "ThemeProvider.tsx"
Cohesion: 0.27
Nodes (7): Catalog, Item, loadStripe(), Method, noteOf(), pictureOf(), PosScreen()

### Community 2 - "ContactSection.tsx"
Cohesion: 0.26
Nodes (6): ThemeContext, ThemeId, THEMES, useTheme(), useThemes(), ThemeSwitcher()

### Community 3 - "Locale"
Cohesion: 0.06
Nodes (58): GET(), PATCH(), POST(), requireAdmin(), GET(), LOCALES, POST(), requireAdmin() (+50 more)

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

### Community 12 - "query"
Cohesion: 0.32
Nodes (9): Detail, InvoiceCenter(), InvoiceSheet(), money(), person(), place(), Row, statusLabel() (+1 more)

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
Cohesion: 0.21
Nodes (18): appointmentsGET(), appointmentsPOST(), auth(), denied(), leadsGET(), leadsPOST(), patientsGET(), patientsPOST() (+10 more)

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
Cohesion: 0.15
Nodes (5): LoadingScreenLogo3D, ScrollProgress(), opacityMap, WaveDivider(), WaveDividerProps

### Community 47 - "db.ts"
Cohesion: 0.24
Nodes (7): BookingWizard(), Catalog, dateKey(), Group, pad(), PublicCalendar(), Slot

### Community 48 - "Header.tsx"
Cohesion: 0.19
Nodes (12): Header(), HeaderPreviewConfig, HeaderProps, isNavLinkActive(), NavItem, normalizePath(), useLocationHash(), LanguageSwitcherProps (+4 more)

### Community 50 - "Thrive Formative"
Cohesion: 0.20
Nodes (9): Agenda (Pabau), Base de datos, Desarrollo, Embeds, Quién entra dónde, Requisitos, Scripts, Thrive Formative (+1 more)

### Community 51 - "ContactForm.tsx"
Cohesion: 0.28
Nodes (3): Props, BrandCtaButton(), Props

### Community 53 - "NewsSection.tsx"
Cohesion: 0.18
Nodes (8): metadata, playfair, poppins, CmsProviderFetched(), locales, fetchCmsBundle(), EMPTY, useCms()

### Community 56 - "http.ts"
Cohesion: 0.18
Nodes (22): decryptPhi(), encryptPhi(), shiftStart(), COPY, Kind, notifyAppointment(), enqueueForAppointment(), render() (+14 more)

### Community 59 - "CmsProvider.tsx"
Cohesion: 0.06
Nodes (89): PATCH(), GET(), POST(), DELETE(), GET(), POST(), GET(), GET() (+81 more)

### Community 60 - "CmsVisualPreview.tsx"
Cohesion: 0.43
Nodes (5): Props, ALLOWED_TYPES, CmsImageFolder, uploadCmsImage(), validateCmsImageFile()

### Community 61 - "resolveDisplay.ts"
Cohesion: 0.14
Nodes (15): CmsEditDrawer(), CmsEditTarget, Props, CmsPreviewDoctorSection(), CmsPreviewFaqSection(), SectionProps, ARTICLE_KEYS, CmsVisualPreview() (+7 more)

### Community 63 - "LanguageSwitcher.tsx"
Cohesion: 0.12
Nodes (10): cellsOf(), DAYS, detailOf(), GROUPS, labelOf(), MAP, Row, SECTIONS (+2 more)

### Community 64 - "CmsImageField.tsx"
Cohesion: 0.38
Nodes (3): ContactLocationMap(), Props, CLINIC_MAPS_QUERY

### Community 65 - "appointments.ts"
Cohesion: 0.19
Nodes (24): GET(), KINDS, POST(), writeAudit(), listPatientForms(), addSensitive(), createNote(), createPatient() (+16 more)

### Community 66 - "v1Handlers.ts"
Cohesion: 0.50
Nodes (3): CardVariant, GiantScrollCard(), GiantScrollCardProps

### Community 67 - "Modules.tsx"
Cohesion: 0.24
Nodes (5): CommsAdmin(), formatReport(), ReportView(), statusLabel(), EmptyState()

### Community 68 - "api"
Cohesion: 0.12
Nodes (12): ClinicLocation, ClinicScopeProvider(), countryCode(), Ctx, Scope, ScopeBar(), useClinicScope(), EMPTY (+4 more)

### Community 69 - "PatientScreens.tsx"
Cohesion: 0.11
Nodes (11): EMPTY, Patient, PatientChart(), PatientList(), TAB_ALIAS, TABS, Button(), CloseButton() (+3 more)

### Community 70 - "CalendarBoard.tsx"
Cohesion: 0.24
Nodes (8): Appt, CalendarBoard(), clinicWall(), localKey(), nextClinicSlot(), Opt, pad(), STATUSES

### Community 72 - "db.ts"
Cohesion: 0.17
Nodes (19): POST(), createPool(), getPool(), TxQuery, withTx(), addPayment(), applySideEffects(), catalogPrice() (+11 more)

### Community 73 - "migrate.mjs"
Cohesion: 0.47
Nodes (5): bootstrapAdmin(), __dirname, loadEnv(), main(), root

### Community 74 - "session.ts"
Cohesion: 0.20
Nodes (16): GET(), POST(), POST(), PanelLayout(), clearStaffSession(), createStaffSession(), getStaffSession(), hashToken() (+8 more)

### Community 75 - "NewsArticleView.tsx"
Cohesion: 0.12
Nodes (19): Props, AnimatedSection(), AnimatedSectionProps, BookingSection(), CmsContext, CmsContextValue, Props, useCmsContext() (+11 more)

### Community 76 - "types.ts"
Cohesion: 0.23
Nodes (9): GET(), LOCALES, fetchCmsBundleFromDb(), parsePlanItems(), TPlans, TServices, CmsPlan, CmsService (+1 more)

### Community 77 - "NewsArticleView.tsx"
Cohesion: 0.60
Nodes (3): NewsArticleView(), Props, formatArticleBody()

### Community 79 - "seed-demo.mjs"
Cohesion: 0.19
Nodes (18): at(), clearDemo(), clinicDate(), contactHash(), context(), encryptPhi(), insertLead(), insertMessages() (+10 more)

### Community 80 - "resolveDisplay.ts"
Cohesion: 0.39
Nodes (10): PreviewPlanRow, PreviewServiceRow, isEphemeralCmsId(), isFallbackId(), mergeBySortOrderSlot(), resolveArticlesForDisplay(), resolvePlansForDisplay(), resolveServicesForDisplay() (+2 more)

### Community 81 - "query"
Cohesion: 0.20
Nodes (20): POST(), GET(), getPortalSession(), portalAppointments(), portalInvoices(), generateTotpSecret(), query(), beginMfa() (+12 more)

### Community 82 - "useStoreAdmin.ts"
Cohesion: 0.11
Nodes (9): api(), DashboardHome(), money(), Site, Stats, Upcoming, ManageBooking(), Field (+1 more)

### Community 83 - "CatalogPanel.tsx"
Cohesion: 0.12
Nodes (8): SECTIONS, CatalogPanel(), cellsOf(), columnsOf(), hintOf(), Named, Row, SECTIONS

### Community 84 - "appointments.ts"
Cohesion: 0.23
Nodes (18): GET(), limited(), POST(), PUT(), AppointmentInput, createAppointment(), findByManageToken(), hashToken() (+10 more)

### Community 85 - "page.tsx"
Cohesion: 0.19
Nodes (13): authorized(), POST(), AuditInput, log, LogLevel, redact(), shouldLog(), write() (+5 more)

### Community 86 - "portal.ts"
Cohesion: 0.29
Nodes (11): POST(), hashPassword(), verifyPassword(), clearPortalSession(), createPortalAccount(), hashToken(), portalLogin(), contactHash() (+3 more)

### Community 87 - "forms.ts"
Cohesion: 0.33
Nodes (10): GET(), POST(), GET(), archiveTemplate(), assignForm(), assignmentByToken(), hashToken(), listTemplates() (+2 more)

### Community 88 - "FormStudio.tsx"
Cohesion: 0.22
Nodes (5): BLOCKS, FormField, FormStudio(), Template, TYPES

### Community 94 - "SalesOverview.tsx"
Cohesion: 0.28
Nodes (6): formatDay(), IncomeRow, money(), Sale, SalesOverview(), Summary

## Knowledge Gaps
- **296 isolated node(s):** `extends`, `next/core-web-vitals`, `SECTIONS`, `poppins`, `playfair` (+291 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `query` to `appointments.ts`, `Locale`, `db.ts`, `session.ts`, `types.ts`, `appointments.ts`, `page.tsx`, `isAdminAuthenticated`, `portal.ts`, `http.ts`, `forms.ts`, `CmsProvider.tsx`?**
  _High betweenness centrality (0.162) - this node is a cross-community bridge._
- **Why does `Locale` connect `Locale` to `NewsArticleView.tsx`, `types.ts`, `CmsPanel.tsx`, `page.tsx`, `resolveDisplay.ts`, `NewsSection.tsx`, `CmsVisualPreview.tsx`, `resolveDisplay.ts`?**
  _High betweenness centrality (0.089) - this node is a cross-community bridge._
- **Why does `api()` connect `useStoreAdmin.ts` to `ThemeProvider.tsx`, `Modules.tsx`, `api`, `PatientScreens.tsx`, `CalendarBoard.tsx`, `query`, `db.ts`, `CatalogPanel.tsx`, `FormStudio.tsx`, `SalesOverview.tsx`, `LanguageSwitcher.tsx`?**
  _High betweenness centrality (0.073) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `SECTIONS` to the rest of the system?**
  _296 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CmsVisualPreview.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Should `Locale` be split into smaller, more focused modules?**
  _Cohesion score 0.05546218487394958 - nodes in this community are weakly interconnected._
- **Should `route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.10202020202020202 - nodes in this community are weakly interconnected._