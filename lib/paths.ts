export const BASE_PATH = "/apps/teacher-evaluation";

export function apiPath(path: string) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}
