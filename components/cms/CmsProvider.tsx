"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCms } from "@/lib/cms/useCms";
import type { CmsBundle } from "@/lib/cms/types";

export type CmsContextValue = CmsBundle & {
  loading: boolean;
  error: string | null;
};

export const CmsContext = createContext<CmsContextValue | null>(null);

type Props = {
  children: ReactNode;
  /** Vista previa admin: inyecta datos sin fetch. */
  value?: CmsContextValue;
};

function CmsProviderFetched({ children }: { children: ReactNode }) {
  const fetched = useCms();
  return <CmsContext.Provider value={fetched}>{children}</CmsContext.Provider>;
}

export function CmsProvider({ children, value }: Props) {
  if (value) {
    return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
  }
  return <CmsProviderFetched>{children}</CmsProviderFetched>;
}

export function useCmsContext(): CmsContextValue {
  const ctx = useContext(CmsContext);
  if (!ctx) {
    return {
      services: [],
      plans: [],
      articles: [],
      textOverrides: {},
      loading: false,
      error: null,
    };
  }
  return ctx;
}
