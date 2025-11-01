import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Filter } from "lucide-react";
import { PermissionCell } from "./PermissionCell";

interface MatrixRow {
  targetUserId: number;
  targetUserName: string;
  permissions: Record<number, { level: string; id: number } | null>;
}

interface User {
  id: number;
  full_name: string;
}

interface PermissionTableProps {
  filtered: MatrixRow[];
  users: User[];
  matrix: MatrixRow[];
  onEdit: (targetId: number, grantorId: number) => void;
  onDelete: (permId: number) => void;
}

export const PermissionTable: React.FC<PermissionTableProps> = ({
  filtered,
  users,
  matrix,
  onEdit,
  onDelete,
}) => {
  if (filtered.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={users.length + 2} className="text-center py-16">
          <div className="flex flex-col items-center gap-2">
            <Filter className="w-12 h-12 text-gray-300" />
            <p className="text-gray-500 font-medium">No users found</p>
            <p className="text-sm text-gray-400">Try adjusting your search</p>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      {filtered.map((row, idx) => (
        <TableRow key={row.targetUserId} className="hover:bg-gray-50">
          <TableCell className="sticky left-0 bg-white z-10 font-medium text-gray-500 text-sm">
            {idx + 1}
          </TableCell>
          <TableCell className="sticky left-12 bg-white z-10 font-semibold text-gray-900">
            {row.targetUserName}
          </TableCell>
          {users.map((u) => {
            const perm = row.permissions[u.id] ?? null;
            return (
              <TableCell key={u.id} className="text-center py-2">
                <PermissionCell
                  targetId={row.targetUserId}
                  grantorId={u.id}
                  grantorName={u.full_name}
                  level={perm?.level ?? null}
                  permId={perm?.id ?? null}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
};