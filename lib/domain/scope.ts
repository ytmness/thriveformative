export function normalizeCountry(value: string | null | undefined) {
  const code = (value || "").trim().toUpperCase();
  if (code === "MX" || code === "MEXICO" || code === "MÉXICO") return "MX";
  if (code === "US" || code === "USA" || code === "UNITED STATES" || code === "ESTADOS UNIDOS") return "US";
  return null;
}

export function countrySql(locationColumn: string, placeholder: string) {
  return `(${placeholder}::text IS NULL OR EXISTS (
    SELECT 1 FROM locations scope_loc
    WHERE scope_loc.id = ${locationColumn}
      AND (
        (${placeholder} = 'MX' AND upper(scope_loc.country) IN ('MX', 'MEXICO', 'MÉXICO'))
        OR (${placeholder} = 'US' AND upper(scope_loc.country) IN ('US', 'USA', 'UNITED STATES', 'ESTADOS UNIDOS'))
      )
  ))`;
}
