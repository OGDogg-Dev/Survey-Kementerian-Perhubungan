type ZiggyRoute = (name: string, params?: unknown) => string;

export function routeOr(
  name: string,
  params?: unknown,
  fallback = '#'
): string {
  const win = window as unknown as { route?: ZiggyRoute };
  const ziggy = win.route;
  return typeof ziggy === 'function' ? ziggy(name, params) : fallback;
}
