"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCms } from "@/lib/cms/useCms";
import type { CmsBundle } from "@/lib/cms/types";

type CmsContextValue = CmsBundle & {
  loading: boolean;
  error: string | null;
};

const CmsContext = createContext<CmsContextValue | null>(null);

export function CmsProvider({ children }: { children: ReactNode }) {
  const value = useCms();
  return <CmsContext.Provider value={value}>{children}</CmsContext.Provider>;
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
