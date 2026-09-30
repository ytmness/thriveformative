"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { CreateOffer } from "@/components/admin/tutorial";

type Item = { itemType: string; referenceId?: string; description: string; quantity: number; unitPrice?: number; taxRate?: number };
type Catalog = { id: string; name: string; price?: string | number; tax_rate?: string | number | null };
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
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const stripeRef = useRef<{ confirmPayment: (opts: { elements: unknown; redirect: string }) => Promise<{ error?: { message?: string }; paymentIntent?: { id: string } }> } | null>(null);
  const elementsRef = useRef<unknown>(null);

  useEffect(() => {
    api<{ rows: Catalog[] }>("/api/admin/settings/services").then((r) => setServices(r.rows.filter((row) => (row as { is_active?: boolean }).is_active !== false))).catch(() => undefined).finally(() => setCatalogReady(true));
    api<{ rows: Catalog[] }>("/api/admin/products").then((r) => setProducts(r.rows)).catch(() => undefined);
    api<{ rows: Catalog[] }>("/api/admin/products?kind=packages").then((r) => setPackages(r.rows)).catch(() => undefined);
    api<{ rows: Catalog[] }>("/api/admin/products?kind=memberships").then((r) => setMemberships(r.rows)).catch(() => undefined);
    api<{ rows: { id: string; firstName: string; lastName: string }[] }>("/api/admin/patients?pageSize=100").then((r) => setPatients(r.rows)).catch(() => undefined);
    api<{ rows: Method[] }>("/api/admin/settings/payment-methods").then((r) => {
      const active = r.rows.filter((row) => row.is_active !== false);
      setMethods(active);
      const preferred = active.find((row) => row.key === "cash") || active[0];
      if (preferred) setMethod((current) => current || preferred.key);
    }).catch(() => undefined).finally(() => setMethodsReady(true));
    api<{ rows: { id: string; name: string }[] }>("/api/admin/settings/locations").then((r) => {
      setLocations(r.rows);
      if (r.rows[0]) setLocationId((current) => current || r.rows[0].id);
    }).catch(() => undefined);
  }, []);

  const catalog = tab === "service" ? services : tab === "product" ? products : tab === "package" ? packages : memberships;
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0), [cart]);
  const taxTotal = useMemo(() => cart.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity * (item.taxRate || 0) / 100, 0), [cart]);
  const total = subtotal + taxTotal;
  const methodName = methods.find((row) => row.key === method)?.name || "Método de pago";

  function add(item: Catalog) {
    const type = tab === "service" ? "service" : tab === "product" ? "product" : tab === "package" ? "package" : "membership";
    setCart([...cart, { itemType: type, referenceId: item.id, description: item.name, quantity: 1, unitPrice: Number(item.price || 0), taxRate: Number(item.tax_rate || 0) }]);
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
      const result = await api<{ sale: { id: string }; stripe: { clientSecret: string | null; paymentIntentId: string | null } | null }>("/api/admin/sales", {
        method: "POST",
        body: JSON.stringify({ patientId: buyer, walkInName: walkIn || null, locationId: locationId || null, items, payment: { methodKey: method, amount } }),
      });
      setSaleId(result.sale.id);
      if (result.stripe?.clientSecret) {
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
        <p className="admin-header__desc">Elige un servicio o producto, revisa el total y confirma. Para crear o editar el catálogo, ve a Servicios y productos.</p>
      </header>
      <div className="admin-tabs" data-tour="sales-tabs">
        {[["service", "Servicios"], ["product", "Productos"], ["package", "Paquetes"], ["membership", "Membresías"]].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="admin-pos">
        <div data-tour="sales-catalog">
          {catalog.map((item) => (
            <button key={item.id} type="button" className="admin-table__row" onClick={() => add(item)}>
              <span className="admin-table__cell-title">{item.name}</span>
              <span>${Number(item.price || 0).toFixed(2)}</span>
            </button>
          ))}
          <CreateOffer show={catalogReady && !catalog.length && tab === "service"} kind="service" href="/admin/catalogo/servicios?nuevo=1" />
          <CreateOffer show={catalogReady && !catalog.length && tab === "product"} kind="product" href="/admin/catalogo/productos?nuevo=1" />
          {catalogReady && !catalog.length && tab === "package" ? <p className="admin-table__empty">No hay paquetes. Créalos en Servicios y productos.</p> : null}
          {catalogReady && !catalog.length && tab === "membership" ? <p className="admin-table__empty">No hay membresías. Créalas en Servicios y productos.</p> : null}
        </div>
        <aside className="admin-checkout" data-tour="sales-pay">
          <label className="admin-field">Paciente<select value={patientId} onChange={(e) => setPatientId(e.target.value)}><option value="">Mostrador</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select></label>
          <label className="admin-field">Sede<select value={locationId} onChange={(e) => setLocationId(e.target.value)}><option value="">—</option>{locations.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
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
          {cart.map((item, index) => (
            <p key={index} className="admin-checkout__line">
              <span>{item.description} × {item.quantity}</span>
              <button type="button" className="admin-btn" onClick={() => { setCart(cart.filter((_, i) => i !== index)); setReview(false); }}>Quitar</button>
            </p>
          ))}
          <div className="admin-checkout__total">
            <p className="admin-checkout__line"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></p>
            <p className="admin-checkout__line"><span>Impuestos</span><span>${taxTotal.toFixed(2)}</span></p>
            <p className="admin-checkout__line admin-checkout__line--total"><span>Total</span><span>${total.toFixed(2)}</span></p>
          </div>
          {review ? (
            <div className="admin-review" role="region" aria-label="Revisar cobro">
              <p>Revisa la venta antes de registrarla.</p>
              <p>{buyerLabel} · {methodName}</p>
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
