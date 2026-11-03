// بيانات الفصول (استبدلها ببيانات الـ API)
// teacher: null  = الفصل من غير مدرّس (بيظهر بإطار برتقالي وزر Assign)
// teacher.id: id حساب المدرّس (لو مش موجود = بيانات عرض قديمة بتتربط بالاسم)
export const CLASS_CARDS = [
  {
    id: "sunflowers",
    name: "Sunflowers",
    level: "KG-1",
    students: 18,
    teacher: { id: "acc-3", name: "Mariam Fathy", avatar: "blue" },
  },
  {
    id: "little-stars",
    name: "Little Stars",
    level: "Pre-K",
    students: 14,
    teacher: { name: "Rana Adel", avatar: "amber" },
  },
  {
    id: "bumblebees",
    name: "Bumblebees",
    level: "KG-2",
    students: 16,
    teacher: { id: "acc-8", name: "Hany Samir", avatar: "green" },
  },
  {
    id: "rainbows",
    name: "Rainbows",
    level: "Nursery",
    students: 12,
    teacher: null,
  },
];