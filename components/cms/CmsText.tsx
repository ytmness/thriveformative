"use client";

import { createElement } from "react";
import { useTranslations } from "next-intl";
import { resolveCmsText } from "@/lib/cms/fetch";
import { useCmsContext } from "@/components/cms/CmsProvider";

type Props = {
  contentKey: string;
  fallback?: string;
  as?: "span" | "p" | "h1" | "h2" | "h3";
  className?: string;
};

/** Texto con override del CMS; si no hay, usa next-intl. */
export default function CmsText({ contentKey, fallback, as: Tag = "span", className }: Props) {
  const { textOverrides } = useCmsContext();
  const dot = contentKey.indexOf(".");
  const ns = dot >= 0 ? contentKey.slice(0, dot) : contentKey;
  const leaf = dot >= 0 ? contentKey.slice(dot + 1) : "";
  const t = useTranslations(ns);

  const fromIntl =
    fallback ?? (leaf ? t(leaf as never) : (t as unknown as (k: string) => string)(contentKey));

  const text = resolveCmsText(textOverrides, contentKey, fromIntl);

  return createElement(Tag, { className }, text);
}
