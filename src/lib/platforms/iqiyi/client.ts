/**
 * iQIYI API Client
 * Low-level fetch function for the iQIYI API via local proxy.
 * The proxy handles authentication (API key) server-side.
 */

interface RequestOptions {
  params?: Record<string, string | number | undefined>;
}

/**
 * Fetch data from the iQIYI API via the local Next.js proxy.
 * The proxy handles authentication (API key) server-side.
 */
export async function fetchAPI<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const params = new URLSearchParams();
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    });
  }
  const queryString = params.toString();
  const url = `${endpoint}${queryString ? "?" + queryString : ""}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(
      `API Error: ${res.status} ${res.statusText} for ${endpoint}`
    );
  }

  const text = await res.text();

  // If the response is an m3u8 playlist, return as raw string
  if (text.startsWith("#EXTM3U")) {
    return text as unknown as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API Error: Invalid JSON response from ${endpoint}`);
  }
}
