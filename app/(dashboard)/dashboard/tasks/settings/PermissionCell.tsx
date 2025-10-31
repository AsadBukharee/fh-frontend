import React from "react";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Eye } from "lucide-react";

interface PermissionCellProps {
  targetId: number;
  grantorId: number;
  grantorName: string;
  level: string | null;
  permId: number | null;
  onEdit: (targetId: number, grantorId: number) => void;
  onDelete: (permId: number) => void;
}

const badgeInfo = {
  view: { Icon: Eye, class: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200" },
  edit: { Icon: Pencil, class: "bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200" },
  delete: { Icon: Trash2, class: "bg-rose-50 text-rose-700 hover:bg-rose-100 border-rose-200" },
};

export const PermissionCell: React.FC<PermissionCellProps> = React.memo(
  ({ level, permId, onEdit, onDelete, targetId, grantorId }) => {
    if (!level) {
      return (
        <div className="text-center py-3">
          <span className="text-xs text-gray-400">—</span>
        </div>
      );
    }

    const icons: { key: string; Icon: any; cls: string }[] = [];
    if (level === "all" || level === "view")
      icons.push({ key: "view", Icon: badgeInfo.view.Icon, cls: badgeInfo.view.class });
    if (level === "all" || level === "edit")
      icons.push({ key: "edit", Icon: badgeInfo.edit.Icon, cls: badgeInfo.edit.class });
    if (level === "all")
      icons.push({ key: "delete", Icon: badgeInfo.delete.Icon, cls: badgeInfo.delete.class });

    return (
      <div className="flex items-center justify-center gap-1 py-2 group">
        {icons.map(({ key, Icon, cls }) => (
          <Badge
            key={key}
            variant="outline"
            className={`flex items-center gap-1 py-0.5 px-2 text-xs cursor-pointer transition-all ${cls}`}
            onClick={() => onEdit(targetId, grantorId)}
          >
            <Icon className="w-3 h-3" />
          </Badge>
        ))}

        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 ml-2">
          <button
            onClick={() => onEdit(targetId, grantorId)}
            className="text-orange-600 hover:text-orange-800 p-1 rounded hover:bg-orange-50"
            aria-label="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => permId && onDelete(permId)}
            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
            aria-label="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }
);

PermissionCell.displayName = "PermissionCell";