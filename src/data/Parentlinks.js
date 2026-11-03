// حسابات أولياء الأمور (استبدلها ببيانات الـ API / حسابات Parent)
// initials: (اختياري) لو عاوز حروف الأفاتار تختلف عن أول حرفين من الاسم الكامل
export const PARENT_ACCOUNTS = [
  { id: "par-1", name: "Hoda Ahmed", pronoun: "She",   username: "hoda.ahmed", email: "hoda@mail.com",   status: "Active",  avatar: "red" },
  { id: "par-2", name: "Khaled Ahmed", pronoun: "He", initials: "KH", username: "khaled.a",   email: "khaled@mail.com", status: "Active",  avatar: "green" },
  { id: "par-3", name: "Tamer Samy", pronoun: "He",   username: "tamer.s",    email: "tamer@mail.com",  status: "Invited", avatar: "green" },
  { id: "par-4", name: "Nermeen Gad", pronoun: "She",  username: "nermeen.g",  email: "nermeen@mail.com", status: "Active", avatar: "amber" },
  { id: "par-5", name: "Amal Hassan", pronoun: "She",  username: "amal.h",     email: "amal@mail.com",   status: "Active",  avatar: "blue" },
  { id: "par-6", name: "Walid Ezz", pronoun: "He",    username: "walid.e",    email: "walid@mail.com",  status: "Active",  avatar: "cyan" },
];

// حسابات أولياء أمور مش ظاهرة في القايمة لسه مش مربوطة بأي طالب (بتتحسب مع شارة "unlinked")
export const OTHER_UNLINKED = 2;

// بيانات "Linked by …" للروابط الموجودة (المفتاح: id الطالب | اسم ولي الأمر)
export const LINK_META = {
  "stu-1|Hoda Ahmed": "Linked by Mona · 1 Oct",
  "stu-3|Hoda Ahmed": "Linked by Karim · 3 Oct",
  "stu-1|Khaled Ahmed": "Linked by Mona · 1 Oct",
  "stu-2|Amal Hassan": "Linked by Mona · 2 Oct",
  "stu-5|Nermeen Gad": "Linked by Karim · 8 Oct",
};

// طلاب موجودين في النظام بس مش ظاهرين في قايمة صفحة Students (بيظهروا في نافذة Link a child)
// لما تربط واحد منهم بيتضاف لقايمة الطلاب
export const EXTRA_STUDENTS = [
  {
    id: "stu-x1",
    name: "Youssef Samir",
    code: "KD-1065",
    dob: "21 Aug 2021",
    className: "Bumblebees",
    parents: ["Amal Hassan", "Nermeen Gad"],
    avatar: "cyan",
  },
];