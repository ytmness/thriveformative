"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { BlockedDateRow, BookingSettings, WeeklyHoursRow } from "@/lib/bookingAvailability";
import { DAY_LABELS_ES, mergeSettings } from "@/lib/bookingAvailability";
import "@/app/styles/admin-booking.css";

const SLOT_DURATIONS = [15, 20, 30, 45, 60] as const;

function timeInputValue(t: string): string {
  return t.trim().slice(0, 5);
}

export default function BookingAvailabilityPanel() {
  const [settings, setSettings] = useState<BookingSettings>(mergeSettings(null));
  const [weekly, setWeekly] = useState<WeeklyHoursRow[]>([]);
  const [blocked, setBlocked] = useState<BlockedDateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [newBlockDate, setNewBlockDate] = useState("");
  const [newBlockReason, setNewBlockReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const [settingsRes, weeklyRes, blockedRes] = await Promise.all([
      supabase
        .from("booking_settings")
        .select("slot_duration_minutes, min_advance_days, max_advance_days")
        .eq("id", 1)
        .maybeSingle(),
      supabase
        .from("booking_weekly_hours")
        .select("day_of_week, is_enabled, start_time, end_time")
        .order("day_of_week"),
      supabase
        .from("booking_blocked_dates")
        .select("id, blocked_date, reason")
        .order("blocked_date"),
    ]);
    setSettings(mergeSettings(settingsRes.data as BookingSettings | null));
    setWeekly((weeklyRes.data ?? []) as WeeklyHoursRow[]);
    setBlocked((blockedRes.data ?? []) as BlockedDateRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function saveSettings() {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.from("booking_settings").upsert({
      id: 1,
      slot_duration_minutes: settings.slot_duration_minutes,
      min_advance_days: settings.min_advance_days,
      max_advance_days: settings.max_advance_days,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    setMessage({ type: "ok", text: "Ajustes generales guardados." });
  }

  async function saveWeekly() {
    setSaving(true);
    setMessage(null);
    const supabase = createClient();
    for (const row of weekly) {
      const { error } = await supabase.from("booking_weekly_hours").upsert({
        day_of_week: row.day_of_week,
        is_enabled: row.is_enabled,
        start_time: timeInputValue(row.start_time),
        end_time: timeInputValue(row.end_time),
        updated_at: new Date().toISOString(),
      });
      if (error) {
        setSaving(false);
        setMessage({ type: "err", text: error.message });
        return;
      }
    }
    setSaving(false);
    setMessage({ type: "ok", text: "Horario semanal guardado." });
  }

  async function addBlockedDate() {
    if (!newBlockDate) return;
    setMessage(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("booking_blocked_dates")
      .insert({
        blocked_date: newBlockDate,
        reason: newBlockReason.trim() || null,
      })
      .select("id, blocked_date, reason")
      .single();
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    setBlocked((prev) =>
      [...prev, data as BlockedDateRow].sort((a, b) =>
        a.blocked_date.localeCompare(b.blocked_date)
      )
    );
    setNewBlockDate("");
    setNewBlockReason("");
    setMessage({ type: "ok", text: "Día bloqueado añadido." });
  }

  async function removeBlocked(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("booking_blocked_dates").delete().eq("id", id);
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    setBlocked((prev) => prev.filter((b) => b.id !== id));
  }

  function updateWeeklyDay(dow: number, patch: Partial<WeeklyHoursRow>) {
    setWeekly((prev) =>
      prev.map((r) => (r.day_of_week === dow ? { ...r, ...patch } : r))
    );
  }

  if (loading) {
    return <div className="mt-10 animate-pulse h-48 bg-surface rounded-2xl border border-theme" />;
  }

  const weeklySorted = [...weekly].sort((a, b) => a.day_of_week - b.day_of_week);

  return (
    <section className="admin-booking mt-10" aria-label="Disponibilidad de citas">
      {message && (
        <div
          className={`admin-booking__msg admin-booking__msg--${message.type === "ok" ? "ok" : "err"}`}
          role="status"
        >
          {message.text}
        </div>
      )}

      <div className="admin-booking__card">
        <h2 className="admin-booking__card-title">Ajustes generales</h2>
        <p className="admin-booking__card-desc">
          Duración de cada cita y cuántos días de anticipación pueden reservar los pacientes.
        </p>
        <div className="admin-booking__grid-3">
          <div className="admin-booking__field">
            <label htmlFor="slot-duration">Duración de cita (min)</label>
            <select
              id="slot-duration"
              value={settings.slot_duration_minutes}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  slot_duration_minutes: Number(e.target.value),
                }))
              }
            >
              {SLOT_DURATIONS.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </div>
          <div className="admin-booking__field">
            <label htmlFor="min-advance">Mín. días de anticipación</label>
            <input
              id="min-advance"
              type="number"
              min={0}
              max={30}
              value={settings.min_advance_days}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  min_advance_days: Math.max(0, parseInt(e.target.value, 10) || 0),
                }))
              }
            />
            <span className="text-xs text-muted">1 = no mismo día</span>
          </div>
          <div className="admin-booking__field">
            <label htmlFor="max-advance">Máx. días hacia adelante</label>
            <input
              id="max-advance"
              type="number"
              min={7}
              max={365}
              value={settings.max_advance_days}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  max_advance_days: Math.max(1, parseInt(e.target.value, 10) || 90),
                }))
              }
            />
          </div>
        </div>
        <div className="admin-booking__actions">
          <button type="button" className="admin-booking__btn" disabled={saving} onClick={saveSettings}>
            Guardar ajustes
          </button>
        </div>
      </div>

      <div className="admin-booking__card">
        <h2 className="admin-booking__card-title">Horario semanal</h2>
        <p className="admin-booking__card-desc">
          Activa los días de atención y define hora de inicio y fin. Los horarios disponibles se generan según la duración de cita.
        </p>
        {weeklySorted.map((row) => (
          <div key={row.day_of_week} className="admin-booking__weekly-row">
            <label className="admin-booking__weekly-day flex items-center gap-2">
              <input
                type="checkbox"
                checked={row.is_enabled}
                onChange={(e) =>
                  updateWeeklyDay(row.day_of_week, { is_enabled: e.target.checked })
                }
              />
              {DAY_LABELS_ES[row.day_of_week]}
            </label>
            <div className="admin-booking__field">
              <label>Inicio</label>
              <input
                type="time"
                value={timeInputValue(row.start_time)}
                disabled={!row.is_enabled}
                onChange={(e) =>
                  updateWeeklyDay(row.day_of_week, { start_time: e.target.value })
                }
              />
            </div>
            <div className="admin-booking__field">
              <label>Fin</label>
              <input
                type="time"
                value={timeInputValue(row.end_time)}
                disabled={!row.is_enabled}
                onChange={(e) =>
                  updateWeeklyDay(row.day_of_week, { end_time: e.target.value })
                }
              />
            </div>
          </div>
        ))}
        <div className="admin-booking__actions">
          <button type="button" className="admin-booking__btn" disabled={saving} onClick={saveWeekly}>
            Guardar horario semanal
          </button>
        </div>
      </div>

      <div className="admin-booking__card">
        <h2 className="admin-booking__card-title">Días bloqueados</h2>
        <p className="admin-booking__card-desc">
          Vacaciones, feriados o cierres puntuales. Esos días no aparecerán en el calendario de pacientes.
        </p>
        <div className="admin-booking__grid-3">
          <div className="admin-booking__field">
            <label htmlFor="block-date">Fecha</label>
            <input
              id="block-date"
              type="date"
              value={newBlockDate}
              onChange={(e) => setNewBlockDate(e.target.value)}
            />
          </div>
          <div className="admin-booking__field" style={{ gridColumn: "span 2" }}>
            <label htmlFor="block-reason">Motivo (opcional)</label>
            <input
              id="block-reason"
              type="text"
              placeholder="Vacaciones, congreso…"
              value={newBlockReason}
              onChange={(e) => setNewBlockReason(e.target.value)}
            />
          </div>
        </div>
        <div className="admin-booking__actions">
          <button
            type="button"
            className="admin-booking__btn"
            disabled={!newBlockDate || saving}
            onClick={addBlockedDate}
          >
            Añadir día bloqueado
          </button>
        </div>
        <div className="admin-booking__blocked-list">
          {blocked.length === 0 && (
            <p className="text-sm text-muted">No hay días bloqueados.</p>
          )}
          {blocked.map((b) => (
            <div key={b.id} className="admin-booking__blocked-item">
              <div>
                <span className="font-medium">{b.blocked_date}</span>
                {b.reason && <span className="text-muted text-sm ml-2">— {b.reason}</span>}
              </div>
              <button
                type="button"
                className="admin-booking__btn admin-booking__btn--danger"
                onClick={() => removeBlocked(b.id)}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
