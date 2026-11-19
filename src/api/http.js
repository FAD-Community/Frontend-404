// ============================================================
// HTTP client مشترك لكل صفحات المشروع
// - عنوان الـ API من REACT_APP_API_URL (الافتراضي "/api" مع proxy في package.json)
// - بيضيف Authorization: Bearer <token> لو فيه توكن محفوظ في localStorage
// - بيحوّل أخطاء الـ ProblemDetails (اللي في الـ Swagger) لـ ApiError
// ============================================================

const BASE_URL = (process.env.REACT_APP_API_URL || "/api").replace(/\/+$/, "");
const CREDENTIALS = process.env.REACT_APP_API_CREDENTIALS || "same-origin";
const TOKEN_KEY = "kidoo.token"; // غيّر الاسم ده لو التوكن محفوظ بمفتاح تاني

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

/** {"FullName": ["msg"]} -> {fullName: "msg"} (أول رسالة لكل حقل، والمفتاح بحرف صغير) */
function normalizeFieldErrors(errors) {
  const out = {};
  if (errors && typeof errors === "object") {
    Object.entries(errors).forEach(([key, value]) => {
      const msg = Array.isArray(value) ? value[0] : value;
      if (msg) out[key.charAt(0).toLowerCase() + key.slice(1)] = String(msg);
    });
  }
  return out;
}

export class ApiError extends Error {
  constructor(status, problem, fallback) {
    super(problem?.detail || problem?.title || fallback || `Request failed (${status})`);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem || null;
    this.fieldErrors = normalizeFieldErrors(problem?.errors);
  }
}

function buildUrl(path, params) {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const qs = query.toString();
  return `${BASE_URL}${path}${qs ? `?${qs}` : ""}`;
}

export async function request(path, { method = "GET", params, body, signal } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials: CREDENTIALS,
      signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    throw new ApiError(0, null, "Can’t reach the server. Check your connection and try again.");
  }

  if (response.status === 401) {
    // التطبيق يقدر يسمع للحدث ده ويوجّه المستخدم لصفحة الـ login
    window.dispatchEvent(new CustomEvent("kidoo:unauthorized"));
  }

  const isJson = (response.headers.get("content-type") || "").includes("json");
  const payload = response.status === 204 ? null : isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const fallback =
      response.status === 401
        ? "Your session has expired. Please log in again."
        : response.status === 403
        ? "You don’t have permission to do this."
        : response.status === 404
        ? "Not found."
        : undefined;
    throw new ApiError(response.status, payload, fallback);
  }

  return payload;
}

export const api = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body: body ?? {} }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};