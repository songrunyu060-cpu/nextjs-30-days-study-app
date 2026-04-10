/**
 * Route Handler 里统一的 JSON 错误体：`{ error: string, ...extra }`
 */
export function jsonError(
  status: number,
  message: string,
  extra?: Record<string, unknown>,
): Response {
  return Response.json(
    extra ? { error: message, ...extra } : { error: message },
    { status },
  );
}

export function unauthorizedJson(message = "用户没有权限") {
  return jsonError(401, message);
}

export function badRequestJson(message: string) {
  return jsonError(400, message);
}

export function conflictJson(message: string) {
  return jsonError(409, message);
}
