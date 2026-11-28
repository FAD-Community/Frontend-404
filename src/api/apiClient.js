
const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/+$/, "");

let refreshRequest;

function isAuthEndpoint(url) {
  return /\/auth\/(login|refresh|logout)(?:\?|$)/i.test(url);
}

function expireSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.dispatchEvent(new Event("auth:session-expired"));
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) return null;

  if (!refreshRequest) {
    refreshRequest = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const error = new Error(
          data?.detail || data?.title || `Token refresh failed: ${response.status}`
        );
        error.status = response.status;
        if (response.status === 400 || response.status === 401) expireSession();
        throw error;
      }

      if (!data?.accessToken) {
        expireSession();
        throw new Error("The token refresh response did not include an access token.");
      }

      localStorage.setItem("accessToken", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("refreshToken", data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new CustomEvent("auth:user-updated", { detail: data.user }));
      }

      return data.accessToken;
    })().finally(() => {
      refreshRequest = null;
    });
  }

  return refreshRequest;
}

export async function authenticatedFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("accessToken");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(url, { ...options, headers });
  if (response.status !== 401 || isAuthEndpoint(url)) return response;

  const nextToken = await refreshAccessToken();
  if (!nextToken) return response;

  const retryHeaders = new Headers(options.headers || {});
  retryHeaders.set("Authorization", `Bearer ${nextToken}`);
  const retried = await fetch(url, { ...options, headers: retryHeaders });

  if (retried.status === 401) expireSession();
  return retried;
}

export async function apiRequest(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  let response;

  try {
    response = await authenticatedFetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (error) {
    if (error?.name === "AbortError" || error?.status) throw error;
    throw new Error("تعذر الاتصال بالسيرفر. تحقق من الإنترنت.");
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(
      data?.title || data?.message || "حدث خطأ أثناء تنفيذ الطلب"
    );

    error.status = response.status;
    error.code = data?.code;
    error.data = data;

    throw error;
  }

  return data;
}
