import { randomUUID } from "crypto";
import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";
import { getSquareLocation, SquareApiError, squareFetch } from "@/lib/square/client";

const SETTING = "square_terminal";

export type TerminalDevice = { id: string; name: string; status: string };
export type TerminalCode = { id: string; code: string; status: string; deviceId: string | null };

type SavedTerminal = {
  deviceId?: string;
  deviceName?: string;
  codeId?: string;
  code?: string;
  codeStatus?: string;
};

type DevicePayload = {
  devices?: {
    id?: string;
    attributes?: { type?: string; name?: string; model?: string };
    components?: { application_details?: { application_type?: string } }[];
    status?: { category?: string };
  }[];
  cursor?: string;
};

type RawCode = {
  id?: string;
  code?: string;
  status?: string;
  device_id?: string;
};

function rawDeviceId(id: string) {
  return id.startsWith("device:") ? id.slice("device:".length) : id;
}

function mapCode(raw?: RawCode): TerminalCode {
  if (!raw?.id || !raw.code || !raw.status) {
    throw new SquareApiError(502, "Square no devolvió el código de la terminal.");
  }
  return { id: raw.id, code: raw.code, status: raw.status, deviceId: raw.device_id ? rawDeviceId(raw.device_id) : null };
}

async function readSaved(): Promise<SavedTerminal> {
  const rows = await query<{ value: SavedTerminal }>(`SELECT value FROM clinic_settings WHERE key = $1`, [SETTING]);
  return rows.rows[0]?.value ?? {};
}

async function writeSaved(value: SavedTerminal) {
  await query(
    `INSERT INTO clinic_settings (key, value) VALUES ($1, $2::jsonb)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [SETTING, JSON.stringify(value)]
  );
}

export async function listTerminalDevices(): Promise<TerminalDevice[]> {
  const found: TerminalDevice[] = [];
  let cursor: string | undefined;
  do {
    const path = cursor ? `/v2/devices?cursor=${encodeURIComponent(cursor)}` : "/v2/devices";
    const body = await squareFetch<DevicePayload>(path);
    for (const device of body.devices ?? []) {
      if (!device.id) continue;
      const terminal =
        device.attributes?.type === "TERMINAL" ||
        device.components?.some((part) => part.application_details?.application_type === "TERMINAL_API");
      if (!terminal) continue;
      found.push({
        id: rawDeviceId(device.id),
        name: device.attributes?.name || device.attributes?.model || "Terminal",
        status: device.status?.category || "UNKNOWN",
      });
    }
    cursor = body.cursor;
  } while (cursor && found.length < 40);
  return found;
}

export async function createTerminalCode(name: string): Promise<TerminalCode> {
  const location = await getSquareLocation();
  const body = await squareFetch<{ device_code?: RawCode }>("/v2/devices/codes", {
    method: "POST",
    body: {
      idempotency_key: randomUUID(),
      device_code: {
        product_type: "TERMINAL_API",
        name: (name || "Thrive Formative").slice(0, 128),
        location_id: location.id,
      },
    },
  });
  return mapCode(body.device_code);
}

export async function getTerminalCode(id: string): Promise<TerminalCode> {
  const body = await squareFetch<{ device_code?: RawCode }>(`/v2/devices/codes/${encodeURIComponent(id)}`);
  return mapCode(body.device_code);
}

export async function terminalLinkStatus() {
  let saved = await readSaved();
  if (saved.codeId && saved.codeStatus !== "PAIRED") {
    const code = await getTerminalCode(saved.codeId);
    saved = {
      ...saved,
      code: code.code,
      codeStatus: code.status,
      deviceId: code.deviceId || saved.deviceId,
    };
    if (code.status === "PAIRED" && code.deviceId) {
      saved.deviceId = code.deviceId;
      saved.code = undefined;
    }
    await writeSaved(saved);
  }
  const devices = await listTerminalDevices();
  const current = devices.find((device) => device.id === saved.deviceId);
  return {
    deviceId: saved.deviceId || null,
    deviceName: current?.name || saved.deviceName || null,
    devices,
    code: saved.code && saved.codeStatus && saved.codeStatus !== "PAIRED" ? { code: saved.code, status: saved.codeStatus } : null,
  };
}

export async function startTerminalPairing(name: string) {
  const code = await createTerminalCode(name);
  const prev = await readSaved();
  await writeSaved({
    deviceName: prev.deviceName,
    codeId: code.id,
    code: code.code,
    codeStatus: code.status,
  });
  return { code: code.code, status: code.status };
}

export async function selectTerminalDevice(deviceId: string) {
  const devices = await listTerminalDevices();
  const device = devices.find((row) => row.id === deviceId);
  if (!device) throw new DomainError("Esa terminal no aparece en Square.");
  await writeSaved({ deviceId: device.id, deviceName: device.name, codeStatus: "PAIRED" });
  return device;
}

export async function requireTerminalDevice(): Promise<TerminalDevice> {
  const saved = await readSaved();
  const devices = await listTerminalDevices();
  const savedDevice = saved.deviceId ? devices.find((device) => device.id === saved.deviceId) : undefined;
  if (savedDevice) return savedDevice;
  if (saved.deviceId) return { id: saved.deviceId, name: saved.deviceName || "Terminal", status: "UNKNOWN" };
  if (devices.length === 1) {
    await writeSaved({ ...saved, deviceId: devices[0].id, deviceName: devices[0].name, codeStatus: "PAIRED", code: undefined });
    return devices[0];
  }
  throw new DomainError("Vincula la terminal de Square antes de cobrar con tarjeta.", 409);
}

export async function createTerminalCheckout(input: {
  deviceId: string;
  orderId: string;
  amount: number;
  currency: string;
  referenceId: string;
  note: string;
}): Promise<{ id: string; status: string }> {
  const body = await squareFetch<{ checkout?: { id?: string; status?: string } }>("/v2/terminals/checkouts", {
    method: "POST",
    body: {
      idempotency_key: randomUUID(),
      checkout: {
        amount_money: { amount: input.amount, currency: input.currency },
        device_options: {
          device_id: rawDeviceId(input.deviceId),
          skip_receipt_screen: false,
          show_itemized_cart: true,
          tip_settings: { allow_tipping: false },
        },
        order_id: input.orderId,
        payment_type: "CARD_PRESENT",
        reference_id: input.referenceId.slice(0, 40),
        note: input.note.slice(0, 500),
        payment_options: { autocomplete: true },
      },
    },
  });
  if (!body.checkout?.id || !body.checkout.status) {
    throw new SquareApiError(502, "Square no devolvió el cobro de la terminal.");
  }
  return { id: body.checkout.id, status: body.checkout.status };
}

export async function getTerminalCheckout(id: string): Promise<{ status: string; paymentId: string | null }> {
  const body = await squareFetch<{ checkout?: { status?: string; payment_ids?: string[] } }>(
    `/v2/terminals/checkouts/${encodeURIComponent(id)}`
  );
  if (!body.checkout?.status) throw new SquareApiError(502, "Square no devolvió el estado del cobro.");
  return { status: body.checkout.status, paymentId: body.checkout.payment_ids?.[0] ?? null };
}

export async function cancelTerminalCheckout(id: string): Promise<string> {
  const body = await squareFetch<{ checkout?: { status?: string } }>(
    `/v2/terminals/checkouts/${encodeURIComponent(id)}/cancel`,
    { method: "POST", body: {} }
  );
  return body.checkout?.status || "CANCEL_REQUESTED";
}
