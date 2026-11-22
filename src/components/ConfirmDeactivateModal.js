import { useEffect, useId } from "react";
import { UserXIcon, XIcon, AlertTriangleIcon } from "./Icons";
import { getClassName } from "../data/Accounts";

/**
 * نافذة تأكيد إيقاف الحساب.
 * Props: account, onCancel(), onConfirm()
 */
export default function ConfirmDeactivateModal({ account, onCancel, onConfirm }) {
  const uid = useId();
  const className = getClassName(account); // لو مدرّس عنده فصل: تحذير إن الفصل هيفضل من غير مدرّس

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
      className="modal-overlay modal-overlay--center"
      onMouseDown={(e) => e.target === e.currentTarget && onCancel?.()}
    >
      <div
        className="confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        aria-describedby={`${uid}-desc`}
      >
        <div className="confirm__body">
          <span className="confirm__icon">
            <UserXIcon size={18} />
          </span>

          <button type="button" className="na-close confirm__close" onClick={onCancel} aria-label="Close">
            <XIcon size={14} />
          </button>

          <h2 className="confirm__title" id={`${uid}-title`}>
            Deactivate {account.name}?
          </h2>

          <p className="confirm__text" id={`${uid}-desc`}>
            She won’t be able to log in. All activity records she created stay in the system
            (FR-13).
          </p>

          {className && (
            <div className="drawer-alert confirm__alert" role="status">
              <AlertTriangleIcon size={13} />
              <p>
                <strong>{className}</strong> will have no teacher. Assign a new teacher from
                Classes.
              </p>
            </div>
          )}
        </div>

        <footer className="confirm__foot">
          <button type="button" className="btn-outline confirm__btn" onClick={onCancel} autoFocus>
            Cancel
          </button>
          <button type="button" className="btn-danger confirm__btn" onClick={onConfirm}>
            Deactivate
          </button>
        </footer>
      </div>
    </div>
  );
}