"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useUser } from "@/lib/useUser";

const STORAGE_KEY = "thrive_pending_profile";

type PendingProfile = {
  email: string;
  fullName: string | null;
  phone: string | null;
  birthDate: string | null;
  age: string | null;
  contactPreference: string | null;
  address: string | null;
  sex: string | null;
  referralSource: string | null;
  referralSourceOther: string | null;
};

export default function PendingProfileSync() {
  const { user } = useUser();
  const router = useRouter();
  const didRun = useRef(false);

  useEffect(() => {
    if (!user?.email || didRun.current) return;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as PendingProfile;
      if (!data || data.email?.toLowerCase() !== user.email?.toLowerCase()) return;

      didRun.current = true;
      const supabase = createClient();
      const parsedAge = data.age?.trim() ? Number(data.age) : null;
      const safeAge =
        parsedAge !== null && Number.isFinite(parsedAge) ? parsedAge : null;

      supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            full_name: data.fullName?.trim() || null,
            email: user.email || null,
            phone: data.phone?.trim() || null,
            birth_date: data.birthDate || null,
            age: safeAge,
            contact_preference: data.contactPreference || null,
            address: data.address?.trim() || null,
            sex: data.sex || null,
            referral_source: data.referralSource || null,
            referral_source_other:
              data.referralSource === "other" ? data.referralSourceOther?.trim() || null : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )
        .then(({ error }) => {
          if (!error) sessionStorage.removeItem(STORAGE_KEY);
          router.refresh();
        });
    } catch {
      /* ignore */
    }
  }, [user?.id, user?.email, router]);

  return null;
}
