import { useCallback, useEffect, useId, useState } from "react";
import { XIcon, SearchIcon, CheckIcon } from "./Icons";
import { getInitials } from "../data/Accounts";
import { getClassTeacherOptions } from "../api/Classes";
import { mapTeacherOptionFromApi } from "../data/Classes";

export default function AssignTeacherDrawer({
  classCard,
  classes = [],
  onClose,
  onAssign,
}) {
  const uid = useId();
  const [query, setQuery] = useState("");
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [saving, setSaving] = useState(false);

  const currentId = classCard.teacher?.id ?? null;
  const [selectedId, setSelectedId] = useState(currentId);

  const loadTeachers = useCallback(
    async (signal) => {
      setLoading(true);
      setLoadError("");
      try {
        const list = await getClassTeacherOptions({ signal });
        const mapped = (Array.isArray(list) ? list : []).map(
          mapTeacherOptionFromApi
        );
        setTeachers(mapped);

        if (currentId == null) {
          const firstFree = mapped.find(
            (t) =>
              (!t.classes || t.classes.length === 0) &&
              !classes.some((c) => c.teacher?.id === t.id)
          );
          setSelectedId(firstFree?.id ?? null);
        }
      } catch (err) {
        if (err?.name === "AbortError") return;
        setLoadError(err.message || "Failed to load teachers.");
        setTeachers([]);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [currentId, classes]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadTeachers(controller.signal);
    return () => controller.abort();
  }, [loadTeachers]);

  const classOf = (t) => {
    if (Array.isArray(t.classes) && t.classes.length > 0) {
      return t.classes[0];
    }
    return classes.find((c) => c.teacher?.id === t.id) || null;
  };

  const free = teachers.filter((t) => !classOf(t));
  const assigned = teachers.filter((t) => classOf(t));

  const selected = teachers.find((t) => t.id === selectedId) || null;
  const unchanged = !!selected && currentId === selected.id;

  const q = query.trim().toLowerCase();
  const matches = (t) =>
    !q ||
    t.name.toLowerCase().includes(q) ||
    t.username.toLowerCase().includes(q);
  const freeShown = free.filter(matches);
  const assignedShown = assigned.filter(matches);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !saving) onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, saving]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected || unchanged || saving) return;

    setSaving(true);
    setSubmitError("");
    try {
      await onAssign?.(classCard.id, selected);
    } catch (err) {
      setSubmitError(err.message || "Failed to assign teacher.");
      setSaving(false);
    }
  };

  const renderRow = (t) => {
    const cls = classOf(t);
    const isSelected = t.id === selectedId;
    const leaving = cls && cls.id !== classCard.id;

    return (
      <button
        key={t.id}
        type="button"
        role="radio"
        aria-checked={isSelected}
        className={`ap-row${isSelected ? " ap-row--on" : ""}`}
        onClick={() => {
          setSelectedId(t.id);
          if (submitError) setSubmitError("");
        }}
        disabled={saving}
      >
        <span className={`avatar avatar--${t.avatar} ap-avatar`}>
          {getInitials(t.name)}
        </span>

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
      onMouseDown={(e) =>
        e.target === e.currentTarget && !saving && onClose?.()
      }
    >
      <form
        className="drawer ap"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={handleSubmit}
        noValidate
      >
        <header className="ap-head">
          <h2 className="na-title" id={`${uid}-title`}>
            {classCard.teacher ? "Change teacher" : "Assign teacher"} ·{" "}
            {classCard.name}
          </h2>
          <p className="na-sub">
            Changing the teacher keeps all existing records (FR-18).
          </p>
          <button
            type="button"
            className="na-close drawer__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <XIcon size={14} />
          </button>
        </header>

        <div className="drawer__body ap-body">
          {submitError && (
            <div className="drawer-alert" role="alert">
              <p>{submitError}</p>
            </div>
          )}

          <label className="ap-search">
            <SearchIcon size={14} />
            <input
              type="search"
              placeholder="Search teachers"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              aria-label="Search teachers"
              disabled={loading || saving}
            />
          </label>

          {loading ? (
            <p className="ap-empty">Loading teachers...</p>
          ) : loadError ? (
            <div className="drawer-alert" role="alert">
              <p>{loadError}</p>
              <button
                type="button"
                className="btn-outline"
                onClick={() => loadTeachers()}
              >
                Try again
              </button>
            </div>
          ) : (
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
          )}
        </div>

        <footer className="drawer__foot">
          <button
            type="button"
            className="btn-outline drawer__btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary drawer__btn"
            disabled={loading || !selected || unchanged || saving}
          >
            {saving
              ? "Assigning..."
              : selected
              ? `Assign ${selected.name.split(" ")[0]}`
              : "Assign"}
          </button>
        </footer>
      </form>
    </div>
  );
}