import { useEffect, useId, useState } from "react";
import { CLASS_CARDS } from "../data/Classes";
import { XIcon, CalendarIcon, ChevronDownIcon, HistoryIcon, SwapIcon } from "./Icons";

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

// بنقرا الفصول المحفوظة (نفس مفتاح صفحة Classes) علشان نعرف مدرّس كل فصل
function loadClasses() {
  try {
    const raw = localStorage.getItem("kidoo.classes.v1");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return CLASS_CARDS;
}

// اختيار مبدئي مطابق للتصميم (Salma: Sunflowers -> Bumblebees). غيّره/امسحه لو مش عاوزه.
const DEMO_TARGET = "Bumblebees";

/**
 * Props:
 *  - student: الطالب اللي هيتنقل
 *  - onClose(), onSubmit({className, effective, from})
 *  استدعيه بـ {student && <TransferStudentModal key={student.id} .../>} علشان الاختيار يتصفّر عند كل فتح
 */
export default function TransferStudentModal({ student, onClose, onSubmit }) {
  const uid = useId();
  const classes = loadClasses();

  const fromClass = CLASS_CARDS.find((c) => c.name === student.className);
  const fromLabel = fromClass ? `${fromClass.name} · ${fromClass.level}` : student.className;

  const options = CLASS_CARDS.filter((c) => c.name !== student.className);
  const [toName, setToName] = useState(
    (options.find((c) => c.name === DEMO_TARGET) || options[0])?.name || ""
  );
  const [effective, setEffective] = useState(todayIso());

  const toClass = CLASS_CARDS.find((c) => c.name === toName);
  const teacher = classes.find((c) => c.id === toClass?.id)?.teacher || null;
  const firstName = student.name.trim().split(" ")[0];

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
    if (!toName || !effective) return;
    onSubmit?.({ className: toName, effective, from: student.className });
  };

  return (
    <div
      className="modal-overlay modal-overlay--top"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
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
          <button type="button" className="na-close tr-close" onClick={onClose} aria-label="Close">
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
                value={toName}
                onChange={(e) => setToName(e.target.value)}
              >
                {options.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} · {c.level}
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
              onChange={(e) => setEffective(e.target.value)}
              onClick={(e) => e.currentTarget.showPicker?.()}
              aria-label="Effective from"
            />
          </div>

          <div className="na-info tr-info">
            <HistoryIcon size={13} className="na-info__icon" />
            <p>
              Past records keep “{student.className}” as their class. From the effective date,{" "}
              {teacher ? (
                <>
                  only {teacher.name} ({toName}) can log activities for {firstName} (FR-17).
                </>
              ) : (
                <>
                  {toName} has no teacher yet, so no one can log activities for {firstName} until
                  one is assigned (FR-17).
                </>
              )}
            </p>
          </div>
        </div>

        {/* ===== Footer ===== */}
        <footer className="tr-foot">
          <button type="button" className="btn-outline tr-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary tr-btn" disabled={!toName || !effective}>
            Transfer student
          </button>
        </footer>
      </form>
    </div>
  );
}