import SettingsPanel from "@/components/admin/clinic/SettingsPanel";
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <SettingsPanel section={section} />;
}
