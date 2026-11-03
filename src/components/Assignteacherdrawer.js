import { useEffect, useId, useMemo, useState } from "react";
import { XIcon, SearchIcon, CheckIcon } from "./Icons";
import { getInitials } from "../data/Accounts";


export default function AssignTeacherDrawer({ classCard, classes, teachers, onClose, onAssign }) {
  const uid = useId();
  const [query, setQuery] = useState("");

  // الفصل الحالي لكل مدرّس (بالـ id)
  const classOf = (t) => classes.find((c) => c.teacher?.id === t.id) || null;

  const free = teachers.filter((t) => !classOf(t));
  const assigned = teachers.filter((t) => classOf(t));

  // مدرّس الفصل الحالي (بالـ id، أو بالاسم لو البيانات قديمة من غير id)
  const currentId = classCard.teacher
    ? classCard.teacher.id ?? teachers.find((t) => t.name === classCard.teacher.name)?.id ?? null
    : null;

  // الاختيار المبدئي: مدرّس الفصل الحالي (Change) أو أول مدرّس من غير فصل (Assign)
  const [selectedId, setSelectedId] = useState(currentId ?? free[0]?.id ?? null);

  const selected = teachers.find((t) => t.id === selectedId) || null;
  const unchanged = !!selected && currentId === selected.id;

  const q = query.trim().toLowerCase();
  const matches = (t) => !q || t.name.toLowerCase().includes(q) || t.username.toLowerCase().includes(q);
  const freeShown = free.filter(matches);
  const assignedShown = assigned.filter(matches);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selected || unchanged) return;
    onAssign?.(classCard.id, selected);
  };

  const renderRow = (t) => {
    const cls = classOf(t);
    const isSelected = t.id === selectedId;
    const leaving = cls && cls.id !== classCard.id; // هيسيب فصله الحالي لو اتعيّن هنا

    return (
      <button
        key={t.id}
        type="button"
        role="radio"
        aria-checked={isSelected}
        className={`ap-row${isSelected ? " ap-row--on" : ""}`}
        onClick={() => setSelectedId(t.id)}
      >
        <span className={`avatar avatar--${t.avatar} ap-avatar`}>{getInitials(t.name)}</span>

        <span className="ap-row__text">
          <strong>{t.name}</strong>
          <span>{cls ? cls.name : t.username}</span>
        </span>

        {isSelected ? (
          <span className="ap-row__check" aria-hidden="true">
            <CheckIcon size={10} strokeWidth={2.8} />
          </span>
        ) : (
          leaving && <span className="ap-pill">Will leave {cls.name}</span>
        )}
      </button>
    );
  };

  return (
    <div
      className="drawer-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <form
        className="drawer ap"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ===== Header ===== */}
        <header className="ap-head">
          <h2 className="na-title" id={`${uid}-title`}>
            {classCard.teacher ? "Change teacher" : "Assign teacher"} · {classCard.name}
          </h2>
          <p className="na-sub">Changing the teacher keeps all existing records (FR-18).</p>
          <button type="button" className="na-close drawer__close" onClick={onClose} aria-label="Close">
            <XIcon size={14} />
          </button>
        </header>

        {/* ===== Body ===== */}
        <div className="drawer__body ap-body">
          <label className="ap-search">
            <SearchIcon size={14} />
            <input
              type="search"
              placeholder="Search teachers"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              aria-label="Search teachers"
            />
          </label>

          <div role="radiogroup" aria-label="Teachers">
            {freeShown.length > 0 && (
              <>
                <p className="ap-label">Without a class</p>
                <div className="ap-list">{freeShown.map(renderRow)}</div>
              </>
            )}

            {assignedShown.length > 0 && (
              <>
                <p className="ap-label">Currently assigned</p>
                <div className="ap-list">{assignedShown.map(renderRow)}</div>
              </>
            )}

            {freeShown.length === 0 && assignedShown.length === 0 && (
              <p className="ap-empty">No teachers found.</p>
            )}
          </div>
        </div>

        {/* ===== Footer ===== */}
        <footer className="drawer__foot">
          <button type="button" className="btn-outline drawer__btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary drawer__btn" disabled={!selected || unchanged}>
            {selected ? `Assign ${selected.name.split(" ")[0]}` : "Assign"}
          </button>
        </footer>
      </form>
    </div>
  );
}