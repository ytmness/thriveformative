INSERT INTO marketing_sources (name)
SELECT v.name
FROM (VALUES ('Instagram'), ('Facebook')) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM marketing_sources ms WHERE lower(btrim(ms.name)) = lower(v.name)
);
