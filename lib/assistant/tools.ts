import { randomUUID } from "crypto";
import type { StaffSession } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/session";
import { listProducts } from "@/lib/domain/catalog";
import { createAppointment, listAppointments } from "@/lib/domain/appointments";
import { assignForm, listTemplates, saveTemplate } from "@/lib/domain/forms";
import { saveLead } from "@/lib/domain/leads";
import { createPatient, listPatients } from "@/lib/domain/patients";
import { dashboardStats, runReport } from "@/lib/domain/reports";
import { listSales } from "@/lib/domain/sales";
import { countrySql, normalizeCountry } from "@/lib/domain/scope";
import { listSection } from "@/lib/domain/settings";
import { query } from "@/lib/db";
import { DomainError } from "@/lib/http";
import type { AssistantScope, ConfirmField, DisplayBlock, ToolSpec } from "@/lib/assistant/types";

export type ToolContext = {
  session: StaffSession;
  scope: AssistantScope;
  meta?: { ip?: string | null; userAgent?: string | null };
};

export type ToolOutput = {
  data: unknown;
  displays?: DisplayBlock[];
};

export type AssistantTool = {
  name: string;
  description: string;
  permission: string;
  confirm: boolean;
  parameters: Record<string, unknown>;
  title?: string;
  fields?: ConfirmField[];
  summary?: (args: Record<string, unknown>) => string;
  normalize?: (args: Record<string, unknown>, ctx: ToolContext) => Record<string, unknown>;
  ready?: (args: Record<string, unknown>) => string | null;
  run: (args: Record<string, unknown>, ctx: ToolContext) => Promise<ToolOutput>;
};

const FIELD_TYPES = ["heading", "text", "textarea", "date", "checkbox", "select", "signature"];
const FORM_TYPES = [
  { value: "intake", label: "Ingreso" },
  { value: "consent", label: "Consentimiento" },
  { value: "soap", label: "Nota clínica" },
  { value: "custom", label: "Otro" },
];

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function uuid(value: unknown): string | null {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ? value
    : null;
}

function person(row: { first_name?: unknown; last_name?: unknown; firstName?: unknown; lastName?: unknown }): string {
  return [row.firstName || row.first_name, row.lastName || row.last_name].filter(Boolean).join(" ") || "Sin nombre";
}

function scopedUrl(scope: AssistantScope, extra: Record<string, string> = {}): URL {
  const url = new URL("http://panel.local/admin");
  if (scope.country) url.searchParams.set("country", scope.country);
  if (scope.locationId) url.searchParams.set("locationId", scope.locationId);
  for (const [key, value] of Object.entries(extra)) {
    if (value) url.searchParams.set(key, value);
  }
  return url;
}

function stamp(value: unknown): string {
  const date = value instanceof Date ? value : new Date(String(value || ""));
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Chicago" });
}

function clip(value: unknown, limit = 8000): unknown {
  const raw = JSON.stringify(value);
  if (!raw || raw.length <= limit) return value;
  return { aviso: "Resultado recortado", extracto: raw.slice(0, limit) };
}

function formFields(value: unknown): { label: string; type: string; required: boolean; options: string[] }[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const field = item as { label?: unknown; type?: unknown; required?: unknown; options?: unknown };
    const type = FIELD_TYPES.includes(String(field.type)) ? String(field.type) : "text";
    const options = Array.isArray(field.options) ? field.options.map((option) => String(option).trim()).filter(Boolean) : [];
    return [{ label: text(field.label) || "Pregunta", type, required: Boolean(field.required) || type === "signature", options }];
  });
}

function withLocation(args: Record<string, unknown>, ctx: ToolContext): Record<string, unknown> {
  return { ...args, locationId: uuid(args.locationId) || ctx.scope.locationId };
}

const READ: AssistantTool[] = [
  {
    name: "metricas_de_hoy",
    description: "Citas, ingresos, pacientes nuevos, leads abiertos y próximas citas de hoy, ya filtrados por el país y la sede seleccionados.",
    permission: "dashboard.read",
    confirm: false,
    parameters: { type: "object", properties: {}, additionalProperties: false },
    async run(_args, ctx) {
      const stats = await dashboardStats("America/Chicago", ctx.scope);
      const items = [
        { label: "Citas hoy", value: String(stats.appointments ?? 0) },
        { label: "Ingresos hoy", value: money.format(Number(stats.revenue || 0)) },
        { label: "Pacientes nuevos", value: String(stats.new_patients ?? 0) },
        { label: "Leads abiertos", value: String(stats.open_leads ?? 0) },
        { label: "Pacientes", value: String(stats.patients ?? 0) },
        { label: "Servicios activos", value: String(stats.services ?? 0) },
      ];
      const upcoming = Array.isArray(stats.upcoming) ? stats.upcoming : [];
      const displays: DisplayBlock[] = [{ kind: "metrics", title: "Hoy", items }];
      if (upcoming.length) {
        displays.push({
          kind: "table",
          title: "Próximas citas",
          columns: ["Hora", "Paciente", "Servicio", "Sede"],
          rows: upcoming.slice(0, 8).map((row) => {
            const item = row as Record<string, unknown>;
            const when = item.starts_at ? new Date(String(item.starts_at)).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", timeZone: "America/Chicago" }) : "";
            return [when, person(item as { first_name?: string; last_name?: string }), String(item.service_name || "—"), String(item.location_name || "—")];
          }),
        });
      }
      return {
        data: clip({ ...stats, revenue: Number(stats.revenue || 0) }),
        displays,
      };
    },
  },
  {
    name: "reporte",
    description: "Reporte de los últimos días: citas, ingresos, servicios, profesionales, marketing o no-shows. Fechas en ISO si el usuario pide otro rango.",
    permission: "reports.read",
    confirm: false,
    parameters: {
      type: "object",
      properties: {
        slug: { type: "string", enum: ["citas", "ingresos", "servicios", "profesionales", "marketing", "no-shows"] },
        from: { type: "string", description: "Inicio ISO, opcional" },
        to: { type: "string", description: "Fin ISO, opcional" },
      },
      required: ["slug"],
      additionalProperties: false,
    },
    async run(args, ctx) {
      const slug = text(args.slug);
      const url = scopedUrl(ctx.scope);
      if (text(args.from)) url.searchParams.set("from", text(args.from));
      if (text(args.to)) url.searchParams.set("to", text(args.to));
      const report = await runReport(slug, url);
      const rows = Array.isArray(report.rows) ? report.rows : [];
      const columns = rows[0] ? Object.keys(rows[0] as object) : [];
      return {
        data: clip(report),
        displays: columns.length
          ? [{
              kind: "table",
              title: slug,
              columns,
              rows: rows.slice(0, 12).map((row) => columns.map((column) => {
                const value = (row as Record<string, unknown>)[column];
                if (typeof value === "number") return column.includes("total") || column === "revenue" ? money.format(value) : String(value);
                return value == null ? "" : String(value).slice(0, 80);
              })),
            }]
          : [],
      };
    },
  },
  {
    name: "buscar_paciente",
    description: "Busca pacientes por nombre, código, email o teléfono. Devuelve id, código y contacto para poder citarlos o asignarles un formulario.",
    permission: "patients.read",
    confirm: false,
    parameters: {
      type: "object",
      properties: { q: { type: "string", description: "Nombre, código, email o teléfono" } },
      required: ["q"],
      additionalProperties: false,
    },
    ready: (args) => (text(args.q) ? null : "Falta el nombre, código, email o teléfono."),
    async run(args, ctx) {
      const found = await listPatients(scopedUrl(ctx.scope, { q: text(args.q), pageSize: "8" }));
      const rows = found.rows.slice(0, 8).map((row) => ({
        id: row.id,
        codigo: row.clientCode,
        nombre: person(row),
        email: row.email,
        telefono: row.mobile || row.phone,
      }));
      return {
        data: { total: found.total, rows },
        displays: rows.length
          ? [{
              kind: "table",
              title: "Pacientes",
              columns: ["Código", "Nombre", "Email", "Teléfono"],
              rows: rows.map((row) => [String(row.codigo || ""), row.nombre, String(row.email || ""), String(row.telefono || "")]),
            }]
          : [],
      };
    },
  },
  {
    name: "citas_del_rango",
    description: "Citas entre dos fechas ISO, filtradas por el país y la sede seleccionados.",
    permission: "appointments.read",
    confirm: false,
    parameters: {
      type: "object",
      properties: {
        from: { type: "string", description: "Inicio ISO" },
        to: { type: "string", description: "Fin ISO" },
      },
      required: ["from", "to"],
      additionalProperties: false,
    },
    ready: (args) => (text(args.from) && text(args.to) ? null : "Faltan las fechas del rango."),
    async run(args, ctx) {
      const rows = await listAppointments(text(args.from), text(args.to), {
        locationId: ctx.scope.locationId || undefined,
        country: ctx.scope.country,
      });
      const compact = rows.slice(0, 12).map((row) => ({
        id: row.id,
        inicio: stamp(row.startsAt),
        estado: row.status,
        paciente: row.patientName,
        servicio: row.serviceName,
        profesional: row.staffName,
        sede: row.locationName,
      }));
      return {
        data: { total: rows.length, rows: compact },
        displays: compact.length
          ? [{
              kind: "table",
              title: "Citas",
              columns: ["Inicio", "Paciente", "Servicio", "Profesional", "Estado"],
              rows: compact.map((row) => [String(row.inicio || ""), String(row.paciente || ""), String(row.servicio || ""), String(row.profesional || ""), String(row.estado || "")]),
            }]
          : [],
      };
    },
  },
  {
    name: "directorio",
    description: "Sedes del país seleccionado, profesionales que atienden y servicios activos, con sus ids. Úsalo para resolver nombres antes de crear una cita.",
    permission: "appointments.read",
    confirm: false,
    parameters: { type: "object", properties: {}, additionalProperties: false },
    async run(_args, ctx) {
      const country = normalizeCountry(ctx.scope.country);
      const locations = await query<{ id: string; name: string }>(
        `SELECT id, name FROM locations l
         WHERE l.is_active AND ($1::uuid IS NULL OR l.id = $1) AND ${countrySql("l.id", "$2")}
         ORDER BY l.name`,
        [ctx.scope.locationId, country]
      );
      const staff = await query<{ id: string; first_name: string; last_name: string }>(
        `SELECT id, first_name, last_name FROM staff_users
         WHERE is_active AND is_bookable ORDER BY last_name, first_name`
      );
      const services = await query<{ id: string; name: string; duration_minutes: number; price: string }>(
        `SELECT DISTINCT s.id, s.name, s.duration_minutes, s.price
         FROM services s
         JOIN service_locations sl ON sl.service_id = s.id
         WHERE s.is_active AND ($1::uuid IS NULL OR sl.location_id = $1) AND ${countrySql("sl.location_id", "$2")}
         ORDER BY s.name`,
        [ctx.scope.locationId, country]
      );
      return {
        data: {
          sedes: locations.rows,
          profesionales: staff.rows.map((row) => ({ id: row.id, nombre: person(row) })),
          servicios: services.rows.map((row) => ({
            id: row.id,
            nombre: row.name,
            minutos: row.duration_minutes,
            precio: Number(row.price),
          })),
        },
      };
    },
  },
  {
    name: "plantillas_de_formulario",
    description: "Plantillas de formulario activas, con id, nombre y tipo.",
    permission: "forms.read",
    confirm: false,
    parameters: { type: "object", properties: {}, additionalProperties: false },
    async run() {
      const rows = await listTemplates();
      const compact = rows.slice(0, 20).map((row) => ({
        id: (row as { id: string }).id,
        nombre: (row as { name: string }).name,
        tipo: (row as { form_type: string }).form_type,
      }));
      return {
        data: { rows: compact },
        displays: compact.length
          ? [{
              kind: "table",
              title: "Formularios",
              columns: ["Nombre", "Tipo"],
              rows: compact.map((row) => [row.nombre, String(row.tipo || "")]),
            }]
          : [],
      };
    },
  },
  {
    name: "ventas_recientes",
    description: "Resumen de ventas de hoy, la semana y el mes, más las últimas ventas del país y la sede seleccionados.",
    permission: "sales.read",
    confirm: false,
    parameters: { type: "object", properties: {}, additionalProperties: false },
    async run(_args, ctx) {
      const sales = await listSales(scopedUrl(ctx.scope));
      const summary = sales.summary;
      const rows = sales.rows.slice(0, 8).map((row) => {
        const item = row as Record<string, unknown>;
        return {
          id: item.id,
          fecha: item.created_at,
          estado: item.status,
          total: Number(item.total || 0),
          paciente: person(item as { first_name?: string; last_name?: string }),
          sede: item.location_name,
        };
      });
      return {
        data: clip({ resumen: summary, rows }),
        displays: [
          {
            kind: "metrics",
            title: "Ventas",
            items: [
              { label: "Hoy", value: money.format(Number(summary?.today || 0)) },
              { label: "Semana", value: money.format(Number(summary?.week || 0)) },
              { label: "Mes", value: money.format(Number(summary?.month || 0)) },
              { label: "Ticket promedio", value: money.format(Number(summary?.avg_ticket || 0)) },
            ],
          },
        ],
      };
    },
  },
];

function catalogTool(kinds: string[]): AssistantTool {
  return {
    name: "catalogo",
    description: `Lista del catálogo clínico. kind puede ser: ${kinds.join(", ")}.`,
    permission: "dashboard.read",
    confirm: false,
    parameters: {
      type: "object",
      properties: { kind: { type: "string", enum: kinds } },
      required: ["kind"],
      additionalProperties: false,
    },
    ready: (args) => (kinds.includes(text(args.kind)) ? null : "Ese catálogo no está disponible para este usuario."),
    async run(args, ctx) {
      const kind = text(args.kind);
      if (!kinds.includes(kind)) throw new DomainError("Sin permiso para este catálogo.", 403);
      if (kind === "productos") {
        const products = await listProducts();
        const rows = products.slice(0, 20).map((row) => {
          const item = row as Record<string, unknown>;
          return { id: item.id, nombre: item.name, sku: item.sku, precio: Number(item.price || 0) };
        });
        return tableOf("Productos", ["Nombre", "SKU", "Precio"], rows.map((row) => [String(row.nombre || ""), String(row.sku || ""), money.format(row.precio)]), rows);
      }
      if (kind === "servicios") {
        const [services, locations] = await Promise.all([listSection("services"), listSection("locations")]);
        const places = locations as Record<string, unknown>[];
        const allowed = new Set(
          places
            .filter((row) => {
              const code = normalizeCountry(String(row.country || ""));
              if (ctx.scope.country && code && code !== ctx.scope.country) return false;
              if (ctx.scope.locationId && String(row.id) !== ctx.scope.locationId) return false;
              return row.is_active !== false;
            })
            .map((row) => String(row.id))
        );
        const rows = (services as Record<string, unknown>[])
          .filter((row) => row.is_active !== false)
          .filter((row) => {
            const ids = Array.isArray(row.locationIds) ? row.locationIds.map(String) : [];
            return ids.some((id) => allowed.has(id));
          })
          .slice(0, 20)
          .map((row) => ({ id: row.id, nombre: row.name, minutos: row.duration_minutes, precio: Number(row.price || 0) }));
        return tableOf("Servicios", ["Nombre", "Minutos", "Precio"], rows.map((row) => [String(row.nombre || ""), String(row.minutos || ""), money.format(Number(row.precio))]), rows);
      }
      const section = kind === "paquetes" ? "packages" : "memberships";
      const listed = (await listSection(section)) as Record<string, unknown>[];
      const rows = listed.slice(0, 20).map((row) => ({ id: row.id, nombre: row.name, precio: Number(row.price || 0) }));
      return tableOf(kind, ["Nombre", "Precio"], rows.map((row) => [String(row.nombre || ""), money.format(row.precio)]), rows);
    },
  };
}

function tableOf(title: string, columns: string[], lines: string[][], data: unknown): ToolOutput {
  return {
    data: clip(data),
    displays: lines.length ? [{ kind: "table", title, columns, rows: lines }] : [],
  };
}

const WRITE: AssistantTool[] = [
  {
    name: "crear_formulario",
    description: "Propone una plantilla de formulario. No la guarda: el usuario confirma la tarjeta. Pide el nombre y al menos un campo. Tipos de campo: heading, text, textarea, date, checkbox, select, signature. Tipos de formulario: intake, consent, soap, custom.",
    permission: "forms.write",
    confirm: true,
    title: "Nuevo formulario",
    fields: [
      { key: "name", label: "Nombre", input: "text" },
      { key: "formType", label: "Tipo", input: "select", options: FORM_TYPES },
      { key: "fields", label: "Campos", input: "fields" },
    ],
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        formType: { type: "string", enum: FORM_TYPES.map((item) => item.value) },
        fields: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              type: { type: "string", enum: FIELD_TYPES },
              required: { type: "boolean" },
              options: { type: "array", items: { type: "string" } },
            },
            required: ["label", "type"],
            additionalProperties: false,
          },
        },
      },
      required: ["name", "fields"],
      additionalProperties: false,
    },
    summary: (args) => `Crear el formulario «${text(args.name) || "sin nombre"}» con ${formFields(args.fields).length} campos.`,
    normalize: (args) => ({ ...args, name: text(args.name), formType: text(args.formType) || "custom", fields: formFields(args.fields) }),
    ready: (args) => {
      if (!text(args.name)) return "Falta el nombre del formulario.";
      const fields = formFields(args.fields);
      if (!fields.length) return "Falta al menos un campo.";
      if (fields.some((field) => !field.label)) return "Hay un campo sin etiqueta.";
      return null;
    },
    async run(args, ctx) {
      const fields = formFields(args.fields);
      const saved = await saveTemplate(null, {
        name: text(args.name),
        formType: FORM_TYPES.some((item) => item.value === text(args.formType)) ? text(args.formType) : "custom",
        requiresSignature: fields.some((field) => field.type === "signature"),
        schema: fields.map((field) => ({
          id: randomUUID(),
          label: field.label,
          type: field.type,
          required: field.required,
          help: "",
          options: field.type === "select" ? field.options : [],
        })),
      }, ctx.session);
      return {
        data: { id: saved.id, href: "/admin/formularios" },
        displays: [{ kind: "links", items: [{ href: "/admin/formularios", label: "Abrir formularios" }] }],
      };
    },
  },
  {
    name: "crear_paciente",
    description: "Propone el alta de un paciente. No lo guarda hasta que el usuario confirme. Nombre y apellido son obligatorios. Email y teléfono son opcionales.",
    permission: "patients.write",
    confirm: true,
    title: "Nuevo paciente",
    fields: [
      { key: "firstName", label: "Nombre", input: "text" },
      { key: "lastName", label: "Apellido", input: "text" },
      { key: "email", label: "Email", input: "text" },
      { key: "mobile", label: "Teléfono", input: "text" },
      { key: "birthDate", label: "Nacimiento", input: "text" },
    ],
    parameters: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        mobile: { type: "string" },
        birthDate: { type: "string", description: "YYYY-MM-DD" },
        sex: { type: "string", enum: ["masculino", "femenino", "otro"] },
      },
      required: ["firstName", "lastName"],
      additionalProperties: false,
    },
    summary: (args) => `Dar de alta a ${text(args.firstName)} ${text(args.lastName)}.`,
    normalize: withLocation,
    ready: (args) => (text(args.firstName) && text(args.lastName) ? null : "Faltan nombre y apellido."),
    async run(args, ctx) {
      const patient = await createPatient({
        firstName: text(args.firstName),
        lastName: text(args.lastName),
        email: text(args.email) || null,
        mobile: text(args.mobile) || null,
        birthDate: text(args.birthDate) || null,
        sex: text(args.sex) || null,
        locationId: uuid(args.locationId),
        preferredLanguage: "es",
      }, ctx.session, ctx.meta);
      return {
        data: { id: patient.id, codigo: patient.clientCode, href: `/admin/pacientes/${patient.id}` },
        displays: [{ kind: "links", items: [{ href: `/admin/pacientes/${patient.id}`, label: "Abrir ficha" }] }],
      };
    },
  },
  {
    name: "crear_lead",
    description: "Propone un lead nuevo. No lo guarda hasta que el usuario confirme. Nombre y apellido son obligatorios. Si no hay etapa, se usa la primera.",
    permission: "leads.write",
    confirm: true,
    title: "Nuevo lead",
    fields: [
      { key: "firstName", label: "Nombre", input: "text" },
      { key: "lastName", label: "Apellido", input: "text" },
      { key: "email", label: "Email", input: "text" },
      { key: "mobile", label: "Teléfono", input: "text" },
    ],
    parameters: {
      type: "object",
      properties: {
        firstName: { type: "string" },
        lastName: { type: "string" },
        email: { type: "string" },
        mobile: { type: "string" },
      },
      required: ["firstName", "lastName"],
      additionalProperties: false,
    },
    summary: (args) => `Crear el lead ${text(args.firstName)} ${text(args.lastName)}.`,
    normalize: withLocation,
    ready: (args) => (text(args.firstName) && text(args.lastName) ? null : "Faltan nombre y apellido."),
    async run(args, ctx) {
      const saved = await saveLead(null, {
        firstName: text(args.firstName),
        lastName: text(args.lastName),
        email: text(args.email) || null,
        mobile: text(args.mobile) || null,
        locationId: uuid(args.locationId),
      }, ctx.session);
      return {
        data: { id: saved.id, href: "/admin/leads" },
        displays: [{ kind: "links", items: [{ href: "/admin/leads", label: "Abrir leads" }] }],
      };
    },
  },
  {
    name: "crear_cita",
    description: "Propone una cita. No la guarda hasta que el usuario confirme. Necesita patientId, staffUserId, locationId y startsAt en hora local de la sede, formato YYYY-MM-DDTHH:mm, sin zona horaria. Resuelve los ids con buscar_paciente y directorio. serviceId es opcional. Crear la cita puede enviar el aviso al paciente.",
    permission: "appointments.write",
    confirm: true,
    title: "Nueva cita",
    fields: [
      { key: "startsAt", label: "Fecha y hora", input: "datetime" },
      { key: "notes", label: "Notas", input: "textarea" },
    ],
    parameters: {
      type: "object",
      properties: {
        patientId: { type: "string" },
        patientName: { type: "string" },
        staffUserId: { type: "string" },
        staffName: { type: "string" },
        locationId: { type: "string" },
        locationName: { type: "string" },
        serviceId: { type: "string" },
        serviceName: { type: "string" },
        startsAt: { type: "string", description: "YYYY-MM-DDTHH:mm en hora de la sede" },
        notes: { type: "string" },
      },
      required: ["patientId", "staffUserId", "startsAt"],
      additionalProperties: false,
    },
    summary: (args) => {
      const who = text(args.patientName) || "el paciente";
      const when = text(args.startsAt).replace("T", " ");
      const service = text(args.serviceName);
      const where = text(args.locationName);
      return `Agendar a ${who}${service ? ` para ${service}` : ""} el ${when}${where ? ` en ${where}` : ""}.`;
    },
    normalize: withLocation,
    ready: (args) => {
      if (!uuid(args.patientId)) return "Falta elegir el paciente. Búscalo primero.";
      if (!uuid(args.staffUserId)) return "Falta el profesional. Consulta el directorio.";
      if (!uuid(args.locationId)) return "Falta la sede. Pídela o usa la sede seleccionada en el panel.";
      if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text(args.startsAt))) return "La fecha debe ir como YYYY-MM-DDTHH:mm.";
      return null;
    },
    async run(args, ctx) {
      const created = await createAppointment({
        patientId: uuid(args.patientId),
        staffUserId: uuid(args.staffUserId) || "",
        locationId: uuid(args.locationId) || "",
        serviceId: uuid(args.serviceId),
        startsAt: text(args.startsAt),
        notes: text(args.notes) || null,
        status: "booked",
      }, ctx.session, ctx.meta);
      return {
        data: { id: created.appointment.id, href: "/admin/calendario" },
        displays: [{ kind: "links", items: [{ href: "/admin/calendario", label: "Abrir calendario" }] }],
      };
    },
  },
  {
    name: "asignar_formulario",
    description: "Propone asignar una plantilla a un paciente. No la asigna hasta que el usuario confirme. Necesita templateId y patientId, resueltos con plantillas_de_formulario y buscar_paciente.",
    permission: "forms.write",
    confirm: true,
    title: "Asignar formulario",
    fields: [],
    parameters: {
      type: "object",
      properties: {
        templateId: { type: "string" },
        templateName: { type: "string" },
        patientId: { type: "string" },
        patientName: { type: "string" },
      },
      required: ["templateId", "patientId"],
      additionalProperties: false,
    },
    summary: (args) => `Asignar «${text(args.templateName) || "el formulario"}» a ${text(args.patientName) || "el paciente"}.`,
    ready: (args) => (uuid(args.templateId) && uuid(args.patientId) ? null : "Faltan la plantilla y el paciente."),
    async run(args, ctx) {
      const assigned = await assignForm({
        templateId: uuid(args.templateId),
        patientId: uuid(args.patientId),
      }, ctx.session);
      const href = `/portal/formularios/${assigned.token}`;
      return {
        data: { id: assigned.id, href },
        displays: [{ kind: "links", items: [{ href, label: "Abrir el formulario del paciente" }] }],
      };
    },
  },
];

export function toolsFor(session: StaffSession): AssistantTool[] {
  const visible = READ.concat(WRITE).filter((tool) => hasPermission(session, tool.permission));
  const kinds = [
    hasPermission(session, "appointments.read") || hasPermission(session, "settings.read") ? "servicios" : "",
    hasPermission(session, "inventory.read") ? "productos" : "",
    hasPermission(session, "inventory.read") || hasPermission(session, "settings.read") ? "paquetes" : "",
    hasPermission(session, "inventory.read") || hasPermission(session, "settings.read") ? "membresias" : "",
  ].filter(Boolean);
  if (kinds.length) visible.push(catalogTool(kinds));
  return visible;
}

export function toolByName(session: StaffSession, name: string): AssistantTool | undefined {
  return toolsFor(session).find((tool) => tool.name === name);
}

export function specsOf(tools: AssistantTool[]): ToolSpec[] {
  return tools.map((tool) => ({ name: tool.name, description: tool.description, parameters: tool.parameters }));
}
