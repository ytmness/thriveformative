# Graph Report - thriveformative-git  (2026-09-30)

## Corpus Check
- 288 files · ~926,064 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1216 nodes · 2967 edges · 98 communities (77 shown, 21 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8fa33548`
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
- BookingAvailabilityPanel.tsx
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
- session.ts
- NewsArticleView.tsx
- types.ts
- NewsArticleView.tsx
- seed-demo.mjs
- db.ts
- v1Handlers.ts
- useStoreAdmin.ts
- CatalogPanel.tsx
- queue.ts
- page.tsx
- PortalApp.tsx
- emailServer.ts
- db.ts
- HeroQuestionsRotator.tsx
- query
- settings.ts
- schemas.ts
- availability.ts
- SalesOverview.tsx
- CmsProvider.tsx

## God Nodes (most connected - your core abstractions)
1. `query()` - 125 edges
2. `toErrorResponse()` - 90 edges
3. `isSession()` - 82 edges
4. `requirePermission()` - 76 edges
5. `readJson()` - 61 edges
6. `writeAudit()` - 44 edges
7. `requestMeta()` - 31 edges
8. `api()` - 30 edges
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

## Communities (98 total, 21 thin omitted)

### Community 0 - "CmsVisualPreview.tsx"
Cohesion: 0.13
Nodes (21): asLang(), cardBox(), CreateOffer(), FOCUS, GuideId, GUIDES, ICONS, Lang (+13 more)

### Community 1 - "ThemeProvider.tsx"
Cohesion: 0.13
Nodes (10): NAV, NavItem, Field, PortalApp(), ThemeContext, ThemeId, THEMES, useTheme() (+2 more)

### Community 2 - "ContactSection.tsx"
Cohesion: 0.33
Nodes (6): GET(), LOCALES, fetchCmsBundleFromDb(), parsePlanItems(), CMS_LOCALES, CmsTextEntry

### Community 3 - "Locale"
Cohesion: 0.20
Nodes (14): ProductDetailContent(), StoreCatalog(), Props, StoreProductPrice(), fetchStoreCategories(), fetchStoreProductByRef(), fetchStoreProducts(), storeApi() (+6 more)

### Community 4 - "route.ts"
Cohesion: 0.29
Nodes (12): POST(), RATE_LIMIT, handleRouteError(), jsonError(), jsonOk(), getClientIp(), InvalidJsonError, invalidJsonResponse() (+4 more)

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
Cohesion: 0.39
Nodes (6): POST(), requireAdmin(), attachCategoryToProduct(), PRODUCT_FIELDS_SQL, ProductRow, slugifyRef()

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
Cohesion: 0.14
Nodes (31): createPortalAccount(), contactHash(), encryptPhi(), getKey(), normalizeEmail(), normalizePhone(), archiveLead(), blankNumber() (+23 more)

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
Nodes (11): CmsPanel(), LOCALE_LABELS, Props, SubTab, ViewMode, mergeWithPendingDrafts(), useCmsAdmin(), fetchCmsBundle() (+3 more)

### Community 46 - "page.tsx"
Cohesion: 0.16
Nodes (4): CmsProvider(), DoctorNoticiasPage(), LoadingScreenLogo3D, ScrollProgress()

### Community 47 - "page.tsx"
Cohesion: 0.22
Nodes (17): POST(), writeAudit(), addPayment(), applySideEffects(), catalogPrice(), createCreditNote(), createQuote(), createSale() (+9 more)

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
Cohesion: 0.29
Nodes (4): metadata, playfair, poppins, locales

### Community 56 - "BookingAvailabilityPanel.tsx"
Cohesion: 0.16
Nodes (21): GET(), KINDS, POST(), GET(), decryptPhi(), archiveTemplate(), assignForm(), assignmentByToken() (+13 more)

### Community 59 - "CmsProvider.tsx"
Cohesion: 0.08
Nodes (72): PATCH(), GET(), POST(), DELETE(), GET(), POST(), GET(), GET() (+64 more)

### Community 60 - "CmsVisualPreview.tsx"
Cohesion: 0.12
Nodes (16): CmsEditDrawer(), CmsEditTarget, Props, CmsPreviewDoctorSection(), CmsPreviewFaqSection(), SectionProps, ARTICLE_KEYS, MESSAGES_BY_LOCALE (+8 more)

### Community 61 - "resolveDisplay.ts"
Cohesion: 0.28
Nodes (14): CmsVisualPreview(), NewsSection(), buildFallbackArticles(), PreviewPlanRow, PreviewServiceRow, isEphemeralCmsId(), isFallbackId(), mergeBySortOrderSlot() (+6 more)

### Community 63 - "LanguageSwitcher.tsx"
Cohesion: 0.12
Nodes (10): cellsOf(), DAYS, detailOf(), GROUPS, labelOf(), MAP, Row, SECTIONS (+2 more)

### Community 64 - "CmsImageField.tsx"
Cohesion: 0.38
Nodes (3): ContactLocationMap(), Props, CLINIC_MAPS_QUERY

### Community 65 - "appointments.ts"
Cohesion: 0.20
Nodes (21): AppointmentInput, createAppointment(), hashToken(), insertOne(), mapAppointment(), resolveWindow(), shiftStart(), STATUSES (+13 more)

### Community 66 - "v1Handlers.ts"
Cohesion: 0.24
Nodes (7): BookingWizard(), Catalog, dateKey(), Group, pad(), PublicCalendar(), Slot

### Community 67 - "Modules.tsx"
Cohesion: 0.16
Nodes (7): CommsAdmin(), formatReport(), FormBuilder(), InvoiceCenter(), ReportView(), statusLabel(), CloseButton()

### Community 68 - "api"
Cohesion: 0.14
Nodes (7): api(), DashboardHome(), Stats, EMPTY, Lead, LeadBoard(), ManageBooking()

### Community 69 - "PatientScreens.tsx"
Cohesion: 0.11
Nodes (11): EMPTY, Patient, PatientChart(), PatientList(), TAB_ALIAS, TABS, Button(), EmptyState() (+3 more)

### Community 70 - "CalendarBoard.tsx"
Cohesion: 0.24
Nodes (8): Appt, CalendarBoard(), clinicWall(), localKey(), nextClinicSlot(), Opt, pad(), STATUSES

### Community 71 - "PortalApp.tsx"
Cohesion: 0.29
Nodes (5): Catalog, Item, loadStripe(), Method, PosScreen()

### Community 72 - "PosScreen.tsx"
Cohesion: 0.20
Nodes (12): GET(), PATCH(), POST(), requireAdmin(), ALLOWED, POST(), createAdminSessionToken(), isAdminAuthenticated() (+4 more)

### Community 73 - "migrate.mjs"
Cohesion: 0.47
Nodes (5): bootstrapAdmin(), __dirname, loadEnv(), main(), root

### Community 74 - "session.ts"
Cohesion: 0.18
Nodes (17): GET(), POST(), POST(), PanelLayout(), verifyPassword(), clearStaffSession(), createStaffSession(), getStaffSession() (+9 more)

### Community 75 - "NewsArticleView.tsx"
Cohesion: 0.17
Nodes (13): AnimatedSection(), AnimatedSectionProps, BookingSection(), useCmsContext(), CmsText(), Props, CardVariant, GiantScrollCard() (+5 more)

### Community 76 - "types.ts"
Cohesion: 0.43
Nodes (5): Props, ALLOWED_TYPES, CmsImageFolder, uploadCmsImage(), validateCmsImageFile()

### Community 77 - "NewsArticleView.tsx"
Cohesion: 0.23
Nodes (7): Props, NewsArticleView(), Props, ITEM_KEYS, NewsSectionAdminEditable, Props, formatArticleBody()

### Community 79 - "seed-demo.mjs"
Cohesion: 0.19
Nodes (18): at(), clearDemo(), clinicDate(), contactHash(), context(), encryptPhi(), insertLead(), insertMessages() (+10 more)

### Community 80 - "db.ts"
Cohesion: 0.22
Nodes (13): GET(), LOCALES, GET(), LOCALES, GET(), LOCALES, Locale, fetchStoreCategoriesFromDb() (+5 more)

### Community 81 - "v1Handlers.ts"
Cohesion: 0.29
Nodes (13): appointmentsGET(), appointmentsPOST(), auth(), denied(), leadsGET(), leadsPOST(), patientsGET(), patientsPOST() (+5 more)

### Community 82 - "useStoreAdmin.ts"
Cohesion: 0.15
Nodes (11): LOCALE_LABELS, ProductForm(), Props, slugifyInput(), StorePanel(), createEmptyDraft(), StoreAdminApi, StoreProductDraft (+3 more)

### Community 83 - "CatalogPanel.tsx"
Cohesion: 0.12
Nodes (8): SECTIONS, CatalogPanel(), cellsOf(), columnsOf(), hintOf(), Named, Row, SECTIONS

### Community 84 - "queue.ts"
Cohesion: 0.22
Nodes (13): authorized(), POST(), log, LogLevel, redact(), shouldLog(), write(), dispatchDueMessages() (+5 more)

### Community 85 - "page.tsx"
Cohesion: 0.18
Nodes (3): opacityMap, WaveDivider(), WaveDividerProps

### Community 86 - "PortalApp.tsx"
Cohesion: 0.20
Nodes (13): GET(), limited(), GET(), limited(), POST(), PUT(), findByManageToken(), joinWaitlist() (+5 more)

### Community 87 - "emailServer.ts"
Cohesion: 0.33
Nodes (14): deliverMail(), EmailKind, getTransport(), isValidEmail(), sendClinicEmail(), sendEmailPayload(), ASSETS, assetUrl() (+6 more)

### Community 88 - "db.ts"
Cohesion: 0.24
Nodes (10): GET(), AuditInput, StaffSession, createPool(), getPool(), TxQuery, withTx(), adjustStock() (+2 more)

### Community 90 - "query"
Cohesion: 0.35
Nodes (10): POST(), POST(), GET(), clearPortalSession(), getPortalSession(), hashToken(), portalAppointments(), portalInvoices() (+2 more)

### Community 91 - "settings.ts"
Cohesion: 0.33
Nodes (11): hashPassword(), Column, createSection(), deleteSection(), saveService(), saveStaff(), SIMPLE, updateBooking() (+3 more)

### Community 92 - "schemas.ts"
Cohesion: 0.18
Nodes (10): appointmentAdminEmailSchema, appointmentPendingSchema, contactConfirmationSchema, contactNotifyAdminSchema, emailField, honeypotShape, messageText, SendEmailBody (+2 more)

### Community 93 - "availability.ts"
Cohesion: 0.36
Nodes (7): GET(), availabilityForDate(), overlaps(), Range, Slot, todayKey(), weekdayIndex()

### Community 94 - "SalesOverview.tsx"
Cohesion: 0.28
Nodes (6): formatDay(), IncomeRow, money(), Sale, SalesOverview(), Summary

### Community 95 - "CmsProvider.tsx"
Cohesion: 0.31
Nodes (7): CmsContext, CmsContextValue, CmsProviderFetched(), Props, CmsBundle, EMPTY, useCms()

## Knowledge Gaps
- **285 isolated node(s):** `extends`, `next/core-web-vitals`, `SECTIONS`, `poppins`, `playfair` (+280 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **21 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `query()` connect `query` to `appointments.ts`, `ContactSection.tsx`, `PosScreen.tsx`, `db.ts`, `session.ts`, `settings.ts`, `emailServer.ts`, `page.tsx`, `db.ts`, `v1Handlers.ts`, `queue.ts`, `PortalApp.tsx`, `isAdminAuthenticated`, `BookingAvailabilityPanel.tsx`, `CmsProvider.tsx`, `availability.ts`?**
  _High betweenness centrality (0.168) - this node is a cross-community bridge._
- **Why does `Locale` connect `db.ts` to `ContactSection.tsx`, `Locale`, `NewsArticleView.tsx`, `emailServer.ts`, `types.ts`, `CmsPanel.tsx`, `NewsArticleView.tsx`, `useStoreAdmin.ts`, `NewsSection.tsx`, `CmsVisualPreview.tsx`, `resolveDisplay.ts`, `CmsProvider.tsx`?**
  _High betweenness centrality (0.076) - this node is a cross-community bridge._
- **Why does `api()` connect `api` to `ThemeProvider.tsx`, `v1Handlers.ts`, `Modules.tsx`, `PatientScreens.tsx`, `CalendarBoard.tsx`, `PortalApp.tsx`, `CatalogPanel.tsx`, `SalesOverview.tsx`, `LanguageSwitcher.tsx`?**
  _High betweenness centrality (0.071) - this node is a cross-community bridge._
- **What connects `extends`, `next/core-web-vitals`, `SECTIONS` to the rest of the system?**
  _285 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `CmsVisualPreview.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12987012987012986 - nodes in this community are weakly interconnected._
- **Should `ThemeProvider.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.12554112554112554 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.04878048780487805 - nodes in this community are weakly interconnected._