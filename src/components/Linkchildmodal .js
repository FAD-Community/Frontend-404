import { useEffect, useId, useState } from "react";
import { XIcon, SearchIcon, CheckIcon, LinkIcon, ChevronLeftIcon, ChevronRightIcon } from "./Icons";

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const parentsText = (n) => (n === 0 ? "no parent linked" : n === 1 ? "1 parent" : `${n} parents`);

/**
 * Props:
 *  - parent: parent account being linked
 *  - candidates, page, total, loading, error: current API result
 *  - onSearch(query), onPageChange(page), onSubmit(candidate, relationship)
 */
export default function LinkChildModal({
  parent,
  candidates = [],
  page = 1,
  pageSize = 8,
  total = 0,
  loading = false,
  error = "",
  onSearch,
  onPageChange,
  onClose,
  onSubmit,
}) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [relationship, setRelationship] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const selected = candidates.find((student) => student.id === selectedId) || null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    const timer = setTimeout(() => onSearch?.(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query, onSearch]);

  useEffect(() => {
    setSelectedId(null);
  }, [candidates]);

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
    if (selected && relationship) onSubmit?.(selected, relationship);
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
            {parent.name} will immediately see this child’s records and notifications.
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
              maxLength={100}
              onChange={(e) => {
                setQuery(e.target.value);
                onPageChange?.(1);
              }}
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

          <label className="lc-relationship">
            Relationship
            <select value={relationship} onChange={(e) => setRelationship(e.target.value)} required>
              <option value="">Select relationship</option>
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Guardian">Guardian</option>
              <option value="Other">Other</option>
            </select>
          </label>

          {error && <p className="lc-error" role="alert">{error}</p>}

          <div className="lc-list" role="radiogroup" aria-label="Students">
            {candidates.map((student) => {
              const on = student.id === selectedId;
              return (
                <button
                  key={student.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  disabled={student.alreadyLinked}
                  className={`lc-row${on ? " lc-row--on" : ""}${student.alreadyLinked ? " lc-row--linked" : ""}`}
                  onClick={() => setSelectedId(student.id)}
                >
                  <span className="avatar avatar--cyan lc-avatar">{initialsOf(student.fullName)}</span>
                  <span className="lc-row__text">
                    <strong>{student.fullName}</strong>
                    <span>
                      {student.class?.name || "—"} · #{student.studentCode} · {parentsText(student.parentCount)}
                    </span>
                  </span>
                  {student.alreadyLinked && <span className="lc-pill">Already linked</span>}
                  {on && (
                    <span className="lc-row__check" aria-hidden="true">
                      <CheckIcon size={10} strokeWidth={2.8} />
                    </span>
                  )}
                </button>
              );
            })}

            {loading ? (
              <p className="lc-empty">Loading students...</p>
            ) : candidates.length === 0 && !error ? (
              <p className="lc-empty">No students found.</p>
            ) : null}
          </div>
          {totalPages > 1 && (
            <div className="lc-pager">
              <button type="button" aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => onPageChange?.(page - 1)}>
                <ChevronLeftIcon size={13} />
              </button>
              <span>{page} / {totalPages}</span>
              <button type="button" aria-label="Next page" disabled={page >= totalPages || loading} onClick={() => onPageChange?.(page + 1)}>
                <ChevronRightIcon size={13} />
              </button>
            </div>
          )}
        </div>

        {/* ===== Footer ===== */}
        <footer className="lc-foot">
          <button type="button" className="btn-outline lc-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary lc-btn" disabled={!selected || !relationship || loading}>
            <LinkIcon size={12} />
            Link child
          </button>
        </footer>
      </form>
    </div>
  );
}