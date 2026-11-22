import { useEffect, useId, useMemo, useState } from "react";
import { XIcon, SearchIcon, CheckIcon, LinkIcon } from "./Icons";

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const parentsText = (n) => (n === 0 ? "no parent linked" : n === 1 ? "1 parent" : `${n} parents`);

// أول فتح بيظهر بنفس حالة التصميم (بحث "yous" + Youssef Karim مختار). بعد أول ربط بيفتح فاضي.
const DEMO_QUERY = "yous";

/**
 * Props:
 *  - parent: ولي الأمر اللي هنربطله طفل ({name, pronoun})
 *  - students: كل الطلاب المتاحين للربط (الموجودين + الإضافيين)
 *  - demo: true = يفتح بالقيم التجريبية اللي في التصميم
 *  - onClose(), onSubmit(student)
 *  استدعيه بـ {open && <LinkChildModal .../>} علشان البحث والاختيار يتصفّروا عند كل فتح
 */
export default function LinkChildModal({ parent, students, demo = false, onClose, onSubmit }) {
  const uid = useId();
  const [query, setQuery] = useState(demo ? DEMO_QUERY : "");

  const isLinked = (s) => (s.parents || []).includes(parent.name);

  const q = query.trim().toLowerCase();
  const matches = (s) => !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);

  const candidates = useMemo(
    () => students.filter((s) => !isLinked(s) && matches(s)),
    [students, parent, q] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // الأطفال المربوطين فعلاً (باهتين تحت): اللي بيطابقوا البحث + آخر طفل اتربط كتلميح
  const linkedShown = useMemo(() => {
    const linked = students.filter(isLinked);
    const last = linked[linked.length - 1];
    const shown = linked.filter(matches);
    if (last && !shown.includes(last)) shown.push(last);
    return shown;
  }, [students, parent, q]); // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedId, setSelectedId] = useState(() => (demo ? candidates[0]?.id ?? null : null));
  const selected = candidates.find((s) => s.id === selectedId) || null;

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
    if (selected) onSubmit?.(selected);
  };

  return (
    <div
      className="modal-overlay modal-overlay--lc"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <form
        className="lc-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ===== Header ===== */}
        <header className="lc-head">
          <h2 className="lc-title" id={`${uid}-title`}>Link a child to {parent.name}</h2>
          <p className="lc-sub">
            {parent.pronoun || "They"}’ll immediately see this child’s records and notifications.
          </p>
          <button type="button" className="na-close lc-close" onClick={onClose} aria-label="Close">
            <XIcon size={14} />
          </button>
        </header>

        {/* ===== Body ===== */}
        <div className="lc-body">
          <label className="lc-search">
            <SearchIcon size={14} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students by name or code"
              autoComplete="off"
              aria-label="Search students"
              autoFocus
              onFocus={(e) => {
                const el = e.currentTarget;
                requestAnimationFrame(() => el.setSelectionRange?.(el.value.length, el.value.length));
              }}
            />
          </label>

          <div className="lc-list" role="radiogroup" aria-label="Students">
            {candidates.map((s) => {
              const on = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`lc-row${on ? " lc-row--on" : ""}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <span className={`avatar avatar--${s.avatar} lc-avatar`}>{initialsOf(s.name)}</span>
                  <span className="lc-row__text">
                    <strong>{s.name}</strong>
                    <span>
                      {s.className} · #{s.code} · {parentsText((s.parents || []).length)}
                    </span>
                  </span>
                  {on && (
                    <span className="lc-row__check" aria-hidden="true">
                      <CheckIcon size={10} strokeWidth={2.8} />
                    </span>
                  )}
                </button>
              );
            })}

            {linkedShown.map((s) => (
              <div key={s.id} className="lc-row lc-row--linked" aria-disabled="true">
                <span className={`avatar avatar--${s.avatar} lc-avatar`}>{initialsOf(s.name)}</span>
                <span className="lc-row__text">
                  <strong>{s.name}</strong>
                  <span>Already linked</span>
                </span>
                <span className="lc-pill">Linked</span>
              </div>
            ))}

            {candidates.length === 0 && linkedShown.length === 0 && (
              <p className="lc-empty">No students found.</p>
            )}
          </div>
        </div>

        {/* ===== Footer ===== */}
        <footer className="lc-foot">
          <button type="button" className="btn-outline lc-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary lc-btn" disabled={!selected}>
            <LinkIcon size={12} />
            Link child
          </button>
        </footer>
      </form>
    </div>
  );
}