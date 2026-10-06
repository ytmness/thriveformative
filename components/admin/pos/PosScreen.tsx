"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { useClinicScope } from "@/components/admin/clinic/ClinicScope";
import { CreateOffer } from "@/components/admin/tutorial";

type Item = { itemType: string; referenceId?: string; description: string; quantity: number; unitPrice?: number; taxRate?: number; imageUrl?: string | null };
type Catalog = {
  id: string;
  name: string;
  price?: string | number;
  tax_rate?: string | number | null;
  locationIds?: string[];
  image_url?: string | null;
  color?: string | null;
  duration_minutes?: number | null;
  description?: string | null;
  size_label?: string | null;
  interval_unit?: string | null;
};
type Method = { id: string; key: string; name: string; is_active?: boolean };

export default function PosScreen() {
  const [tab, setTab] = useState("service");
  const [services, setServices] = useState<Catalog[]>([]);
  const [products, setProducts] = useState<Catalog[]>([]);
  const [packages, setPackages] = useState<Catalog[]>([]);
  const [memberships, setMemberships] = useState<Catalog[]>([]);
  const [patients, setPatients] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
  const [patientId, setPatientId] = useState("");
  const [walkIn, setWalkIn] = useState("");
  const [newPatient, setNewPatient] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [cart, setCart] = useState<Item[]>([]);
  const [method, setMethod] = useState("");
  const [methods, setMethods] = useState<Method[]>([]);
  const [methodsReady, setMethodsReady] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [saleId, setSaleId] = useState<string | null>(null);
  const [terminalSale, setTerminalSale] = useState<string | null>(null);
  const [terminal, setTerminal] = useState<TerminalLink | null>(null);
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const scope = useClinicScope();
  const [catalogReady, setCatalogReady] = useState(false);
  const stripeRef = useRef<{ confirmPayment: (opts: { elements: unknown; redirect: string }) => Promise<{ error?: { message?: string }; paymentIntent?: { id: string } }> } | null>(null);
  const elementsRef = useRef<unknown>(null);

  useEffect(() => {
    api<{ rows: Catalog[] }>("/api/admin/settings/services").then((r) => setServices(r.rows.filter((row) => (row as { is_active?: boolean }).is_active !== false))).catch(() => undefined).finally(() => setCatalogReady(true));
    api<{ rows: Catalog[] }>("/api/admin/products").then((r) => setProducts(r.rows)).catch(() => undefined);
    api<{ rows: Catalog[] }>("/api/admin/products?kind=packages").then((r) => setPackages(r.rows)).catch(() => undefined);
    api<{ rows: Catalog[] }>("/api/admin/products?kind=memberships").then((r) => setMemberships(r.rows)).catch(() => undefined);
    api<{ rows: { id: string; firstName: string; lastName: string }[] }>(`/api/admin/patients?pageSize=100&${scope.query}`).then((r) => setPatients(r.rows)).catch(() => undefined);
    api<{ rows: Method[] }>("/api/admin/settings/payment-methods").then((r) => {
      const active = r.rows.filter((row) => row.is_active !== false);
      setMethods(active);
      const preferred = active.find((row) => row.key === "cash") || active[0];
      if (preferred) setMethod((current) => current || preferred.key);
    }).catch(() => undefined).finally(() => setMethodsReady(true));
    api<{ rows: { id: string; name: string }[] }>("/api/admin/settings/locations").then((r) => {
      setLocations(r.rows);
    }).catch(() => undefined);
  }, [scope.query]);

  useEffect(() => {
    const sites = scope.visible.length ? scope.visible : locations;
    const next = scope.locationId && sites.some((row) => row.id === scope.locationId) ? scope.locationId : sites[0]?.id || "";
    if (next) setLocationId(next);
  }, [scope.locationId, scope.visible, locations]);

  const siteChoices = scope.visible.length ? scope.visible : locations;
  const scopedServices = services.filter((item) => {
    const ids = item.locationIds || [];
    if (!ids.length) return true;
    if (locationId) return ids.includes(locationId);
    return ids.some((id) => siteChoices.some((site) => site.id === id));
  });
  const catalog = tab === "service" ? scopedServices : tab === "product" ? products : tab === "package" ? packages : memberships;
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0), [cart]);
  const taxTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity * (item.taxRate || 0) / 100, 0), [cart]);
  const total = subtotal + taxTotal;
  const methodName = methods.find((row) => row.key === method)?.name || "Método de pago";

  function add(item: Catalog) {
    const type = tab === "service" ? "service" : tab === "product" ? "product" : tab === "package" ? "package" : "membership";
    setCart((current) => {
      const index = current.findIndex((row) => row.referenceId === item.id && row.itemType === type);
      if (index >= 0) {
        return current.map((row, i) => (i === index ? { ...row, quantity: row.quantity + 1 } : row));
      }
      return [...current, { itemType: type, referenceId: item.id, description: item.name, quantity: 1, unitPrice: Number(item.price || 0), taxRate: Number(item.tax_rate || 0), imageUrl: item.image_url || null }];
    });
    setReview(false);
  }

  function askCheckout() {
    if (!cart.length) {
      setMessage("Agrega al menos un servicio o producto antes de cobrar.");
      return;
    }
    if (cart.some((item) => item.itemType === "product") && !locationId) {
      setMessage("Elige la sede para descontar el inventario.");
      return;
    }
    if (cart.some((item) => item.itemType === "membership") && !patientId && !newPatient) {
      setMessage("La membresía necesita un paciente.");
      return;
    }
    if (!method) {
      setMessage("Elige un método de pago.");
      return;
    }
    setMessage(null);
    setReview(true);
  }

  async function checkout() {
    setMessage(null);
    try {
      let buyer = patientId || null;
      if (newPatient) {
        const created = await api<{ patient: { id: string } }>("/api/admin/patients", { method: "POST", body: JSON.stringify({ firstName, lastName }) });
        buyer = created.patient.id;
      }
      const items = cart.map(({ itemType, referenceId, description, quantity, unitPrice }) => ({ itemType, referenceId, description, quantity, unitPrice }));
      const amount = Math.round(total * 100) / 100;
      const result = await api<{
        sale: { id: string };
        terminal: { checkoutId: string; deviceName: string; status: string } | null;
        stripe: { clientSecret: string | null; paymentIntentId: string | null } | null;
      }>("/api/admin/sales", {
        method: "POST",
        body: JSON.stringify({ patientId: buyer, walkInName: walkIn || null, locationId: locationId || null, items, payment: { methodKey: method, amount } }),
      });
      setSaleId(result.sale.id);
      if (result.terminal?.checkoutId) {
        setTerminalSale(result.sale.id);
        setMessage(`Cobro enviado a ${result.terminal.deviceName}. El cliente paga en la terminal.`);
      } else if (result.stripe?.clientSecret) {
        setClientSecret(result.stripe.clientSecret);
        setMessage("Confirma el cobro con Stripe.");
      } else {
        setMessage("Venta registrada.");
        setCart([]);
        setReview(false);
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    }
  }

  useEffect(() => {
    if (method !== "card") return;
    let stop = false;
    const load = () => api<TerminalLink>("/api/admin/square/terminal").then((row) => {
      if (!stop) setTerminal(row);
    }).catch((error) => {
      if (!stop && !terminalSale) setMessage(error instanceof Error ? error.message : "No se pudo consultar la terminal.");
    });
    load();
    if (!terminal?.code) return () => { stop = true; };
    const timer = window.setInterval(load, 3000);
    return () => { stop = true; window.clearInterval(timer); };
  }, [method, terminal?.code, terminalSale]);

  useEffect(() => {
    if (!terminalSale) return;
    let stop = false;
    const tick = async () => {
      const row = await api<{ status: string }>(`/api/admin/sales/${terminalSale}`, {
        method: "POST",
        body: JSON.stringify({ action: "terminal" }),
      });
      if (stop) return;
      if (row.status === "COMPLETED") {
        setMessage("Pago confirmado en la terminal.");
        setTerminalSale(null);
        setCart([]);
        setReview(false);
      } else if (row.status === "CANCELED") {
        setMessage("La terminal canceló el cobro. La venta quedó abierta.");
        setTerminalSale(null);
        setReview(false);
      }
    };
    tick().catch((error) => { if (!stop) setMessage(error instanceof Error ? error.message : "Error"); });
    const timer = window.setInterval(() => {
      tick().catch((error) => { if (!stop) setMessage(error instanceof Error ? error.message : "Error"); });
    }, 2000);
    return () => { stop = true; window.clearInterval(timer); };
  }, [terminalSale]);

  async function pairTerminal() {
    setMessage(null);
    try {
      const row = await api<{ code: string; status: string }>("/api/admin/square/terminal", {
        method: "POST",
        body: JSON.stringify({ action: "code", name: "Recepción" }),
      });
      setTerminal((current) => ({ ...(current || { deviceId: null, deviceName: null, devices: [] }), code: row }));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    }
  }

  async function chooseTerminal(deviceId: string) {
    try {
      const row = await api<{ device: { id: string; name: string } }>("/api/admin/square/terminal", {
        method: "POST",
        body: JSON.stringify({ action: "select", deviceId }),
      });
      setTerminal((current) => current ? { ...current, deviceId: row.device.id, deviceName: row.device.name, code: null } : current);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    }
  }

  async function cancelTerminal() {
    if (!terminalSale) return;
    try {
      await api(`/api/admin/sales/${terminalSale}`, { method: "POST", body: JSON.stringify({ action: "terminal-cancel" }) });
      setMessage("Cancelación enviada a la terminal.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error");
    }
  }

  useEffect(() => {
    if (!clientSecret) return;
    let cancelled = false;
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) return;
    loadStripe().then((StripeFactory) => {
      if (cancelled) return;
      const stripe = StripeFactory(key);
      const elements = stripe.elements({ clientSecret });
      elements.create("payment").mount("#stripe-payment");
      stripeRef.current = stripe;
      elementsRef.current = elements;
    }).catch(() => setMessage("No se pudo cargar Stripe."));
    return () => { cancelled = true; };
  }, [clientSecret]);

  async function confirmStripe() {
    const stripe = stripeRef.current;
    const elements = elementsRef.current;
    if (!stripe || !elements || !saleId) return;
    const result = await stripe.confirmPayment({ elements, redirect: "if_required" });
    if (result.error) { setMessage(result.error.message || "Pago rechazado"); return; }
    await api(`/api/admin/sales/${saleId}`, { method: "POST", body: JSON.stringify({ action: "confirm", paymentIntentId: result.paymentIntent?.id }) });
    setMessage("Pago confirmado.");
    setClientSecret(null);
    setCart([]);
    setReview(false);
  }

  const buyerLabel = patientId ? `${patients.find((p) => p.id === patientId)?.firstName || ""} ${patients.find((p) => p.id === patientId)?.lastName || ""}`.trim() : walkIn || "Mostrador";

  return (
    <>
      <header className="admin-header">
        <p className="admin-header__eyebrow">Punto de venta</p>
        <h1 className="admin-header__title">Cobrar</h1>
        <p className="admin-header__desc">Toca una ficha para agregarla al ticket. Para crear o editar el catálogo, ve a Servicios y productos.</p>
      </header>
      <div className="admin-tabs" data-tour="sales-tabs">
        {[["service", "Servicios"], ["product", "Productos"], ["package", "Paquetes"], ["membership", "Membresías"]].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="admin-pos">
        <div className="pos-menu" data-tour="sales-catalog">
          {catalog.map((item) => {
            const type = tab === "service" ? "service" : tab === "product" ? "product" : tab === "package" ? "package" : "membership";
            const qty = cart.filter((row) => row.referenceId === item.id && row.itemType === type).reduce((sum, row) => sum + row.quantity, 0);
            const price = Number(item.price || 0).toFixed(2);
            return (
              <button key={item.id} type="button" className="pos-card" onClick={() => add(item)} aria-label={`Agregar ${item.name}, $${price}`}>
                <span className="pos-card__photo" style={{ background: item.color || undefined }}>
                  <img src={pictureOf(item, tab)} alt="" />
                  <span className="pos-card__price">${price}</span>
                  {qty ? <span className="pos-card__qty">{qty}</span> : null}
                </span>
                <span className="pos-card__name">{item.name}</span>
                <span className="pos-card__note">{noteOf(item, tab)}</span>
              </button>
            );
          })}
          <CreateOffer show={catalogReady && !catalog.length && tab === "service"} kind="service" href="/admin/catalogo/servicios?nuevo=1" />
          <CreateOffer show={catalogReady && !catalog.length && tab === "product"} kind="product" href="/admin/catalogo/productos?nuevo=1" />
          {catalogReady && !catalog.length && tab === "package" ? <p className="admin-table__empty">No hay paquetes. Créalos en Servicios y productos.</p> : null}
          {catalogReady && !catalog.length && tab === "membership" ? <p className="admin-table__empty">No hay membresías. Créalas en Servicios y productos.</p> : null}
        </div>
        <aside className="admin-checkout" data-tour="sales-pay">
          <label className="admin-field">Paciente<select value={patientId} onChange={(e) => setPatientId(e.target.value)}><option value="">Mostrador</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select></label>
          <label className="admin-field">Sede<select value={locationId} onChange={(e) => setLocationId(e.target.value)}><option value="">—</option>{siteChoices.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
          <label className="admin-field">Sin paciente<input value={walkIn} placeholder="Nombre walk-in" onChange={(e) => setWalkIn(e.target.value)} /></label>
          <label className="admin-check"><input type="checkbox" checked={newPatient} onChange={(e) => setNewPatient(e.target.checked)} />Crear paciente ahora</label>
          {newPatient ? <><label className="admin-field">Nombre<input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label><label className="admin-field">Apellido<input value={lastName} onChange={(e) => setLastName(e.target.value)} /></label></> : null}
          <label className="admin-field">Cobro
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {!methods.length ? <option value="">Sin métodos</option> : null}
              {methods.map((row) => <option key={row.id} value={row.key}>{row.name}</option>)}
            </select>
          </label>
          {methodsReady && !methods.length ? <p className="admin-field__hint">Agrega un método en Configuración → Métodos de pago.</p> : null}
          {method === "card" ? (
            <div className="pos-terminal">
              {terminal?.deviceName ? <p>Terminal lista: {terminal.deviceName}</p> : <p>Vincula la terminal de Square para cobrar con tarjeta.</p>}
              {terminal?.code ? <p className="pos-terminal__code">{terminal.code.code}</p> : null}
              {terminal?.code ? <p>Escribe este código en la terminal. Se vincula sola.</p> : null}
              {(terminal?.devices.length || 0) > 1 ? (
                <label className="admin-field">Terminal
                  <select value={terminal?.deviceId || ""} onChange={(e) => chooseTerminal(e.target.value)}>
                    <option value="">Elige</option>
                    {terminal?.devices.map((device) => <option key={device.id} value={device.id}>{device.name}</option>)}
                  </select>
                </label>
              ) : null}
              <button className="admin-btn" type="button" onClick={pairTerminal}>{terminal?.code ? "Generar otro código" : "Vincular terminal"}</button>
            </div>
          ) : null}
          {cart.map((item, index) => (
            <p key={index} className="admin-checkout__line">
              <span className="admin-checkout__item">
                {item.imageUrl ? <img className="admin-checkout__photo" src={item.imageUrl} alt="" /> : null}
                <span>{item.description}</span>
              </span>
              <span className="pos-qty">
                <button type="button" aria-label="Quitar uno" onClick={() => { setCart(cart.flatMap((row, i) => (i !== index ? [row] : row.quantity > 1 ? [{ ...row, quantity: row.quantity - 1 }] : []))); setReview(false); }}>−</button>
                <span>{item.quantity}</span>
                <button type="button" aria-label="Agregar uno" onClick={() => { setCart(cart.map((row, i) => (i === index ? { ...row, quantity: row.quantity + 1 } : row))); setReview(false); }}>+</button>
              </span>
            </p>
          ))}
          <div className="admin-checkout__total">
            <p className="admin-checkout__line"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></p>
            <p className="admin-checkout__line"><span>Impuestos</span><span>${taxTotal.toFixed(2)}</span></p>
            <p className="admin-checkout__line admin-checkout__line--total"><span>Total</span><span>${total.toFixed(2)}</span></p>
          </div>
          {terminalSale ? (
            <div className="admin-toolbar">
              <button className="admin-btn" type="button" onClick={cancelTerminal}>Cancelar en la terminal</button>
            </div>
          ) : review ? (
            <div className="admin-review" role="region" aria-label="Revisar cobro">
              <p>Revisa la venta antes de registrarla.</p>
              <p>{buyerLabel} · {methodName}</p>
              {method === "card" ? <p>El ticket se manda a la terminal. El cliente paga ahí.</p> : null}
              {cart.map((item, index) => <p key={index}>{item.description} × {item.quantity} · ${((item.unitPrice || 0) * item.quantity).toFixed(2)}</p>)}
              <div className="admin-toolbar">
                <button className="admin-btn admin-btn--primary" type="button" onClick={checkout}>Confirmar cobro</button>
                <button className="admin-btn" type="button" onClick={() => setReview(false)}>Volver</button>
              </div>
            </div>
          ) : <button className="admin-btn admin-btn--primary" type="button" onClick={askCheckout}>Cobrar</button>}
          {clientSecret ? <><div id="stripe-payment" /><button className="admin-btn" type="button" onClick={confirmStripe}>Confirmar Stripe</button></> : null}
          {message ? <p className="admin-notice" role="status">{message}</p> : null}
        </aside>
      </div>
    </>
  );
}

type TerminalLink = {
  deviceId: string | null;
  deviceName: string | null;
  devices: { id: string; name: string; status: string }[];
  code: { code: string; status: string } | null;
};

function pictureOf(item: Catalog, tab: string) {
  if (item.image_url) return item.image_url;
  const name = item.name.toLowerCase();
  if (name.includes("consulta")) return "/pos/consulta.svg";
  if (name.includes("seguimiento")) return "/pos/seguimiento.svg";
  if (name.includes("lectura") || name.includes("lab")) return "/pos/labs.svg";
  if (name.includes("hábito") || name.includes("habito")) return "/pos/habitos.svg";
  if (tab === "product") return "/pos/producto.svg";
  if (tab === "package") return "/pos/paquete.svg";
  if (tab === "membership") return "/pos/membresia.svg";
  return "/pos/consulta.svg";
}

function noteOf(item: Catalog, tab: string) {
  if (tab === "service" && item.duration_minutes) return `${item.duration_minutes} min`;
  if (tab === "product" && item.size_label) return item.size_label;
  if (tab === "membership") return item.interval_unit === "year" ? "Cada año" : "Cada mes";
  if (item.description) return String(item.description);
  return "Toca para agregar";
}

function loadStripe(): Promise<(key: string) => { elements: (opts: { clientSecret: string }) => { create: (type: string) => { mount: (sel: string) => void } }; confirmPayment: (opts: { elements: unknown; redirect: string }) => Promise<{ error?: { message?: string }; paymentIntent?: { id: string } }> }> {
  return new Promise((resolve, reject) => {
    const existing = (window as unknown as { Stripe?: (key: string) => never }).Stripe;
    if (existing) { resolve(existing as never); return; }
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = () => resolve((window as unknown as { Stripe: (key: string) => never }).Stripe as never);
    script.onerror = () => reject(new Error("No se pudo cargar Stripe"));
    document.head.appendChild(script);
  });
}
