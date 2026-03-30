"use client";

import { Table } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";

interface DataTableFilterListProps<TData> {
  table: Table<TData>;
}

export function DataTableFilterList<TData>({
  table,
}: DataTableFilterListProps<TData>) {
  const filters = table.getState().columnFilters;
  if (!filters.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => (
        <Badge key={f.id} variant="secondary" className="gap-1">
          {f.id}: {String(f.value)}
          <button
            onClick={() => table.getColumn(f.id)?.setFilterValue(undefined)}
          >
            ×
          </button>
        </Badge>
      ))}
    </div>
  );
}
