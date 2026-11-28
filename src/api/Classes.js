import { authenticatedFetch } from "./apiClient";

const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status, code, errors, raw } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors || null;
    this.raw = raw || null;
  }
}

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem("accessToken");
  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function request(path, options = {}) {
  const response = await authenticatedFetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: getAuthHeaders(options.headers),
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const firstFieldError = data?.errors
      ? Object.values(data.errors).flat()[0]
      : null;

    throw new ApiError(
      data?.detail ||
        firstFieldError ||
        data?.title ||
        `Request failed: ${response.status}`,
      {
        status: response.status,
        code: data?.title || null,
        errors: data?.errors || null,
        raw: data,
      }
    );
  }

  return data;
}

// GET /classes
export function getClasses({
  search = "",
  level = "",
  status = "",
  page = 1,
  pageSize = 100,
  signal,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (search.trim()) params.set("search", search.trim());
  if (level) params.set("level", level);
  if (status) params.set("status", status);

  return request(`/classes?${params.toString()}`, {
    method: "GET",
    signal,
  });
}

// POST /classes
export function createClass({ name, level }) {
  return request("/classes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.trim(),
      level,
    }),
  });
}

// GET /classes/teacher-options
export function getClassTeacherOptions({ search = "", signal } = {}) {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  const qs = params.toString();

  return request(`/classes/teacher-options${qs ? `?${qs}` : ""}`, {
    method: "GET",
    signal,
  });
}

// GET /classes/{id}
export function getClassById(id, { signal } = {}) {
  return request(`/classes/${id}`, {
    method: "GET",
    signal,
  });
}

// PUT /classes/{id}
export function updateClass(id, { name, level }) {
  return request(`/classes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.trim(),
      level,
    }),
  });
}

// POST /classes/{id}/archive
export function archiveClass(id) {
  return request(`/classes/${id}/archive`, {
    method: "POST",
  });
}

// POST /classes/{id}/activate
export function activateClass(id) {
  return request(`/classes/${id}/activate`, {
    method: "POST",
  });
}

// PUT /classes/{id}/teacher
export function assignClassTeacher(id, teacherId) {
  return request(`/classes/${id}/teacher`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      teacherId: teacherId ?? null,
    }),
  });
}

// مستخدمة في Students.js و Newaccountmodal.js
export async function listClasses({ signal } = {}) {
  try {
    const res = await getClasses({
      status: "Active",
      page: 1,
      pageSize: 100,
      signal,
    });
    const items = Array.isArray(res) ? res : res?.items || [];
    return items
      .map((c) => ({
        id: c.id,
        name: c.name || "",
        level: c.level || "",
        teacherName: c.teacher?.fullName || "",
      }))
      .filter((c) => c.id !== undefined && c.name);
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return [];
  }
}