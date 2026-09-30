"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import {
  BarChart3, Calendar, ChevronLeft, ChevronRight, CircleHelp, ClipboardList,
  Clock, Contact, CreditCard, FileText, LayoutDashboard, MapPin, MessageSquare,
  Package, Percent, ShoppingBag, SlidersHorizontal, Store, Tags, UserRound, Users, Wallet, X,
} from "lucide-react";

type Lang = "es" | "en" | "it" | "ko";
type GuideId =
  | "home" | "calendar" | "chart" | "patients" | "leads" | "cobrar" | "sales" | "invoices" | "products" | "catalog"
  | "forms" | "comms" | "reports" | "locations" | "rooms" | "hours" | "services" | "categories"
  | "team" | "taxes" | "payments" | "billing" | "fields" | "policies" | "content" | "store" | "fallback";
type OfferKind = "patient" | "service" | "staff" | "location" | "category" | "sale" | "product";

const LANGS: Lang[] = ["es", "en", "it", "ko"];
const LANG_LABEL: Record<Lang, string> = { es: "ES", en: "EN", it: "IT", ko: "KO" };
const STORAGE = "thrive_tutorial_locale";

const UI: Record<Lang, { tutorial: string; close: string; back: string; next: string; done: string; step: string; missing: string; create: string }> = {
  es: { tutorial: "Tutorial", close: "Cerrar tutorial", back: "Atrás", next: "Siguiente", done: "Listo", step: "Paso", missing: "No se puede continuar sin", create: "¿Quieres crear esto?" },
  en: { tutorial: "Guide", close: "Close guide", back: "Back", next: "Next", done: "Done", step: "Step", missing: "You need", create: "Create it?" },
  it: { tutorial: "Guida", close: "Chiudi guida", back: "Indietro", next: "Avanti", done: "Fatto", step: "Passo", missing: "Manca", create: "Vuoi crearlo?" },
  ko: { tutorial: "안내", close: "안내 닫기", back: "이전", next: "다음", done: "완료", step: "단계", missing: "필요한 항목", create: "새로 만들까요?" },
};

type Pack = { title: string; steps: string[] };

const GUIDES: Record<GuideId, Record<Lang, Pack>> = {
  home: {
    es: { title: "Inicio", steps: ["Mira las citas, los ingresos y los leads de hoy.", "Crear abre paciente, lead, cita o cobro."] },
    en: { title: "Home", steps: ["See today’s appointments, revenue, and leads.", "Create starts a patient, lead, visit, or charge."] },
    it: { title: "Inizio", steps: ["Vedi visite, incassi e lead di oggi.", "Crea apre paziente, lead, visita o incasso."] },
    ko: { title: "홈", steps: ["오늘의 예약, 매출, 리드를 확인합니다.", "만들기에서 환자, 리드, 예약, 결제를 엽니다."] },
  },
  calendar: {
    es: { title: "Calendario", steps: ["Esta barra cambia día, semana o mes, filtra al profesional y abre + Cita.", "Haz clic en un hueco libre o arrastra una cita para moverla.", "Elige paciente, servicio, profesional y sede, y guarda."] },
    en: { title: "Calendar", steps: ["This bar switches day, week, or month, filters the provider, and opens + Visit.", "Click an empty slot, or drag a visit to move it.", "Choose patient, service, provider, and location, then save."] },
    it: { title: "Calendario", steps: ["Questa barra cambia giorno, settimana o mese, filtra il professionista e apre + Visita.", "Clicca uno spazio libero o trascina una visita per spostarla.", "Scegli paziente, servizio, professionista e sede, e salva."] },
    ko: { title: "달력", steps: ["이 막대에서 일·주·월, 담당자, + 예약을 고릅니다.", "빈 칸을 누르거나 예약을 끌어 옮깁니다.", "환자, 서비스, 담당자, 지점을 고르고 저장합니다."] },
  },
  chart: {
    es: { title: "Ficha", steps: ["Estas pestañas son resumen, citas, expediente, finanzas, comunicaciones y membresías.", "Aquí está el contenido de la pestaña que tienes abierta.", "Archivar oculta al paciente de la lista. El expediente se queda."] },
    en: { title: "Chart", steps: ["These tabs are summary, visits, chart, billing, messages, and memberships.", "This is the content of the open tab.", "Archive hides the patient from the list. The record stays."] },
    it: { title: "Scheda", steps: ["Queste schede sono riepilogo, visite, cartella, pagamenti, messaggi e abbonamenti.", "Qui c’è il contenuto della scheda aperta.", "Archivia nasconde il paziente dalla lista. La cartella resta."] },
    ko: { title: "차트", steps: ["이 탭은 요약, 예약, 기록, 수납, 메시지, 멤버십입니다.", "열린 탭의 내용이 여기 있습니다.", "보관하면 목록에서 숨고 기록은 남습니다."] },
  },
  patients: {
    es: { title: "Pacientes", steps: ["Busca por nombre, código, email o teléfono y pulsa Buscar.", "Este botón abre el alta.", "Estas pestañas son Datos, Contacto, Dirección y Consentimientos. El * es obligatorio.", "Guardar cierra el panel y deja el aviso con enlace a la ficha.", "La lista muestra los pacientes. Abre una fila para ver la ficha."] },
    en: { title: "Patients", steps: ["Search by name, code, email, or phone, then press Search.", "This button opens the new patient panel.", "These tabs are Details, Contact, Address, and Consent. * means required.", "Save closes the panel and leaves a link to the chart.", "The list shows patients. Open a row to see the chart."] },
    it: { title: "Pazienti", steps: ["Cerca per nome, codice, email o telefono e premi Cerca.", "Questo bottone apre la scheda nuova.", "Queste schede sono Dati, Contatto, Indirizzo e Consensi. * è obbligatorio.", "Salva chiude il pannello e lascia il link alla scheda.", "La lista mostra i pazienti. Apri una riga per la scheda."] },
    ko: { title: "환자", steps: ["이름, 코드, 이메일, 전화로 찾고 검색을 누릅니다.", "이 버튼이 신규 등록을 엽니다.", "이 탭은 정보, 연락처, 주소, 동의입니다. * 는 필수입니다.", "저장하면 패널이 닫히고 차트 링크가 남습니다.", "목록에 환자가 있습니다. 행을 열면 차트입니다."] },
  },
  leads: {
    es: { title: "Leads", steps: ["Este botón abre el alta del lead.", "Nombre, apellido y etapa son obligatorios. Luego guarda.", "Arrastra la tarjeta a otra columna. Ábrela para convertirla o archivarla."] },
    en: { title: "Leads", steps: ["This button opens a new lead.", "First name, last name, and stage are required. Then save.", "Drag the card to another column. Open it to convert or archive."] },
    it: { title: "Lead", steps: ["Questo bottone apre un lead nuovo.", "Nome, cognome e fase sono obbligatori. Poi salva.", "Trascina la scheda in un’altra colonna. Aprila per convertirla o archiviarla."] },
    ko: { title: "리드", steps: ["이 버튼이 새 리드를 엽니다.", "이름, 성, 단계는 필수입니다. 그리고 저장합니다.", "카드를 다른 열로 끕니다. 열어서 환자로 바꾸거나 보관합니다."] },
  },
  cobrar: {
    es: { title: "Cobrar", steps: ["Elige la pestaña y pulsa un ítem para sumarlo.", "Revisa subtotal, impuestos y total, y confirma el cobro.", "Si falta el catálogo, el aviso te lleva a crearlo."] },
    en: { title: "Charge", steps: ["Pick a tab and tap an item to add it.", "Review subtotal, tax, and total, then confirm.", "If the catalog is empty, the prompt creates it."] },
    it: { title: "Incassa", steps: ["Scegli la scheda e tocca una voce.", "Controlla subtotale, imposte e totale, e conferma.", "Se manca il catalogo, l’avviso lo crea."] },
    ko: { title: "결제", steps: ["탭에서 항목을 눌러 담습니다.", "소계, 세금, 합계를 확인하고 확정합니다.", "목록이 없으면 안내가 만들기로 보냅니다."] },
  },
  sales: {
    es: { title: "Ventas", steps: ["Estas tarjetas son hoy, la semana, el mes y el ticket promedio.", "La tabla lista las ventas. Anular conserva el registro.", "Cobrar abre el punto de venta."] },
    en: { title: "Sales", steps: ["These cards are today, this week, this month, and the average ticket.", "The table lists sales. Void keeps the record.", "Charge opens the register."] },
    it: { title: "Vendite", steps: ["Queste schede sono oggi, la settimana, il mese e lo scontrino medio.", "La tabella elenca le vendite. Annullare conserva il registro.", "Incassa apre la cassa."] },
    ko: { title: "판매", steps: ["이 카드는 오늘, 이번 주, 이번 달, 평균 결제입니다.", "표가 판매 목록입니다. 취소해도 기록은 남습니다.", "결제가 계산대를 엽니다."] },
  },
  invoices: {
    es: { title: "Facturas", steps: ["Estas pestañas son facturas, cotizaciones y notas de crédito.", "En cotizaciones o notas, este formulario crea el documento.", "La tabla lista lo emitido. Las facturas nacen al cobrar en Ventas."] },
    en: { title: "Invoices", steps: ["These tabs are invoices, quotes, and credit notes.", "On quotes or credits, this form creates the document.", "The table lists what was issued. Invoices appear when you charge in Sales."] },
    it: { title: "Fatture", steps: ["Queste schede sono fatture, preventivi e note di credito.", "In preventivi o note, questo modulo crea il documento.", "La tabella elenca l’emesso. Le fatture nascono incassando in Vendite."] },
    ko: { title: "청구", steps: ["이 탭은 청구서, 견적, 신용 전표입니다.", "견적이나 전표에서 이 양식이 문서를 만듭니다.", "표에 발행 내역이 있습니다. 청구서는 판매 결제 때 생깁니다."] },
  },
  products: {
    es: { title: "Productos", steps: ["Pulsa + Nuevo para crear el producto: nombre, precio y proveedor.", "La tabla muestra SKU, precio y existencias.", "Aquí sumas o restas stock por sede. Sin sede, el aviso te lleva a crearla."] },
    en: { title: "Products", steps: ["Press + New to create the product: name, price, and supplier.", "The table shows SKU, price, and stock.", "Here you add or remove stock by location. Without a location, the prompt creates one."] },
    it: { title: "Prodotti", steps: ["Premi + Nuovo per creare il prodotto: nome, prezzo e fornitore.", "La tabella mostra SKU, prezzo e giacenza.", "Qui sommi o togli stock per sede. Senza sede, l’avviso la crea."] },
    ko: { title: "제품", steps: ["+ 새로 만들기로 이름, 가격, 공급자를 넣습니다.", "표에 SKU, 가격, 재고가 있습니다.", "여기서 지점별 재고를 더하거나 뺍니다. 지점이 없으면 안내가 만들기로 보냅니다."] },
  },
  forms: {
    es: { title: "Formularios", steps: ["Elige el tipo, escribe el nombre y agrega campos. El asterisco marca lo obligatorio.", "Pulsa guardar para dejar la plantilla.", "Pulsa una fila de la lista para volver a abrirla."] },
    en: { title: "Forms", steps: ["Pick the type, type the name, and add fields. The asterisk marks what is required.", "Press save to keep the template.", "Press a row in the list to open it again."] },
    it: { title: "Moduli", steps: ["Scegli il tipo, scrivi il nome e aggiungi campi. L’asterisco segna l’obbligatorio.", "Premi salva per tenere il modello.", "Premi una riga della lista per riaprirlo."] },
    ko: { title: "서식", steps: ["유형을 고르고 이름을 쓴 뒤 필드를 넣습니다. 별표가 필수입니다.", "저장을 눌러 서식을 남깁니다.", "목록의 행을 누르면 다시 엽니다."] },
  },
  comms: {
    es: { title: "Comunicaciones", steps: ["Cada tarjeta es una plantilla. Pulsa Editar para abrirla.", "En el editor, pulsa un chip para insertar la variable y guarda.", "Este botón envía los pendientes y pide confirmación.", "La cola muestra canal, destinatario, estado, mensaje y fecha."] },
    en: { title: "Messages", steps: ["Each card is a template. Press Edit to open it.", "In the editor, tap a chip to insert a variable, then save.", "This button sends the queue and asks you to confirm.", "The queue shows channel, recipient, status, message, and date."] },
    it: { title: "Messaggi", steps: ["Ogni scheda è un modello. Premi Modifica per aprirlo.", "Nell’editor, tocca un chip per la variabile e salva.", "Questo bottone invia la coda e chiede conferma.", "La coda mostra canale, destinatario, stato, messaggio e data."] },
    ko: { title: "메시지", steps: ["카드마다 템플릿입니다. 편집을 눌러 엽니다.", "편집기에서 칩을 눌러 변수를 넣고 저장합니다.", "이 버튼이 대기열을 보내고 확인을 묻습니다.", "대기열에 채널, 수신자, 상태, 메시지, 날짜가 있습니다."] },
  },
  reports: {
    es: { title: "Reportes", steps: ["Estas pestañas cambian el reporte: citas, ingresos, servicios y el resto.", "La tabla son los últimos 30 días. Si está vacía, faltan citas o cobros.", "El menú de la izquierda lleva a las demás secciones del panel."] },
    en: { title: "Reports", steps: ["These tabs switch the report: visits, revenue, services, and the rest.", "The table is the last 30 days. Empty means there are no visits or charges yet.", "The left menu opens the other sections of the panel."] },
    it: { title: "Report", steps: ["Queste schede cambiano il report: visite, incassi, servizi e il resto.", "La tabella sono gli ultimi 30 giorni. Vuota significa che mancano visite o incassi.", "Il menu a sinistra apre le altre sezioni."] },
    ko: { title: "보고서", steps: ["이 탭이 보고서를 바꿉니다: 예약, 매출, 서비스와 나머지.", "표는 최근 30일입니다. 비어 있으면 예약이나 결제가 없습니다.", "왼쪽 메뉴가 패널의 다른 구역으로 갑니다."] },
  },
  locations: {
    es: { title: "Sedes", steps: ["Pulsa + Nuevo.", "Escribe nombre y zona horaria.", "Guarda. Salas, horarios y citas usan esta sede."] },
    en: { title: "Locations", steps: ["Press + New.", "Enter the name and time zone.", "Save. Rooms, hours, and visits use this location."] },
    it: { title: "Sedi", steps: ["Premi + Nuovo.", "Scrivi nome e fuso orario.", "Salva. Sale, orari e visite usano questa sede."] },
    ko: { title: "지점", steps: ["+ 새로 만들기를 누릅니다.", "이름과 시간대를 적습니다.", "저장합니다. 진료실, 시간, 예약이 이 지점을 씁니다."] },
  },
  rooms: {
    es: { title: "Salas", steps: ["Primero hace falta una sede.", "Pulsa + Nuevo y elige sede y nombre.", "Guarda. La sala queda para agendar."] },
    en: { title: "Rooms", steps: ["You need a location first.", "Press + New and pick location and name.", "Save. The room is ready for booking."] },
    it: { title: "Sale", steps: ["Prima serve una sede.", "Premi + Nuovo e scegli sede e nome.", "Salva. La sala è pronta per le visite."] },
    ko: { title: "진료실", steps: ["먼저 지점이 필요합니다.", "+ 새로 만들기에서 지점과 이름을 고릅니다.", "저장하면 예약에 쓸 수 있습니다."] },
  },
  hours: {
    es: { title: "Horarios", steps: ["Pulsa + Nuevo para abrir el horario.", "Elige profesional, sede y día, e indica desde y hasta.", "La tabla lista los horarios. Sin horario, la reserva pública no ofrece esas horas."] },
    en: { title: "Hours", steps: ["Press + New to open the hours form.", "Choose provider, location, and day, then set from and to.", "The table lists the hours. Without hours, online booking hides those times."] },
    it: { title: "Orari", steps: ["Premi + Nuovo per aprire l’orario.", "Scegli professionista, sede e giorno, e indica da e a.", "La tabella elenca gli orari. Senza orario, la prenotazione online non li mostra."] },
    ko: { title: "근무 시간", steps: ["+ 새로 만들기로 시간 양식을 엽니다.", "담당자, 지점, 요일과 시작·끝을 고릅니다.", "표에 시간이 있습니다. 없으면 온라인 예약에 안 나옵니다."] },
  },
  services: {
    es: { title: "Servicios", steps: ["Pulsa + Nuevo y pon el nombre.", "General, Precios, Reserva y Formularios son el control de arriba.", "Guarda. La tabla muestra duración y precio."] },
    en: { title: "Services", steps: ["Press + New and name it.", "General, Pricing, Booking, and Forms are the top control.", "Save. The table shows length and price."] },
    it: { title: "Servizi", steps: ["Premi + Nuovo e dai il nome.", "Generale, Prezzi, Prenotazione e Moduli sono il controllo in alto.", "Salva. La tabella mostra durata e prezzo."] },
    ko: { title: "서비스", steps: ["+ 새로 만들기로 이름을 넣습니다.", "일반, 가격, 예약, 서식은 위 전환입니다.", "저장하면 표에 시간과 가격이 나옵니다."] },
  },
  categories: {
    es: { title: "Categorías", steps: ["Pulsa + Nuevo.", "Escribe el nombre y guarda.", "Luego asígnala al editar un servicio."] },
    en: { title: "Categories", steps: ["Press + New.", "Type the name and save.", "Then assign it while editing a service."] },
    it: { title: "Categorie", steps: ["Premi + Nuovo.", "Scrivi il nome e salva.", "Poi assegnala modificando un servizio."] },
    ko: { title: "분류", steps: ["+ 새로 만들기를 누릅니다.", "이름을 쓰고 저장합니다.", "서비스를 편집할 때 지정합니다."] },
  },
  team: {
    es: { title: "Equipo", steps: ["Pulsa + Nuevo.", "Nombre, correo y contraseña crean el acceso.", "Marca Atiende citas si sale en el calendario."] },
    en: { title: "Team", steps: ["Press + New.", "Name, email, and password create the login.", "Mark Sees patients if they appear on the calendar."] },
    it: { title: "Team", steps: ["Premi + Nuovo.", "Nome, email e password creano l’accesso.", "Segna Riceve visite se compare in calendario."] },
    ko: { title: "팀", steps: ["+ 새로 만들기를 누릅니다.", "이름, 메일, 비밀번호가 로그인입니다.", "예약을 보면 달력에 나옵니다."] },
  },
  taxes: {
    es: { title: "Impuestos", steps: ["Pulsa + Nuevo.", "Nombre y tasa. Marca el de por defecto si aplica.", "Guarda y asígnalo en el precio del servicio."] },
    en: { title: "Taxes", steps: ["Press + New.", "Name and rate. Mark the default if it applies.", "Save and assign it on the service price."] },
    it: { title: "Imposte", steps: ["Premi + Nuovo.", "Nome e aliquota. Segna quella predefinita.", "Salva e assegnala al prezzo del servizio."] },
    ko: { title: "세금", steps: ["+ 새로 만들기를 누릅니다.", "이름과 세율. 기본이면 표시합니다.", "저장 후 서비스 가격에 지정합니다."] },
  },
  payments: {
    es: { title: "Pagos", steps: ["Pulsa + Nuevo.", "La clave es interna. El nombre lo ve el equipo.", "Quita Activo para ocultarlo."] },
    en: { title: "Payments", steps: ["Press + New.", "The key is internal. The name is what staff see.", "Turn off Active to hide it."] },
    it: { title: "Pagamenti", steps: ["Premi + Nuovo.", "La chiave è interna. Il nome lo vede il team.", "Togli Attivo per nasconderlo."] },
    ko: { title: "결제 수단", steps: ["+ 새로 만들기를 누릅니다.", "키는 내부용이고 이름은 직원이 봅니다.", "사용 중을 끄면 숨습니다."] },
  },
  billing: {
    es: { title: "Facturación", steps: ["Escribe la política de cancelación. La reserva pública la muestra.", "Este botón guarda el texto.", "El menú de la izquierda cambia de sección."] },
    en: { title: "Billing", steps: ["Write the cancellation policy. Public booking shows it.", "This button saves the text.", "The left menu switches section."] },
    it: { title: "Fatturazione", steps: ["Scrivi la politica di cancellazione. La prenotazione pubblica la mostra.", "Questo bottone salva il testo.", "Il menu a sinistra cambia sezione."] },
    ko: { title: "청구 문구", steps: ["취소 정책을 적습니다. 공개 예약에 보입니다.", "이 버튼이 문구를 저장합니다.", "왼쪽 메뉴가 구역을 바꿉니다."] },
  },
  fields: {
    es: { title: "Campos", steps: ["Pulsa + Nuevo.", "Elige si es de paciente, lead, cita o producto.", "Etiqueta se lee. Clave identifica. Tipo es el control."] },
    en: { title: "Fields", steps: ["Press + New.", "Choose patient, lead, visit, or product.", "Label is read. Key identifies. Type is the control."] },
    it: { title: "Campi", steps: ["Premi + Nuovo.", "Scegli paziente, lead, visita o prodotto.", "Etichetta si legge. Chiave identifica. Tipo è il controllo."] },
    ko: { title: "사용자 필드", steps: ["+ 새로 만들기를 누릅니다.", "환자, 리드, 예약, 제품 중 고릅니다.", "라벨은 표시, 키는 식별, 유형은 입력칸입니다."] },
  },
  policies: {
    es: { title: "Políticas", steps: ["Aquí ajustas intervalo, anticipación, reprogramar, espera y términos.", "Este botón guarda. La reserva pública usa estas reglas.", "El menú de la izquierda lleva al resto de la configuración."] },
    en: { title: "Policies", steps: ["Here you set the interval, how far ahead, reschedule, waitlist, and terms.", "This button saves. Public booking uses these rules.", "The left menu opens the rest of settings."] },
    it: { title: "Regole", steps: ["Qui regoli intervallo, anticipo, riprogramma, attesa e termini.", "Questo bottone salva. La prenotazione pubblica usa queste regole.", "Il menu a sinistra apre il resto della configurazione."] },
    ko: { title: "예약 규칙", steps: ["여기서 간격, 사전 범위, 변경, 대기, 약관을 맞춥니다.", "이 버튼이 저장합니다. 공개 예약이 이 규칙을 씁니다.", "왼쪽 메뉴가 나머지 설정으로 갑니다."] },
  },
  content: {
    es: { title: "Contenido", steps: ["Aquí eliges vista previa o lista, y el idioma que vas a editar.", "Haz clic en un bloque de la página para editar ese texto o esa imagen.", "El menú de la izquierda vuelve al resto del panel."] },
    en: { title: "Content", steps: ["Here you pick preview or list, and the language you will edit.", "Click a block on the page to edit that text or image.", "The left menu returns to the rest of the panel."] },
    it: { title: "Contenuti", steps: ["Qui scegli anteprima o lista, e la lingua da modificare.", "Clicca un blocco della pagina per modificare quel testo o quell’immagine.", "Il menu a sinistra torna al resto del pannello."] },
    ko: { title: "콘텐츠", steps: ["여기서 미리보기나 목록, 그리고 편집할 언어를 고릅니다.", "페이지 블록을 눌러 그 글이나 이미지를 고칩니다.", "왼쪽 메뉴가 패널의 나머지로 돌아갑니다."] },
  },
  catalog: {
    es: { title: "Catálogo", steps: ["El menú elige servicios, productos, paquetes, membresías, categorías o proveedores.", "Pulsa + Nuevo para crear.", "La tabla lista lo que ya existe. El menú ⋯ edita o archiva."] },
    en: { title: "Catalog", steps: ["The menu picks services, products, packages, memberships, categories, or suppliers.", "Press + New to create.", "The table lists what exists. The ⋯ menu edits or archives."] },
    it: { title: "Catalogo", steps: ["Il menu sceglie servizi, prodotti, pacchetti, abbonamenti, categorie o fornitori.", "Premi + Nuovo per creare.", "La tabella elenca ciò che esiste. Il menu ⋯ modifica o archivia."] },
    ko: { title: "목록", steps: ["메뉴에서 서비스, 제품, 패키지, 멤버십, 분류, 공급자를 고릅니다.", "+ 새로 만들기로 만듭니다.", "표가 목록입니다. ⋯ 메뉴에서 고치거나 보관합니다."] },
  },
  store: {
    es: { title: "Tienda web", steps: ["Este formulario crea o edita el producto del sitio. Guarda para publicarlo.", "La lista de abajo son los productos ya cargados.", "Arriba creas o renombras las categorías."] },
    en: { title: "Shop", steps: ["This form creates or edits the product. Save to publish it.", "The list below is the products already added.", "Above, you create the categories a product can use."] },
    it: { title: "Negozio", steps: ["Questo modulo crea o modifica il prodotto. Salva per pubblicarlo.", "La lista sotto sono i prodotti già caricati.", "In alto crei le categorie che il prodotto può usare."] },
    ko: { title: "스토어", steps: ["이 양식이 제품을 만들거나 고칩니다. 저장하면 공개됩니다.", "아래 목록이 이미 올린 제품입니다.", "위에서 제품에 쓸 분류를 만듭니다."] },
  },
  fallback: {
    es: { title: "Esta sección", steps: ["El menú de la izquierda abre cada parte del panel.", "Crear abre paciente, lead, cita o cobro."] },
    en: { title: "This section", steps: ["The left menu opens each part of the panel.", "Create starts a patient, lead, visit, or charge."] },
    it: { title: "Questa sezione", steps: ["Il menu a sinistra apre ogni parte del pannello.", "Crea apre paziente, lead, visita o incasso."] },
    ko: { title: "이 화면", steps: ["왼쪽 메뉴가 패널의 각 부분을 엽니다.", "만들기에서 환자, 리드, 예약, 결제를 엽니다."] },
  },
};

const OFFERS: Record<OfferKind, Record<Lang, { what: string; how: string }>> = {
  patient: {
    es: { what: "un paciente", how: "En Pacientes, pulsa + Paciente, completa nombre y apellido, y guarda." },
    en: { what: "a patient", how: "In Patients, press + Patient, fill in the name, and save." },
    it: { what: "un paziente", how: "In Pazienti, premi + Paziente, compila nome e cognome e salva." },
    ko: { what: "환자", how: "환자에서 + 환자를 누르고 이름을 적은 뒤 저장합니다." },
  },
  service: {
    es: { what: "un servicio", how: "En Servicios y productos, abre Servicios, pulsa + Nuevo y guarda." },
    en: { what: "a service", how: "In Services and products, open Services, press + New, and save." },
    it: { what: "un servizio", how: "In Servizi e prodotti, apri Servizi, premi + Nuovo e salva." },
    ko: { what: "서비스", how: "서비스와 제품에서 서비스를 열고 + 새로 만들기로 저장합니다." },
  },
  staff: {
    es: { what: "un profesional", how: "En Equipo, pulsa + Nuevo y marca Atiende citas." },
    en: { what: "a provider", how: "In Team, press + New and mark that they see patients." },
    it: { what: "un professionista", how: "In Team, premi + Nuovo e segna che riceve visite." },
    ko: { what: "담당자", how: "팀에서 + 새로 만들기를 누르고 예약 담당을 표시합니다." },
  },
  location: {
    es: { what: "una sede", how: "En Sedes, pulsa + Nuevo, escribe el nombre y guarda." },
    en: { what: "a location", how: "In Locations, press + New, type the name, and save." },
    it: { what: "una sede", how: "In Sedi, premi + Nuovo, scrivi il nome e salva." },
    ko: { what: "지점", how: "지점에서 + 새로 만들기로 이름을 적고 저장합니다." },
  },
  category: {
    es: { what: "una categoría", how: "En Servicios y productos, abre Categorías, pulsa + Nuevo y guarda." },
    en: { what: "a category", how: "In Services and products, open Categories, press + New, and save." },
    it: { what: "una categoria", how: "In Servizi e prodotti, apri Categorie, premi + Nuovo e salva." },
    ko: { what: "분류", how: "서비스와 제품에서 분류를 열고 + 새로 만들기로 저장합니다." },
  },
  sale: {
    es: { what: "una venta", how: "En Cobrar, agrega un servicio o producto, revisa y confirma." },
    en: { what: "a sale", how: "In Charge, add a service or product, review, and confirm." },
    it: { what: "una vendita", how: "In Incassa, aggiungi un servizio o prodotto, controlla e conferma." },
    ko: { what: "판매", how: "결제에서 서비스나 제품을 담고 확인한 뒤 확정합니다." },
  },
  product: {
    es: { what: "un producto", how: "En Servicios y productos, abre Productos, pulsa + Nuevo y guarda." },
    en: { what: "a product", how: "In Services and products, open Products, press + New, and save." },
    it: { what: "un prodotto", how: "In Servizi e prodotti, apri Prodotti, premi + Nuovo e salva." },
    ko: { what: "제품", how: "서비스와 제품에서 제품을 열고 + 새로 만들기로 저장합니다." },
  },
};

const ICONS: Record<GuideId, typeof Calendar> = {
  home: LayoutDashboard, calendar: Calendar, chart: UserRound, patients: Users, leads: Contact,
  cobrar: CreditCard, sales: ShoppingBag, invoices: Wallet, products: Package, catalog: Package,
  forms: ClipboardList, comms: MessageSquare,
  reports: BarChart3, locations: MapPin, rooms: LayoutDashboard, hours: Clock, services: ClipboardList,
  categories: Tags, team: Users, taxes: Percent, payments: CreditCard, billing: FileText,
  fields: SlidersHorizontal, policies: SlidersHorizontal, content: FileText, store: Store, fallback: CircleHelp,
};

const MATCH: { id: GuideId; test: (path: string) => boolean }[] = [
  { id: "home", test: (path) => path === "/admin" },
  { id: "calendar", test: (path) => path.includes("/calendario") },
  { id: "chart", test: (path) => /\/pacientes\/[^/]+/.test(path) },
  { id: "patients", test: (path) => path.includes("/pacientes") },
  { id: "leads", test: (path) => path.includes("/leads") },
  { id: "cobrar", test: (path) => path.includes("/cobrar") },
  { id: "sales", test: (path) => path.includes("/ventas") },
  { id: "invoices", test: (path) => path.includes("/facturas") },
  { id: "services", test: (path) => path.includes("/catalogo/servicios") },
  { id: "categories", test: (path) => path.includes("/catalogo/categorias") },
  { id: "products", test: (path) => path.includes("/catalogo/productos") },
  { id: "catalog", test: (path) => path.includes("/catalogo") },
  { id: "forms", test: (path) => path.includes("/formularios") },
  { id: "comms", test: (path) => path.includes("/comunicaciones") },
  { id: "reports", test: (path) => path.includes("/reportes") },
  { id: "locations", test: (path) => path.includes("/configuracion/sedes") },
  { id: "rooms", test: (path) => path.includes("/configuracion/salas") },
  { id: "hours", test: (path) => path.includes("/configuracion/horarios") },
  { id: "team", test: (path) => path.includes("/configuracion/equipo") },
  { id: "taxes", test: (path) => path.includes("/configuracion/impuestos") },
  { id: "payments", test: (path) => path.includes("/configuracion/pagos") },
  { id: "billing", test: (path) => path.includes("/configuracion/facturacion") },
  { id: "fields", test: (path) => path.includes("/configuracion/campos") },
  { id: "policies", test: (path) => path.includes("/configuracion/politicas") },
  { id: "content", test: (path) => path.includes("/contenido") },
  { id: "store", test: (path) => path.includes("/tienda") },
];

function asLang(value: string): Lang {
  return LANGS.includes(value as Lang) ? (value as Lang) : "es";
}

function useTutorialLang() {
  const site = useLocale();
  const [lang, setLang] = useState<Lang>(asLang(site));
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE);
    setLang(saved ? asLang(saved) : asLang(site));
    function onChange() {
      const next = window.localStorage.getItem(STORAGE);
      if (next) setLang(asLang(next));
    }
    window.addEventListener("thrive-tutorial-locale", onChange);
    return () => window.removeEventListener("thrive-tutorial-locale", onChange);
  }, [site]);
  function choose(next: Lang) {
    window.localStorage.setItem(STORAGE, next);
    setLang(next);
    window.dispatchEvent(new Event("thrive-tutorial-locale"));
  }
  return { lang, choose };
}

function guideId(pathname: string): GuideId {
  const path = pathname.replace(/^\/(es|en|ko|it)/, "") || "/admin";
  return MATCH.find((item) => item.test(path))?.id || "fallback";
}

const FOCUS: Record<GuideId, string[]> = {
  home: ["home-metrics", "home-actions"],
  calendar: ["cal-toolbar", "cal-grid", "cal-form"],
  chart: ["chart-tabs", "chart-panel", "chart-archive"],
  patients: ["patients-tools", "patients-new", "patient-tabs", "patient-save", "patients-list"],
  leads: ["leads-new", "leads-form", "leads-board"],
  cobrar: ["sales-tabs", "sales-catalog", "sales-pay"],
  sales: ["sales-metrics", "sales-history", "sales-charge"],
  invoices: ["invoice-tabs", "invoice-form", "invoice-table"],
  products: ["catalog-new", "product-list", "product-stock"],
  catalog: ["catalog-nav", "catalog-new", "catalog-table"],
  forms: ["form-builder", "form-save", "form-list"],
  comms: ["comms-templates", "comms-editor", "comms-send", "comms-queue"],
  reports: ["report-tabs", "report-table", "shell-nav"],
  locations: ["settings-new", "settings-form", "settings-table"],
  rooms: ["settings-nav", "settings-new", "settings-form"],
  hours: ["settings-new", "settings-form", "settings-table"],
  services: ["catalog-new", "service-tabs", "catalog-table"],
  categories: ["catalog-new", "catalog-table", "catalog-nav"],
  team: ["settings-new", "settings-form", "settings-table"],
  taxes: ["settings-new", "settings-form", "settings-table"],
  payments: ["settings-new", "settings-form", "settings-table"],
  billing: ["settings-form", "settings-save", "settings-nav"],
  fields: ["settings-new", "settings-form", "settings-table"],
  policies: ["settings-form", "settings-save", "settings-nav"],
  content: ["content-nav", "content-preview", "shell-nav"],
  store: ["store-form", "store-list", "store-cats"],
  fallback: ["shell-nav", "shell-create"],
};

type Stop = { target: string; text: string };

function plannedStops(id: GuideId, lang: Lang): Stop[] {
  const texts = GUIDES[id][lang].steps;
  const targets = FOCUS[id];
  const count = Math.min(texts.length, targets.length);
  return Array.from({ length: count }, (_, index) => ({ target: targets[index], text: texts[index] }));
}

function liveStops(id: GuideId, lang: Lang): Stop[] {
  const planned = plannedStops(id, lang);
  if (typeof document === "undefined") return planned;
  const visible = planned.filter((stop) => document.querySelector(`[data-tour="${stop.target}"]`));
  return visible.length ? visible : planned;
}

function sameRect(prev: DOMRect | null, next: DOMRect) {
  return !!prev && Math.abs(prev.top - next.top) < 1 && Math.abs(prev.left - next.left) < 1 && Math.abs(prev.width - next.width) < 1 && Math.abs(prev.height - next.height) < 1;
}

function cardBox(rect: DOMRect | null) {
  const width = 360;
  const height = 300;
  if (!rect) return { top: 72, left: 16, width };
  const gap = 14;
  let top = rect.bottom + gap;
  let left = Math.min(Math.max(16, rect.left), window.innerWidth - width - 16);
  if (top + height > window.innerHeight - 12) {
    const above = rect.top - height - gap;
    if (above > 12) top = above;
    else {
      top = Math.min(Math.max(12, rect.top), window.innerHeight - height - 12);
      left = rect.right + gap;
      if (left + width > window.innerWidth - 12) left = Math.max(12, rect.left - width - gap);
    }
  }
  return { top, left, width };
}

export function TutorialButton({ pathname }: { pathname: string }) {
  const { lang, choose } = useTutorialLang();
  const id = guideId(pathname);
  const guide = GUIDES[id][lang];
  const Icon = ICONS[id];
  const ui = UI[lang];
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [tick, setTick] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const stops = useMemo(() => (open ? liveStops(id, lang) : []), [id, lang, open, tick]);
  const index = Math.max(0, stops.findIndex((stop) => stop.target === current));
  const stop = stops[index] || stops[0];
  const last = stops.length === 0 || index >= stops.length - 1;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const next = params.get("tutorial") === "1";
    setOpen(next);
    setCurrent("");
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const observer = new MutationObserver((mutations) => {
      const changed = mutations.some((mutation) => [...mutation.addedNodes, ...mutation.removedNodes].some((node) => {
        if (!(node instanceof Element)) return true;
        return !node.classList.contains("admin-tour__shade") && !node.classList.contains("admin-tour__ring") && !node.classList.contains("admin-tutorial__panel");
      }));
      if (changed) setTick((value) => value + 1);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [open]);

  useEffect(() => {
    if (!open || !stops.length) return;
    if (!stops.some((item) => item.target === current)) setCurrent(stops[0].target);
  }, [open, stops, current]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open || !stop) {
      setRect(null);
      return;
    }
    const selector = `[data-tour="${stop.target}"]`;
    const node = document.querySelector(selector);
    if (!node) {
      setRect(null);
      return;
    }
    node.scrollIntoView({ block: "center", inline: "nearest" });
    const measure = () => {
      const el = document.querySelector(selector);
      if (!el) {
        setRect(null);
        return;
      }
      const next = el.getBoundingClientRect();
      setRect((prev) => (sameRect(prev, next) ? prev : next));
    };
    const timer = window.setTimeout(measure, 280);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, stop, tick]);

  function go(next: number) {
    const item = stops[next];
    if (item) setCurrent(item.target);
  }

  const box = cardBox(rect);
  const pad = 8;

  return (
    <div className="admin-tutorial">
      <button type="button" className="admin-tutorial__btn" aria-expanded={open} onClick={() => { setCurrent(""); setOpen((value) => !value); }}>
        <CircleHelp size={14} aria-hidden />
        {ui.tutorial}
      </button>
      {open && stop ? (
        <>
          {rect ? (
            <>
              <div className="admin-tour__shade" style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top - pad) }} />
              <div className="admin-tour__shade" style={{ top: rect.bottom + pad, left: 0, right: 0, bottom: 0 }} />
              <div className="admin-tour__shade" style={{ top: rect.top - pad, left: 0, width: Math.max(0, rect.left - pad), height: rect.height + pad * 2 }} />
              <div className="admin-tour__shade" style={{ top: rect.top - pad, left: rect.right + pad, right: 0, height: rect.height + pad * 2 }} />
              <div className="admin-tour__ring" style={{ top: rect.top - 6, left: rect.left - 6, width: rect.width + 12, height: rect.height + 12 }} />
            </>
          ) : <div className="admin-tour__shade" style={{ inset: 0 }} />}
          <div className="admin-tutorial__panel admin-tutorial__panel--coach" role="dialog" aria-label={`${ui.tutorial}: ${guide.title}`} style={{ top: box.top, left: box.left, width: box.width }}>
            <div className="admin-tutorial__head">
              <p><Icon size={16} aria-hidden /> {guide.title}</p>
              <button type="button" className="admin-icon-btn" aria-label={ui.close} onClick={() => setOpen(false)}><X size={14} /></button>
            </div>
            <div className="admin-tutorial__langs" role="group" aria-label={ui.tutorial}>
              {LANGS.map((code) => (
                <button key={code} type="button" className={code === lang ? "is-active" : ""} onClick={() => choose(code)}>{LANG_LABEL[code]}</button>
              ))}
            </div>
            <p className="admin-tutorial__kicker">{ui.step} {index + 1} / {stops.length}</p>
            <p className="admin-tutorial__text" aria-live="polite">{stop.text}</p>
            <div className="admin-tutorial__dots">
              {stops.map((item, dot) => (
                <button key={item.target} type="button" className={dot === index ? "is-active" : ""} aria-label={`${ui.step} ${dot + 1}`} onClick={() => go(dot)} />
              ))}
            </div>
            <div className="admin-tutorial__nav">
              <button type="button" className="admin-btn" disabled={index === 0} onClick={() => go(index - 1)}><ChevronLeft size={16} aria-hidden /> {ui.back}</button>
              {last ? (
                <button type="button" className="admin-btn admin-btn--primary" onClick={() => setOpen(false)}>{ui.done}</button>
              ) : (
                <button type="button" className="admin-btn admin-btn--primary" onClick={() => go(index + 1)}>{ui.next} <ChevronRight size={16} aria-hidden /></button>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function CreateOffer({ show, kind, href }: { show: boolean; kind: OfferKind; href: string }) {
  const { lang } = useTutorialLang();
  if (!show) return null;
  const offer = OFFERS[kind][lang];
  const ui = UI[lang];
  const target = href.includes("tutorial=1") ? href : `${href}${href.includes("?") ? "&" : "?"}tutorial=1`;
  return (
    <span className="admin-offer">
      {ui.missing} {offer.what}. <Link href={target}>{ui.create}</Link>
      <span>{offer.how}</span>
    </span>
  );
}
