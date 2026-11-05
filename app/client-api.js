export const API_URL = "/api";

export async function request(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.detail || `The backend returned ${response.status}.`);
    error.status = response.status;
    throw error;
  }
  return body;
}

export async function wakeBackend(onRetry) {
  let lastError;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await request("/health");
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 2) {
        onRetry?.(attempt + 1);
        await new Promise((resolve) => window.setTimeout(resolve, 1500 * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export function startKeepAlive(onExpired) {
  async function ping() {
    try {
      await request("/auth/me");
    } catch (error) {
      if (error.status === 401) onExpired?.();
    }
  }
  const heartbeat = window.setInterval(ping, 10 * 60 * 1000);
  const onVisible = () => {
    if (document.visibilityState === "visible") ping();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearInterval(heartbeat);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
