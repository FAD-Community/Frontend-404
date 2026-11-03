import { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import AssignTeacherDrawer from "../components/Assignteacherdrawer";
import useAccounts from "./Useaccounts";
import { CLASS_CARDS } from "../data/Classes";
import { getInitials } from "../data/Accounts";
import { PlusIcon, CapIcon, KebabIcon, BabyIcon, UserIcon } from "../components/Icons";

const STORAGE_KEY = "kidoo.classes.v1";

function loadClasses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return CLASS_CARDS;
}

/**
 * صفحة الفصول.
 * التعيين (Assign / Change) بيتحفظ في localStorage.
 * الأزرار التانية (New class / View students / القايمة) متوصّلة بـ props اختيارية.
 */
export default function Classes({ onNewClass, onViewStudents, onClassMenu }) {
  const { accounts } = useAccounts();

  const [classes, setClasses] = useState(loadClasses);
  const [assignId, setAssignId] = useState(null); // الفصل اللي بنعيّنله مدرّس
  const assignTarget = classes.find((c) => c.id === assignId);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    } catch {
      /* ignore */
    }
  }, [classes]);

  // المدرّسين المتاحين: حسابات Teacher مش موقوفة
  const teachers = accounts.filter((a) => a.role === "Teacher" && a.status !== "Inactive");

  /** تعيين مدرّس لفصل: بيسيب فصله القديم، ومدرّس الفصل الحالي بيتحرر */
  function assignTeacher(classId, teacher) {
    setClasses((list) =>
      list.map((c) => {
        if (c.id === classId) {
          return { ...c, teacher: { id: teacher.id, name: teacher.name, avatar: teacher.avatar } };
        }
        if (c.teacher && (c.teacher.id === teacher.id || c.teacher.name === teacher.name)) {
          return { ...c, teacher: null };
        }
        return c;
      })
    );
    setAssignId(null);
  }

  return (
    <>
      <Topbar
        title="Classes"
        subtitle="Each class has exactly one teacher at a time (FR-15)."
        actions={
          <button type="button" className="btn-primary" onClick={() => onNewClass?.()}>
            <PlusIcon size={13} />
            New class
          </button>
        }
      />

      <div className="content">
        <section className="cls-grid" aria-label="Classes">
          {classes.map((c) => (
            <article key={c.id} className={`cls-card${c.teacher ? "" : " cls-card--warn"}`}>
              {/* ===== Header ===== */}
              <header className="cls-card__head">
                <span className="cls-card__icon">
                  <CapIcon size={16} />
                </span>

                <div className="cls-card__titles">
                  <h2 className="cls-card__name">{c.name}</h2>
                  <p className="cls-card__level">{c.level}</p>
                </div>

                <button
                  type="button"
                  className="cls-card__menu"
                  aria-label={`Actions for ${c.name}`}
                  onClick={() => onClassMenu?.(c)}
                >
                  <KebabIcon size={16} />
                </button>
              </header>

              {/* ===== Teacher ===== */}
              <div className="cls-card__teacher">
                {c.teacher ? (
                  <span className={`avatar avatar--${c.teacher.avatar} cls-avatar`}>
                    {getInitials(c.teacher.name)}
                  </span>
                ) : (
                  <span className="cls-avatar cls-avatar--empty">
                    <UserIcon size={12} />
                  </span>
                )}

                <div className="cls-card__who">
                  <p className="cls-card__label">Teacher</p>
                  <p className={`cls-card__tname${c.teacher ? "" : " cls-card__tname--warn"}`}>
                    {c.teacher ? c.teacher.name : "No teacher assigned"}
                  </p>
                </div>

                {c.teacher ? (
                  <button
                    type="button"
                    className="btn-outline cls-card__btn"
                    onClick={() => setAssignId(c.id)}
                  >
                    Change
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary cls-card__btn"
                    onClick={() => setAssignId(c.id)}
                  >
                    Assign
                  </button>
                )}
              </div>

              {/* ===== Footer ===== */}
              <footer className="cls-card__foot">
                <span className="cls-card__count">
                  <BabyIcon size={12} />
                  {c.students} students
                </span>
                <button type="button" className="cls-card__link" onClick={() => onViewStudents?.(c)}>
                  View students
                </button>
              </footer>
            </article>
          ))}
        </section>
      </div>

      {/* ===== Assign / Change teacher ===== */}
      {assignTarget && (
        <AssignTeacherDrawer
          key={assignTarget.id}
          classCard={assignTarget}
          classes={classes}
          teachers={teachers}
          onClose={() => setAssignId(null)}
          onAssign={assignTeacher}
        />
      )}
    </>
  );
}