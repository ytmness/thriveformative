import type { CmsEditTarget } from "@/components/admin/cms/CmsEditDrawer";
import type { PreviewServiceRow } from "@/lib/cms/mergePreviewLists";

export type HomePageEditableConfig = {
  txt: (key: string, fallbackKey: string) => string;
  onEdit: (target: CmsEditTarget) => void;
  services: PreviewServiceRow[];
  onAddService: () => void;
  onEditService: (id: string, fallback?: { name: string; description: string }) => void;
  onToggleServiceVisibility: (id: string) => void;
  onDeleteService: (id: string) => void;
};
