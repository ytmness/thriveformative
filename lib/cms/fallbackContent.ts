import type { CmsPlan, CmsService } from "@/lib/cms/types";

type TServices = (key: string) => string;
type TPlans = (key: string) => string;

export function fallbackServicesFromTranslations(t: TServices): Pick<CmsService, "name" | "description">[] {
  return [1, 2, 3, 4, 5, 6].map((i) => ({
    name: t(`service${i}`),
    description: t(`desc${i}`),
  }));
}

export function fallbackPlansFromTranslations(t: TPlans): Pick<CmsPlan, "name" | "items" | "is_featured">[] {
  return [
    {
      name: t("plan1"),
      items: [t("plan1Item1"), t("plan1Item2"), t("plan1Item3")],
      is_featured: false,
    },
    {
      name: t("plan2"),
      items: [t("plan2Item1"), t("plan2Item2"), t("plan2Item3"), t("plan2Item4")],
      is_featured: true,
    },
    {
      name: t("plan3"),
      items: [
        t("plan3Item1"),
        t("plan3Item2"),
        t("plan3Item3"),
        t("plan3Item4"),
        t("plan3Item5"),
      ],
      is_featured: false,
    },
  ];
}
