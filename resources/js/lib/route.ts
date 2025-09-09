type ZiggyRoute = (name: string, params?: unknown) => string;

export function routeOr(
  name: string,
  params?: unknown,
  fallback = '#'
): string {
  try {
    if (typeof window !== 'undefined') {
      const ziggy = (window as unknown as { route?: ZiggyRoute }).route;
      if (typeof ziggy === 'function') {
        return ziggy(name, params);
      }
    }
  } catch {
    // ignore ziggy errors and fall back
  }
  return fallback;
}
