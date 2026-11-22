import { useEffect, useId } from "react";
import { UnlinkIcon, XIcon, HistoryIcon } from "./Icons";

/**
 * نافذة تأكيد فك الربط بين ولي أمر وطالب.
 * Props: parent, student, onCancel(), onConfirm()
 * استدعيها بـ {target && <ConfirmRemoveLinkModal .../>}
 */
export default function ConfirmRemoveLinkModal({ parent, student, onCancel, onConfirm }) {
  const uid = useId();
  const parentFirst = parent.name.trim().split(" ")[0];
  const childFirst = student.name.trim().split(" ")[0];

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onCancel]);

  return (
    <div
      className="modal-overlay modal-overlay--remove"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div
        className="confirm confirm--remove"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-desc`}
      >
        <div className="confirm__body">
          <span className="confirm__icon">
            <UnlinkIcon size={18} />
          </span>

          <button type="button" className="na-close confirm__close" onClick={onCancel} aria-label="Close">
            <XIcon size={14} />
          </button>

          <h2 className="confirm__title" id={`${uid}-title`}>
            Remove link between {parent.name} and {student.name}?
          </h2>

          <p className="confirm__text confirm__text--tight" id={`${uid}-desc`}>
            {parentFirst} will immediately lose access to {childFirst}’s records and future
            notifications. Existing records and notifications are <strong>not deleted</strong>{" "}
            (§2.3.1-5).
          </p>

          <div className="na-info confirm__info" role="status">
            <HistoryIcon size={13} className="na-info__icon" />
            <p>This action is recorded in the audit log with your name.</p>
          </div>
        </div>

        <footer className="confirm__foot">
          <button type="button" className="btn-outline confirm__btn" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn-danger confirm__btn" onClick={onConfirm}>
            <UnlinkIcon size={12} />
            Remove link
          </button>
        </footer>
      </div>
    </div>
  );
}