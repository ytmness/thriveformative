"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { readMarket, writeMarket, type SiteMarket } from "@/lib/site/market";

export default function SiteSwitch() {
  const t = useTranslations("site");
  const router = useRouter();
  const [market, setMarket] = useState<SiteMarket | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setMarket(readMarket());
  }, []);

  function enter(next: SiteMarket) {
    if (next === market || pending) return;
    writeMarket(next);
    setMarket(next);
    startTransition(() => router.refresh());
  }

  if (!market) return <div className="site-switch" aria-hidden="true" />;

  const here = market === "US" ? t("usHere") : t("mxHere");
  const action = market === "US" ? t("enterMx") : t("enterUs");
  const next = market === "US" ? "MX" : "US";

  return (
    <div className="site-switch">
      <p>
        <span>{here}</span>{" "}
        <button type="button" onClick={() => enter(next)} disabled={pending}>
          {action}
        </button>
      </p>
    </div>
  );
}
