-- Cuentas creadas en el registro no traían sede, y el directorio
-- solo lista pacientes de la sede elegida. México queda en Monterrey y EE. UU. en Laredo.
WITH chosen AS (
  SELECT DISTINCT ON (market) id, market
  FROM (
    SELECT id,
      CASE
        WHEN upper(country) IN ('US', 'USA', 'UNITED STATES', 'ESTADOS UNIDOS') THEN 'US'
        ELSE 'MX'
      END AS market,
      CASE
        WHEN (
          upper(country) IN ('US', 'USA', 'UNITED STATES', 'ESTADOS UNIDOS')
          AND (name ILIKE '%laredo%' OR coalesce(city, '') ILIKE '%laredo%')
        ) OR (
          upper(country) NOT IN ('US', 'USA', 'UNITED STATES', 'ESTADOS UNIDOS')
          AND (name ILIKE '%monterrey%' OR coalesce(city, '') ILIKE '%monterrey%')
        ) THEN 0
        ELSE 1
      END AS pref,
      CASE WHEN is_active THEN 0 ELSE 1 END AS active_rank,
      name
    FROM locations
  ) ranked
  ORDER BY market, pref, active_rank, name
)
UPDATE patients p
SET location_id = chosen.id
FROM chosen
WHERE p.location_id IS NULL
  AND p.deleted_at IS NULL
  AND chosen.market = CASE
    WHEN upper(coalesce(p.country, 'MX')) IN ('US', 'USA', 'UNITED STATES', 'ESTADOS UNIDOS') THEN 'US'
    ELSE 'MX'
  END;
