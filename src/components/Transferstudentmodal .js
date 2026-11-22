import { useEffect, useId, useState } from "react";
import { getStudent, cancelTransfer, findScheduledTransfer, toId } from "../api/students";
import { XIcon, CalendarIcon, ChevronDownIcon, HistoryIcon, SwapIcon, AlertTriangleIcon } from "./Icons";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** "2026-10-13" -> "Tue 13 Oct 2026" */
export function formatLongDate(iso) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${wd} ${String(d).padStart(2, "0")} ${MONTHS[m - 1]} ${y}`;
}

const todayIso = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const labelOf = (c) => (c ? `${c.name}${c.level ? ` · ${c.level}` : ""}` : "");

export default function TransferStudentModal({ student, classes = [], onClose, onSubmit, onScheduleChanged }) {
  const uid = useId();

  const fromClass = classes.find((c) => String(c.id) === String(student.classId));
  const fromLabel = fromClass ? labelOf(fromClass) : student.className;

  const options = classes.filter((c) => String(c.id) !== String(student.classId));
  const [toId_, setToId] = useState(options[0] ? String(options[0].id) : "");
  const [effective, setEffective] = useState(todayIso());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // النقل المجدول الحالي (من GET /students/{id})
  const [scheduled, setScheduled] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const toClass = classes.find((c) => String(c.id) === toId_);
  const firstName = student.name.trim().split(" ")[0];

  useEffect(() => {
    const controller = new AbortController();
    getStudent(student.id, { signal: controller.signal })
      .then((detail) => setScheduled(findScheduledTransfer(detail)))
      .catch(() => {});
    return () => controller.abort();
  }, [student.id]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toId_ || !effective || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      await onSubmit?.({ classId: toId(toId_), effectiveFrom: effective });
    } catch (err) {
      setError(err?.fieldErrors?.classId || err?.fieldErrors?.effectiveFrom || err?.message || "Couldn’t transfer the student.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelScheduled = async () => {
    if (!scheduled || cancelling) return;
    setCancelling(true);
    setError("");
    try {
      // await cancelTransfer(student.id, scheduled.id);
      setScheduled(null);
      onScheduleChanged?.();
    } catch (err) {
      setError(err?.message || "Couldn’t cancel the scheduled transfer.");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div
      className="modal-overlay modal-overlay--top"
      onMouseDown={(e) => e.target === e.currentTarget && !submitting && onClose?.()}
    >
      <form
        className="tr-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ===== Header ===== */}
        <header className="tr-head">
          <h2 className="tr-title" id={`${uid}-title`}>Transfer {student.name}</h2>
          <p className="tr-sub">
            #{student.code} · currently in {fromLabel}
          </p>
          <button type="button" className="na-close tr-close" onClick={onClose} aria-label="Close" disabled={submitting}>
            <XIcon size={14} />
          </button>
        </header>

        {/* ===== Body ===== */}
        <div className="tr-body">
          <div className="tr-route">
            <div className="tr-from" aria-label="Current class">{fromLabel}</div>
            <SwapIcon size={14} className="tr-route__arrow" />
            <div className="na-select tr-to">
              <select
                aria-label="New class"
                value={toId_}
                onChange={(e) => setToId(e.target.value)}
                disabled={options.length === 0}
              >
                {options.length === 0 && <option value="">No other classes</option>}
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {labelOf(c)}
                  </option>
                ))}
              </select>
              <ChevronDownIcon size={14} className="na-select__chev" />
            </div>
          </div>

          <label className="na-label tr-label" htmlFor={`${uid}-date`}>Effective from</label>
          <div className="as-date tr-date">
            <CalendarIcon size={13} />
            <span className={effective ? "" : "as-date__ph"}>
              {effective ? formatLongDate(effective) : "Select date"}
            </span>
            <input
              id={`${uid}-date`}
              type="date"
              value={effective}
              min={todayIso()}
              onChange={(e) => setEffective(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              aria-label="Effective from"
            />
          </div>

          <div className="na-info tr-info">
            <HistoryIcon size={13} className="na-info__icon" />
            <p>
              Past records keep “{student.className}” as their class. From the effective date,{" "}
              {toClass?.teacherName ? (
                <>
                  only {toClass.teacherName} ({toClass.name}) can log activities for {firstName} (FR-17).
                </>
              ) : (
                <>
                  only the teacher of {toClass?.name || "the new class"} can log activities for {firstName} (FR-17).
                </>
              )}
            </p>
          </div>

          {scheduled && (
            <div className="tr-sched" role="status">
              <p>
                A transfer to <strong>{scheduled.class?.name || "another class"}</strong> is already scheduled
                {scheduled.effectiveFrom ? ` from ${formatLongDate(scheduled.effectiveFrom)}` : ""}.
              </p>
              <button type="button" onClick={handleCancelScheduled} disabled={cancelling}>
                {cancelling ? "Cancelling…" : "Cancel scheduled transfer"}
              </button>
            </div>
          )}

          {error && (
            <p className="na-error tr-error" role="alert">
              <AlertTriangleIcon size={12} /> {error}
            </p>
          )}
        </div>

        {/* ===== Footer ===== */}
        <footer className="tr-foot">
          <button type="button" className="btn-outline tr-btn" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn-primary tr-btn" disabled={!toId_ || !effective || submitting}>
            {submitting ? "Transferring…" : "Transfer student"}
          </button>
        </footer>
      </form>
    </div>
  );
}