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

  const visible = useMemo(
    () => locations.filter((row) => countryCode(row.country) === country),
    [locations, country]
  );

  const active = visible.find((row) => row.id === locationId);
  const label = active ? active.name : country === "MX" ? "México · ambas sedes" : "Estados Unidos · ambas sedes";

  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("country", country);
    if (locationId && visible.some((row) => row.id === locationId)) params.set("locationId", locationId);
    return params.toString();
  }, [country, locationId, visible]);

  function setCountry(next: "MX" | "US") {
    setCountryState(next);
    setLocationId("");
  }

  const value: Scope = {
    ready,
    country,
    locationId: visible.some((row) => row.id === locationId) ? locationId : "",
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
  const { country, locationId, visible, setCountry, setLocationId } = useClinicScope();
  return (
    <div className="admin-scope" role="group" aria-label="País y sede">
      <div className="admin-scope__countries">
        <button type="button" className={country === "MX" ? "is-active" : ""} aria-pressed={country === "MX"} onClick={() => setCountry("MX")}>México</button>
        <button type="button" className={country === "US" ? "is-active" : ""} aria-pressed={country === "US"} onClick={() => setCountry("US")}>Estados Unidos</button>
      </div>
      <div className="admin-scope__sites">
        <button type="button" className={!locationId ? "is-active" : ""} aria-pressed={!locationId} onClick={() => setLocationId("")}>Ambas</button>
        {visible.map((row) => (
          <button key={row.id} type="button" className={locationId === row.id ? "is-active" : ""} aria-pressed={locationId === row.id} onClick={() => setLocationId(row.id)}>
            {row.name}
          </button>
        ))}
      </div>
    </div>
  );
}
