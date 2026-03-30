"use client";

import { DataTable } from "@/components/data-table/data-table";
import { ColumnDef } from "@tanstack/react-table";

const data = [
  { id: "1", name: "张三", email: "zs@example.com" },
  { id: "2", name: "李四", email: "ls@example.com" },
  { id: "3", name: "王五", email: "ww@example.com" },
  { id: "4", name: "赵六", email: "zl@example.com" },
];

const columns: ColumnDef<(typeof data)[0]>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "姓名" },
  { accessorKey: "email", header: "邮箱" },
];

export default function TablePage() {
  return (
    <div className="p-6">
      <DataTable columns={columns} data={data} totalCount={4} />
    </div>
  );
}
