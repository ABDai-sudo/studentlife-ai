type JsonResult = {
  ok: boolean;
  status: number;
  json: unknown;
};

export function fetchJson(
  url: string,
  init?: RequestInit
): Promise<JsonResult> {
  return fetch(url, { cache: "no-store", ...init }).then((res) =>
    res
      .json()
      .then((json) => ({ ok: res.ok, status: res.status, json }))
      .catch(() => ({ ok: res.ok, status: res.status, json: null }))
  );
}

/**
 * Start a fetch from an effect and deliver the result in a promise callback.
 * setState must happen inside `apply` / `onNetworkError` (async callbacks),
 * not synchronously in the effect body — satisfies react-hooks/set-state-in-effect.
 *
 * Intentionally does NOT cancel on unmount: React Strict Mode remounts would
 * otherwise discard slow Neon responses and leave permanent loading skeletons.
 * Callers that need cancellation should pass AbortSignal via fetchJson directly.
 */
export function mountFetch(
  url: string,
  apply: (result: JsonResult) => void,
  onNetworkError?: () => void
): () => void {
  fetchJson(url)
    .then((result) => {
      apply(result);
    })
    .catch(() => {
      onNetworkError?.();
    });
  return () => undefined;
}
