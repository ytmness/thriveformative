import "@/app/styles/admin-cms.css";
import "@/app/styles/admin-cms-visual.css";
import CmsPanel from "@/components/admin/CmsPanel";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CmsPanel siteLocale={locale} />;
}
