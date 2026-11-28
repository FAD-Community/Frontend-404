import { api } from "./http";
import { getAvatarTone } from "../data/Accounts";

const UI_TO_API_PRIVILEGE = {
  Dashboard: "DASHBOARD_VIEW",
  Teachers: "TEACHER_MGMT",
  Students: "STUDENT_CLASS_MGMT",
  Parents: "PARENT_MGMT",
  Admins: "ADMIN_MGMT",
};

const API_TO_UI_PRIVILEGE = Object.fromEntries(
  Object.entries(UI_TO_API_PRIVILEGE).map(([label, code]) => [code, label])
);

const toApiPrivileges = (privileges = []) =>
  privileges.map((privilege) => UI_TO_API_PRIVILEGE[privilege] || privilege);

const fromApiPrivileges = (privileges = []) =>
  privileges.map((privilege) => API_TO_UI_PRIVILEGE[privilege] || privilege);

function mapAdmin(admin) {
  if (!admin) return admin;
  return {
    ...admin,
    role: "Admin",
    name: admin.fullName || admin.name || "",
    status: admin.isDefaultAdmin ? "Default" : admin.status,
    avatar: getAvatarTone(admin),
    privileges: admin.isDefaultAdmin
      ? ["All"]
      : fromApiPrivileges(admin.privileges),
    history: [],
  };
}

function mapAuditEntry(entry) {
  const action = String(entry.action || "Audit event");
  const normalizedAction = action.toLowerCase();
  const privilege = entry.changes?.privilege
    ? fromApiPrivileges([entry.changes.privilege])[0]
    : null;
  const actor = entry.actor?.fullName || "System";

  if (normalizedAction.includes("created")) {
    return {
      type: "created",
      by: actor,
      at: entry.at,
      ...(Array.isArray(entry.changes?.privileges)
        ? { privileges: fromApiPrivileges(entry.changes.privileges) }
        : {}),
    };
  }

  if (normalizedAction.includes("privilege") && privilege) {
    return {
      type: "privileges",
      by: actor,
      at: entry.at,
      added: /grant|add/i.test(action) ? [privilege] : [],
      removed: /revok|remov/i.test(action) ? [privilege] : [],
    };
  }

  return {
    type: "audit",
    by: actor,
    at: entry.at,
    text: action,
    target: entry.target?.fullName,
  };
}

export async function listAdmins({
  search = "",
  status = "",
  page = 1,
  pageSize = 8,
  signal,
} = {}) {
  const result = await api.get("/admins", {
    params: { search, status, page, pageSize },
    signal,
  });
  const items = Array.isArray(result) ? result : result?.items || [];
  return {
    items: items.map(mapAdmin),
    page: result?.page ?? page,
    pageSize: result?.pageSize ?? pageSize,
    total: result?.total ?? items.length,
  };
}

export async function createAdmin({ fullName, username, email, privileges }) {
  const result = await api.post("/admins", {
    fullName: fullName.trim(),
    username: username.trim(),
    email: email.trim(),
    privileges: toApiPrivileges(privileges),
  });
  return { ...mapAdmin(result), invitationSent: result?.invitationSent };
}

export async function updateAdminPrivileges(id, privileges) {
  return mapAdmin(
    await api.put(`/admins/${id}/privileges`, {
      privileges: toApiPrivileges(privileges),
    })
  );
}

export async function getAdminAudit(id, { page = 1, pageSize = 100, signal } = {}) {
  const result = await api.get(`/admins/${id}/audit`, {
    params: { page, pageSize },
    signal,
  });
  const items = Array.isArray(result) ? result : result?.items || [];
  return {
    items: items.map(mapAuditEntry).reverse(),
    page: result?.page ?? page,
    pageSize: result?.pageSize ?? pageSize,
    total: result?.total ?? items.length,
  };
}
