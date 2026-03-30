// src/lib/params.ts
import {
  createSerializer,
  parseAsInteger,
  parseAsString,
  parseAsBoolean,
  createSearchParamsCache,
  UrlKeys,
} from "nuqs/server";

export const projectParams = {
  // 编辑用户 ID
  edit: parseAsInteger.withDefault(1),
  // 创建用户
  create: parseAsBoolean.withDefault(false),
  // 默认第一页，解析为整数
  page: parseAsInteger.withDefault(1),
  // 每页条数
  pageSize: parseAsInteger.withDefault(10),
  // 搜索关键字，默认为空字符串
  q: parseAsString.withDefault(""),
  // 排序字段
  sortBy: parseAsString.withDefault("createdAt"),
  // 排序方向
  order: parseAsString.withDefault("desc"),
};

// query参数过多时 可以采用 UrlKeys 来指定参数名
// export const usersUrlKeys: UrlKeys<typeof projectParams> = {
//   query: "q",
//   editingUserId: "e",
//   createOpen: "c",
// };
// 用于服务端组件 (RSC) 直接读取数据
export const searchParamsCache = createSearchParamsCache(projectParams);

// 用于在组件外生成带参数的 URL（例如导出功能）
export const serialize = createSerializer(projectParams);
