"use client";

import { Column } from "@tanstack/react-table";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface DataTableSliderFilterProps<TData, TValue> {
  column: Column<TData, TValue>;
  title: string;
  min: number;
  max: number;
}

export function DataTableSliderFilter<TData, TValue>({
  column,
  title,
  min,
  max,
}: DataTableSliderFilterProps<TData, TValue>) {
  const value = (column.getFilterValue() as [number, number]) || [min, max];
  return (
    <div className="space-y-2">
      <Label>
        {title}: {value[0]} - {value[1]}
      </Label>
      <Slider
        value={value}
        min={min}
        max={max}
        step={1}
        onValueChange={(v) => column.setFilterValue(v)}
      />
    </div>
  );
}
