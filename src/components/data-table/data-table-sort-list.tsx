"use client";

import { Table } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

interface DataTableSortListProps<TData> {
  table: Table<TData>;
}

export function DataTableSortList<TData>({
  table,
}: DataTableSortListProps<TData>) {
  const sorting = table.getState().sorting;
  if (!sorting.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {sorting.map((s) => (
        <Badge key={s.id} variant="outline" className="gap-1">
          {s.id} {s.desc ? "↓" : "↑"}
          <button onClick={() => table.getColumn(s.id)?.clearSorting()}>
            ×
          </button>
        </Badge>
      ))}
    </div>
  );
}
