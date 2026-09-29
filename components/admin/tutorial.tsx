"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CircleHelp, X } from "lucide-react";

type Guide = { title: string; steps: string[] };

const GUIDES: { match: (path: string) => boolean; guide: Guide }[] = [
  { match: (path) => path === "/admin" || path.endsWith("/admin"), guide: { title: "Inicio", steps: ["Revisa citas, ingresos y leads del día.", "Usa Crear para un paciente, un lead o una cita.", "Ctrl+K busca un paciente por nombre o código."] } },
  { match: (path) => path.includes("/calendario"), guide: { title: "Calendario", steps: ["Haz clic en un hueco del día para abrir una cita.", "Elige paciente, servicio, profesional y sede, y guarda.", "Arrastra una cita para moverla. Archivar la cancela y conserva el registro.", "Si falta un profesional, un servicio o una sede, el formulario te ofrece crearlo."] } },
  { match: (path) => /\/pacientes\/[^/]+/.test(path), guide: { title: "Ficha del paciente", steps: ["Resumen muestra los datos principales.", "Citas, Expediente, Finanzas, Comunicaciones y Membresías están en las pestañas.", "Archivar oculta al paciente de la lista. El expediente se conserva."] } },
  { match: (path) => path.includes("/pacientes"), guide: { title: "Pacientes", steps: ["Pulsa + Paciente. El asterisco marca lo obligatorio.", "Datos, Contacto, Dirección y Consentimientos son pestañas del mismo formulario.", "Guardar paciente cierra el panel y deja el aviso con enlace a la ficha.", "Busca por nombre, código, correo o teléfono."] } },
  { match: (path) => path.includes("/leads"), guide: { title: "Leads", steps: ["Crea el lead con nombre, apellido y etapa.", "Arrastra la tarjeta a otra columna para cambiar la etapa.", "Archivar lo quita del tablero sin borrar el historial."] } },
  { match: (path) => path.includes("/ventas"), guide: { title: "Ventas", steps: ["Elige Servicios, Productos, Paquetes o Membresías y pulsa un ítem para sumarlo.", "Revisa el cobro y confirma. Con Stripe, completa el pago en el mismo paso.", "Si no hay servicios o productos, el aviso te lleva a crearlos.", "Anular deja la venta registrada como anulada."] } },
  { match: (path) => path.includes("/facturas"), guide: { title: "Facturas", steps: ["Las facturas se generan al cobrar en Ventas.", "Aquí consultas emitidas, cotizaciones y notas de crédito.", "Si la lista está vacía, crea primero una venta."] } },
  { match: (path) => path.includes("/productos"), guide: { title: "Productos", steps: ["Crea el producto con nombre y precio.", "El ajuste de inventario suma o resta existencias por sede.", "Si no hay sede, créala en Configuración antes de ajustar stock."] } },
  { match: (path) => path.includes("/formularios"), guide: { title: "Formularios", steps: ["Crea una plantilla: ingreso, consentimiento, SOAP o personalizada.", "Agrega campos y marca los obligatorios.", "Pulsa la fila para volver a abrirla. Archivar la oculta de la lista."] } },
  { match: (path) => path.includes("/comunicaciones"), guide: { title: "Comunicaciones", steps: ["Cada tarjeta es una plantilla. Editar abre el texto y las variables.", "Pulsa un chip para insertar {{nombre}}, {{fecha}} u otra variable.", "La cola lista Canal, Destinatario, Estado, Mensaje y Fecha.", "Enviar N pendientes pide confirmación antes de salir."] } },
  { match: (path) => path.includes("/reportes"), guide: { title: "Reportes", steps: ["Cambia de pestaña para citas, ingresos, servicios, profesionales, marketing o inasistencias.", "Los números cubren los últimos 30 días.", "Si está vacío, aparecen cuando haya citas o cobros."] } },
  { match: (path) => path.includes("/configuracion/sedes"), guide: { title: "Sedes", steps: ["Pulsa + Nuevo.", "Escribe el nombre y la zona horaria. El resto de la dirección es opcional.", "Guarda. Las salas, horarios y citas usan esta sede."] } },
  { match: (path) => path.includes("/configuracion/salas"), guide: { title: "Salas", steps: ["Necesitas al menos una sede.", "Pulsa + Nuevo, elige la sede y el nombre de la sala.", "Guarda. La sala queda disponible al agendar."] } },
  { match: (path) => path.includes("/configuracion/horarios"), guide: { title: "Horarios", steps: ["Elige profesional, sede y día.", "Indica desde y hasta.", "Sin este horario, el calendario público no ofrece horas de ese profesional."] } },
  { match: (path) => path.includes("/configuracion/servicios"), guide: { title: "Servicios", steps: ["Pulsa + Nuevo. El título del panel es el nombre del servicio.", "General, Precios, Reserva en línea y Formularios están en el control segmentado.", "Marca si se puede reservar en línea y guarda.", "La tabla muestra nombre, duración, precio y categoría."] } },
  { match: (path) => path.includes("/configuracion/categorias"), guide: { title: "Categorías", steps: ["Pulsa + Nuevo y escribe el nombre.", "Guarda. Luego asígnala al editar un servicio."] } },
  { match: (path) => path.includes("/configuracion/equipo"), guide: { title: "Equipo y roles", steps: ["Pulsa + Nuevo.", "Nombre, apellido, correo y contraseña son la cuenta de acceso.", "Marca Atiende citas si debe salir en el calendario.", "Elige el rol: Administración, Medicina o Recepción."] } },
  { match: (path) => path.includes("/configuracion/impuestos"), guide: { title: "Impuestos", steps: ["Pulsa + Nuevo, escribe el nombre y la tasa.", "Marca Impuesto por defecto si aplica a los precios nuevos.", "Guarda y asígnalo en el precio del servicio."] } },
  { match: (path) => path.includes("/configuracion/pagos"), guide: { title: "Métodos de pago", steps: ["Pulsa + Nuevo.", "La clave es interna (por ejemplo efectivo). El nombre es el que ve el equipo.", "Desmarca Activo para ocultarlo sin borrarlo."] } },
  { match: (path) => path.includes("/configuracion/facturacion"), guide: { title: "Facturación", steps: ["Escribe la política de cancelación, el pie de factura y el aviso de privacidad.", "Guarda. Esos textos salen en la reserva y en los documentos."] } },
  { match: (path) => path.includes("/configuracion/campos"), guide: { title: "Campos personalizados", steps: ["Pulsa + Nuevo.", "Elige si aplica a paciente, lead, cita o producto.", "Etiqueta es lo que se lee. Clave es el identificador. Tipo define el control."] } },
  { match: (path) => path.includes("/configuracion/politicas"), guide: { title: "Políticas de reserva", steps: ["Ajusta el intervalo, la anticipación y la ventana para cancelar.", "Activa o desactiva reprogramar, lista de espera y términos.", "Guarda. La reserva pública usa estas reglas."] } },
  { match: (path) => path.includes("/contenido"), guide: { title: "Contenido", steps: ["Elige la sección del sitio en el menú del editor.", "Cambia textos o imágenes y guarda.", "La vista previa muestra la página pública."] } },
  { match: (path) => path.includes("/tienda"), guide: { title: "Tienda", steps: ["Crea o edita un producto de la tienda pública.", "Precio, foto y categoría salen en el catálogo.", "Guarda para publicarlo."] } },
];

export function guideFor(pathname: string): Guide {
  const path = pathname.replace(/^\/(es|en|ko|it)/, "") || "/admin";
  return GUIDES.find((item) => item.match(path))?.guide || {
    title: "Esta sección",
    steps: ["Recorre la pantalla de arriba a abajo.", "Los botones terracota guardan o crean.", "Si falta un dato, el aviso te lleva a crearlo."],
  };
}

export function TutorialButton({ pathname }: { pathname: string }) {
  const guide = guideFor(pathname);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOpen(params.get("tutorial") === "1");
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="admin-tutorial">
      <button type="button" className="admin-tutorial__btn" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <CircleHelp size={14} aria-hidden />
        Tutorial
      </button>
      {open ? (
        <div className="admin-tutorial__panel" role="dialog" aria-label={`Tutorial de ${guide.title}`}>
          <div className="admin-tutorial__head">
            <p>{guide.title}</p>
            <button type="button" className="admin-icon-btn" aria-label="Cerrar tutorial" onClick={() => setOpen(false)}><X size={14} /></button>
          </div>
          <ol>
            {guide.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

export function CreateOffer({ show, what, href, how }: { show: boolean; what: string; href: string; how: string }) {
  if (!show) return null;
  const target = href.includes("tutorial=1") ? href : `${href}${href.includes("?") ? "&" : "?"}tutorial=1`;
  return (
    <span className="admin-offer">
      No se puede continuar sin {what}. <Link href={target}>¿Quieres crear esto?</Link>
      <span>{how}</span>
    </span>
  );
}
