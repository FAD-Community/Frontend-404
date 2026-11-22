import { api } from "./http";

// ============================================================
// Students API  (مطابق للـ Swagger: Students (admin dashboard) – STUDENT_CLASS_MGMT)
//   GET  /students                         قايمة الطلاب (page, pageSize)
//   POST /students                         إضافة طالب
//   GET  /students/{id}                    بيانات طالب (فيها enrollments)
//   PUT  /students/{id}                    تعديل طالب
//   GET  /students/next-code               الكود المقترح للطالب الجديد
//   POST /students/{id}/transfers          نقل طالب لفصل تاني
//   POST /students/{id}/transfers/{enrollmentId}/cancel   إلغاء نقل مجدول
// ============================================================

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const TONES = ["amber", "blue", "green", "red", "cyan"];

export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return iso || "";
  return `${m[3]} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

const toneFor = (seed) => {
  const text = String(seed ?? "");
  let sum = 0;
  for (let i = 0; i < text.length; i += 1) sum += text.charCodeAt(i);
  return TONES[sum % TONES.length];
};
export function toUiStudent(s) {
  const parents = s.parents || [];
  return {
    id: s.id,
    code: s.studentCode,
    name: s.fullName,
    dobIso: s.dateOfBirth,
    dob: formatDate(s.dateOfBirth),
    gender: s.gender,
    status: s.status,
    age: s.age,
    classId: s.class?.id ?? null,
    className: s.class?.name || "—",
    parentRefs: parents.map((p) => ({ id: p.id, name: p.fullName, relationship: p.relationship })),
    parents: parents.map((p) => p.fullName), // أسماء بس (الجدول وصفحة Parent links)
    enrollments: s.enrollments || [],
    avatar: toneFor(s.id ?? s.fullName),
  };
}

export async function listStudents({
  page = 1,
  pageSize = 8,
  classId,
  signal,
} = {}) {
  const res = await api.get("/students", {
    params: { page, pageSize, classId },
    signal,
  });

  const rawItems = Array.isArray(res)
    ? res
    : Array.isArray(res?.items)
      ? res.items
      : res && typeof res === "object" && res.id != null
        ? [res]
        : [];

  return {
    items: rawItems.map(toUiStudent),
    page: res?.page ?? page,
    pageSize: res?.pageSize ?? pageSize,
    total: res?.total ?? rawItems.length,
  };
}

export async function getStudent(id, { signal } = {}) {
  return toUiStudent(await api.get(`/students/${id}`, { signal }));
}

export async function createStudent(body) {
  return toUiStudent(await api.post("/students", body));
}

export async function updateStudent(id, body) {
  return toUiStudent(await api.put(`/students/${id}`, body));
}

export async function nextStudentCode({ signal } = {}) {
  const res = await api.get("/students/next-code", { signal });
  if (typeof res === "string") return res;
  return res?.studentCode || res?.code || res?.nextCode || res?.value || "";
}

export async function transferStudent(id, { classId, effectiveFrom }) {
  return api.post(`/students/${id}/transfers`, {
    toClassId: classId,
    effectiveFrom,
  });
}

export async function cancelTransfer(id, enrollmentId) {
  return api.post(`/students/${id}/transfers/${enrollmentId}/cancel`);
}

export function findScheduledTransfer(student) {
  return (
    (student?.enrollments || []).find((e) => /scheduled|pending/i.test(e.status || "")) || null
  );
}
export const toId = (value) => (value !== "" && !Number.isNaN(Number(value)) ? Number(value) : value);