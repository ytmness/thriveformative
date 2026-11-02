"use client";

import { Suspense, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/components/admin/clinic/client";
import { ProfilePhotoGate } from "@/components/account/ProfilePhotoGate";
import SiteFrame from "@/components/site/SiteFrame";
import { consumeNextPath } from "@/lib/site/nextPath";

function PhotoGateContent() {
  const locale = useLocale();
  const router = useRouter();
  const search = useSearchParams();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("Paciente");

  useEffect(() => {
    api<{ user: { name?: string; profilePhotoUrl?: string | null } | null }>("/api/auth/me")
      .then((body) => {
        if (!body.user) {
          router.replace(`/${locale}/login`);
          return;
        }
        if (body.user.profilePhotoUrl) {
          router.replace(consumeNextPath(search.get("next"), locale));
          return;
        }
        setName(body.user.name || "Paciente");
        setReady(true);
      })
      .catch(() => router.replace(`/${locale}/login`));
  }, [locale, router, search]);

  const parts = name.split(" ");
  if (!ready) return <p className="booking-slots__empty">…</p>;
  return (
    <ProfilePhotoGate
      firstName={parts[0] || "Paciente"}
      lastName={parts.slice(1).join(" ")}
      onDone={() => router.replace(consumeNextPath(search.get("next"), locale))}
    />
  );
}

export default function Page() {
  return (
    <SiteFrame>
      <Suspense fallback={<p className="booking-slots__empty">…</p>}>
        <PhotoGateContent />
      </Suspense>
    </SiteFrame>
  );
}
