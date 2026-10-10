import { redirect } from "next/navigation";
import CatalogPanel from "@/components/admin/catalog/CatalogPanel";

const SECTIONS = ["servicios", "productos", "tienda", "paquetes", "membresias", "categorias", "proveedores"];

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!SECTIONS.includes(section)) redirect("/admin/catalogo/servicios");
  return <CatalogPanel section={section} />;
}
