import { useEffect, useId, useState } from "react";
import {
  CapIcon,
  XIcon,
  AlertTriangleIcon,
  PlusIcon,
  CheckIcon,
  InfoIcon,
} from "./Icons";
import { CLASS_LEVELS, toApiClassLevel } from "../data/Classes";
import { getClassById } from "../api/Classes";

export default function ClassModal({
  mode = "create", 
  initialClass = null,
  onClose,
  onSubmit,
}) {
  const uid = useId();
  const isEdit = mode === "edit";

  const [name, setName] = useState(initialClass?.name || "");
  const [level, setLevel] = useState(
    toApiClassLevel(initialClass?.rawLevel || initialClass?.level || "KG1")
  );
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    if (!isEdit || !initialClass?.id) return undefined;
    const controller = new AbortController();

    getClassById(initialClass.id, { signal: controller.signal })
      .then((fresh) => {
        if (!fresh) return;
        setName(fresh.name || "");
        setLevel(toApiClassLevel(fresh.level || "KG1"));
      })
      .catch(() => {});

    return () => controller.abort();
  }, [isEdit, initialClass?.id]);

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

  const trimmedName = name.trim();
  const missingName = submitted && !trimmedName;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setApiError("");

    if (!trimmedName || !level || saving) return;

    setSaving(true);
    try {
      await onSubmit?.({ name: trimmedName, level });
    } catch (err) {
      setApiError(err.message || "Could not save class. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay cls-modal-overlay"
      onMouseDown={(e) =>
        e.target === e.currentTarget && !saving && onClose?.()
      }
    >
      <form
        className="cls-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ===== Header ===== */}
        <header className="cls-modal__head">
          <span className="cls-modal__badge" aria-hidden="true">
            <CapIcon size={17} />
          </span>

          <div className="cls-modal__titles">
            <h2 className="cls-modal__title" id={`${uid}-title`}>
              {isEdit ? `Edit class · ${initialClass?.name}` : "New class"}
            </h2>
            <p className="cls-modal__sub">
              {isEdit
                ? "Update the class name and grade level."
                : "Created as Active with no assigned teacher."}
            </p>
          </div>

          <button
            type="button"
            className="cls-modal__close"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
          >
            <XIcon size={14} />
          </button>
        </header>

        {/* ===== Body ===== */}
        <div className="cls-modal__body">
          <div className="cls-modal__field">
            <label className="cls-modal__label" htmlFor={`${uid}-name`}>
              Class name
            </label>
            <input
              id={`${uid}-name`}
              className={`cls-modal__input${missingName ? " is-invalid" : ""}`}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (apiError) setApiError("");
              }}
              placeholder="e.g. Sunflowers"
              autoFocus
              autoComplete="off"
              disabled={saving}
            />
            {missingName && (
              <p className="cls-modal__error" role="alert">
                <AlertTriangleIcon size={12} /> Enter a class name
              </p>
            )}
          </div>

          <div className="cls-modal__field">
            <span className="cls-modal__label" id={`${uid}-level`}>
              Grade level
            </span>
            <div
              className="cls-level-grid"
              role="radiogroup"
              aria-labelledby={`${uid}-level`}
            >
              {CLASS_LEVELS.map((opt) => {
                const active = level === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    className={`cls-level-btn${active ? " is-active" : ""}`}
                    onClick={() => {
                      setLevel(opt.value);
                      if (apiError) setApiError("");
                    }}
                    disabled={saving}
                  >
                    <span>{opt.label}</span>
                    {active && (
                      <span className="cls-level-btn__check" aria-hidden="true">
                        <CheckIcon size={10} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {!isEdit && (
            <div className="cls-modal__info">
              <InfoIcon size={14} />
              <p>
                After creating the class, you can assign a teacher directly from
                the class card.
              </p>
            </div>
          )}

          {apiError && (
            <p className="cls-modal__error cls-modal__error--box" role="alert">
              <AlertTriangleIcon size={13} /> {apiError}
            </p>
          )}
        </div>

        {/* ===== Footer ===== */}
        <footer className="cls-modal__foot">
          <button
            type="button"
            className="btn-outline cls-modal__btn"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary cls-modal__btn"
            disabled={saving}
          >
            {isEdit ? <CheckIcon size={13} /> : <PlusIcon size={13} />}
            {saving
              ? isEdit
                ? "Saving..."
                : "Creating..."
              : isEdit
              ? "Save changes"
              : "Create class"}
          </button>
        </footer>
      </form>
    </div>
  );
}