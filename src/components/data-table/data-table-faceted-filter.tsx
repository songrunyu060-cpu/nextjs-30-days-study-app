"use client";

import { Column } from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface DataTableFacetedFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  options: { label: string; value: string }[];
}

/**
 * 分面过滤器
 * @param column 列
 * @param title 标题
 * @param options 选项
 * @returns
 */
export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selected = new Set(column.getFilterValue() as string[]);
  return (
    <div className="space-y-2">
      <h4 className="font-medium">{title}</h4>
      {options.map((opt) => (
        <div key={opt.value} className="flex items-center space-x-2">
          <Checkbox
            id={opt.value}
            checked={selected.has(opt.value)}
            onCheckedChange={(v) => {
              const next = new Set(selected);
              v ? next.add(opt.value) : next.delete(opt.value);
              column.setFilterValue(Array.from(next));
            }}
          />
          <Label htmlFor={opt.value} className="text-sm">
            {opt.label}
          </Label>
        </div>
      ))}
    </div>
  );
}
