import "@/app/styles/tienda.css";
import StorePanel from "@/components/admin/StorePanel";
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <StorePanel siteLocale={locale} />;
}
