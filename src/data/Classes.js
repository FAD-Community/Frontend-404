import { getAvatarTone } from "./Accounts";

export const CLASS_CARDS = [];

export const CLASS_LEVELS = [
  { value: "Nursery", label: "Nursery" },
  { value: "PreK", label: "Pre-K" },
  { value: "KG1", label: "KG-1" },
  { value: "KG2", label: "KG-2" },
];

export function formatClassLevel(level = "") {
  const found = CLASS_LEVELS.find((l) => l.value === level);
  return found ? found.label : level;
}

export function toApiClassLevel(level = "") {
  const found = CLASS_LEVELS.find(
    (l) => l.label === level || l.value === level
  );
  return found ? found.value : level;
}

export function mapClassFromApi(raw) {
  if (!raw) return null;

  return {
    id: raw.id,
    name: raw.name || "",
    level: formatClassLevel(raw.level),
    rawLevel: raw.level || "",
    students: raw.studentCount ?? 0,
    studentCount: raw.studentCount ?? 0,
    status: raw.status || "Active",
    teacher: raw.teacher
      ? {
          id: raw.teacher.id,
          name: raw.teacher.fullName || raw.teacher.name || "",
          fullName: raw.teacher.fullName || raw.teacher.name || "",
          avatar: getAvatarTone(raw.teacher),
        }
      : null,
  };
}

export function mapTeacherOptionFromApi(raw) {
  if (!raw) return null;
  const assignedClasses = Array.isArray(raw.classes) ? raw.classes : [];

  return {
    id: raw.id,
    name: raw.fullName || raw.name || "",
    fullName: raw.fullName || raw.name || "",
    username: raw.username || "",
    avatar: getAvatarTone(raw),
    classes: assignedClasses,
    classId: assignedClasses[0]?.id ?? "",
    info: assignedClasses[0]?.name || "",
  };
}