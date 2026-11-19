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

/** "2022-03-14" -> "14 Mar 2022" (من غير مشاكل Timezone) */
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

/** شكل الـ API -> الشكل اللي بتستخدمه الصفحات */
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

/** GET /students -> { items, page, pageSize, total } */
export async function listStudents({ page = 1, pageSize = 8, classId, signal } = {}) {
  const res = await api.get("/students", { params: { page, pageSize, classId }, signal });
  return {
    items: (res?.items || []).map(toUiStudent),
    page: res?.page ?? page,
    pageSize: res?.pageSize ?? pageSize,
    total: res?.total ?? (res?.items || []).length,
  };
}

/** GET /students/{id} */
export async function getStudent(id, { signal } = {}) {
  return toUiStudent(await api.get(`/students/${id}`, { signal }));
}

/**
 * POST /students
 * body: { fullName, dateOfBirth: "YYYY-MM-DD", gender: "Male"|"Female", classId, parentIds: [] }
 */
export async function createStudent(body) {
  return toUiStudent(await api.post("/students", body));
}

/** PUT /students/{id} (نفس شكل بيانات الإضافة) */
export async function updateStudent(id, body) {
  return toUiStudent(await api.put(`/students/${id}`, body));
}

/** GET /students/next-code -> "KD-1062" (بيقبل string أو { code } أو { studentCode } أو { nextCode }) */
export async function nextStudentCode({ signal } = {}) {
  const res = await api.get("/students/next-code", { signal });
  if (typeof res === "string") return res;
  return res?.studentCode || res?.code || res?.nextCode || res?.value || "";
}

/**
 * POST /students/{id}/transfers
 * body: { classId, effectiveFrom: "YYYY-MM-DD" }
 * لو تاريخ السريان في المستقبل الباك بيعمل نقل "مجدول" (Scheduled) ويرجع enrollment
 */
export async function transferStudent(id, { classId, effectiveFrom }) {
  return api.post(`/students/${id}/transfers`, { classId, effectiveFrom });
}

/** POST /students/{id}/transfers/{enrollmentId}/cancel */
export async function cancelTransfer(id, enrollmentId) {
  return api.post(`/students/${id}/transfers/${enrollmentId}/cancel`);
}

/** النقل المجدول (لو موجود) من enrollments الطالب */
export function findScheduledTransfer(student) {
  return (
    (student?.enrollments || []).find((e) => /scheduled|pending/i.test(e.status || "")) || null
  );
}

/** بيحوّل قيمة id من <select> لرقم لو الـ ids أرقام (وإلا بيسيبها نص) */
export const toId = (value) => (value !== "" && !Number.isNaN(Number(value)) ? Number(value) : value);