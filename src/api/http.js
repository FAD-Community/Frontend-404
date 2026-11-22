const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

async function request(method, endpoint, options = {}) {
  if (!API_BASE_URL) {
    throw new Error("REACT_APP_API_BASE_URL مش متظبط في ملف .env");
  }

  const { params, signal, ...requestOptions } = options;

const baseUrl = API_BASE_URL.replace(/\/+$/, "");
const path = endpoint.replace(/^\/+/, "");
const url = new URL(`${baseUrl}/${path}`);

  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, String(value));
    }
  });

const token = localStorage.getItem("accessToken");

const headers = {
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
};

  if (requestOptions.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(url.toString(), {
      ...requestOptions,
      method,
      headers,
      signal,
    });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }

    throw new Error("تعذر الاتصال بالـ API. راجعي الإنترنت وعنوان السيرفر.");
  }

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.title || data?.message || `Request failed: ${response.status}`
    );

    error.status = response.status;
    error.code = data?.code;
    error.data = data;

    throw error;
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) =>
    request("GET", endpoint, options),

  post: (endpoint, body, options = {}) =>
    request("POST", endpoint, {
      ...options,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  put: (endpoint, body, options = {}) =>
    request("PUT", endpoint, {
      ...options,
      body: body === undefined ? undefined : JSON.stringify(body),
    }),

  delete: (endpoint, options = {}) =>
    request("DELETE", endpoint, options),
};