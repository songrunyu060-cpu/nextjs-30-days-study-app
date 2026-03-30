"use client";

import { Column } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DataTableRangeFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}
/**
 * 范围过滤器
 * @param column 列
 * @param title 标题
 * @returns
 */
export function DataTableRangeFilter<TData, TValue>({
  column,
  title,
}: DataTableRangeFilterProps<TData, TValue>) {
  const value =
    (column.getFilterValue() as { min?: number; max?: number }) || {};
  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <div className="flex gap-2">
        <Input
          type="number"
          value={value.min || ""}
          onChange={(e) =>
            column.setFilterValue({ ...value, min: Number(e.target.value) })
          }
          placeholder="最小值"
        />
        <Input
          type="number"
          value={value.max || ""}
          onChange={(e) =>
            column.setFilterValue({ ...value, max: Number(e.target.value) })
          }
          placeholder="最大值"
        />
      </div>
    </div>
  );
}
