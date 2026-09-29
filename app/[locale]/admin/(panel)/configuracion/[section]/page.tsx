import { SettingsManager } from "@/components/admin/clinic/Modules";
export default async function Page({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  return <SettingsManager section={section} />;
}
