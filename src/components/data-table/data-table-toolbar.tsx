"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Props {
  search: string;
  onSearch: (v: string) => void;
  onReset: () => void;
}

export function DataTableToolbar({ search, onSearch, onReset }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="搜索"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="h-8 w-[240px]"
      />
      {search && (
        <Button variant="ghost" size="sm" onClick={onReset}>
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
