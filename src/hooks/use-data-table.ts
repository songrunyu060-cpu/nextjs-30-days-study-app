"use client";

import { useQueryStates, parseAsInteger, parseAsString } from "nuqs";
import { useCallback } from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";

const tableParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  sort: parseAsString.withDefault(""),
  search: parseAsString.withDefault(""),
};

export function useDataTable<TData>({
  columns,
  data,
  totalCount,
}: {
  columns: ColumnDef<TData>[];
  data: TData[];
  totalCount: number;
}) {
  const [query, setQuery] = useQueryStates(tableParams);

  const sorting = query.sort
    ? [
        {
          id: query.sort.split(",")[0],
          desc: query.sort.split(",")[1] === "desc",
        },
      ]
    : [];

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    manualSorting: true,
    pageCount: Math.ceil(totalCount / query.perPage),
    state: {
      sorting,
      pagination: { pageIndex: query.page - 1, pageSize: query.perPage },
      globalFilter: query.search,
    },
    onSortingChange: (updater) => {
      const s = typeof updater === "function" ? updater(sorting) : updater;
      if (!s.length) return setQuery({ sort: null });
      setQuery({ sort: `${s[0].id},${s[0].desc ? "desc" : "asc"}` });
    },
    onPaginationChange: (updater) => {
      const p =
        typeof updater === "function"
          ? updater(table.getState().pagination)
          : updater;
      setQuery({ page: p.pageIndex + 1, perPage: p.pageSize });
    },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const setSearch = useCallback(
    (v: string) => {
      setQuery({ search: v || null, page: 1 });
    },
    [setQuery],
  );

  const reset = useCallback(() => {
    setQuery({ page: 1, perPage: 10, sort: "", search: "" });
    table.resetColumnFilters();
  }, [setQuery, table]);

  return { table, search: query.search ?? "", setSearch, reset };
}
