/** Claves de texto editables en el CMS (coinciden con namespaces de messages/*.json). */
export const CMS_TEXT_GROUPS: {
  group: string;
  keys: { key: string; label: string }[];
}[] = [
  {
    group: "Hero (inicio)",
    keys: [
      { key: "hero.title", label: "Título principal" },
      { key: "hero.subtitle", label: "Subtítulo" },
      { key: "hero.scheduleBtn", label: "Botón agendar" },
      { key: "hero.benefit1", label: "Beneficio 1" },
      { key: "hero.benefit2", label: "Beneficio 2" },
      { key: "hero.benefit3", label: "Beneficio 3" },
      { key: "hero.benefit4", label: "Beneficio 4" },
      { key: "hero.stat1Label", label: "Estadística 1 — etiqueta" },
      { key: "hero.stat1Value", label: "Estadística 1 — valor" },
      { key: "hero.stat2Label", label: "Estadística 2 — etiqueta" },
      { key: "hero.stat2Value", label: "Estadística 2 — valor" },
      { key: "hero.stat3Label", label: "Estadística 3 — etiqueta" },
      { key: "hero.stat3Value", label: "Estadística 3 — valor" },
      { key: "heroStats.eyebrow", label: "Metodología — etiqueta" },
      { key: "heroStats.title", label: "Metodología — título" },
      { key: "heroStats.stat1Desc", label: "Metodología — texto tarjeta 1" },
      { key: "heroStats.stat2Desc", label: "Metodología — texto tarjeta 2" },
      { key: "heroStats.stat3Desc", label: "Metodología — texto tarjeta 3" },
    ],
  },
  {
    group: "Enfoque",
    keys: [
      { key: "approach.sectionEyebrow", label: "Etiqueta sección" },
      { key: "approach.sectionTitle", label: "Título sección" },
      { key: "approach.sectionLead", label: "Texto introductorio" },
      { key: "approach.title1a", label: "Pilar 1 — título A" },
      { key: "approach.title1b", label: "Pilar 1 — título B" },
      { key: "approach.desc1", label: "Pilar 1 — descripción" },
      { key: "approach.title2a", label: "Pilar 2 — título A" },
      { key: "approach.title2b", label: "Pilar 2 — título B" },
      { key: "approach.desc2", label: "Pilar 2 — descripción" },
      { key: "approach.title3", label: "Pilar 3 — título" },
      { key: "approach.desc3", label: "Pilar 3 — descripción" },
    ],
  },
  {
    group: "Servicios (encabezado)",
    keys: [
      { key: "services.title", label: "Título" },
      { key: "services.subtitle", label: "Subtítulo" },
    ],
  },
  {
    group: "T-Shape",
    keys: [
      { key: "tshape.eyebrow", label: "Etiqueta" },
      { key: "tshape.heroTitle", label: "Título principal" },
      { key: "tshape.subtitle", label: "Subtítulo" },
      { key: "tshape.fdaDesc", label: "Intro FDA" },
      { key: "tshape.fdaItem1", label: "FDA ítem 1" },
      { key: "tshape.fdaItem2", label: "FDA ítem 2" },
      { key: "tshape.fdaItem3", label: "FDA ítem 3" },
      { key: "tshape.fdaItem4", label: "FDA ítem 4" },
      { key: "tshape.fdaNote", label: "Nota FDA" },
      { key: "tshape.tech1Title", label: "Tech 1 — título" },
      { key: "tshape.tech1Desc", label: "Tech 1 — descripción" },
      { key: "tshape.tech2Title", label: "Tech 2 — título" },
      { key: "tshape.tech2Desc", label: "Tech 2 — descripción" },
      { key: "tshape.tech3Title", label: "Tech 3 — título" },
      { key: "tshape.tech3Desc", label: "Tech 3 — descripción" },
    ],
  },
  {
    group: "Planes (encabezado)",
    keys: [
      { key: "plans.title", label: "Título" },
      { key: "plans.subtitle", label: "Subtítulo" },
      { key: "plans.recommendedBadge", label: "Badge recomendado" },
      { key: "plans.chooseBtn", label: "Botón elegir plan" },
    ],
  },
  {
    group: "CTA final",
    keys: [
      { key: "cta.title", label: "Título" },
      { key: "cta.subtitle", label: "Subtítulo" },
      { key: "cta.button", label: "Botón" },
    ],
  },
  {
    group: "Citas (agenda)",
    keys: [
      { key: "booking.title", label: "Título" },
      { key: "booking.subtitle", label: "Subtítulo" },
      { key: "booking.ctaHint", label: "Texto antes de WhatsApp" },
      { key: "booking.ctaButton", label: "Botón WhatsApp" },
    ],
  },
  {
    group: "Doctor (página info)",
    keys: [
      { key: "doctor.title", label: "Título sección" },
      { key: "doctor.subtitle", label: "Subtítulo" },
      { key: "doctor.name", label: "Nombre" },
      { key: "doctor.bio", label: "Biografía" },
    ],
  },
  {
    group: "FAQ (página info)",
    keys: [
      { key: "faq.title", label: "Título sección" },
      { key: "faq.subtitle", label: "Subtítulo" },
      { key: "faq.q1", label: "Pregunta 1" },
      { key: "faq.a1", label: "Respuesta 1" },
      { key: "faq.q2", label: "Pregunta 2" },
      { key: "faq.a2", label: "Respuesta 2" },
      { key: "faq.q3", label: "Pregunta 3" },
      { key: "faq.a3", label: "Respuesta 3" },
      { key: "faq.q4", label: "Pregunta 4" },
      { key: "faq.a4", label: "Respuesta 4" },
    ],
  },
  {
    group: "Noticias (encabezado)",
    keys: [
      { key: "news.label", label: "Etiqueta" },
      { key: "news.titlePrefix", label: "Título (prefijo)" },
      { key: "news.titleWord", label: "Título (palabra destacada)" },
      { key: "news.searchPlaceholder", label: "Placeholder búsqueda" },
    ],
  },
];

export const ALL_CMS_TEXT_KEYS = CMS_TEXT_GROUPS.flatMap((g) => g.keys.map((k) => k.key));
