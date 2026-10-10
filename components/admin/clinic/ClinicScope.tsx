"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "@/components/admin/clinic/client";

export type ClinicLocation = {
  id: string;
  name: string;
  country?: string | null;
  city?: string | null;
  timezone?: string | null;
  is_active?: boolean;
};

type Scope = {
  ready: boolean;
  country: "MX" | "US";
  locationId: string;
  locations: ClinicLocation[];
  visible: ClinicLocation[];
  label: string;
  setCountry: (country: "MX" | "US") => void;
  setLocationId: (id: string) => void;
  query: string;
};

const Ctx = createContext<Scope | null>(null);
const KEY = "tf-clinic-scope";

function preferredSede(country: "MX" | "US", rows: ClinicLocation[]) {
  const needle = country === "MX" ? "monterrey" : "laredo";
  return rows.find((row) => {
    if (countryCode(row.country) !== country) return false;
    const haystack = `${row.name || ""} ${row.city || ""}`.toLowerCase();
    return haystack.includes(needle);
  }) || null;
}

function FlagMexico() {
  return (
    <svg className="admin-scope__flag" viewBox="0 0 18 12" aria-hidden="true">
      <rect width="6" height="12" fill="#006847" />
      <rect x="6" width="6" height="12" fill="#fff" />
      <rect x="12" width="6" height="12" fill="#ce1126" />
    </svg>
  );
}

function FlagUnitedStates() {
  return (
    <svg className="admin-scope__flag" viewBox="0 0 18 12" aria-hidden="true">
      <rect width="18" height="12" fill="#b22234" />
      <rect y="1.85" width="18" height="0.92" fill="#fff" />
      <rect y="3.69" width="18" height="0.92" fill="#fff" />
      <rect y="5.54" width="18" height="0.92" fill="#fff" />
      <rect y="7.38" width="18" height="0.92" fill="#fff" />
      <rect y="9.23" width="18" height="0.92" fill="#fff" />
      <rect y="11.08" width="18" height="0.92" fill="#fff" />
      <rect width="7.6" height="6.46" fill="#3c3b6e" />
    </svg>
  );
}

export function countryCode(value: string | null | undefined) {
  const code = (value || "").trim().toUpperCase();
  if (code === "MX" || code === "MEXICO" || code === "MÉXICO") return "MX";
  if (code === "US" || code === "USA" || code === "UNITED STATES" || code === "ESTADOS UNIDOS") return "US";
  return "";
}

export function ClinicScopeProvider({ children }: { children: React.ReactNode }) {
  const [locations, setLocations] = useState<ClinicLocation[]>([]);
  const [country, setCountryState] = useState<"MX" | "US">("MX");
  const [locationId, setLocationId] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { country?: string; locationId?: string };
        if (parsed.country === "US" || parsed.country === "MX") setCountryState(parsed.country);
        if (parsed.locationId) setLocationId(parsed.locationId);
      }
    } catch {
      /* el panel abre en México si no hay preferencia guardada */
    }
    api<{ rows: ClinicLocation[] }>("/api/admin/settings/locations")
      .then((result) => setLocations(result.rows.filter((row) => row.is_active !== false)))
      .catch(() => undefined)
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(KEY, JSON.stringify({ country, locationId }));
  }, [country, locationId, ready]);

  const sede = useMemo(() => preferredSede(country, locations), [locations, country]);
  const visible = useMemo(() => (sede ? [sede] : []), [sede]);
  const label = sede?.name || (country === "MX" ? "Monterrey" : "Laredo");

  useEffect(() => {
    if (!ready || !sede || locationId === sede.id) return;
    setLocationId(sede.id);
  }, [ready, sede, locationId]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("country", country);
    if (sede) params.set("locationId", sede.id);
    return params.toString();
  }, [country, sede]);

  function setCountry(next: "MX" | "US") {
    setCountryState(next);
    const nextSede = preferredSede(next, locations);
    setLocationId(nextSede?.id || "");
  }

  const value: Scope = {
    ready,
    country,
    locationId: sede?.id || "",
    locations,
    visible,
    label,
    setCountry,
    setLocationId,
    query,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useClinicScope() {
  const value = useContext(Ctx);
  if (!value) throw new Error("El selector de sede solo vive dentro del panel.");
  return value;
}

export function ScopeBar() {
  const { country, setCountry } = useClinicScope();
  function onKey(event: React.KeyboardEvent) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    setCountry(country === "MX" ? "US" : "MX");
  }
  return (
    <div className="admin-scope" role="radiogroup" aria-label="Sede" data-country={country} onKeyDown={onKey}>
      <span className="admin-scope__thumb" aria-hidden="true" />
      <button type="button" role="radio" aria-checked={country === "MX"} className={country === "MX" ? "is-active" : ""} onClick={() => setCountry("MX")}>
        <FlagMexico />
        <span>Monterrey</span>
      </button>
      <button type="button" role="radio" aria-checked={country === "US"} className={country === "US" ? "is-active" : ""} onClick={() => setCountry("US")}>
        <FlagUnitedStates />
        <span>Laredo</span>
      </button>
    </div>
  );
}
