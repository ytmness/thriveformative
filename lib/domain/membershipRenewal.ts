import { randomUUID } from "crypto";
import { decryptPhi, encryptPhi } from "@/lib/crypto/phi";
import { query } from "@/lib/db";
import { sendClinicEmail } from "@/lib/emailServer";
import { getNotifyEmail, getSiteUrl } from "@/lib/env/server";
import { grantMembershipPeriod, intervalUnitOf } from "@/lib/domain/memberships";
import { log } from "@/lib/log";
import { createCounterOrder } from "@/lib/square/orders";
import { createSquarePayment } from "@/lib/square/payments";
import { getSquareLocation } from "@/lib/square/client";
import { majorToMinor } from "@/lib/square/money";

export async function setMembershipAutoRenew(patientMembershipId: string, patientId: string, enabled: boolean) {
  const updated = await query<{ id: string }>(
    `UPDATE patient_memberships
     SET auto_renew = $3
     WHERE id = $1 AND patient_id = $2
     RETURNING id`,
    [patientMembershipId, patientId, enabled]
  );
  return { ok: Boolean(updated.rows[0]), id: updated.rows[0]?.id || null };
}

export async function renewDueMemberships(limit = 20) {
  const due = await query<{
    id: string;
    patient_id: string;
    membership_id: string;
    square_card_id: string | null;
    square_customer_id: string | null;
    current_period_end: string;
    price: string;
    name: string;
    interval_unit: string;
    first_name: string | null;
    email_enc: Buffer | null;
    preferred_language: string | null;
  }>(
    `SELECT pm.id, pm.patient_id, pm.membership_id, pm.square_card_id, pm.square_customer_id,
            pm.current_period_end::text AS current_period_end,
            m.price::text AS price, m.name, m.interval_unit,
            p.first_name, p.email_enc, p.preferred_language
     FROM patient_memberships pm
     JOIN memberships m ON m.id = pm.membership_id
     JOIN patients p ON p.id = pm.patient_id
     WHERE pm.auto_renew = true
       AND pm.status = 'active'
       AND pm.renewal_mode = 'manual'
       AND pm.square_card_id IS NOT NULL
       AND pm.current_period_end IS NOT NULL
       AND pm.current_period_end < DATE '2099-01-01'
       AND pm.current_period_end < current_date
       AND (pm.auto_renew_last_attempt_on IS NULL OR pm.auto_renew_last_attempt_on < current_date)
       AND p.deleted_at IS NULL
     ORDER BY pm.current_period_end ASC
     LIMIT $1`,
    [limit]
  );

  let renewed = 0;
  let failed = 0;
  const inbox = getNotifyEmail();
  const site = getSiteUrl();

  for (const row of due.rows) {
    await query(`UPDATE patient_memberships SET auto_renew_last_attempt_on = current_date WHERE id = $1`, [row.id]);
    try {
      const location = await getSquareLocation();
      const amount = majorToMinor(Number(row.price || 0), location.currency);
      if (amount <= 0) throw new Error("precio inválido");
      const order = await createCounterOrder({
        idempotencyKey: `renew-${row.id}-${String(row.current_period_end).slice(0, 10)}-order`,
        locationId: location.id,
        referenceId: `ren:${row.id.slice(0, 8)}`,
        lines: [{ name: `${row.name} · renovación`, quantity: "1", amount, currency: location.currency }],
      });
      const payment = await createSquarePayment({
        sourceId: String(row.square_card_id),
        idempotencyKey: `renew-${row.id}-${String(row.current_period_end).slice(0, 10)}-pay`,
        amount: order.totalAmount,
        currency: order.currency,
        locationId: location.id,
        orderId: order.id,
        note: `Renovación ${row.name}`,
        referenceId: row.patient_id,
      });
      if (payment.status !== "COMPLETED" && payment.status !== "APPROVED") {
        throw new Error(`pago ${payment.status}`);
      }
      const nextStart = new Date(`${String(row.current_period_end).slice(0, 10)}T12:00:00Z`);
      nextStart.setUTCDate(nextStart.getUTCDate() + 1);
      await grantMembershipPeriod({
        patientMembershipId: row.id,
        membershipId: row.membership_id,
        periodStart: nextStart,
      });
      await query(`UPDATE patient_memberships SET auto_renew_failures = 0, status = 'active' WHERE id = $1`, [row.id]);
      renewed += 1;
      log.info("memberships", "auto_renew ok", { id: row.id });
    } catch (error) {
      failed += 1;
      const detail = error instanceof Error ? error.message : "error";
      await query(
        `UPDATE patient_memberships SET auto_renew_failures = auto_renew_failures + 1 WHERE id = $1`,
        [row.id]
      );
      log.warn("memberships", "auto_renew falló", { id: row.id, detail });
      const english = row.preferred_language === "en";
      const who = row.first_name || (english ? "there" : "Paciente");
      const link = `${site}/suscribir`;
      const subject = english ? "We could not renew your Thrive Formative plan" : "No pudimos renovar tu plan de Thrive Formative";
      const body = english
        ? `Hi ${who}, we could not charge your saved card for ${row.name}. Please update payment here: ${link}`
        : `Hola ${who}, no pudimos cobrar la tarjeta guardada de ${row.name}. Actualiza el pago aquí: ${link}`;
      const email = decryptPhi(row.email_enc);
      if (email) {
        const result = await sendClinicEmail(email, subject, body, english ? "en" : "es");
        await query(
          `INSERT INTO messages (channel, recipient_enc, patient_id, subject, body, status, scheduled_for, sent_at, error, provider)
           VALUES ('email',$1,$2,$3,$4,$5, now(), CASE WHEN $5 = 'sent' THEN now() ELSE NULL END, $6, 'smtp')`,
          [encryptPhi(email), row.patient_id, subject, body, result.ok ? "sent" : "failed", result.ok ? null : result.error || "No se pudo enviar"]
        );
      }
      await query(
        `INSERT INTO notifications (type, title, body, reference_id, patient_id)
         VALUES ('membership_renewal_failed', $1, $2, $3, $4)`,
        [
          english ? "Membership renewal failed" : "Falló la renovación de membresía",
          english ? `Could not renew ${row.name}.` : `No se pudo renovar ${row.name}.`,
          row.id,
          row.patient_id,
        ]
      );
      if (inbox) {
        await sendClinicEmail(
          inbox,
          "Falló auto-renovación de membresía",
          `${who} · ${row.name} · ${detail}`
        ).catch(() => undefined);
      }
    }
  }

  return { processed: due.rows.length, renewed, failed, idempotencyProbe: randomUUID().slice(0, 8) };
}
