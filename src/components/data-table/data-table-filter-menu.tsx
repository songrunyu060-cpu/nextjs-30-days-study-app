"use client";

import { useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DataTableFilterMenu() {
  const [status, setStatus] = useQueryState("status", { defaultValue: "" });
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          状态筛选
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => setStatus("active")}>
          启用
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setStatus("inactive")}>
          禁用
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setStatus(null)}>
          全部
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
