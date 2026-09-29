"use client";

import { useEffect, useState } from "react";
import { api } from "@/components/admin/clinic/client";

export default function ManageBooking({ token }: { token: string }) {
  const [appointment, setAppointment] = useState<Record<string, string> | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState("");
  useEffect(() => { api<{ appointment: Record<string, string> }>(`/api/public/booking?token=${encodeURIComponent(token)}`).then((r) => setAppointment(r.appointment)).catch((e) => setMessage(e.message)); }, [token]);
  if (!appointment) return <main className="booking-wizard"><p>{message || "Cargando…"}</p></main>;
  return (
    <main className="booking-wizard">
      <h1 className="admin-header__title">{appointment.serviceName}</h1>
      <p>{new Date(appointment.startsAt).toLocaleString("es-MX")} · {appointment.staffName} · {appointment.locationName}</p>
      <p>Estado: {appointment.status}</p>
      {message ? <div className="admin-alert">{message}</div> : null}
      <div className="admin-toolbar">
        <button className="admin-btn admin-btn--danger" type="button" onClick={async () => { await api("/api/public/booking", { method: "PUT", body: JSON.stringify({ token, action: "cancel" }) }); setMessage("Cita cancelada."); }}>Cancelar</button>
      </div>
      <form onSubmit={async (e) => { e.preventDefault(); await api("/api/public/booking", { method: "PUT", body: JSON.stringify({ token, action: "reschedule", startsAt: new Date(startsAt).toISOString() }) }); setMessage("Cita reprogramada."); }}>
        <label className="admin-field">Nueva fecha y hora<input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required /></label>
        <button className="admin-btn admin-btn--primary" type="submit">Reprogramar</button>
      </form>
    </main>
  );
}
