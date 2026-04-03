/**
 * Busca resultados paginados da API Meta.
 * Usa limit menor e cap para evitar erro "reduce the amount of data".
 */
export async function fetchAllPages(
  baseUrl: string,
  accessToken: string,
  params: Record<string, string> = {},
  maxItems = 500
): Promise<unknown[]> {
  const url = new URL(baseUrl);
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("limit", "100");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const all: unknown[] = [];
  let nextUrl: string | null = url.toString();

  while (nextUrl && all.length < maxItems) {
    const res = await fetch(nextUrl);
    const data = (await res.json()) as {
      data?: unknown[];
      paging?: { next?: string };
      error?: { message: string };
    };

    if (data.error) {
      throw new Error(data.error.message);
    }

    if (data.data) {
      const remaining = maxItems - all.length;
      const toAdd = data.data.slice(0, remaining);
      all.push(...toAdd);
      if (data.data.length > remaining) break;
    }

    nextUrl = data.paging?.next ?? null;
  }

  return all;
}
