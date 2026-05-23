import type { CmsEditTarget } from "@/components/admin/cms/CmsEditDrawer";
import type { PreviewPlanRow, PreviewServiceRow } from "@/lib/cms/mergePreviewLists";

export type HomePageEditableConfig = {
  txt: (key: string, fallbackKey: string) => string;
  onEdit: (target: CmsEditTarget) => void;
  services: PreviewServiceRow[];
  plans: PreviewPlanRow[];
  onAddService: () => void;
  onAddPlan: () => void;
  onEditService: (id: string, fallback?: { name: string; description: string }) => void;
  onEditPlan: (
    id: string,
    fallback?: { name: string; items: string[]; is_featured: boolean }
  ) => void;
  onToggleServiceVisibility: (id: string) => void;
  onTogglePlanVisibility: (id: string) => void;
  onDeleteService: (id: string) => void;
  onDeletePlan: (id: string) => void;
};
