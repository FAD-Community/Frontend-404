import { useEffect, useId, useMemo, useState } from "react";
import {
  PRIVILEGE_OPTIONS,
  DEMO_DRAFT_ADDS,
  hasAnyPrivilege,
  privilegeTitle,
  fmtDateTime,
} from "../data/Accounts";
import { XIcon, CheckIcon, LockIcon, HistoryIcon, AlertTriangleIcon } from "./Icons";

const ORDER = PRIVILEGE_OPTIONS.map((o) => o.key);
const sortKeys = (keys) => ORDER.filter((k) => keys.includes(k));
const joinTitles = (keys) => keys.map(privilegeTitle).join(", ");

/**
 * Props:
 *  - account: الأدمن اللي بيتعدّل
 *  - currentAdmin: الأدمن اللي عامل login (بيحدد الصلاحيات المقفولة – FR-10)
 *  - onClose(): إلغاء / قفل
 *  - onSave(id, privileges): بيتنادى بالصلاحيات الجديدة بعد التعديل
 *  استدعيه بـ {account && <EditPrivilegesDrawer key={account.id} .../>} علشان المسودة تتصفّر عند كل فتح
 */
export default function EditPrivilegesDrawer({
  account,
  currentAdmin,
  auditLoading = false,
  auditError = "",
  onClose,
  onSave,
}) {
  const uid = useId();

  const isDefault = account.status === "Default"; // Default admin معاه كل الصلاحيات ومينفعش يتعدّل (FR-06)
  const isOwnAccount = String(account.id) === String(currentAdmin?.id);
  const original = useMemo(
    () => (isDefault ? [...ORDER] : sortKeys(account.privileges || [])),
    [account, isDefault]
  );

  // الصلاحيات اللي الأدمن الحالي مايقدرش يمنحها أو يشيلها (سقف الصلاحيات – FR-10)
  const lockedKeys = isDefault ? [] : ORDER.filter((k) => !hasAnyPrivilege(currentAdmin, [k]));

  const [draft, setDraft] = useState(() => {
    // الإضافة التجريبية بتظهر بس قبل أول تعديل محفوظ للأدمن ده
    const edited = account.history.some((e) => e.type === "privileges");
    const adds = edited ? [] : (DEMO_DRAFT_ADDS[account.id] || []).filter((k) => !lockedKeys.includes(k));
    return sortKeys([...original, ...adds]);
  });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const added = draft.filter((k) => !original.includes(k));
  const removed = original.filter((k) => !draft.includes(k));
  const changed = added.length + removed.length > 0;

  const firstName = account.name.trim().split(" ")[0];
  const adminFirst = (currentAdmin?.name || "You").trim().split(" ")[0];
  const lockedTitles = lockedKeys.map((k) => `“${privilegeTitle(k)}”`).join(", ");

  const toggle = (key) =>
    setDraft((d) => (d.includes(key) ? d.filter((k) => k !== key) : sortKeys([...d, key])));

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDefault || isOwnAccount || !changed || saving) return;
    setSubmitted(true);
    if (draft.length === 0) return; // لازم صلاحية واحدة على الأقل

    setSaving(true);
    setSaveError("");
    try {
      await onSave?.(account.id, draft);
    } catch (error) {
      setSaveError(error.message || "Failed to update privileges.");
    } finally {
      setSaving(false);
    }
  };

  /* ----- Audit history: التغييرات المعلّقة أولاً ثم السجل المحفوظ (الأحدث فوق) ----- */
  const pending = [
    ...added.map((k) => ({ text: `added ${privilegeTitle(k)}` })),
    ...removed.map((k) => ({ text: `removed ${privilegeTitle(k)}` })),
  ].map((p) => ({ ...p, by: currentAdmin?.name || "You", time: "Now · pending save" }));

  const saved = [...account.history]
    .reverse()
    .flatMap((e) => {
      if (e.type === "created") {
        const keys = isDefault ? null : sortKeys(e.privileges || account.privileges || []);
        const what = keys ? joinTitles(keys) : "all privileges";
        return [
          {
            by: e.by,
            text: e.by === "System" ? `set up the default admin with ${what}` : `created this admin with ${what}`,
            time: fmtDateTime(e.at),
          },
        ];
      }
      if (e.type === "privileges") {
        return [
          ...(e.added || []).map((k) => ({ by: e.by, text: `added ${privilegeTitle(k)}`, time: fmtDateTime(e.at) })),
          ...(e.removed || []).map((k) => ({ by: e.by, text: `removed ${privilegeTitle(k)}`, time: fmtDateTime(e.at) })),
        ];
      }
      if (e.type === "audit") {
        return [
          {
            by: e.by || "System",
            text: `${e.text || "Updated account"}${e.target ? ` · ${e.target}` : ""}`,
            time: fmtDateTime(e.at),
          },
        ];
      }
      return [];
    });

  const entries = [...pending, ...saved];

  return (
    <div
      className="drawer-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <form
        className="drawer ep"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ===== Header ===== */}
        <header className="ep-head">
          <h2 className="na-title" id={`${uid}-title`}>Edit privileges · {account.name}</h2>
          <p className="na-sub">Changes apply on {firstName}’s next request and are recorded.</p>
          <button type="button" className="na-close drawer__close" onClick={onClose} aria-label="Close">
            <XIcon size={14} />
          </button>
        </header>

        {/* ===== Body ===== */}
        <div className="drawer__body ep-body">
          <div className="ep-list" role="group" aria-label="Privileges">
            {PRIVILEGE_OPTIONS.map(({ key, title }) => {
              const locked = lockedKeys.includes(key);
              const checked = !locked && draft.includes(key);
              const readOnly = isDefault || isOwnAccount;
              return (
                <label
                  key={key}
                  className={`ep-row${checked ? " ep-row--on" : ""}${locked ? " ep-row--locked" : ""}${readOnly ? " ep-row--readonly" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="nad-priv__input"
                    checked={checked}
                    disabled={locked || readOnly}
                    onChange={() => toggle(key)}
                  />
                  <span className="ep-row__box" aria-hidden="true">
                    {locked ? <LockIcon size={9} /> : checked && <CheckIcon size={10.5} strokeWidth={2.6} />}
                  </span>
                  <span className="ep-row__title">{title}</span>
                  {locked && <span className="ep-row__hint">You don’t hold this</span>}
                </label>
              );
            })}
          </div>

          {submitted && draft.length === 0 && (
            <p className="na-error" role="alert">
              <AlertTriangleIcon size={11} /> Select at least one privilege
            </p>
          )}

          {isDefault ? (
            <p className="ep-note">
              The default admin always has every privilege and can’t be changed (FR-06).
            </p>
          ) : isOwnAccount ? (
            <p className="ep-note">You can’t change your own privileges.</p>
          ) : (
            lockedKeys.length > 0 && (
              <p className="ep-note">
                Logged in as {adminFirst}: {lockedTitles} {lockedKeys.length > 1 ? "are" : "is"} locked
                because {adminFirst} doesn’t hold {lockedKeys.length > 1 ? "them" : "it"} — he can
                neither grant nor remove {lockedKeys.length > 1 ? "them" : "it"} (privilege ceiling).
              </p>
            )
          )}

          <h3 className="ep-section">Audit history</h3>
          {auditLoading && <p className="ep-note">Loading audit history...</p>}
          {auditError && <p className="na-error" role="alert">{auditError}</p>}
          {saveError && <p className="na-error" role="alert">{saveError}</p>}
          <ol className="ep-events">
            {entries.map((e, i) => (
              <li className="ep-event" key={`${e.text}-${i}`}>
                <HistoryIcon size={14} className="ep-event__icon" />
                <div className="ep-event__text">
                  <p className="ep-event__title">
                    <strong>{e.by}</strong> {e.text}
                  </p>
                  <p className="ep-event__time">{e.time}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* ===== Footer ===== */}
        <footer className="drawer__foot">
          <button type="button" className="btn-outline drawer__btn" onClick={onClose} disabled={saving}>
            {isDefault ? "Close" : "Cancel"}
          </button>
          {!isDefault && !isOwnAccount && (
            <button type="submit" className="btn-primary drawer__btn" disabled={!changed || saving}>
              {saving ? "Saving..." : "Save changes"}
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}