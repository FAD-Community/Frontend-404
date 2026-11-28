export const INVITE_TTL_MS = 72 * 3600 * 1000;
const DAY = 86400000;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const AVATAR_TONES = ["cyan", "green", "blue", "amber", "red"];

const pad = (n) => String(n).padStart(2, "0");

export const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const fmtDateTime = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${fmtDate(iso)} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const isToday = (iso) => {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
};

export function getAvatarTone(account) {
  const num = Number(account?.id);
  if (Number.isFinite(num) && num >= 0) {
    return AVATAR_TONES[num % AVATAR_TONES.length];
  }
  const seed = String(account?.username || account?.email || account?.id || "");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

export function normalizeStatus(account) {
  if (account?.isDefaultAdmin) return "Default";
  if (account?.status === "InviteExpired") return "Invite expired";
  return account?.status || "";
}

/** قراءة آخر حدث من بيانات الباك إند الحقيقية (للتوافق مع Admins.js) */
export function lastEvent(account, type) {
  if (Array.isArray(account?.history) && account.history.length > 0) {
    return [...account.history].reverse().find((e) => e.type === type);
  }
  if (type === "sent" && account?.invitation?.sentAt) {
    return { type: "sent", at: account.invitation.sentAt };
  }
  if (type === "expired" && account?.invitation?.expiresAt) {
    return { type: "expired", at: account.invitation.expiresAt };
  }
  if (type === "created" && account?.createdAt) {
    return {
      type: "created",
      at: account.createdAt,
      by: account.createdBy?.fullName || "System",
    };
  }
  return undefined;
}

// مصفوفة فاضية لحين ربطها بـ GET /classes
export const CLASSES = [];

/** اسم فصل المدرّس من بيانات الباك إند (للتوافق مع ConfirmDeactivateModal.js) */
export function getClassName(account) {
  if (!account || account.role !== "Teacher") return null;
  if (Array.isArray(account.classes) && account.classes.length > 0) {
    return account.classes.map((c) => c.name).join(", ");
  }
  const byId = CLASSES.find((c) => String(c.id) === String(account.classId));
  return byId ? byId.name : null;
}

export function getInfo(account) {
  if (!account) return "";

  if (account.isDefaultAdmin || account.status === "Default") {
    return "System setup";
  }

  if (account.status === "Invited" && account.invitation?.sentAt) {
    const sentAt = account.invitation.sentAt;
    const expiresMs = account.invitation.expiresAt
      ? new Date(account.invitation.expiresAt).getTime()
      : new Date(sentAt).getTime() + INVITE_TTL_MS;
    const left = Math.max(0, Math.ceil((expiresMs - Date.now()) / DAY));
    const when = isToday(sentAt) ? "Sent today" : `Sent ${fmtDate(sentAt)}`;
    return `${when} · expires in ${left} ${left === 1 ? "day" : "days"}`;
  }

  if (account.status === "Inactive") {
    return "Records kept";
  }

  if (account.role === "Admin") {
    if (account.createdBy?.fullName) {
      const creatorFirst = account.createdBy.fullName.trim().split(/\s+/)[0];
      const dateStr = fmtDate(account.createdAt);
      return dateStr ? `by ${creatorFirst} · ${dateStr}` : `by ${creatorFirst}`;
    }
    return fmtDate(account.createdAt);
  }

  if (account.role === "Teacher") {
    if (account.classes?.length) {
      return account.classes.map((c) => c.name).join(", ");
    }
    return "No class";
  }

  if (account.role === "Parent") {
    if (account.children?.length) {
      return account.children.map((c) => c.fullName).join(", ");
    }
    return "No child linked";
  }

  return "";
}

export function getInfoTone(account) {
  if (!account || account.status === "Inactive" || account.status === "Invited") {
    return "";
  }
  if (account.role === "Teacher") {
    return account.classes?.length ? "ink" : "warn";
  }
  if (account.role === "Parent") {
    return account.children?.length ? "ink" : "warn";
  }
  return "";
}

export function mapAccountFromApi(raw) {
  if (!raw) return null;

  const normalizedStatus = normalizeStatus(raw);
  const mapped = {
    ...raw,
    name: raw.fullName || raw.name || "",
    fullName: raw.fullName || raw.name || "",
    status: normalizedStatus,
    rawStatus: raw.status,
    locked: Boolean(raw.isDefaultAdmin),
    avatar: getAvatarTone(raw),
    classes: Array.isArray(raw.classes) ? raw.classes : [],
    classId: raw.classes?.[0]?.id ?? "",
    children: Array.isArray(raw.children) ? raw.children : [],
    invitation: raw.invitation || null,
  };

  return {
    ...mapped,
    info: getInfo(mapped),
    infoTone: getInfoTone(mapped),
  };
}

export const PRIVILEGES = ["Dashboard", "Teachers", "Students", "Parents", "Admins"];

const PRIVILEGE_CODES = {
  Dashboard: "DASHBOARD_VIEW",
  Teachers: "TEACHER_MGMT",
  Students: "STUDENT_CLASS_MGMT",
  Parents: "PARENT_MGMT",
  Admins: "ADMIN_MGMT",
};

const privilegeCode = (value) => PRIVILEGE_CODES[value] || value;

export function hasAnyPrivilege(account, needs = []) {
  const list = account?.privileges;
  if (account?.isDefaultAdmin || account?.status === "Default") return true;
  if (!Array.isArray(list)) return false;
  if (list.includes("All")) return true;

  const held = new Set(list.map(privilegeCode));
  return needs.some((need) => held.has(privilegeCode(need)));
}

export const PRIVILEGE_OPTIONS = [
  { key: "Teachers", title: "Teacher management", hint: "Create / deactivate teacher accounts" },
  { key: "Students", title: "Student & class management", hint: "Classes, students, transfers, teacher assignment" },
  { key: "Parents", title: "Parent management", hint: "Parent accounts and parent–student links" },
  { key: "Dashboard", title: "Dashboard & reports", hint: "Overview, alerts and daily reports" },
  { key: "Admins", title: "Admin account management", hint: "Create admins and assign privileges" },
];

export const privilegeTitle = (key) =>
  PRIVILEGE_OPTIONS.find((option) => privilegeCode(option.key) === privilegeCode(key))
    ?.title || key;

// فارغ بدون داتا تجريبية (للتوافق مع Editprivilegesdrawer.js)
export const DEMO_DRAFT_ADDS = {};