import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import AddStudentDrawer from "../components/Addstudentdrawer";
import TransferStudentModal from "../components/Transferstudentmodal ";
import { STUDENTS, STUDENT_TABS } from "../data/Students";
import { PlusIcon, KebabIcon } from "../components/Icons";

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const STORAGE_KEY = "kidoo.students.v1";
const TONES = ["amber", "blue", "green", "red", "cyan"];

function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return STUDENTS;
}

/**
 * صفحة الطلاب.
 * إضافة طالب (Add student) بتتحفظ في localStorage وبتظهر في الجدول.
 * النقط الثلاثة بتفتح نافذة نقل الطالب لفصل تاني (Transfer student).
 */
export default function Students({ onStudentMenu }) {
  const [students, setStudents] = useState(loadStudents);
  const [tab, setTab] = useState("All classes");
  const [addOpen, setAddOpen] = useState(false);
  const [transferId, setTransferId] = useState(null); // الطالب اللي بيتنقل
  const transferring = students.find((s) => s.id === transferId);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch {
      /* ignore */
    }
  }, [students]);

  // أول فتح (لسه مفيش طلاب مضافين) بيظهر الفورم بالقيم التجريبية اللي في التصميم
  const demo = students.every((s) => STUDENTS.some((seed) => seed.id === s.id));

  /** نقل طالب لفصل تاني: السجلات القديمة بتفضل باسم الفصل القديم، والنقل بيتسجل في transfers */
  const transferStudent = (id, { className, effective, from }) => {
    setStudents((list) =>
      list.map((s) =>
        s.id === id
          ? {
              ...s,
              className,
              transfers: [
                ...(s.transfers || []),
                { from, to: className, effective, at: new Date().toISOString() },
              ],
            }
          : s
      )
    );
    setTransferId(null);
  };

  const addStudent = (data) => {
    const tone = TONES[[...data.name].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];
    setStudents((list) => [...list, { id: `stu-${Date.now()}`, avatar: tone, ...data }]);
    setTab("All classes");
    setAddOpen(false);
  };

  const rows = useMemo(
    () => (tab === "All classes" ? students : students.filter((s) => s.className === tab)),
    [students, tab]
  );

  return (
    <>
      <Topbar
        title="Students"
        subtitle="Student records — one class at a time."
        actions={
          <button type="button" className="btn-primary" onClick={() => setAddOpen(true)}>
            <PlusIcon size={13} />
            Add student
          </button>
        }
      />

      <div className="content">
        <section className="panel acc-card">
          {/* ===== Tabs ===== */}
          <div className="acc-toolbar stu-toolbar">
            <div className="acc-tabs stu-tabs" role="tablist" aria-label="Classes">
              {STUDENT_TABS.map((name) => (
                <button
                  key={name}
                  type="button"
                  role="tab"
                  aria-selected={tab === name}
                  className={`acc-tab${tab === name ? " acc-tab--active" : ""}`}
                  onClick={() => setTab(name)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* ===== Table ===== */}
          <div className="acc-scroll">
            <table className="acc-table stu-table">
              <colgroup>
                <col style={{ width: "26.9%" }} />
                <col style={{ width: "13.8%" }} />
                <col style={{ width: "17.4%" }} />
                <col style={{ width: "13.8%" }} />
                <col style={{ width: "19.9%" }} />
                <col style={{ width: "8.2%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Code</th>
                  <th>Date of birth</th>
                  <th>Class</th>
                  <th>Linked parents</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="stu-name">
                        <span className={`avatar avatar--${s.avatar}`}>{initialsOf(s.name)}</span>
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="stu-code">{s.code}</td>
                    <td className="stu-dob">{s.dob}</td>
                    <td>
                      <span className="tag tag--cyan">{s.className}</span>
                    </td>
                    <td>
                      {s.parents.length > 0 ? (
                        <span className="stu-parents">{s.parents.join(", ")}</span>
                      ) : (
                        <span className="stu-parents stu-parents--none">No parent linked</span>
                      )}
                    </td>
                    <td className="acc-actions stu-actions">
                      <button
                        type="button"
                        className="acc-kebab"
                        aria-label={`Actions for ${s.name}`}
                        onClick={() => {
                          setTransferId(s.id);
                          onStudentMenu?.(s);
                        }}
                      >
                        <KebabIcon size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="stu-empty">
                      No students in this class yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ===== Transfer student ===== */}
      {transferring && (
        <TransferStudentModal
          key={transferring.id}
          student={transferring}
          onClose={() => setTransferId(null)}
          onSubmit={(data) => transferStudent(transferring.id, data)}
        />
      )}

      {/* ===== Add student ===== */}
      {addOpen && (
        <AddStudentDrawer
          students={students}
          demo={demo}
          onClose={() => setAddOpen(false)}
          onSubmit={addStudent}
        />
      )}
    </>
  );
}