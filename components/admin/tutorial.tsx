"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  BarChart3, Calendar, Check, ChevronLeft, ChevronRight, CircleHelp, ClipboardList,
  Clock, Contact, CreditCard, FileText, LayoutDashboard, MapPin, MessageSquare,
  Package, Percent, ShoppingBag, SlidersHorizontal, Store, Tags, UserRound, Users, Wallet, X,
} from "lucide-react";

type Lang = "es" | "en" | "it" | "ko";
type GuideId =
  | "home" | "calendar" | "chart" | "patients" | "leads" | "sales" | "invoices" | "products"
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
    es: { title: "Inicio", steps: ["Mira las citas, los ingresos y los leads de hoy.", "Crear abre paciente, lead o cita.", "Ctrl+K busca un paciente."] },
    en: { title: "Home", steps: ["See today’s appointments, revenue, and leads.", "Create starts a patient, lead, or visit.", "Ctrl+K searches patients."] },
    it: { title: "Inizio", steps: ["Vedi visite, incassi e lead di oggi.", "Crea apre paziente, lead o visita.", "Ctrl+K cerca un paziente."] },
    ko: { title: "홈", steps: ["오늘의 예약, 매출, 리드를 확인합니다.", "만들기에서 환자, 리드, 예약을 엽니다.", "Ctrl+K로 환자를 찾습니다."] },
  },
  calendar: {
    es: { title: "Calendario", steps: ["Haz clic en un hueco libre para abrir la cita.", "Elige paciente, servicio, profesional y sede.", "Arrastra la cita para moverla. Archivar la cancela."] },
    en: { title: "Calendar", steps: ["Click an empty slot to open the visit.", "Choose patient, service, provider, and location.", "Drag a visit to move it. Archive cancels it."] },
    it: { title: "Calendario", steps: ["Clicca uno spazio libero per aprire la visita.", "Scegli paziente, servizio, professionista e sede.", "Trascina per spostarla. Archivia annulla."] },
    ko: { title: "달력", steps: ["빈 칸을 눌러 예약을 엽니다.", "환자, 서비스, 담당자, 지점을 고릅니다.", "끌어 옮깁니다. 보관은 취소입니다."] },
  },
  chart: {
    es: { title: "Ficha", steps: ["Resumen es la portada del paciente.", "Las pestañas son citas, expediente, finanzas y más.", "Archivar lo oculta de la lista. El expediente se queda."] },
    en: { title: "Chart", steps: ["Summary is the patient cover.", "Tabs hold visits, chart, billing, and more.", "Archive hides the patient. The record stays."] },
    it: { title: "Scheda", steps: ["Il riepilogo è la copertina.", "Le schede sono visite, cartella e pagamenti.", "Archivia nasconde il paziente. La cartella resta."] },
    ko: { title: "차트", steps: ["요약이 환자 표지입니다.", "탭에 예약, 기록, 수납이 있습니다.", "보관하면 목록에서 숨고 기록은 남습니다."] },
  },
  patients: {
    es: { title: "Pacientes", steps: ["+ Paciente abre el panel. El * es obligatorio.", "Datos, Contacto, Dirección y Consentimientos son pestañas.", "Guardar cierra el panel y deja el enlace a la ficha."] },
    en: { title: "Patients", steps: ["+ Patient opens the panel. * means required.", "Details, Contact, Address, and Consent are tabs.", "Save closes the panel and links to the chart."] },
    it: { title: "Pazienti", steps: ["+ Paziente apre il pannello. * è obbligatorio.", "Dati, Contatto, Indirizzo e Consensi sono schede.", "Salva chiude il pannello e apre la scheda."] },
    ko: { title: "환자", steps: ["+ 환자가 패널을 엽니다. * 는 필수입니다.", "정보, 연락처, 주소, 동의는 탭입니다.", "저장하면 패널이 닫히고 차트로 갑니다."] },
  },
  leads: {
    es: { title: "Leads", steps: ["Crea el lead con nombre, apellido y etapa.", "Arrastra la tarjeta a otra columna.", "Archivar lo quita del tablero."] },
    en: { title: "Leads", steps: ["Create the lead with name and stage.", "Drag the card to another column.", "Archive removes it from the board."] },
    it: { title: "Lead", steps: ["Crea il lead con nome e fase.", "Trascina la scheda in un’altra colonna.", "Archivia lo toglie dalla bacheca."] },
    ko: { title: "리드", steps: ["이름과 단계로 리드를 만듭니다.", "카드를 다른 열로 끕니다.", "보관하면 보드에서 빠집니다."] },
  },
  sales: {
    es: { title: "Ventas", steps: ["Elige la pestaña y pulsa un ítem para sumarlo.", "Revisa el total y confirma el cobro.", "Si falta el catálogo, el aviso te lleva a crearlo."] },
    en: { title: "Sales", steps: ["Pick a tab and tap an item to add it.", "Review the total and confirm payment.", "If the catalog is empty, the prompt creates it."] },
    it: { title: "Vendite", steps: ["Scegli la scheda e tocca una voce.", "Controlla il totale e conferma.", "Se manca il catalogo, l’avviso lo crea."] },
    ko: { title: "판매", steps: ["탭에서 항목을 눌러 담습니다.", "합계를 확인하고 결제를 확정합니다.", "목록이 없으면 안내가 만들기로 보냅니다."] },
  },
  invoices: {
    es: { title: "Facturas", steps: ["Las facturas nacen al cobrar en Ventas.", "Cambia a cotizaciones o notas de crédito.", "Si está vacío, crea primero una venta."] },
    en: { title: "Invoices", steps: ["Invoices appear when you charge in Sales.", "Switch to quotes or credit notes.", "If empty, create a sale first."] },
    it: { title: "Fatture", steps: ["Le fatture nascono incassando in Vendite.", "Passa a preventivi o note di credito.", "Se è vuoto, crea prima una vendita."] },
    ko: { title: "청구", steps: ["청구서는 판매에서 결제할 때 생깁니다.", "견적과 신용 전표로 바꿉니다.", "비어 있으면 먼저 판매를 만듭니다."] },
  },
  products: {
    es: { title: "Productos", steps: ["Arriba creas el producto con nombre y precio.", "Abajo sumas o restas stock por sede.", "Sin sede, el aviso te lleva a crearla."] },
    en: { title: "Products", steps: ["Create the product with name and price.", "Adjust stock by location below.", "Without a location, the prompt creates one."] },
    it: { title: "Prodotti", steps: ["In alto crei nome e prezzo.", "Sotto regoli lo stock per sede.", "Senza sede, l’avviso la crea."] },
    ko: { title: "제품", steps: ["위에서 이름과 가격으로 제품을 만듭니다.", "아래에서 지점별 재고를 조정합니다.", "지점이 없으면 안내가 만들기로 보냅니다."] },
  },
  forms: {
    es: { title: "Formularios", steps: ["Crea ingreso, consentimiento, SOAP o personalizado.", "Agrega campos y marca los obligatorios.", "Pulsa la fila para reabrir. Archivar oculta."] },
    en: { title: "Forms", steps: ["Create intake, consent, SOAP, or custom.", "Add fields and mark required ones.", "Open a row to edit. Archive hides it."] },
    it: { title: "Moduli", steps: ["Crea ingresso, consenso, SOAP o personale.", "Aggiungi campi e segna gli obbligatori.", "Apri la riga per modificare. Archivia nasconde."] },
    ko: { title: "서식", steps: ["접수, 동의, SOAP 또는 사용자 서식을 만듭니다.", "필드를 넣고 필수를 표시합니다.", "행을 눌러 다시 엽니다. 보관은 숨김입니다."] },
  },
  comms: {
    es: { title: "Comunicaciones", steps: ["Cada tarjeta es una plantilla con vista previa.", "En Editar, pulsa un chip para insertar la variable.", "La cola muestra estado. Enviar pide confirmación."] },
    en: { title: "Messages", steps: ["Each card is a template with a preview.", "In Edit, tap a chip to insert a variable.", "The queue shows status. Send asks to confirm."] },
    it: { title: "Messaggi", steps: ["Ogni scheda è un modello con anteprima.", "In Modifica, tocca un chip per la variabile.", "La coda mostra lo stato. Invia chiede conferma."] },
    ko: { title: "메시지", steps: ["카드마다 미리보기가 있는 템플릿입니다.", "편집에서 칩을 눌러 변수를 넣습니다.", "대기열에 상태가 있습니다. 보내기는 확인을 묻습니다."] },
  },
  reports: {
    es: { title: "Reportes", steps: ["Cambia la pestaña: citas, ingresos, servicios…", "Los números son de los últimos 30 días.", "Si está vacío, faltan citas o cobros."] },
    en: { title: "Reports", steps: ["Switch tabs: visits, revenue, services…", "Numbers cover the last 30 days.", "Empty means there are no visits or charges yet."] },
    it: { title: "Report", steps: ["Cambia scheda: visite, incassi, servizi…", "I numeri sono degli ultimi 30 giorni.", "Vuoto significa che mancano visite o incassi."] },
    ko: { title: "보고서", steps: ["탭을 바꿉니다: 예약, 매출, 서비스…", "숫자는 최근 30일입니다.", "비어 있으면 예약이나 결제가 없습니다."] },
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
    es: { title: "Horarios", steps: ["Elige profesional, sede y día.", "Indica desde y hasta.", "Sin horario, la reserva pública no ofrece esas horas."] },
    en: { title: "Hours", steps: ["Choose provider, location, and day.", "Set from and to.", "Without hours, online booking hides those times."] },
    it: { title: "Orari", steps: ["Scegli professionista, sede e giorno.", "Indica da e a.", "Senza orario, la prenotazione online non li mostra."] },
    ko: { title: "근무 시간", steps: ["담당자, 지점, 요일을 고릅니다.", "시작과 끝을 적습니다.", "시간이 없으면 온라인 예약에 안 나옵니다."] },
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
    es: { title: "Facturación", steps: ["Escribe cancelación, pie de factura y privacidad.", "Guarda.", "Esos textos salen en la reserva y en los documentos."] },
    en: { title: "Billing", steps: ["Write cancellation, invoice footer, and privacy.", "Save.", "Those texts show in booking and documents."] },
    it: { title: "Fatturazione", steps: ["Scrivi cancellazione, piè di fattura e privacy.", "Salva.", "Quei testi escono in prenotazione e documenti."] },
    ko: { title: "청구 문구", steps: ["취소, 청구서 하단, 개인정보를 적습니다.", "저장합니다.", "예약과 문서에 그 문구가 나옵니다."] },
  },
  fields: {
    es: { title: "Campos", steps: ["Pulsa + Nuevo.", "Elige si es de paciente, lead, cita o producto.", "Etiqueta se lee. Clave identifica. Tipo es el control."] },
    en: { title: "Fields", steps: ["Press + New.", "Choose patient, lead, visit, or product.", "Label is read. Key identifies. Type is the control."] },
    it: { title: "Campi", steps: ["Premi + Nuovo.", "Scegli paziente, lead, visita o prodotto.", "Etichetta si legge. Chiave identifica. Tipo è il controllo."] },
    ko: { title: "사용자 필드", steps: ["+ 새로 만들기를 누릅니다.", "환자, 리드, 예약, 제품 중 고릅니다.", "라벨은 표시, 키는 식별, 유형은 입력칸입니다."] },
  },
  policies: {
    es: { title: "Políticas", steps: ["Ajusta intervalo y anticipación.", "Activa reprogramar, espera o términos.", "Guarda. La reserva pública usa estas reglas."] },
    en: { title: "Policies", steps: ["Set the interval and how far ahead.", "Turn reschedule, waitlist, or terms on.", "Save. Public booking uses these rules."] },
    it: { title: "Regole", steps: ["Regola intervallo e anticipo.", "Attiva riprogramma, attesa o termini.", "Salva. La prenotazione pubblica le usa."] },
    ko: { title: "예약 규칙", steps: ["간격과 사전 예약 범위를 맞춥니다.", "변경, 대기, 약관을 켭니다.", "저장하면 공개 예약이 이 규칙을 씁니다."] },
  },
  content: {
    es: { title: "Contenido", steps: ["Elige la sección del sitio.", "Cambia el texto o la imagen.", "Guarda y mira la vista previa."] },
    en: { title: "Content", steps: ["Pick the page section.", "Change the text or image.", "Save and check the preview."] },
    it: { title: "Contenuti", steps: ["Scegli la sezione del sito.", "Cambia testo o immagine.", "Salva e guarda l’anteprima."] },
    ko: { title: "콘텐츠", steps: ["사이트 구역을 고릅니다.", "글이나 이미지를 바꿉니다.", "저장하고 미리보기를 봅니다."] },
  },
  store: {
    es: { title: "Tienda", steps: ["Crea o abre un producto.", "Precio, foto y categoría salen en el catálogo.", "Guarda para publicarlo."] },
    en: { title: "Shop", steps: ["Create or open a product.", "Price, photo, and category show in the catalog.", "Save to publish it."] },
    it: { title: "Negozio", steps: ["Crea o apri un prodotto.", "Prezzo, foto e categoria escono nel catalogo.", "Salva per pubblicarlo."] },
    ko: { title: "스토어", steps: ["제품을 만들거나 엽니다.", "가격, 사진, 분류가 목록에 나옵니다.", "저장하면 공개됩니다."] },
  },
  fallback: {
    es: { title: "Esta sección", steps: ["Recorre la pantalla de arriba abajo.", "El botón terracota guarda o crea.", "Si falta un dato, el aviso te lleva a crearlo."] },
    en: { title: "This section", steps: ["Read the screen from top to bottom.", "The terracotta button saves or creates.", "If something is missing, the prompt takes you there."] },
    it: { title: "Questa sezione", steps: ["Leggi la schermata dall’alto.", "Il bottone terracotta salva o crea.", "Se manca un dato, l’avviso ti porta a crearlo."] },
    ko: { title: "이 화면", steps: ["위에서 아래로 봅니다.", "테라코타 버튼이 저장하거나 만듭니다.", "빠진 항목은 안내가 만드는 곳으로 보냅니다."] },
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
    es: { what: "un servicio", how: "En Servicios, pulsa + Nuevo, escribe nombre, duración y precio, y guarda." },
    en: { what: "a service", how: "In Services, press + New, enter name, length, and price, and save." },
    it: { what: "un servizio", how: "In Servizi, premi + Nuovo, scrivi nome, durata e prezzo e salva." },
    ko: { what: "서비스", how: "서비스에서 + 새로 만들기로 이름, 시간, 가격을 적고 저장합니다." },
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
    es: { what: "una categoría", how: "En Categorías, pulsa + Nuevo, escribe el nombre y guarda." },
    en: { what: "a category", how: "In Categories, press + New, type the name, and save." },
    it: { what: "una categoria", how: "In Categorie, premi + Nuovo, scrivi il nome e salva." },
    ko: { what: "분류", how: "분류에서 + 새로 만들기로 이름을 적고 저장합니다." },
  },
  sale: {
    es: { what: "una venta", how: "En Ventas, agrega un servicio o producto, revisa y confirma." },
    en: { what: "a sale", how: "In Sales, add a service or product, review, and confirm." },
    it: { what: "una vendita", how: "In Vendite, aggiungi un servizio o prodotto, controlla e conferma." },
    ko: { what: "판매", how: "판매에서 서비스나 제품을 담고 확인한 뒤 확정합니다." },
  },
  product: {
    es: { what: "un producto", how: "En Productos, completa el formulario de arriba y guarda." },
    en: { what: "a product", how: "In Products, fill in the form above and save." },
    it: { what: "un prodotto", how: "In Prodotti, compila il modulo in alto e salva." },
    ko: { what: "제품", how: "제품에서 위 양식을 채우고 저장합니다." },
  },
};

const ICONS: Record<GuideId, typeof Calendar> = {
  home: LayoutDashboard, calendar: Calendar, chart: UserRound, patients: Users, leads: Contact,
  sales: ShoppingBag, invoices: Wallet, products: Package, forms: ClipboardList, comms: MessageSquare,
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
  { id: "sales", test: (path) => path.includes("/ventas") },
  { id: "invoices", test: (path) => path.includes("/facturas") },
  { id: "products", test: (path) => path.includes("/productos") },
  { id: "forms", test: (path) => path.includes("/formularios") },
  { id: "comms", test: (path) => path.includes("/comunicaciones") },
  { id: "reports", test: (path) => path.includes("/reportes") },
  { id: "locations", test: (path) => path.includes("/configuracion/sedes") },
  { id: "rooms", test: (path) => path.includes("/configuracion/salas") },
  { id: "hours", test: (path) => path.includes("/configuracion/horarios") },
  { id: "services", test: (path) => path.includes("/configuracion/servicios") },
  { id: "categories", test: (path) => path.includes("/configuracion/categorias") },
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

function StepArt({ index }: { index: number }) {
  if (index === 1) {
    return (
      <div className="admin-tutorial__art" aria-hidden>
        <span className="admin-tutorial__fake-label">Nombre *</span>
        <span className="admin-tutorial__fake-input" />
        <span className="admin-tutorial__fake-input admin-tutorial__fake-input--short" />
      </div>
    );
  }
  if (index === 2) {
    return (
      <div className="admin-tutorial__art admin-tutorial__art--done" aria-hidden>
        <Check size={28} />
      </div>
    );
  }
  return (
    <div className="admin-tutorial__art" aria-hidden>
      <span className="admin-tutorial__cell" />
      <span className="admin-tutorial__cell admin-tutorial__cell--on" />
      <span className="admin-tutorial__cell" />
      <span className="admin-tutorial__cell" />
    </div>
  );
}

export function TutorialButton({ pathname }: { pathname: string }) {
  const { lang, choose } = useTutorialLang();
  const id = guideId(pathname);
  const guide = GUIDES[id][lang];
  const Icon = ICONS[id];
  const ui = UI[lang];
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOpen(params.get("tutorial") === "1");
    setStep(0);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const last = step >= guide.steps.length - 1;

  return (
    <div className="admin-tutorial">
      <button type="button" className="admin-tutorial__btn" aria-expanded={open} onClick={() => { setStep(0); setOpen((value) => !value); }}>
        <CircleHelp size={14} aria-hidden />
        {ui.tutorial}
      </button>
      {open ? (
        <div className="admin-tutorial__panel" role="dialog" aria-label={`${ui.tutorial}: ${guide.title}`}>
          <div className="admin-tutorial__head">
            <p><Icon size={16} aria-hidden /> {guide.title}</p>
            <button type="button" className="admin-icon-btn" aria-label={ui.close} onClick={() => setOpen(false)}><X size={14} /></button>
          </div>
          <div className="admin-tutorial__langs" role="group" aria-label={ui.tutorial}>
            {LANGS.map((code) => (
              <button key={code} type="button" className={code === lang ? "is-active" : ""} onClick={() => choose(code)}>{LANG_LABEL[code]}</button>
            ))}
          </div>
          <StepArt index={step} />
          <p className="admin-tutorial__kicker">{ui.step} {step + 1} / {guide.steps.length}</p>
          <p className="admin-tutorial__text">{guide.steps[step]}</p>
          <div className="admin-tutorial__dots">
            {guide.steps.map((_, index) => (
              <button key={index} type="button" className={index === step ? "is-active" : ""} aria-label={`${ui.step} ${index + 1}`} onClick={() => setStep(index)} />
            ))}
          </div>
          <div className="admin-tutorial__nav">
            <button type="button" className="admin-btn" disabled={step === 0} onClick={() => setStep((value) => value - 1)}><ChevronLeft size={16} aria-hidden /> {ui.back}</button>
            {last ? (
              <button type="button" className="admin-btn admin-btn--primary" onClick={() => setOpen(false)}>{ui.done}</button>
            ) : (
              <button type="button" className="admin-btn admin-btn--primary" onClick={() => setStep((value) => value + 1)}>{ui.next} <ChevronRight size={16} aria-hidden /></button>
            )}
          </div>
        </div>
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
