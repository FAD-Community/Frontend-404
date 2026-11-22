// بيانات الطلاب (استبدلها ببيانات الـ API)
// parents: أسماء أولياء الأمور المرتبطين (فاضية = "No parent linked")
export const STUDENTS = [
  { id: "stu-1", name: "Salma Ahmed",   code: "KD-1042", dob: "12 Mar 2022", className: "Sunflowers",  parents: ["Hoda Ahmed", "Khaled Ahmed"], avatar: "amber" },
  { id: "stu-2", name: "Malak Hassan",  code: "KD-1043", dob: "02 Jun 2022", className: "Sunflowers",  parents: ["Amal Hassan"],                avatar: "blue" },
  { id: "stu-3", name: "Ali Ahmed",     code: "KD-1051", dob: "20 Jan 2023", className: "Little Stars", parents: ["Hoda Ahmed"],                avatar: "blue" },
  { id: "stu-4", name: "Youssef Karim", code: "KD-1044", dob: "09 Sep 2022", className: "Sunflowers",  parents: [],                             avatar: "green" },
  { id: "stu-5", name: "Omar Tarek",    code: "KD-1060", dob: "15 Apr 2021", className: "Bumblebees",  parents: ["Nermeen Gad"],                avatar: "red" },
  { id: "stu-6", name: "Laila Mostafa", code: "KD-1061", dob: "30 Nov 2021", className: "Bumblebees",  parents: ["Mostafa Ali"],                avatar: "cyan" },
];

// تابات الفصول (All classes + أسماء الفصول)
export const STUDENT_TABS = ["All classes", "Sunflowers", "Little Stars", "Bumblebees", "Rainbows"];

// دليل أولياء الأمور المتاحين للربط (استبدله ببيانات الـ API / حسابات Parent)
export const PARENTS = [
  "Hoda Ahmed",
  "Khaled Ahmed",
  "Amal Hassan",
  "Nermeen Gad",
  "Mostafa Ali",
  "Walid Ezz",
  "Tamer Samy",
];