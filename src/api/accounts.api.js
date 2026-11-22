const API_BASE_URL = (process.env.REACT_APP_API_BASE_URL || "").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status, code, errors, raw, invitationSaved = false } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors || null;
    this.raw = raw || null;
    this.invitationSaved = invitationSaved;
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
  const response = await fetch(`${API_BASE_URL}${path}`, {
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

// GET /accounts
export function getAccounts({
  search = "",
  role = "",
  status = "",
  noChildLinked,
  page = 1,
  pageSize = 8,
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (search.trim()) params.set("search", search.trim());
  if (role) params.set("role", role);
  if (status) params.set("status", status);
  if (typeof noChildLinked === "boolean") {
    params.set("noChildLinked", String(noChildLinked));
  }

  return request(`/accounts?${params.toString()}`, { method: "GET" });
}

// POST /accounts
export function createAccount({
  role,
  fullName,
  username,
  email,
  phone,
  classId,
  studentIds,
}) {
  const payload = {
    role,
    fullName: fullName.trim(),
    username: username.trim(),
    email: email.trim(),
    ...(phone?.trim() ? { phone: phone.trim() } : {}),
  };

  if (role === "Teacher" && classId !== "" && classId != null) {
    payload.classId = Number(classId);
  }

  if (role === "Parent" && Array.isArray(studentIds) && studentIds.length > 0) {
    payload.studentIds = studentIds.map(Number);
  }

  return request("/accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// GET /accounts/username-available
export function checkUsernameAvailable(username) {
  const params = new URLSearchParams({ username: username.trim() });
  return request(`/accounts/username-available?${params.toString()}`, {
    method: "GET",
  });
}

// POST /accounts/{id}/invitation/resend
export function resendAccountInvitation(id) {
  return request(`/accounts/${id}/invitation/resend`, {
    method: "POST",
  });
}

// PUT /accounts/{id}/email
export function updateAccountEmail(id, email) {
  return request(`/accounts/${id}/email`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() }),
  });
}

// GET /accounts/{id}/invitations
export function getAccountInvitations(id) {
  return request(`/accounts/${id}/invitations`, {
    method: "GET",
  });
}

// POST /accounts/{id}/deactivate
export function deactivateAccount(id) {
  return request(`/accounts/${id}/deactivate`, {
    method: "POST",
  });
}

// POST /accounts/{id}/reactivate
export function reactivateAccount(id) {
  return request(`/accounts/${id}/reactivate`, {
    method: "POST",
  });
}