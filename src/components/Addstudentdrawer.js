import { useEffect, useId, useRef, useState } from "react";
import { nextStudentCode, toId } from "../api/students";
import { searchParents } from "../api/Parents";
import {
  XIcon,
  CalendarIcon,
  SearchIcon,
  ChevronDownIcon,
  AlertTriangleIcon,
} from "./Icons";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const GENDERS = ["Male", "Female"];

/** "2022-02-04" -> "04 Feb 2022" */
export function formatDob(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return `${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}

const EMPTY_FORM = { fullName: "", dob: "", gender: "", classId: "", parents: [] };

/**
 * Props:
 *  - classes: [{id, name, level}] (من الـ API)
 *  - onClose()
 *  - onSubmit({fullName, dateOfBirth, gender, classId, parentIds}): async — لو رمى خطأ بيتعرض جوه الدرج
 *  استدعيه بـ {open && <AddStudentDrawer .../>} علشان الفورم يتصفّر عند كل فتح
 */
export default function AddStudentDrawer({ classes = [], onClose, onSubmit }) {
  const uid = useId();
  const [form, setForm] = useState(EMPTY_FORM);
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState("loading"); // loading | ready | failed
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const searchRef = useRef(null);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setFieldErrors((errs) => ({ ...errs, [key === "dob" ? "dateOfBirth" : key]: undefined }));
  };

  const today = new Date().toISOString().slice(0, 10);
  const bad = {
    fullName: (submitted && form.fullName.trim().length < 2) || !!fieldErrors.fullName,
    dob: (submitted && (!form.dob || form.dob > today)) || !!fieldErrors.dateOfBirth,
    gender: (submitted && !form.gender) || !!fieldErrors.gender,
    classId: (submitted && !form.classId) || !!fieldErrors.classId,
  };

  /* ----- الكود المقترح من الـ API ----- */
  useEffect(() => {
    const controller = new AbortController();
    nextStudentCode({ signal: controller.signal })
      .then((c) => {
        setCode(c);
        setCodeState(c ? "ready" : "failed");
      })
      .catch((err) => {
        if (err?.name !== "AbortError") setCodeState("failed");
      });
    return () => controller.abort();
  }, []);

  /* ----- البحث عن أولياء الأمور (debounce) ----- */
  useEffect(() => {
    if (!suggestOpen) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchParents(query.trim(), { signal: controller.signal })
        .then(setResults)
        .catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, suggestOpen]);

  const suggestions = results.filter((p) => !form.parents.some((x) => String(x.id) === String(p.id)));

  const addParent = (parent) => {
    setForm((f) =>
      f.parents.some((x) => String(x.id) === String(parent.id)) ? f : { ...f, parents: [...f.parents, parent] }
    );
    setQuery("");
    setSuggestOpen(false);
  };

  const removeParent = (id) =>
    setForm((f) => ({ ...f, parents: f.parents.filter((p) => String(p.id) !== String(id)) }));

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !submitting && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, submitting]);

  useEffect(() => {
    if (!suggestOpen) return undefined;
    const onDown = (e) => searchRef.current && !searchRef.current.contains(e.target) && setSuggestOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [suggestOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setServerError("");
    if (form.fullName.trim().length < 2 || !form.dob || form.dob > today || !form.gender || !form.classId) return;

    setSubmitting(true);
    try {
      await onSubmit?.({
        fullName: form.fullName.trim(),
        dateOfBirth: form.dob,
        gender: form.gender,
        classId: toId(form.classId),
        parentIds: form.parents.map((p) => p.id),
      });
    } catch (err) {
      setFieldErrors(err?.fieldErrors || {});
      setServerError(err?.message || "Couldn’t add the student. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const FieldError = ({ name }) =>
    fieldErrors[name] ? (
      <p className="na-error as-help" role="alert">
        <AlertTriangleIcon size={11} /> {fieldErrors[name]}
      </p>
    ) : null;

  return (
    <div
      className="drawer-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose?.()}
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
          <button type="button" className="na-close drawer__close" onClick={onClose} aria-label="Close" disabled={submitting}>
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
              autoFocus
            />
            <FieldError name="fullName" />
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
              <FieldError name="dateOfBirth" />
            </div>

            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-code`}>Student code</label>
              <input
                id={`${uid}-code`}
                className="na-input as-code"
                value={codeState === "loading" ? "" : code || "Auto"}
                placeholder={codeState === "loading" ? "…" : ""}
                readOnly
                aria-readonly="true"
              />
              <p className="as-help">
                {codeState === "failed" ? "Assigned by the server" : "Unique · auto-suggested"}
              </p>
            </div>
          </div>

          <div className="na-field">
            <label className="na-label" htmlFor={`${uid}-class`}>Class</label>
            <div className="na-select as-select">
              <select
                id={`${uid}-class`}
                className={bad.classId ? "is-invalid" : ""}
                value={form.classId}
                onChange={set("classId")}
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.level ? ` · ${c.level}` : ""}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={14} className="na-select__chev" />
            </div>
            <FieldError name="classId" />
          </div>

          <div className="na-field">
            <span className="na-label" id={`${uid}-gender`}>Gender</span>
            <div className={`as-seg${bad.gender ? " is-invalid" : ""}`} role="radiogroup" aria-labelledby={`${uid}-gender`}>
              {GENDERS.map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={form.gender === g}
                  className={`as-seg__btn${form.gender === g ? " is-on" : ""}`}
                  onClick={() => {
                    setForm((f) => ({ ...f, gender: g }));
                    setFieldErrors((errs) => ({ ...errs, gender: undefined }));
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
            <FieldError name="gender" />
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
                  suggestions.map((p) => (
                    <li key={p.id}>
                      <button type="button"  onClick={() => addParent(p)}>
                        {p.name}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}

            {form.parents.length > 0 && (
              <div className="as-chips">
                {form.parents.map((p) => (
                  <span className="as-chip" key={p.id}>
                    {p.name}
                    <button type="button" onClick={() => removeParent(p.id)} aria-label={`Remove ${p.name}`}>
                      <XIcon size={9} strokeWidth={2.6} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {serverError && (
            <p className="na-error as-server-error" role="alert">
              <AlertTriangleIcon size={12} /> {serverError}
            </p>
          )}
        </div>

        {/* ===== Footer ===== */}
        <footer className="drawer__foot">
          <button type="button" className="btn-outline drawer__btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary drawer__btn" disabled={submitting}>
            {submitting ? "Adding…" : "Add student"}
          </button>
        </footer>
      </form>
    </div>
  );
}