import { api } from "./http";

// ============================================================
// Classes API  ⚠️ (افتراضي – مش في الـ Swagger اللي بعتّه)
// غيّر ENDPOINT / mapClass لو الـ endpoint عندك مختلف.
// لو الطلب فشل بيرجع [] والصفحة بتستنتج الفصول من الطلاب نفسهم.
// ============================================================
const ENDPOINT = "/classes";

const mapClass = (c) => ({
  id: c.id,
  name: c.name || c.className || "",
  level: c.level || c.gradeLevel || c.stage || "",
  teacherName: c.teacher?.fullName || c.teacherName || "",
});

export async function listClasses({ signal } = {}) {
  try {
    const res = await api.get(ENDPOINT, { params: { pageSize: 100 }, signal });
    const items = Array.isArray(res) ? res : res?.items || [];
    return items.map(mapClass).filter((c) => c.id !== undefined && c.name);
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return [];
  }
}