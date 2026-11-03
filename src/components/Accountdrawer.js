import { useEffect, useId, useState } from "react";
import { RoleTag, StatusBadge } from "./AccountBadges";
import {
  XIcon,
  ClockIcon,
  SendIcon,
  UserIcon,
  CheckIcon,
  PencilIcon,
  RefreshIcon,
  AlertTriangleIcon,
} from "./Icons";
import {
  INVITE_TTL_MS,
  fmtDate,
  fmtDateTime,
  getInitials,
  lastEvent,
} from "../data/Accounts";

// شكل كل نوع حدث في "Invitation history"
const EVENT_VIEW = {
  created:     { Icon: UserIcon,   tone: "slate", title: (e) => `Record created by ${e.by}` },
  sent:        { Icon: SendIcon,   tone: "cyan",  title: (e) => `Invitation ${e.resent ? "resent" : "sent"} by ${e.by}` },
  expired:     { Icon: ClockIcon,  tone: "slate", title: () => "Expired" },
  activated:   { Icon: CheckIcon,  tone: "green", title: () => "Account activated" },
  edited:      { Icon: PencilIcon, tone: "slate", title: (e) => `Details updated by ${e.by}` },
  privileges:  { Icon: PencilIcon, tone: "slate", title: (e) => `Privileges updated by ${e.by}` },
  deactivated: { Icon: XIcon,      tone: "slate", title: (e) => `Account deactivated by ${e.by}` },
  reactivated: { Icon: CheckIcon,  tone: "green", title: (e) => `Account reactivated by ${e.by}` },
};

const isInviteStatus = (s) => s === "Invited" || s === "Invite expired";

/**
 * Props:
 *  - account: الحساب المعروض
 *  - existingUsernames: أسماء المستخدمين التانية (لفحص التكرار وقت التعديل)
 *  - onClose(), onResend(account), onSave(id, {name, username, email})
 *  - onDeactivate(account): بيفتح نافذة التأكيد  |  onSetActive(id, true): إعادة التفعيل
 */
export default function AccountDrawer({
  account,
  existingUsernames = [],
  onClose,
  onResend,
  onSave,
  onDeactivate,
  onSetActive,
}) {
  const uid = useId();
  const [editing, setEditing] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: account.name,
    username: account.username,
    email: account.email,
  });

  const firstName = account.name.trim().split(" ")[0];
  const events = [...account.history].reverse();
  const inviteFlow = isInviteStatus(account.status);

  /* ----- alert (أصفر لو منتهية / أزرق لو لسه شغالة) ----- */
  let alertBox = null;
  const sent = lastEvent(account, "sent");
  if (account.status === "Invite expired" && sent) {
    const expired = lastEvent(account, "expired");
    alertBox = (
      <div className="drawer-alert" role="status">
        <ClockIcon size={13} />
        <p>
          The invitation sent on <strong>{fmtDate(sent.at)}</strong> expired on{" "}
          <strong>{fmtDate(expired ? expired.at : new Date(new Date(sent.at).getTime() + INVITE_TTL_MS))}</strong>.{" "}
          {firstName} can’t log in until she activates a new invitation.
        </p>
      </div>
    );
  } else if (account.status === "Invited" && sent) {
    alertBox = (
      <div className="drawer-alert drawer-alert--info" role="status">
        <SendIcon size={13} />
        <p>
          The invitation was sent on <strong>{fmtDate(sent.at)}</strong> and expires on{" "}
          <strong>{fmtDate(new Date(new Date(sent.at).getTime() + INVITE_TTL_MS))}</strong>.{" "}
          {firstName} hasn’t activated the account yet.
        </p>
      </div>
    );
  }

  /* ----- edit validation ----- */
  const username = form.username.trim();
  const taken = existingUsernames.some((u) => u.toLowerCase() === username.toLowerCase());
  const bad = {
    name: submitted && !form.name.trim(),
    username: submitted && !username,
    email: submitted && !/^\S+@\S+\.\S+$/.test(form.email.trim()),
  };

  const startEdit = () => {
    setForm({ name: account.name, username: account.username, email: account.email });
    setSubmitted(false);
    setEditing(true);
  };

  const cancelEdit = () => setEditing(false);

  const save = (e) => {
    e?.preventDefault();
    setSubmitted(true);
    if (taken || !form.name.trim() || !username || !/^\S+@\S+\.\S+$/.test(form.email.trim())) return;
    onSave(account.id, { name: form.name.trim(), username, email: form.email.trim() });
    setEditing(false);
  };

  /* Esc: يلغي التعديل أولاً، وبعدين يقفل الدراور + منع سكرول الخلفية */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (editing) setEditing(false);
      else onClose?.();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [editing, onClose]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div
      className="drawer-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
      >
        {/* ===== Header ===== */}
        <header className="drawer__head">
          <span className={`avatar avatar--lg avatar--${account.avatar}`}>
            {getInitials(account.name)}
          </span>

          <div className="drawer__who">
            <h2 className="drawer__name" id={`${uid}-title`}>{account.name}</h2>
            <p className="drawer__handle">
              @{account.username} · {account.email}
            </p>
            <div className="drawer__tags">
              <RoleTag role={account.role} />
              <StatusBadge status={account.status} />
            </div>
          </div>

          <button type="button" className="na-close drawer__close" onClick={onClose} aria-label="Close">
            <XIcon size={14} />
          </button>
        </header>

        {/* ===== Body ===== */}
        {editing ? (
          <form className="drawer__body" onSubmit={save} noValidate id={`${uid}-form`}>
            <h3 className="drawer__section">Edit details</h3>

            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-name`}>Full name</label>
              <input
                id={`${uid}-name`}
                className={`na-input${bad.name ? " is-invalid" : ""}`}
                value={form.name}
                onChange={set("name")}
                autoComplete="off"
                autoFocus
              />
            </div>

            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-user`}>Username</label>
              <input
                id={`${uid}-user`}
                className={`na-input${taken || bad.username ? " is-invalid" : ""}`}
                value={form.username}
                onChange={set("username")}
                aria-invalid={taken}
                autoComplete="off"
              />
              {taken && (
                <p className="na-error" role="alert">
                  <AlertTriangleIcon size={11} /> Username already taken
                </p>
              )}
            </div>

            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-email`}>Email</label>
              <input
                id={`${uid}-email`}
                type="email"
                className={`na-input${bad.email ? " is-invalid" : ""}`}
                value={form.email}
                onChange={set("email")}
                autoComplete="off"
              />
              {bad.email && (
                <p className="na-error" role="alert">
                  <AlertTriangleIcon size={11} /> Enter a valid email address
                </p>
              )}
            </div>
          </form>
        ) : (
          <div className="drawer__body">
            {alertBox}

            <h3 className="drawer__section">Invitation history</h3>

            <ol className="drawer-events">
              {events.map((e, i) => {
                const view = EVENT_VIEW[e.type] || EVENT_VIEW.created;
                const { Icon } = view;
                return (
                  <li className="drawer-event" key={`${e.type}-${e.at}-${i}`}>
                    <span className={`icon-box icon-box--${view.tone}`}>
                      <Icon size={13} />
                    </span>
                    <div className="drawer-event__text">
                      <p className="drawer-event__title">{view.title(e)}</p>
                      <p className="drawer-event__time">{fmtDateTime(e.at)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>

            {inviteFlow && (
              <p className="drawer__note">
                Resending invalidates any older link (only the newest link works).
              </p>
            )}
          </div>
        )}

        {/* ===== Footer ===== */}
        <footer className="drawer__foot">
          {editing ? (
            <>
              <button type="button" className="btn-outline drawer__btn" onClick={cancelEdit}>
                Cancel
              </button>
              <button type="submit" form={`${uid}-form`} className="btn-primary drawer__btn">
                <CheckIcon size={12} />
                Save changes
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn-outline drawer__btn" onClick={startEdit}>
                Edit email
              </button>

              {inviteFlow && (
                <button type="button" className="btn-primary drawer__btn" onClick={() => onResend(account)}>
                  <RefreshIcon size={12} />
                  Resend invitation
                </button>
              )}

              {account.status === "Active" && (
                <button
                  type="button"
                  className="btn-outline btn-outline--danger drawer__btn"
                  onClick={() => onDeactivate(account)}
                >
                  Deactivate
                </button>
              )}

              {account.status === "Inactive" && (
                <button type="button" className="btn-primary drawer__btn" onClick={() => onSetActive(account.id, true)}>
                  <CheckIcon size={12} />
                  Reactivate
                </button>
              )}
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}