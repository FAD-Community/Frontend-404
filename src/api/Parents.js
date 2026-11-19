import { api } from "./http";

// ============================================================
// Parents API  ⚠️ (افتراضي – مش في الـ Swagger اللي بعتّه)
// بيستخدم في ربط أولياء الأمور وقت إضافة طالب (parentIds).
// غيّر ENDPOINT / PARAM / mapParent لو الـ endpoint عندك مختلف.
// لو الطلب فشل بيرجع [].
// ============================================================
const ENDPOINT = "/parents";
const SEARCH_PARAM = "search";

const mapParent = (p) => ({
  id: p.id,
  name: p.fullName || p.name || "",
  email: p.email || "",
});

export async function searchParents(query = "", { signal } = {}) {
  try {
    const res = await api.get(ENDPOINT, { params: { [SEARCH_PARAM]: query, pageSize: 8 }, signal });
    const items = Array.isArray(res) ? res : res?.items || [];
    return items.map(mapParent).filter((p) => p.id !== undefined && p.name);
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    return [];
  }
}