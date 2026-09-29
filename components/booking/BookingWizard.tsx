"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";

type SlotGroup = { staffUserId: string; staffName: string; locationId: string; locationName: string; slots: { start: string; end: string; roomId: string | null }[] };

export default function BookingWizard() {
  const [catalog, setCatalog] = useState<{ services: { id: string; name: string; duration_minutes: number; price: string }[]; locations: { id: string; name: string }[]; settings: { require_terms?: boolean } | null; policy: { text?: string } | null } | null>(null);
  const [serviceId, setServiceId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [date, setDate] = useState("");
  const [groups, setGroups] = useState<SlotGroup[]>([]);
  const [slot, setSlot] = useState<SlotGroup["slots"][number] & { staffUserId: string; locationId: string } | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", acceptTerms: false, portalPassword: "" });
  const [done, setDone] = useState<{ manageToken?: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api<typeof catalog>("/api/public/booking/catalog").then((data) => { setCatalog(data); setLocationId(data?.locations[0]?.id || ""); }); }, []);
  useEffect(() => {
    if (!serviceId || !date) return;
    api<{ slots: SlotGroup[] }>(`/api/public/booking/availability?serviceId=${serviceId}&date=${date}&locationId=${locationId}`).then((r) => setGroups(r.slots)).catch((e) => setError(e.message));
  }, [serviceId, date, locationId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    try {
      const result = await api<{ manageToken: string | null }>("/api/public/booking", { method: "POST", body: JSON.stringify({ ...form, serviceId, locationId: slot.locationId, staffUserId: slot.staffUserId, roomId: slot.roomId, startsAt: slot.start, endsAt: slot.end }) });
      setDone(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    }
  }

  if (done) return <main className="booking-wizard"><h1 className="admin-header__title">Cita registrada</h1><p>Guarda este enlace para cancelar o reprogramar.</p>{done.manageToken ? <p><a href={`/reservar/${done.manageToken}`}>Administrar cita</a></p> : null}</main>;

  return (
    <main className="booking-wizard">
      <p className="admin-header__eyebrow">Thrive Formative</p>
      <h1 className="admin-header__title">Reservar</h1>
      {error ? <div className="admin-alert">{error}</div> : null}
      <div className="admin-form-grid">
        <label className="admin-field">Servicio<select value={serviceId} onChange={(e) => setServiceId(e.target.value)}><option value="">Elige</option>{catalog?.services.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.duration_minutes} min</option>)}</select></label>
        <label className="admin-field">Sede<select value={locationId} onChange={(e) => setLocationId(e.target.value)}>{catalog?.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
        <label className="admin-field">Fecha<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
      </div>
      {groups.map((group) => (
        <section key={group.staffUserId}><h2>{group.staffName}</h2><div className="admin-toolbar">{group.slots.map((item) => <button key={item.start} type="button" className={`admin-btn${slot?.start === item.start ? " admin-btn--primary" : ""}`} onClick={() => setSlot({ ...item, staffUserId: group.staffUserId, locationId: group.locationId })}>{new Date(item.start).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</button>)}</div></section>
      ))}
      {slot ? (
        <form onSubmit={submit} className="admin-form-grid">
          <label className="admin-field">Nombre<input required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></label>
          <label className="admin-field">Apellido<input required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></label>
          <label className="admin-field">Email<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          <label className="admin-field">Teléfono<input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
          <label className="admin-field span-2">Contraseña del portal (opcional)<input type="password" value={form.portalPassword} onChange={(e) => setForm({ ...form, portalPassword: e.target.value })} /></label>
          <label className="admin-check span-2"><input type="checkbox" checked={form.acceptTerms} onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })} />Acepto los términos y el aviso de privacidad. {catalog?.policy?.text}</label>
          <button className="admin-btn admin-btn--primary" type="submit">Confirmar</button>
          <button className="admin-btn" type="button" onClick={async () => { await api("/api/public/booking", { method: "PUT", body: JSON.stringify({ action: "waitlist", patientId: null, serviceId, locationId, notes: form.email }) }); setError("Si ya eres paciente, recepción te avisará. También puedes dejar tus datos al reservar."); }}>Lista de espera</button>
        </form>
      ) : null}
    </main>
  );
}
