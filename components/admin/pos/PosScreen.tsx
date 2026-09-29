"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/components/admin/clinic/client";
import { CreateOffer } from "@/components/admin/tutorial";

type Item = { itemType: string; referenceId?: string; description: string; quantity: number; unitPrice?: number };
type Catalog = { id: string; name: string; price?: string | number };

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
  const [method, setMethod] = useState("cash");
  const [message, setMessage] = useState<string | null>(null);
  const [review, setReview] = useState(false);
  const [sales, setSales] = useState<{ id: string; sale_number: string; status: string; total: string | number; first_name?: string | null; last_name?: string | null }[]>([]);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [saleId, setSaleId] = useState<string | null>(null);
  const [catalogReady, setCatalogReady] = useState(false);
  const stripeRef = useRef<{ confirmPayment: (opts: { elements: unknown; redirect: string }) => Promise<{ error?: { message?: string }; paymentIntent?: { id: string } }> } | null>(null);
  const elementsRef = useRef<unknown>(null);

  useEffect(() => {
    api<{ rows: Catalog[] }>("/api/admin/settings/services").then((r) => setServices(r.rows)).catch(() => undefined).finally(() => setCatalogReady(true));
    api<{ rows: Catalog[] }>("/api/admin/products").then((r) => setProducts(r.rows)).catch(() => undefined);
    api<{ rows: Catalog[] }>("/api/admin/products?kind=packages").then((r) => setPackages(r.rows)).catch(() => undefined);
    api<{ rows: Catalog[] }>("/api/admin/products?kind=memberships").then((r) => setMemberships(r.rows)).catch(() => undefined);
    api<{ rows: { id: string; firstName: string; lastName: string }[] }>("/api/admin/patients?pageSize=100").then((r) => setPatients(r.rows)).catch(() => undefined);
    api<{ rows: { id: string; sale_number: string; status: string; total: string | number; first_name?: string | null; last_name?: string | null }[] }>("/api/admin/sales").then((r) => setSales(r.rows)).catch(() => undefined);
  }, []);

  const catalog = tab === "service" ? services : tab === "product" ? products : tab === "package" ? packages : tab === "membership" ? memberships : [];
  const total = useMemo(() => cart.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantity, 0), [cart]);

  function add(item: Catalog) {
    const type = tab === "service" ? "service" : tab === "product" ? "product" : tab === "package" ? "package" : "membership";
    setCart([...cart, { itemType: type, referenceId: item.id, description: item.name, quantity: 1, unitPrice: Number(item.price || 0) }]);
  }

  function askCheckout() {
    if (tab !== "gift_card" && tab !== "credit" && !cart.length) {
      setMessage("Agrega al menos un servicio o producto antes de cobrar.");
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
      const items = tab === "gift_card" || tab === "credit"
        ? [{ itemType: tab, description: tab === "gift_card" ? "Tarjeta de regalo" : "Abono a cuenta", quantity: 1, unitPrice: total || Number(prompt("Monto") || 0) }]
        : cart;
      const result = await api<{ sale: { id: string }; stripe: { clientSecret: string | null; paymentIntentId: string | null } | null }>("/api/admin/sales", {
        method: "POST",
        body: JSON.stringify({ patientId: buyer, walkInName: walkIn || null, items, payment: { methodKey: method, amount: items.reduce((s, i) => s + (i.unitPrice || 0) * i.quantity, 0) } }),
      });
      setSaleId(result.sale.id);
      if (result.stripe?.clientSecret) {
        setClientSecret(result.stripe.clientSecret);
        setMessage("Confirma el cobro con Stripe.");
      } else {
        setMessage("Venta registrada.");
        setCart([]);
        setReview(false);
        api<{ rows: { id: string; sale_number: string; status: string; total: string | number; first_name?: string | null; last_name?: string | null }[] }>("/api/admin/sales").then((r) => setSales(r.rows)).catch(() => undefined);
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
  }

  return (
    <>
      <header className="admin-header"><p className="admin-header__eyebrow">Punto de venta</p><h1 className="admin-header__title">Ventas</h1></header>
      <div className="admin-tabs">
        {[["service", "Servicios"], ["product", "Productos"], ["package", "Paquetes"], ["membership", "Membresías"], ["gift_card", "Gift cards"], ["credit", "Abonos"]].map(([id, label]) => (
          <button key={id} type="button" className={tab === id ? "is-active" : ""} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>
      <div className="admin-pos">
        <div>
          {catalog.map((item) => <button key={item.id} type="button" className="admin-table__row" onClick={() => add(item)}><span className="admin-table__cell-title">{item.name}</span><span>${Number(item.price || 0)}</span></button>)}
          <CreateOffer
            show={catalogReady && !catalog.length && tab === "service"}
            what="un servicio"
            href="/admin/configuracion/servicios?nuevo=1"
            how="En Servicios, pulsa + Nuevo, completa nombre, duración y precio, y guarda. Luego vuelve a Ventas."
          />
          <CreateOffer
            show={catalogReady && !catalog.length && tab === "product"}
            what="un producto"
            href="/admin/productos"
            how="En Productos, completa el formulario de arriba y guarda. Luego vuelve a Ventas."
          />
        </div>
        <aside className="admin-metric">
          <label className="admin-field">Paciente<select value={patientId} onChange={(e) => setPatientId(e.target.value)}><option value="">Mostrador</option>{patients.map((p) => <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>)}</select></label>
          <label className="admin-field">Sin paciente<input value={walkIn} placeholder="Nombre walk-in" onChange={(e) => setWalkIn(e.target.value)} /></label>
          <label className="admin-check"><input type="checkbox" checked={newPatient} onChange={(e) => setNewPatient(e.target.checked)} />Crear paciente ahora</label>
          {newPatient ? <><label className="admin-field">Nombre<input value={firstName} onChange={(e) => setFirstName(e.target.value)} /></label><label className="admin-field">Apellido<input value={lastName} onChange={(e) => setLastName(e.target.value)} /></label></> : null}
          <label className="admin-field">Cobro<select value={method} onChange={(e) => setMethod(e.target.value)}><option value="cash">Efectivo</option><option value="card">Tarjeta</option><option value="transfer">Transferencia</option><option value="stripe">Stripe</option></select></label>
          {cart.map((item, index) => <p key={index}>{item.description} × {item.quantity}</p>)}
          <p className="admin-metric__value">${total.toFixed(2)}</p>
          {review ? (
            <div className="admin-review" role="region" aria-label="Revisar cobro">
              <p>Revisa la venta antes de registrarla.</p>
              <p>{patientId ? patients.find((p) => p.id === patientId)?.firstName : walkIn || "Mostrador"} · {method === "cash" ? "Efectivo" : method === "card" ? "Tarjeta" : method === "transfer" ? "Transferencia" : "Stripe"}</p>
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
      <section style={{ marginTop: "1.5rem" }}>
        <h2>Ventas recientes</h2>
        <div className="admin-table-wrap">
          {sales.map((sale) => (
            <div key={sale.id} className="admin-table__row">
              <div>
                <div className="admin-table__cell-title">{sale.sale_number}</div>
                <div className="admin-table__cell-sub">{[sale.first_name, sale.last_name].filter(Boolean).join(" ") || "Mostrador"} · {sale.status === "void" ? "Anulada" : sale.status} · ${Number(sale.total || 0).toFixed(2)}</div>
              </div>
              {sale.status !== "void" ? <button className="admin-btn admin-btn--danger" type="button" onClick={async () => {
                if (!window.confirm(`¿Anular ${sale.sale_number}? El registro se conserva, pero deja de contar como cobro.`)) return;
                try {
                  await api(`/api/admin/sales/${sale.id}`, { method: "POST", body: JSON.stringify({ action: "void", reason: "Anulada en ventas" }) });
                  setMessage("Venta anulada.");
                  setSales(sales.map((item) => item.id === sale.id ? { ...item, status: "void" } : item));
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "No se pudo anular la venta.");
                }
              }}>Anular</button> : null}
            </div>
          ))}
          {!sales.length ? <div className="admin-table__empty">Todavía no hay ventas.</div> : null}
        </div>
      </section>
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
