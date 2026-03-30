"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useQueryState, parseAsString } from "nuqs";

type Props = {
  /**
   * 仅用于首屏同步（server 已解析的 q）。
   * 之后输入框状态以 URL 为准。
   */
  initialQuery: string;
};

export function UserFilters({ initialQuery }: Props) {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [draft, setDraft] = useState<string>(initialQuery);

  // URL → 输入框（例如点击浏览器前进/后退）
  useEffect(() => {
    setDraft(q);
  }, [q]);

  const showClear = useMemo(() => draft.trim() !== "", [draft]);

  const onSubmit = useCallback(
    async (
      e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>,
    ) => {
      e.preventDefault();
      const next = draft.trim();
      await setQ(next === "" ? null : next, {
        history: "push",
        shallow: false,
      });
    },
    [draft, setQ],
  );

  const onClear = useCallback(async () => {
    setDraft("");
    await setQ(null, { history: "push", shallow: false });
  }, [setQ]);

  const onChange = useCallback((value: string) => {
    setDraft(value);
  }, []);

  return (
    <form
      method="get"
      onSubmit={onSubmit}
      className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <input
        type="search"
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        placeholder="按姓名或邮箱筛选…"
        className="w-full flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 sm:max-w-md"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          筛选
        </button>
        {showClear ? (
          <button
            type="button"
            onClick={() => void onClear()}
            className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            清除
          </button>
        ) : null}
      </div>
    </form>
  );
}
