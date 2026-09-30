"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/components/admin/clinic/client";
import { CloseButton, EmptyState, SegmentedControl } from "@/components/admin/ui";
import { CreateOffer } from "@/components/admin/tutorial";

const SECTIONS: [string, string][] = [
  ["servicios", "Servicios"],
  ["productos", "Productos"],
  ["paquetes", "Paquetes"],
  ["membresias", "Membresías"],
  ["categorias", "Categorías"],
  ["proveedores", "Proveedores"],
];

type Row = Record<string, unknown>;
type Named = { id: string; name: string };

export default function CatalogPanel({ section }: { section: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [moves, setMoves] = useState<Row[]>([]);
  const [categoryKind, setCategoryKind] = useState("servicios");
  const [locations, setLocations] = useState<Named[]>([]);
  const [staff, setStaff] = useState<Row[]>([]);
  const [serviceCategories, setServiceCategories] = useState<Named[]>([]);
  const [productCategories, setProductCategories] = useState<Named[]>([]);
  const [taxes, setTaxes] = useState<Named[]>([]);
  const [rooms, setRooms] = useState<Named[]>([]);
  const [suppliers, setSuppliers] = useState<Named[]>([]);
  const [templates, setTemplates] = useState<Named[]>([]);
  const [depsReady, setDepsReady] = useState(false);
  const [form, setForm] = useState<Row>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [serviceTab, setServiceTab] = useState("general");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [stock, setStock] = useState({ productId: "", locationId: "", quantity: "", reason: "Ajuste" });

  const title = SECTIONS.find((item) => item[0] === section)?.[1] || "Catálogo";

  async function load() {
    if (section === "productos") {
      const [products, movements] = await Promise.all([
        api<{ rows: Row[] }>("/api/admin/products"),
        api<{ rows: Row[] }>("/api/admin/products?kind=movements").catch(() => ({ rows: [] as Row[] })),
      ]);
      setRows(products.rows);
      setMoves(movements.rows);
      return;
    }
    if (section === "paquetes") {
      setRows((await api<{ rows: Row[] }>("/api/admin/products?kind=packages")).rows);
      return;
    }
    if (section === "membresias") {
      setRows((await api<{ rows: Row[] }>("/api/admin/products?kind=memberships")).rows);
      return;
    }
    if (section === "servicios") {
      setRows((await api<{ rows: Row[] }>("/api/admin/settings/services")).rows);
      return;
    }
    const path = section === "proveedores" ? "suppliers" : categoryKind === "productos" ? "product-categories" : "service-categories";
    setRows((await api<{ rows: Row[] }>(`/api/admin/settings/${path}`)).rows);
  }

  useEffect(() => {
    setError(null);
    setSaved(false);
    setForm({});
    setEditing(null);
    const wantsNew = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("nuevo") === "1";
    setOpenForm(wantsNew);
    load().catch((err) => setError(err instanceof Error ? err.message : "No se pudo cargar."));
  }, [section, categoryKind]);

  useEffect(() => {
    setDepsReady(false);
    Promise.all([
      api<{ rows: Named[] }>("/api/admin/settings/locations").catch(() => ({ rows: [] })),
      api<{ rows: Row[] }>("/api/admin/settings/staff").catch(() => ({ rows: [] })),
      api<{ rows: Named[] }>("/api/admin/settings/service-categories").catch(() => ({ rows: [] })),
      api<{ rows: Named[] }>("/api/admin/settings/product-categories").catch(() => ({ rows: [] })),
      api<{ rows: Named[] }>("/api/admin/settings/taxes").catch(() => ({ rows: [] })),
      api<{ rows: Named[] }>("/api/admin/settings/rooms").catch(() => ({ rows: [] })),
      api<{ rows: Named[] }>("/api/admin/settings/suppliers").catch(() => ({ rows: [] })),
      api<{ rows: Named[] }>("/api/admin/forms").catch(() => ({ rows: [] })),
    ]).then(([locationRows, staffRows, serviceRows, productRows, taxRows, roomRows, supplierRows, formRows]) => {
      setLocations(locationRows.rows);
      setStaff(staffRows.rows);
      setServiceCategories(serviceRows.rows);
      setProductCategories(productRows.rows);
      setTaxes(taxRows.rows);
      setRooms(roomRows.rows);
      setSuppliers(supplierRows.rows);
      setTemplates(formRows.rows);
      setDepsReady(true);
    });
  }, []);

  function set(key: string, value: unknown) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openNew() {
    setEditing(null);
    setServiceTab("general");
    setForm(section === "membresias" ? { interval: "month" } : {});
    setOpenForm(true);
  }

  function openEdit(row: Row) {
    setEditing(String(row.id));
    setServiceTab("general");
    setForm(formFrom(section, row));
    setOpenForm(true);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    try {
      if (section === "productos") {
        const body = {
          name: form.name, sku: form.sku || null, barcode: form.barcode || null, sizeLabel: form.sizeLabel || null,
          cost: Number(form.cost || 0), price: Number(form.price || 0), description: form.description || "",
          supplierId: form.supplierId || null, categoryId: form.categoryId || null, taxId: form.taxId || null,
        };
        if (editing) await api(`/api/admin/products/${editing}`, { method: "PATCH", body: JSON.stringify(body) });
        else await api("/api/admin/products", { method: "POST", body: JSON.stringify(body) });
      } else if (section === "paquetes") {
        const body = { kind: "package", name: form.name, price: Number(form.price || 0), description: form.description || "" };
        if (editing) await api(`/api/admin/products/${editing}`, { method: "PATCH", body: JSON.stringify(body) });
        else await api("/api/admin/products", { method: "POST", body: JSON.stringify(body) });
      } else if (section === "membresias") {
        const body = { kind: "membership", name: form.name, price: Number(form.price || 0), intervalUnit: form.interval || "month", description: form.description || "" };
        if (editing) await api(`/api/admin/products/${editing}`, { method: "PATCH", body: JSON.stringify(body) });
        else await api("/api/admin/products", { method: "POST", body: JSON.stringify(body) });
      } else if (section === "servicios") {
        const body = {
          ...form,
          durationMinutes: Number(form.durationMinutes || 60),
          price: form.price === "" || form.price == null ? 0 : Number(form.price),
          depositAmount: form.depositAmount === "" || form.depositAmount == null ? null : Number(form.depositAmount),
          bufferBeforeMinutes: Number(form.bufferBeforeMinutes || 0),
          bufferAfterMinutes: Number(form.bufferAfterMinutes || 0),
        };
        if (editing) await api(`/api/admin/settings/services/${editing}`, { method: "PATCH", body: JSON.stringify(body) });
        else await api("/api/admin/settings/services", { method: "POST", body: JSON.stringify(body) });
      } else {
        const path = settingsPath(section, categoryKind);
        const body = settingsBody(section, categoryKind, form);
        if (editing) await api(`/api/admin/settings/${path}/${editing}`, { method: "PATCH", body: JSON.stringify(body) });
        else await api(`/api/admin/settings/${path}`, { method: "POST", body: JSON.stringify(body) });
      }
      setOpenForm(false);
      setEditing(null);
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar");
    }
  }

  async function archive(row: Row) {
    const label = String(row.name || "este registro");
    if (!window.confirm(section === "categorias" || section === "proveedores" ? `¿Eliminar «${label}»?` : `¿Archivar «${label}»?`)) return;
    try {
      if (section === "productos") await api(`/api/admin/products/${row.id}`, { method: "DELETE" });
      else if (section === "paquetes") await api(`/api/admin/products/${row.id}?kind=package`, { method: "DELETE" });
      else if (section === "membresias") await api(`/api/admin/products/${row.id}?kind=membership`, { method: "DELETE" });
      else if (section === "servicios") await api(`/api/admin/settings/services/${row.id}`, { method: "DELETE" });
      else await api(`/api/admin/settings/${settingsPath(section, categoryKind)}/${row.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo archivar");
    }
  }

  const columns = columnsOf(section);

  return (
    <div className="admin-settings">
      <nav className="admin-settings__nav" data-tour="catalog-nav" aria-label="Catálogo">
        <div className="admin-settings__group">
          <p className="admin-settings__label">Qué vendes</p>
          {SECTIONS.map(([id, label]) => (
            <Link key={id} className={section === id ? "is-active" : ""} href={`/admin/catalogo/${id}`}>{label}</Link>
          ))}
        </div>
      </nav>
      <div>
        <header className="admin-header">
          <p className="admin-header__eyebrow">Catálogo de la clínica</p>
          <h1 className="admin-header__title">{title}</h1>
          <p className="admin-header__desc">{hintOf(section)}</p>
        </header>
        {error ? <div className="admin-alert" role="alert">{error}</div> : null}
        {saved ? <p className="admin-notice" role="status">Cambios guardados.</p> : null}
        {section === "categorias" ? (
          <SegmentedControl
            label="Tipo de categoría"
            value={categoryKind}
            onChange={setCategoryKind}
            items={[{ id: "servicios", label: "De servicios" }, { id: "productos", label: "De productos" }]}
          />
        ) : null}
        {section === "productos" ? (
          <div className="admin-toolbar">
            <button type="button" className="admin-btn" onClick={() => { window.location.href = "/api/admin/products?export=1&format=csv"; }}>CSV</button>
            <button type="button" className="admin-btn" onClick={() => { window.location.href = "/api/admin/products?export=1&format=xlsx"; }}>Excel</button>
          </div>
        ) : null}
        <div className="admin-page-head">
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h2>
          <button className="admin-btn admin-btn--primary" type="button" data-tour="catalog-new" onClick={openNew}>+ Nuevo</button>
        </div>
        <div className="admin-table-wrap" data-tour={section === "productos" ? "product-list" : "catalog-table"}>
          <div className="admin-table__row admin-table__head" style={{ gridTemplateColumns: columns.template }}>
            {columns.labels.map((label) => <span key={label}>{label}</span>)}
          </div>
          {rows.map((row) => (
            <div key={String(row.id)} className="admin-table__row" style={{ gridTemplateColumns: columns.template }}>
              {cellsOf(section, row, serviceCategories).map((cell, index) => <div key={index}>{cell}</div>)}
              <details className="admin-menu">
                <summary aria-label="Acciones">⋯</summary>
                <div className="admin-menu__list">
                  <button type="button" onClick={() => openEdit(row)}>Editar</button>
                  <button type="button" onClick={() => archive(row)}>{section === "categorias" || section === "proveedores" ? "Eliminar" : "Archivar"}</button>
                </div>
              </details>
            </div>
          ))}
          {!rows.length ? <EmptyState title="Sin registros" text="Crea el primero con + Nuevo." action={<button className="admin-btn admin-btn--primary" type="button" onClick={openNew}>+ Nuevo</button>} /> : null}
        </div>
        {section === "productos" ? (
          <>
            <h2 style={{ marginTop: "1.5rem" }}>Ajuste de inventario</h2>
            <form className="admin-toolbar" data-tour="product-stock" onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              try {
                await api("/api/admin/products", { method: "POST", body: JSON.stringify({ kind: "stock", productId: stock.productId, locationId: stock.locationId, quantity: Number(stock.quantity), movementType: "adjust", reason: stock.reason }) });
                setStock({ productId: "", locationId: "", quantity: "", reason: "Ajuste" });
                setSaved(true);
                await load();
              } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudo registrar el movimiento.");
              }
            }}>
              <select required value={stock.productId} onChange={(e) => setStock({ ...stock, productId: e.target.value })}><option value="">Producto</option>{rows.map((row) => <option key={String(row.id)} value={String(row.id)}>{String(row.name)}</option>)}</select>
              <select required value={stock.locationId} onChange={(e) => setStock({ ...stock, locationId: e.target.value })}><option value="">Sede</option>{locations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select>
              <input required type="number" step="1" placeholder="Cantidad (+/−)" value={stock.quantity} onChange={(e) => setStock({ ...stock, quantity: e.target.value })} />
              <input value={stock.reason} onChange={(e) => setStock({ ...stock, reason: e.target.value })} placeholder="Motivo" />
              <button className="admin-btn admin-btn--primary" type="submit">Registrar movimiento</button>
            </form>
            <CreateOffer show={depsReady && !locations.length} kind="location" href="/admin/configuracion/sedes?nuevo=1" />
            <div className="admin-table-wrap" style={{ marginTop: "1rem" }}>
              <div className="admin-table__row admin-table__head"><span>Movimiento</span><span>Producto</span><span>Sede</span><span>Cantidad</span></div>
              {moves.map((row) => (
                <div key={String(row.id)} className="admin-table__row">
                  <div>{String(row.movement_type)}</div>
                  <div>{String(row.product_name)}</div>
                  <div>{String(row.location_name)}</div>
                  <div>{String(row.quantity)} · {String(row.reason || "")}</div>
                </div>
              ))}
              {!moves.length ? <div className="admin-table__empty">Sin movimientos de inventario.</div> : null}
            </div>
          </>
        ) : null}
      </div>
      {openForm ? (
        <div className="admin-drawer" onClick={() => setOpenForm(false)}>
          <div className="admin-drawer__panel" onClick={(event) => event.stopPropagation()}>
            <div className="admin-drawer__head">
              <h2 className="admin-header__title" style={{ margin: 0, fontSize: "1.25rem" }}>{editing ? `Editar ${title.toLowerCase()}` : `Nuevo: ${title.toLowerCase()}`}</h2>
              <CloseButton onClick={() => setOpenForm(false)} />
            </div>
            <form id="catalog-editor" className="admin-form-grid admin-drawer__body" data-tour="settings-form" onSubmit={submit}>
              {section === "servicios" ? (
                <div className="span-2">
                  <SegmentedControl tour="service-tabs" label="Secciones del servicio" value={serviceTab} onChange={setServiceTab} items={[{ id: "general", label: "General" }, { id: "precios", label: "Precios" }, { id: "reserva", label: "Reserva en línea" }, { id: "formularios", label: "Formularios" }]} />
                </div>
              ) : null}
              <Fields section={section} categoryKind={categoryKind} serviceTab={serviceTab} form={form} set={set} locations={locations} staff={staff} serviceCategories={serviceCategories} productCategories={productCategories} taxes={taxes} rooms={rooms} suppliers={suppliers} templates={templates} depsReady={depsReady} />
            </form>
            <div className="admin-drawer__foot">
              <button className="admin-btn" type="button" onClick={() => setOpenForm(false)}>Cancelar</button>
              <button className="admin-btn admin-btn--primary" type="submit" form="catalog-editor" data-tour="settings-save">Guardar</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Fields({ section, categoryKind, serviceTab, form, set, locations, staff, serviceCategories, productCategories, taxes, rooms, suppliers, templates, depsReady }: {
  section: string;
  categoryKind: string;
  serviceTab: string;
  form: Row;
  set: (key: string, value: unknown) => void;
  locations: Named[];
  staff: Row[];
  serviceCategories: Named[];
  productCategories: Named[];
  taxes: Named[];
  rooms: Named[];
  suppliers: Named[];
  templates: Named[];
  depsReady: boolean;
}) {
  if (section === "servicios") {
    return (
      <>
        {serviceTab === "general" ? (
          <>
            <Text label="Nombre" value={form.name} onChange={(value) => set("name", value)} required />
            <Select label="Categoría" value={form.categoryId} onChange={(value) => set("categoryId", value)} options={serviceCategories.map((row) => [row.id, row.name])} />
            <CreateOffer show={depsReady && !serviceCategories.length} kind="category" href="/admin/catalogo/categorias?nuevo=1" />
            <Text label="Duración (min)" value={form.durationMinutes || "60"} onChange={(value) => set("durationMinutes", Number(value))} />
            <Text label="Descripción" value={form.description} onChange={(value) => set("description", value)} />
          </>
        ) : null}
        {serviceTab === "precios" ? (
          <>
            <Text label="Precio" value={form.price || ""} onChange={(value) => set("price", value)} />
            <Select label="Impuesto" value={form.taxId} onChange={(value) => set("taxId", value)} options={taxes.map((row) => [row.id, row.name])} />
            <Text label="Depósito" value={form.depositAmount || ""} onChange={(value) => set("depositAmount", value)} />
          </>
        ) : null}
        {serviceTab === "reserva" ? (
          <>
            <Check label="Se puede reservar en línea" checked={form.isOnlineBookable !== false} onChange={(value) => set("isOnlineBookable", value)} />
            <Text label="Margen antes (min)" value={form.bufferBeforeMinutes || "0"} onChange={(value) => set("bufferBeforeMinutes", Number(value))} />
            <Text label="Margen después (min)" value={form.bufferAfterMinutes || "0"} onChange={(value) => set("bufferAfterMinutes", Number(value))} />
            <Checks label="Sedes" value={form.locationIds} options={locations.map((row) => [row.id, row.name])} onChange={(value) => set("locationIds", value)} />
            <Checks label="Profesionales" value={form.staffIds} options={staff.map((row) => [String(row.id), `${row.first_name} ${row.last_name}`])} onChange={(value) => set("staffIds", value)} />
            <Checks label="Salas" value={form.roomIds} options={rooms.map((row) => [row.id, row.name])} onChange={(value) => set("roomIds", value)} />
          </>
        ) : null}
        {serviceTab === "formularios" ? <Select label="Formulario requerido" value={form.requiredFormTemplateId} onChange={(value) => set("requiredFormTemplateId", value)} options={templates.map((row) => [row.id, row.name])} /> : null}
      </>
    );
  }
  if (section === "productos") {
    return (
      <>
        <Text label="Nombre" value={form.name} onChange={(value) => set("name", value)} required />
        <Text label="SKU" value={form.sku} onChange={(value) => set("sku", value)} />
        <Text label="Código de barras" value={form.barcode} onChange={(value) => set("barcode", value)} />
        <Text label="Tamaño" value={form.sizeLabel} onChange={(value) => set("sizeLabel", value)} />
        <Text label="Costo" value={form.cost} onChange={(value) => set("cost", value)} />
        <Text label="Precio" value={form.price} onChange={(value) => set("price", value)} />
        <Select label="Categoría" value={form.categoryId} onChange={(value) => set("categoryId", value)} options={productCategories.map((row) => [row.id, row.name])} />
        <Select label="Proveedor" value={form.supplierId} onChange={(value) => set("supplierId", value)} options={suppliers.map((row) => [row.id, row.name])} />
        <Select label="Impuesto" value={form.taxId} onChange={(value) => set("taxId", value)} options={taxes.map((row) => [row.id, row.name])} />
        <label className="admin-field span-2"><span className="admin-field__label">Descripción</span><textarea value={String(form.description || "")} onChange={(event) => set("description", event.target.value)} /></label>
      </>
    );
  }
  if (section === "paquetes") {
    return (
      <>
        <Text label="Nombre" value={form.name} onChange={(value) => set("name", value)} required />
        <Text label="Precio" value={form.price} onChange={(value) => set("price", value)} />
        <label className="admin-field span-2"><span className="admin-field__label">Descripción</span><textarea value={String(form.description || "")} onChange={(event) => set("description", event.target.value)} /></label>
      </>
    );
  }
  if (section === "membresias") {
    return (
      <>
        <Text label="Nombre" value={form.name} onChange={(value) => set("name", value)} required />
        <Text label="Precio" value={form.price} onChange={(value) => set("price", value)} />
        <Select label="Cobro" value={form.interval || "month"} onChange={(value) => set("interval", value)} options={[["month", "Mensual"], ["year", "Anual"]]} />
        <label className="admin-field span-2"><span className="admin-field__label">Descripción</span><textarea value={String(form.description || "")} onChange={(event) => set("description", event.target.value)} /></label>
      </>
    );
  }
  if (section === "proveedores") {
    return (
      <>
        <Text label="Nombre" value={form.name} onChange={(value) => set("name", value)} required />
        <Text label="Email" value={form.email} onChange={(value) => set("email", value)} />
        <Text label="Teléfono" value={form.phone} onChange={(value) => set("phone", value)} />
        <Text label="Notas" value={form.notes} onChange={(value) => set("notes", value)} />
      </>
    );
  }
  return (
    <>
      <Text label="Nombre" value={form.name} onChange={(value) => set("name", value)} required />
      {categoryKind === "servicios" ? <Check label="Activa" checked={form.isActive !== false} onChange={(value) => set("isActive", value)} /> : null}
    </>
  );
}

function Text({ label, value, onChange, required }: { label: string; value: unknown; onChange: (value: string) => void; required?: boolean }) {
  return (
    <label className="admin-field">
      <span className="admin-field__label">{label}{required ? <span className="admin-req"> *</span> : null}</span>
      <input required={required} value={value == null ? "" : String(value)} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: unknown; onChange: (value: string) => void; options: string[][] }) {
  return (
    <label className="admin-field">
      <span className="admin-field__label">{label}</span>
      <select value={value == null ? "" : String(value)} onChange={(event) => onChange(event.target.value)}>
        <option value="">—</option>
        {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="admin-check"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />{label}</label>;
}

function Checks({ label, value, options, onChange }: { label: string; value: unknown; options: string[][]; onChange: (value: string[]) => void }) {
  const selected = Array.isArray(value) ? value.map(String) : [];
  if (!options.length) return null;
  return (
    <fieldset className="admin-field span-2">
      <legend>{label}</legend>
      {options.map(([id, name]) => (
        <label key={id} className="admin-check">
          <input type="checkbox" checked={selected.includes(id)} onChange={(event) => onChange(event.target.checked ? [...selected, id] : selected.filter((item) => item !== id))} />
          {name}
        </label>
      ))}
    </fieldset>
  );
}

function settingsPath(section: string, categoryKind: string) {
  if (section === "proveedores") return "suppliers";
  return categoryKind === "productos" ? "product-categories" : "service-categories";
}

function settingsBody(section: string, categoryKind: string, form: Row) {
  if (section === "proveedores") return { name: form.name, email: form.email || null, phone: form.phone || null, notes: form.notes || null };
  if (categoryKind === "productos") return { name: form.name, sortOrder: Number(form.sortOrder || 0) };
  return { name: form.name, sortOrder: Number(form.sortOrder || 0), isActive: form.isActive !== false };
}

function formFrom(section: string, row: Row): Row {
  if (section === "servicios") {
    return {
      name: row.name, categoryId: row.category_id, durationMinutes: row.duration_minutes, price: row.price, taxId: row.tax_id,
      description: row.description, isOnlineBookable: row.is_online_bookable, depositAmount: row.deposit_amount,
      bufferBeforeMinutes: row.buffer_before_minutes, bufferAfterMinutes: row.buffer_after_minutes,
      requiredFormTemplateId: row.required_form_template_id, locationIds: row.locationIds || [], staffIds: row.staffIds || [], roomIds: row.roomIds || [],
    };
  }
  if (section === "productos") {
    return {
      name: row.name, sku: row.sku, barcode: row.barcode, sizeLabel: row.size_label, cost: row.cost, price: row.price,
      description: row.description, supplierId: row.supplier_id, categoryId: row.category_id, taxId: row.tax_id,
    };
  }
  if (section === "membresias") return { name: row.name, price: row.price, interval: row.interval_unit || "month", description: row.description };
  if (section === "paquetes") return { name: row.name, price: row.price, description: row.description };
  if (section === "proveedores") return { name: row.name, email: row.email, phone: row.phone, notes: row.notes };
  return { name: row.name, sortOrder: row.sort_order || 0, isActive: row.is_active !== false };
}

function columnsOf(section: string) {
  if (section === "servicios") return { labels: ["Nombre", "Duración", "Precio", "Categoría", "Acciones"], template: "minmax(0,1.4fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,1fr) 4.5rem" };
  if (section === "productos") return { labels: ["Producto", "SKU", "Precio", "Stock", "Acciones"], template: "minmax(0,1.4fr) minmax(0,0.8fr) minmax(0,0.7fr) minmax(0,1.2fr) 4.5rem" };
  if (section === "proveedores") return { labels: ["Nombre", "Contacto", "Acciones"], template: "minmax(0,1.2fr) minmax(0,1fr) 4.5rem" };
  return { labels: ["Nombre", "Detalle", "Acciones"], template: "minmax(0,1.4fr) minmax(0,1fr) 4.5rem" };
}

function cellsOf(section: string, row: Row, categories: Named[]) {
  if (section === "servicios") {
    const category = categories.find((item) => item.id === row.category_id);
    return [String(row.name || ""), `${row.duration_minutes || "—"} min`, `$${Number(row.price || 0).toFixed(2)}`, category?.name || String(row.category_name || "—")];
  }
  if (section === "productos") {
    const stockRows = (row.stock as { quantity: number; location_name: string }[]) || [];
    return [String(row.name || ""), String(row.sku || "—"), `$${Number(row.price || 0).toFixed(2)}`, stockRows.length ? stockRows.map((item) => `${item.location_name}: ${item.quantity}`).join(" · ") : "Sin existencias"];
  }
  if (section === "membresias") return [String(row.name || ""), `${row.interval_unit === "year" ? "Anual" : "Mensual"} · $${Number(row.price || 0).toFixed(2)}`];
  if (section === "paquetes") return [String(row.name || ""), `$${Number(row.price || 0).toFixed(2)}`];
  if (section === "proveedores") return [String(row.name || ""), [row.email, row.phone].filter(Boolean).join(" · ") || "—"];
  return [String(row.name || ""), "—"];
}

function hintOf(section: string) {
  if (section === "servicios") return "Lo que cobras en consulta. Aparece en Cobrar y en la reserva en línea.";
  if (section === "productos") return "Inventario de la clínica, con existencias por sede. No es la tienda del sitio web.";
  if (section === "paquetes") return "Un precio cerrado que vendes en Cobrar.";
  if (section === "membresias") return "Un plan que se cobra cada mes o cada año.";
  if (section === "categorias") return "Sirven para ordenar servicios y productos. Elige cuál estás editando.";
  return "A quién le compras. Luego lo asignas al crear un producto.";
}
