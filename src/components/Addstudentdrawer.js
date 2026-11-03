import { useEffect, useId, useMemo, useRef, useState } from "react";
import { CLASS_CARDS } from "../data/Classes";
import { PARENTS } from "../data/Students";
import {
  XIcon,
  CalendarIcon,
  SearchIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
} from "./Icons";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2022-02-04" -> "04 Feb 2022" */
export function formatDob(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}

/** الكود المقترح: أعلى رقم KD-#### موجود + 1 */
export function suggestCode(students) {
  const max = students.reduce((n, s) => {
    const m = /(\d+)\s*$/.exec(s.code || "");
    return m ? Math.max(n, Number(m[1])) : n;
  }, 1000);
  return `KD-${max + 1}`;
}

// قيم أول فتح = نفس التصميم. بعد أول طالب بتضيفه الفورم بيتفتح فاضي.
const DEMO_FORM = {
  fullName: "Jana Walid",
  dob: "2022-02-04",
  className: "Sunflowers",
  parents: ["Walid Ezz"],
};
const EMPTY_FORM = { fullName: "", dob: "", className: "", parents: [] };

/**
 * Props:
 *  - students: الطلاب الحاليين (لاقتراح الكود وفحص التكرار)
 *  - demo: true = يفتح بالقيم التجريبية اللي في التصميم
 *  - classes: [{name, level}] (الافتراضي من data/Classes)
 *  - parentsDirectory: أسماء أولياء الأمور المتاحين للربط
 *  - onClose(), onSubmit({name, dob, code, className, parents})
 *  استدعيه بـ {open && <AddStudentDrawer .../>} علشان الفورم يتصفّر عند كل فتح
 */
export default function AddStudentDrawer({
  students = [],
  demo = false,
  classes = CLASS_CARDS,
  parentsDirectory = PARENTS,
  onClose,
  onSubmit,
}) {
  const uid = useId();
  const [form, setForm] = useState(() => ({
    ...(demo ? DEMO_FORM : EMPTY_FORM),
    code: suggestCode(students),
  }));
  const [submitted, setSubmitted] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchRef = useRef(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const code = form.code.trim();
  const codeTaken = students.some((s) => s.code.toLowerCase() === code.toLowerCase());
  const today = new Date().toISOString().slice(0, 10);
  const bad = {
    fullName: submitted && form.fullName.trim().length < 2,
    dob: submitted && (!form.dob || form.dob > today),
    code: submitted && !code,
    className: submitted && !form.className,
  };

  /* ----- ربط أولياء الأمور ----- */
  const q = query.trim().toLowerCase();
  const suggestions = useMemo(
    () =>
      parentsDirectory
        .filter((n) => !form.parents.includes(n) && (!q || n.toLowerCase().includes(q)))
        .slice(0, 6),
    [parentsDirectory, form.parents, q]
  );

  const addParent = (name) => {
    setForm((f) => (f.parents.includes(name) ? f : { ...f, parents: [...f.parents, name] }));
    setQuery("");
    setSuggestOpen(false);
  };

  const removeParent = (name) =>
    setForm((f) => ({ ...f, parents: f.parents.filter((n) => n !== name) }));

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

  // قفل قايمة الاقتراحات بالضغط برا
  useEffect(() => {
    if (!suggestOpen) return;
    const onDown = (e) => searchRef.current && !searchRef.current.contains(e.target) && setSuggestOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [suggestOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (
      form.fullName.trim().length < 2 ||
      !form.dob ||
      form.dob > today ||
      !code ||
      codeTaken ||
      !form.className
    )
      return;

    onSubmit?.({
      name: form.fullName.trim(),
      dob: formatDob(form.dob),
      code,
      className: form.className,
      parents: form.parents,
    });
  };

  return (
    <div
      className="drawer-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <form
        className="drawer as"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ===== Header ===== */}
        <header className="as-head">
          <h2 className="na-title" id={`${uid}-title`}>Add student</h2>
          <p className="na-sub">All fields are required (FR-16).</p>
          <button type="button" className="na-close drawer__close" onClick={onClose} aria-label="Close">
            <XIcon size={14} />
          </button>
        </header>

        {/* ===== Body ===== */}
        <div className="drawer__body as-body">
          <div className="na-field">
            <label className="na-label" htmlFor={`${uid}-name`}>Full name</label>
            <input
              id={`${uid}-name`}
              className={`na-input${bad.fullName ? " is-invalid" : ""}`}
              value={form.fullName}
              onChange={set("fullName")}
              placeholder="e.g. Jana Walid"
              autoComplete="off"
            />
          </div>

          <div className="as-row">
            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-dob`}>Date of birth</label>
              <div className={`as-date${bad.dob ? " is-invalid" : ""}`}>
                <CalendarIcon size={13} />
                <span className={form.dob ? "" : "as-date__ph"}>
                  {form.dob ? formatDob(form.dob) : "Select date"}
                </span>
                <input
                  id={`${uid}-dob`}
                  type="date"
                  value={form.dob}
                  max={today}
                  onChange={set("dob")}
                  onClick={(e) => e.currentTarget.showPicker?.()}
                  aria-label="Date of birth"
                />
              </div>
            </div>

            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-code`}>Student code</label>
              <input
                id={`${uid}-code`}
                className={`na-input${bad.code || (submitted && codeTaken) ? " is-invalid" : ""}`}
                value={form.code}
                onChange={set("code")}
                autoComplete="off"
              />
              {submitted && codeTaken ? (
                <p className="na-error as-help" role="alert">
                  <AlertTriangleIcon size={11} /> Code already in use
                </p>
              ) : (
                <p className="as-help">Unique · auto-suggested</p>
              )}
            </div>
          </div>

          <div className="na-field">
            <label className="na-label" htmlFor={`${uid}-class`}>Class</label>
            <div className="na-select as-select">
              <select
                id={`${uid}-class`}
                className={bad.className ? "is-invalid" : ""}
                value={form.className}
                onChange={set("className")}
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} · {c.level}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={14} className="na-select__chev" />
            </div>
          </div>

          <div className="na-field as-parents" ref={searchRef}>
            <label className="na-label" htmlFor={`${uid}-parent`}>
              Link parents <span>(optional — can be done later)</span>
            </label>

            <div className="as-search">
              <SearchIcon size={13} />
              <input
                id={`${uid}-parent`}
                type="search"
                value={query}
                placeholder="Search parent accounts"
                autoComplete="off"
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSuggestOpen(true);
                }}
                onFocus={() => setSuggestOpen(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault(); // Enter يضيف أول نتيجة بدل ما يبعت الفورم
                    if (suggestions[0]) addParent(suggestions[0]);
                  }
                }}
              />
            </div>

            {suggestOpen && (
              <ul className="as-suggest" role="listbox">
                {suggestions.length === 0 ? (
                  <li className="as-suggest__empty">No parent accounts found</li>
                ) : (
                  suggestions.map((n) => (
                    <li key={n}>
                      <button type="button" role="option" onClick={() => addParent(n)}>
                        {n}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}

            {form.parents.length > 0 && (
              <div className="as-chips">
                {form.parents.map((n) => (
                  <span className="as-chip" key={n}>
                    {n}
                    <button type="button" onClick={() => removeParent(n)} aria-label={`Remove ${n}`}>
                      <XIcon size={9} strokeWidth={2.6} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ===== Footer ===== */}
        <footer className="drawer__foot">
          <button type="button" className="btn-outline drawer__btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary drawer__btn">
            Add student
          </button>
        </footer>
      </form>
    </div>
  );
}