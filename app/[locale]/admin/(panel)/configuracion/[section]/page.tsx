import { redirect } from "next/navigation";
import SettingsPanel from "@/components/admin/clinic/SettingsPanel";

export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (section === "servicios") redirect("/admin/catalogo/servicios");
  if (section === "categorias") redirect("/admin/catalogo/categorias");
  return <SettingsPanel section={section} />;
}
