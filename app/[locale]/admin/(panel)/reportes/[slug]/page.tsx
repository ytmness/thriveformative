import { ReportView } from "@/components/admin/clinic/Modules";
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ReportView slug={slug} />;
}
