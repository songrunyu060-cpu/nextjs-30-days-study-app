"use client";

import { Column } from "@tanstack/react-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DataTableDateFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
}

/**
 * 日期过滤器
 * @param column 列
 * @param title 标题
 * @returns
 */
export function DataTableDateFilter<TData, TValue>({
  column,
  title,
}: DataTableDateFilterProps<TData, TValue>) {
  const value =
    (column.getFilterValue() as { from?: string; to?: string }) || {};
  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <div className="flex gap-2">
        <Input
          type="date"
          value={value.from || ""}
          onChange={(e) =>
            column.setFilterValue({ ...value, from: e.target.value })
          }
          placeholder="开始日期"
        />
        <Input
          type="date"
          value={value.to || ""}
          onChange={(e) =>
            column.setFilterValue({ ...value, to: e.target.value })
          }
          placeholder="结束日期"
        />
      </div>
    </div>
  );
}
