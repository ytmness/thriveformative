#!/usr/bin/env node
/**
 * Importa productos reales de HealthVape (Shopify products.json) a Supabase.
 *
 * Uso:
 *   node scripts/import-healthvape-store.mjs --dry-run
 *   node scripts/import-healthvape-store.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const LOCALES = ["es", "en", "ko", "it"];
const SOURCE = "healthvape";
const HEALTHVAPE_BASE = "https://healthvape.com";
const PRIMARY_ENDPOINT = `${HEALTHVAPE_BASE}/products.json`;
const FALLBACK_ENDPOINT = `${HEALTHVAPE_BASE}/collections/all/products.json`;
const PAGE_LIMIT = 250;

const isDryRun = process.argv.includes("--dry-run");

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

function loadEnvFile(filePath) {
  try {
    const raw = readFileSync(filePath, "utf8");
    const env = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      env[key] = value;
    }
    return env;
  } catch {
    return {};
  }
}

function requireEnv() {
  const env = {
    ...loadEnvFile(join(ROOT, ".env.local")),
    ...process.env,
  };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local"
    );
    process.exit(1);
  }
  return { url, serviceKey };
}

// ---------------------------------------------------------------------------
// Slug / HTML helpers (misma lógica que lib/store/slug.ts)
// ---------------------------------------------------------------------------

function slugifyRef(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function stripHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parsePrice(value) {
  if (value == null || value === "") return null;
  const n = Number.parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

// ---------------------------------------------------------------------------
// Fetch HealthVape
// ---------------------------------------------------------------------------

async function fetchPage(endpoint, page) {
  const url = `${endpoint}?limit=${PAGE_LIMIT}&page=${page}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "ThriveFormative-Importer/1.0" },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} al obtener ${url}`);
  }
  const data = await res.json();
  return Array.isArray(data?.products) ? data.products : [];
}

async function fetchAllProducts() {
  let endpoint = PRIMARY_ENDPOINT;
  let usedFallback = false;

  const firstPage = await fetchPage(endpoint, 1).catch(() => null);
  if (!firstPage || firstPage.length === 0) {
    console.log("Endpoint principal vacío o falló; usando fallback collections/all…");
    endpoint = FALLBACK_ENDPOINT;
    usedFallback = true;
    const fallbackFirst = await fetchPage(endpoint, 1);
    if (fallbackFirst.length === 0) {
      throw new Error("No se encontraron productos en HealthVape.");
    }
    const all = [...fallbackFirst];
    let page = 2;
    while (true) {
      const batch = await fetchPage(endpoint, page);
      if (batch.length === 0) break;
      all.push(...batch);
      if (batch.length < PAGE_LIMIT) break;
      page += 1;
    }
    return { products: all, endpoint, usedFallback };
  }

  const all = [...firstPage];
  let page = 2;
  while (true) {
    const batch = await fetchPage(endpoint, page);
    if (batch.length === 0) break;
    all.push(...batch);
    if (batch.length < PAGE_LIMIT) break;
    page += 1;
  }
  return { products: all, endpoint, usedFallback };
}

// ---------------------------------------------------------------------------
// Normalización
// ---------------------------------------------------------------------------

function normalizeProduct(raw, index) {
  const handle = raw.handle || slugifyRef(raw.title || `product-${raw.id}`);
  const ref = slugifyRef(handle);
  const variants = Array.isArray(raw.variants) ? raw.variants : [];
  const prices = variants.map((v) => parsePrice(v.price)).filter((p) => p !== null);
  const comparePrices = variants
    .map((v) => parsePrice(v.compare_at_price))
    .filter((p) => p !== null);

  const priceMin = prices.length ? Math.min(...prices) : null;
  const priceMax = prices.length ? Math.max(...prices) : null;
  const compareAtPriceMin = comparePrices.length ? Math.min(...comparePrices) : null;

  const imageUrl =
    raw.images?.[0]?.src || raw.image?.src || null;

  const categoryName = (raw.product_type || "").trim() || "HealthVape";
  const categorySlug = slugifyRef(categoryName);

  const referralUrl = `${HEALTHVAPE_BASE}/products/${handle}`;

  return {
    ref,
    source_handle: handle,
    name: (raw.title || "").trim() || handle,
    description: stripHtml(raw.body_html),
    slug: ref,
    image_url: imageUrl,
    price_min: priceMin,
    price_max: priceMax,
    compare_at_price_min: compareAtPriceMin,
    currency: "USD",
    referral_url: referralUrl,
    external_url: referralUrl,
    source: SOURCE,
    source_payload: raw,
    category: {
      name: categoryName,
      slug: categorySlug,
    },
    sort_order: index + 1,
    is_published: true,
  };
}

function buildLocaleRows(normalized) {
  const rows = [];
  for (const locale of LOCALES) {
    rows.push({
      locale,
      ...normalized,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Supabase upsert
// ---------------------------------------------------------------------------

async function upsertCategory(supabase, locale, category, sortOrder) {
  const { data, error } = await supabase
    .from("store_categories")
    .upsert(
      {
        locale,
        name: category.name,
        slug: category.slug,
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "locale,slug" }
    )
    .select("id")
    .single();

  if (error) throw new Error(`Categoría [${locale}/${category.slug}]: ${error.message}`);
  return data.id;
}

async function upsertProduct(supabase, locale, normalized, categoryId) {
  const row = {
    locale,
    sort_order: normalized.sort_order,
    name: normalized.name,
    description: normalized.description,
    ref: normalized.ref,
    referral_url: normalized.referral_url,
    image_url: normalized.image_url,
    category_id: categoryId,
    is_published: true,
    price_min: normalized.price_min,
    price_max: normalized.price_max,
    compare_at_price_min: normalized.compare_at_price_min,
    currency: normalized.currency,
    source: normalized.source,
    source_handle: normalized.source_handle,
    source_payload: normalized.source_payload,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("store_products")
    .upsert(row, { onConflict: "locale,ref" });

  if (error) throw new Error(`Producto [${locale}/${normalized.ref}]: ${error.message}`);
}

async function importToSupabase(supabase, normalizedProducts) {
  const categorySort = new Map();
  let categoryOrder = 0;
  const stats = { categories: 0, products: 0 };

  for (const normalized of normalizedProducts) {
    const catKey = normalized.category.slug;
    if (!categorySort.has(catKey)) {
      categorySort.set(catKey, ++categoryOrder);
    }
    const catSort = categorySort.get(catKey);

    for (const locale of LOCALES) {
      const categoryId = await upsertCategory(
        supabase,
        locale,
        normalized.category,
        catSort
      );
      stats.categories += 1;
      await upsertProduct(supabase, locale, normalized, categoryId);
      stats.products += 1;
    }
  }

  return stats;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log(`\nHealthVape → Supabase${isDryRun ? " (dry-run)" : ""}\n`);

  const { products: rawProducts, endpoint, usedFallback } = await fetchAllProducts();
  console.log(`Endpoint: ${endpoint}${usedFallback ? " (fallback)" : ""}`);
  console.log(`Productos obtenidos: ${rawProducts.length}`);

  const normalized = rawProducts.map((p, i) => normalizeProduct(p, i));
  const preview = {
    imported_at: new Date().toISOString(),
    source: SOURCE,
    endpoint,
    used_fallback: usedFallback,
    dry_run: isDryRun,
    product_count: normalized.length,
    locale_count: LOCALES.length,
    total_rows: normalized.length * LOCALES.length,
    products: normalized,
    sample_by_locale: LOCALES.reduce((acc, locale) => {
      acc[locale] = normalized.slice(0, 2).map((p) => ({ locale, ...p }));
      return acc;
    }, {}),
  };

  const previewPath = join(ROOT, "healthvape-products-preview.json");
  writeFileSync(previewPath, JSON.stringify(preview, null, 2), "utf8");
  console.log(`Preview guardado: ${previewPath}`);

  if (isDryRun) {
    console.log("\nDry-run: no se escribió en Supabase.");
    console.log(`  Productos únicos: ${normalized.length}`);
    console.log(`  Filas por locale (${LOCALES.join(", ")}): ${normalized.length * LOCALES.length}`);
    console.log(
      `  Categorías únicas: ${new Set(normalized.map((p) => p.category.slug)).size}`
    );
    if (normalized[0]) {
      const s = normalized[0];
      console.log(`\nEjemplo: ${s.name}`);
      console.log(`  ref: ${s.ref}`);
      console.log(`  precio: ${s.price_min}${s.price_max !== s.price_min ? `–${s.price_max}` : ""} ${s.currency}`);
      console.log(`  categoría: ${s.category.name}`);
      console.log(`  url: ${s.referral_url}`);
    }
    return;
  }

  const { url, serviceKey } = requireEnv();
  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("\nImportando a Supabase…");
  const stats = await importToSupabase(supabase, normalized);
  console.log("\nImportación completada.");
  console.log(`  Upserts categoría×locale: ${stats.categories}`);
  console.log(`  Upserts producto×locale: ${stats.products}`);
}

main().catch((err) => {
  console.error("\nError:", err.message || err);
  process.exit(1);
});
