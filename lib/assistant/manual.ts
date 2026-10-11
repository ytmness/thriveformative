const MANUAL = `
Dashboard (/admin): citas, ingresos y leads de hoy. El botón Crear abre paciente, lead, cita o cobro. El selector de México o Estados Unidos, arriba en el menú, filtra sedes, servicios y la tienda.

Calendario (/admin/calendario): cambia día, semana o mes, filtra al profesional y abre + Cita. Clic en un hueco libre o arrastra una cita para moverla. Hay que elegir paciente, servicio, profesional y sede.

Pacientes (/admin/pacientes): busca por nombre, código, email o teléfono. El menú lateral filtra por sexo (Mujeres, Hombres, Otro y Sin dato) y por cómo nos descubrieron (Instagram, Facebook u otra fuente). Quien no tiene sexo guardado aparece en Sin dato, no en Otro. + Paciente pide nombre y apellido (el asterisco es obligatorio) en Datos, Contacto, Dirección y Consentimientos. En Contacto, Cómo nos descubrieron guarda el origen. Abrir una fila entra a la ficha (/admin/pacientes/{id}) con resumen, citas, expediente, finanzas, comunicaciones y membresías. En Expediente, Plan de 90 días es un recuadro grande de notas. Sesiones pide el nombre; la fecha se pone sola. Empezar cronometra y el botón pasa a Guardar para terminar y guardar el tiempo. Estudios clínicos guarda PDF, JPG y PNG en Imagenología, Sangre/orina/saliva, Microbiota y Procedimientos. Archivar oculta al paciente de la lista; el expediente se queda.

Leads (/admin/leads): nombre, apellido y etapa son obligatorios. Arrastrar la tarjeta cambia de columna. Abrirla permite convertirla en paciente o archivarla.

Cobrar (/admin/cobrar): menú de servicios, productos, paquetes y membresías con foto y precio. Cada toque suma una unidad. Revisa subtotal, impuestos y total, y confirma. Si falta el catálogo, el aviso lleva a crearlo. Las facturas nacen al cobrar.

Ventas (/admin/ventas): hoy, semana, mes y ticket promedio. La tabla lista las ventas. Anular conserva el registro. Cobrar abre el punto de venta.

Facturas (/admin/facturas): pestañas de facturas, cotizaciones y notas de crédito. Abrir una fila muestra el documento para imprimirlo. En cotizaciones o notas, el formulario crea el documento.

Servicios y productos (/admin/catalogo/servicios, /admin/catalogo/productos, /admin/catalogo/tienda, /admin/catalogo/paquetes, /admin/catalogo/membresias, /admin/catalogo/categorias): + Nuevo crea el registro, excepto en el punto de venta, que se crea desde Tienda web. El menú de la fila edita o archiva. Los servicios se asignan a las sedes del país seleccionado. El stock de productos se ajusta por sede.

Tienda web (/admin/catalogo/tienda): el catálogo público del sitio, dentro de Catálogo, separado por país. El formulario pide nombre, precio o enlace de referido, y lo publica. El enlace del producto se arma solo. Arriba se crean o renombran categorías.

Contenido (/admin/contenido): elige vista previa o lista y el idioma. Clic en un bloque para editar ese texto o esa imagen.

Formularios (/admin/formularios): elige el tipo (ingreso, consentimiento, nota clínica u otro), escribe el nombre y agrega bloques (título, texto, párrafo, fecha, casilla, lista, firma). Guardar deja la plantilla. Pulsar una plantilla la vuelve a abrir.

Comunicaciones (/admin/comunicaciones): cada tarjeta es una plantilla. Editar e insertar variables con los chips. El envío de pendientes pide confirmación. La cola muestra canal, destinatario, estado, mensaje y fecha.

Reportes (/admin/reportes/citas, /admin/reportes/ingresos, /admin/reportes/servicios, /admin/reportes/profesionales, /admin/reportes/marketing, /admin/reportes/no-shows): cada ruta es un reporte de los últimos 30 días, filtrado por el país y la sede elegidos.

Clínica, en el menú: horarios (/admin/configuracion/horarios) y equipo y roles (/admin/configuracion/equipo). Configuración: sedes (/admin/configuracion/sedes), salas (/admin/configuracion/salas), horarios, equipo, impuestos (/admin/configuracion/impuestos), pagos (/admin/configuracion/pagos), facturación (/admin/configuracion/facturacion), campos (/admin/configuracion/campos) y políticas de reserva (/admin/configuracion/politicas). Una sede hace falta antes de salas, horarios y citas. En equipo, nombre, correo y contraseña crean el acceso; Atiende citas lo muestra en el calendario. Sin horario, la reserva pública no ofrece esas horas.
`.trim();

const SCREENS: { test: (path: string) => boolean; hint: string }[] = [
  { test: (path) => path === "/admin", hint: "Está en el Dashboard." },
  { test: (path) => path.includes("/calendario"), hint: "Está en el Calendario." },
  { test: (path) => /\/pacientes\/[^/]+/.test(path), hint: "Está en la ficha de un paciente." },
  { test: (path) => path.includes("/pacientes"), hint: "Está en Pacientes." },
  { test: (path) => path.includes("/leads"), hint: "Está en Leads." },
  { test: (path) => path.includes("/cobrar"), hint: "Está en Cobrar." },
  { test: (path) => path.includes("/ventas"), hint: "Está en Ventas." },
  { test: (path) => path.includes("/facturas"), hint: "Está en Facturas." },
  { test: (path) => path.includes("/catalogo/tienda"), hint: "Está en la Tienda web, dentro de Catálogo." },
  { test: (path) => path.includes("/catalogo"), hint: "Está en Servicios y productos." },
  { test: (path) => path.includes("/formularios"), hint: "Está en Formularios." },
  { test: (path) => path.includes("/comunicaciones"), hint: "Está en Comunicaciones." },
  { test: (path) => path.includes("/reportes"), hint: "Está en Reportes." },
  { test: (path) => path.includes("/tienda/pedidos"), hint: "Está en Pedidos en línea." },
  { test: (path) => path.includes("/contenido"), hint: "Está en Contenido." },
  { test: (path) => path.includes("/configuracion"), hint: "Está en Configuración." },
];

export function manualText(): string {
  return MANUAL;
}

export function screenHint(pathname: string): string {
  const path = pathname.replace(/^\/(es|en|ko|it)/, "") || "/admin";
  return SCREENS.find((item) => item.test(path))?.hint || "Está en el panel.";
}
