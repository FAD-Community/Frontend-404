// بيانات الحسابات + دوال مساعدة (التواريخ، الحروف الأولى، وصف الحالة)

export const CURRENT_ADMIN = "Mona Saleh"; // الأدمن الحالي (استبدله باليوزر اللي عامل login)
export const INVITE_TTL_MS = 72 * 3600 * 1000; // الدعوة بتنتهي بعد 72 ساعة
const DAY = 86400000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const pad = (n) => String(n).padStart(2, "0");

export const fmtDate = (iso) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
};

export const fmtDateTime = (iso) => {
  const d = new Date(iso);
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

// الفصول (استبدلها ببيانات الـ API)
export const CLASSES = [
  { id: "sunflowers", name: "Sunflowers · KG-1" },
  { id: "little-stars", name: "Little Stars · Pre-K" },
  { id: "bumblebees", name: "Bumblebees · KG-2" },
  { id: "rainbows", name: "Rainbows · Nursery" },
];

/** اسم فصل المدرّس (لو عنده فصل) – بيشتغل كمان مع البيانات القديمة المتخزنة */
export function getClassName(account) {
  if (account.role !== "Teacher") return null;
  const byId = CLASSES.find((c) => c.id === account.classId);
  if (byId) return byId.name;
  const byInfo = CLASSES.find((c) => account.info && c.name.startsWith(account.info));
  return byInfo ? byInfo.name : null;
}

// الصلاحيات المتاحة للأدمنز
export const PRIVILEGES = ["Dashboard", "Teachers", "Students", "Parents", "Admins"];

/** هل الأدمن ده معاه واحدة من الصلاحيات دي؟ (Default admin معاه كل حاجة) */
export function hasAnyPrivilege(account, needs = []) {
  const list = account?.privileges;
  if (!list) return true; // حسابات قديمة من غير صلاحيات = مسموح
  return list.includes("All") || needs.some((n) => list.includes(n));
}

/* ===== جديد: صلاحيات الأدمنز (شاشة Edit privileges) ===== */

// اختيارات الصلاحيات (الترتيب هو ترتيب العرض)
export const PRIVILEGE_OPTIONS = [
  { key: "Teachers", title: "Teacher management", hint: "Create / deactivate teacher accounts" },
  { key: "Students", title: "Student & class management", hint: "Classes, students, transfers, teacher assignment" },
  { key: "Parents", title: "Parent management", hint: "Parent accounts and parent–student links" },
  { key: "Dashboard", title: "Dashboard & reports", hint: "Overview, alerts and daily reports" },
  { key: "Admins", title: "Admin account management", hint: "Create admins and assign privileges" },
];

/** عنوان الصلاحية (Teacher management…) من المفتاح (Teachers…) */
export const privilegeTitle = (key) => PRIVILEGE_OPTIONS.find((o) => o.key === key)?.title || key;

/**
 * تغييرات "معلّقة" بتظهر أول ما تفتح Edit privileges (زي التصميم بالظبط: Yara + Student & class management).
 * مجرد عرض مبدئي: بتتحط على المسودة بس قبل أول تعديل محفوظ للأدمن. امسح السطر ده لو مش عاوزه.
 */
export const DEMO_DRAFT_ADDS = { "acc-9": ["Students"] };

const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString();

export const lastEvent = (account, type) =>
  [...account.history].reverse().find((e) => e.type === type);

export const makeEvent = (type, extra = {}) => ({
  type,
  at: new Date().toISOString(),
  by: CURRENT_ADMIN,
  ...extra,
});

/** النص اللي بيظهر في عمود Assignment / info */
export function getInfo(account) {
  if (account.status === "Invited") {
    const sent = lastEvent(account, "sent");
    if (sent) {
      const left = Math.max(
        0,
        Math.ceil((new Date(sent.at).getTime() + INVITE_TTL_MS - Date.now()) / DAY)
      );
      const when = isToday(sent.at) ? "Sent today" : `Sent ${fmtDate(sent.at)}`;
      return `${when} · expires in ${left} ${left === 1 ? "day" : "days"}`;
    }
  }
  return account.info || "";
}

/** أي دعوة عدّى عليها 72 ساعة تتحول لـ Invite expired */
export function normalizeAccounts(list) {
  const now = Date.now();
  return list.map((a) => {
    if (a.status !== "Invited") return a;
    const sent = lastEvent(a, "sent");
    if (!sent) return a;
    const expiresAt = new Date(sent.at).getTime() + INVITE_TTL_MS;
    if (expiresAt > now) return a;
    return {
      ...a,
      status: "Invite expired",
      history: [...a.history, { type: "expired", at: new Date(expiresAt).toISOString(), by: "System" }],
    };
  });
}

const ev = (type, at, by = CURRENT_ADMIN, extra) => ({ type, at, by, ...extra });
const hoursAgo = (h) => new Date(Date.now() - h * 3600e3).toISOString();

export const SEED_ACCOUNTS = [
  {
    id: "acc-1", name: "Ahlam Mahmoud", username: "ahlam.mahmoud", email: "mona@kidoo.app",
    role: "Admin", status: "Default", info: "System setup", avatar: "cyan", locked: true,
    privileges: ["All"],
    history: [ev("created", "2026-09-01T09:00", "System")],
  },
  {
    id: "acc-2", name: "Karim Adel", username: "karim.a", email: "karim@kidoo.app",
    role: "Admin", status: "Active", info: "by Mona · 10 Oct", avatar: "green",
    privileges: ["Teachers", "Students", "Parents", "Admins"],
    history: [ev("created", "2026-10-10T09:40", CURRENT_ADMIN, { privileges: ["Teachers", "Students", "Parents", "Admins"] }), ev("sent", "2026-10-10T09:45"), ev("activated", "2026-10-10T11:20", "Karim Adel")],
  },
  {
    id: "acc-3", name: "Mariam Fathy", username: "mariam.f", email: "mariam@kidoo.app",
    role: "Teacher", status: "Active", info: "Sunflowers", infoTone: "ink", avatar: "blue", classId: "sunflowers",
    history: [ev("created", "2026-09-03T10:00"), ev("sent", "2026-09-03T10:02"), ev("activated", "2026-09-03T12:30", "Mariam Fathy")],
  },
  {
    id: "acc-4", name: "Rana Adel", username: "rana.adel", email: "rana@kidoo.app",
    role: "Teacher", status: "Active", info: "No class", infoTone: "warn", avatar: "amber",
    history: [ev("created", "2026-09-14T09:10"), ev("sent", "2026-09-14T09:12"), ev("activated", "2026-09-14T15:05", "Rana Adel")],
  },
  {
    id: "acc-5", name: "Hoda Ahmed", username: "hoda.ahmed", email: "hoda@mail.com",
    role: "Parent", status: "Active", info: "Salma, Ali", infoTone: "ink", avatar: "red",
    history: [ev("created", "2026-09-20T11:00"), ev("sent", "2026-09-20T11:03"), ev("activated", "2026-09-21T08:45", "Hoda Ahmed")],
  },
  {
    id: "acc-6", name: "Tamer Samy", username: "tamer.s", email: "tamer@mail.com",
    role: "Parent", status: "Invited", avatar: "green",
    history: [ev("created", hoursAgo(2.05)), ev("sent", hoursAgo(2))],
  },
  {
    id: "acc-7", name: "Sara Nabil", username: "sara.n", email: "sara@kidoo.app",
    role: "Teacher", status: "Invite expired", avatar: "red",
    history: [
      ev("created", "2026-10-08T08:58"),
      ev("sent", "2026-10-08T09:00"),
      ev("expired", "2026-10-11T09:00", "System"),
    ],
  },
  {
    id: "acc-8", name: "Hany Samir", username: "hany.s", email: "hany@kidoo.app",
    role: "Teacher", status: "Inactive", info: "Records kept", avatar: "blue",
    history: [
      ev("created", "2026-08-25T09:00"),
      ev("sent", "2026-08-25T09:02"),
      ev("activated", "2026-08-25T13:10", "Hany Samir"),
      ev("deactivated", "2026-10-01T10:00"),
    ],
  },
  {
    id: "acc-9", name: "Yara Fawzy", username: "yara.f", email: "yara@kidoo.app",
    role: "Admin", status: "Active", info: "by Mona · 11 Oct", avatar: "blue",
    privileges: ["Dashboard"],
    history: [ev("created", "2026-10-11T14:20", CURRENT_ADMIN, { privileges: ["Dashboard"] }), ev("sent", "2026-10-11T14:22"), ev("activated", "2026-10-11T15:40", "Yara Fawzy")],
  },
];