/**
 * Node.js HTTPS Fetch Helper
 * 
 * Uses native node:https instead of undici fetch() which can crash
 * the Next.js process when the external API is slow or unreachable.
 * 
 * This is a drop-in replacement for fetch() in proxy routes where
 * we need more resilience against network issues.
 */

import https from "node:https";
import http from "node:http";

export interface NodeFetchOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

export interface NodeFetchResult {
  ok: boolean;
  status: number;
  statusText: string;
  text: () => Promise<string>;
  headers: {
    get: (name: string) => string | null;
  };
}

/**
 * Fetch a URL using native Node.js http/https modules.
 * More resilient than undici fetch() — won't crash the process on timeout.
 */
export function nodeFetch(
  url: string,
  options: NodeFetchOptions = {}
): Promise<NodeFetchResult> {
  const { headers = {}, timeout = 60_000 } = options;

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";
    const mod = isHttps ? https : http;

    const req = mod.request(
      url,
      {
        method: "GET",
        headers,
        timeout,
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const body = Buffer.concat(chunks).toString("utf-8");
          const resHeaders = res.headers;

          resolve({
            ok: res.statusCode! >= 200 && res.statusCode! < 300,
            status: res.statusCode || 0,
            statusText: res.statusMessage || "",
            text: () => Promise.resolve(body),
            headers: {
              get: (name: string) => resHeaders[name.toLowerCase()] || null,
            },
          });
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    req.on("timeout", () => {
      req.destroy(new Error(`Request timeout after ${timeout}ms`));
    });

    req.end();
  });
}
