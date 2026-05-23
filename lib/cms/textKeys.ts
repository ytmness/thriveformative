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
    ],
  },
  {
    group: "Enfoque",
    keys: [
      { key: "approach.sectionEyebrow", label: "Etiqueta sección" },
      { key: "approach.sectionTitle", label: "Título sección" },
      { key: "approach.sectionLead", label: "Texto introductorio" },
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
