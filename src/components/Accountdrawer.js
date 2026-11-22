import { useCallback, useEffect, useId, useState } from "react";
import { RoleTag, StatusBadge } from "./AccountBadges";
import { getAccountInvitations } from "../api/accounts.api";
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
} from "../data/Accounts";

const byName = (e) => e.by?.fullName || e.by || "System";

const EVENT_VIEW = {
  created:     { Icon: UserIcon,   tone: "slate", title: (e) => `Record created by ${byName(e)}` },
  sent:        { Icon: SendIcon,   tone: "cyan",  title: (e) => `Invitation sent to ${e.to || "email"} by ${byName(e)}` },
  used:        { Icon: CheckIcon,  tone: "green", title: () => "Account activated" },
  activated:   { Icon: CheckIcon,  tone: "green", title: () => "Account activated" },
  expired:     { Icon: ClockIcon,  tone: "slate", title: () => "Expired" },
  revoked:     { Icon: XIcon,      tone: "slate", title: () => "Previous link revoked" },
  edited:      { Icon: PencilIcon, tone: "slate", title: (e) => `Details updated by ${byName(e)}` },
  privileges:  { Icon: PencilIcon, tone: "slate", title: (e) => `Privileges updated by ${byName(e)}` },
  deactivated: { Icon: XIcon,      tone: "slate", title: (e) => `Account deactivated by ${byName(e)}` },
  reactivated: { Icon: CheckIcon,  tone: "green", title: (e) => `Account reactivated by ${byName(e)}` },
};

const isInviteStatus = (s) =>
  s === "Invited" || s === "Invite expired" || s === "InviteExpired";

export default function AccountDrawer({
  account,
  initialEditing = false,
  onClose,
  onResend,
  onSave,
  onDeactivate,
  onSetActive,
}) {
  const uid = useId();
  const [editing, setEditing] = useState(
    () => Boolean(initialEditing) && isInviteStatus(account.status)
  );
  const [submitted, setSubmitted] = useState(false);
  const [busyAction, setBusyAction] = useState(""); // "edit" | "resend" | "reactivate" | ""
  const [fieldError, setFieldError] = useState("");
  const [actionError, setActionError] = useState("");
  const [emailInput, setEmailInput] = useState(account.email || "");

  const [events, setEvents] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState("");

  const firstName = (account.name || "").trim().split(" ")[0];
  const inviteFlow = isInviteStatus(account.status);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const data = await getAccountInvitations(account.id);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setHistoryError(err.message || "Failed to load invitation history.");
      setEvents([]);
    } finally {
      setHistoryLoading(false);
    }
  }, [account.id]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, account.email, account.status, account.invitation?.sentAt]);

  /* ----- alert (أصفر لو منتهية / أزرق لو لسه شغالة) ----- */
  const latestSent =
    account.invitation ||
    events.find((e) => (e.kind || e.type || "").toLowerCase() === "sent");
  const latestExpired = events.find(
    (e) => (e.kind || e.type || "").toLowerCase() === "expired"
  );

  const sentAt = latestSent?.sentAt || latestSent?.at;
  const expiresAt =
    latestSent?.expiresAt ||
    latestExpired?.at ||
    (sentAt
      ? new Date(new Date(sentAt).getTime() + INVITE_TTL_MS).toISOString()
      : null);

  let alertBox = null;
  if (
    (account.status === "Invite expired" || account.status === "InviteExpired") &&
    sentAt
  ) {
    alertBox = (
      <div className="drawer-alert" role="status">
        <ClockIcon size={13} />
        <p>
          The invitation sent on <strong>{fmtDate(sentAt)}</strong> expired on{" "}
          <strong>{fmtDate(expiresAt)}</strong>. {firstName} can’t log in until
          activating a new invitation.
        </p>
      </div>
    );
  } else if (account.status === "Invited" && sentAt) {
    alertBox = (
      <div className="drawer-alert drawer-alert--info" role="status">
        <SendIcon size={13} />
        <p>
          The invitation was sent on <strong>{fmtDate(sentAt)}</strong> and
          expires on <strong>{fmtDate(expiresAt)}</strong>. {firstName} hasn’t
          activated the account yet.
        </p>
      </div>
    );
  }

  /* ----- Edit email (PUT /accounts/{id}/email) ----- */
  const trimmedEmail = emailInput.trim();
  const badEmail = submitted && !/^\S+@\S+\.\S+$/.test(trimmedEmail);

  const startEdit = () => {
    setEmailInput(account.email || "");
    setSubmitted(false);
    setFieldError("");
    setActionError("");
    setEditing(true);
  };

  const cancelEdit = () => {
    if (busyAction) return;
    setFieldError("");
    setEditing(false);
  };

  const saveEmail = async (e) => {
    e?.preventDefault();
    setSubmitted(true);
    setFieldError("");
    setActionError("");

    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) return;

    setBusyAction("edit");
    try {
      await onSave(account.id, trimmedEmail);
      setEditing(false);
      await loadHistory();
    } catch (err) {
      if (err?.invitationSaved) {
        setEditing(false);
        setActionError(err.message);
        await loadHistory();
      } else {
        setFieldError(err.message || "Failed to update email.");
      }
    } finally {
      setBusyAction("");
    }
  };

  /* ----- Resend invitation (POST /accounts/{id}/invitation/resend) ----- */
  const handleResendClick = async () => {
    setBusyAction("resend");
    setActionError("");
    try {
      await onResend(account);
      await loadHistory();
    } catch (err) {
      setActionError(err.message || "Failed to resend invitation.");
      if (err?.invitationSaved) {
        await loadHistory();
      }
    } finally {
      setBusyAction("");
    }
  };

  /* ----- Reactivate (POST /accounts/{id}/reactivate) ----- */
  const handleReactivateClick = async () => {
    setBusyAction("reactivate");
    setActionError("");
    try {
      await onSetActive(account.id, true);
      await loadHistory();
    } catch (err) {
      setActionError(err.message || "Failed to reactivate account.");
    } finally {
      setBusyAction("");
    }
  };

  /* Esc: يلغي التعديل أولاً، وبعدين يقفل الدراور + منع سكرول الخلفية */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape" || busyAction) return;
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
  }, [editing, busyAction, onClose]);

  return (
    <div
      className="drawer-overlay"
      onMouseDown={(e) =>
        e.target === e.currentTarget && !busyAction && onClose?.()
      }
    >
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
      >
        {/* ===== Header ===== */}
        <header className="drawer__head">
          <span className={`avatar avatar--${account.avatar}`}>
            {getInitials(account.name)}
          </span>
          <div className="drawer__who">
            <h2 className="drawer__name" id={`${uid}-title`}>
              {account.name}
            </h2>
            <p className="drawer__handle">
              @{account.username} · {account.email}
            </p>
            <div className="drawer__tags">
              <RoleTag role={account.role} />
              <StatusBadge status={account.status} />
            </div>
          </div>

          <button
            type="button"
            className="na-close drawer__close"
            onClick={onClose}
            disabled={Boolean(busyAction)}
            aria-label="Close"
          >
            <XIcon size={14} />
          </button>
        </header>

        {/* ===== Body ===== */}
        {editing ? (
          <form
            className="drawer__body"
            onSubmit={saveEmail}
            noValidate
            id={`${uid}-form`}
          >
            <h3 className="drawer__section">Edit email</h3>

            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-email`}>
                Email
              </label>
              <input
                id={`${uid}-email`}
                type="email"
                className={`na-input${
                  badEmail || fieldError ? " is-invalid" : ""
                }`}
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (fieldError) setFieldError("");
                }}
                autoComplete="off"
                autoFocus
                disabled={busyAction === "edit"}
              />
              {(badEmail || fieldError) && (
                <p className="na-error" role="alert">
                  <AlertTriangleIcon size={11} />{" "}
                  {fieldError || "Enter a valid email address"}
                </p>
              )}
            </div>

            <p className="drawer__note">
              Saving a new email sends a fresh invitation link and invalidates
              all older links.
            </p>
          </form>
        ) : (
          <div className="drawer__body">
            {actionError && (
              <div className="drawer-alert" role="alert">
                <AlertTriangleIcon size={13} />
                <p>{actionError}</p>
              </div>
            )}

            {alertBox}

            <h3 className="drawer__section">Invitation history</h3>

            {historyLoading ? (
              <p className="drawer__note">Loading invitation history...</p>
            ) : historyError ? (
              <div className="drawer-alert" role="alert">
                <AlertTriangleIcon size={13} />
                <p>{historyError}</p>
              </div>
            ) : events.length === 0 ? (
              <p className="drawer__note">No invitation events found.</p>
            ) : (
              <ol className="drawer-events">
                {events.map((e, i) => {
                  const key = (e.kind || e.type || "created").toLowerCase();
                  const view = EVENT_VIEW[key] || EVENT_VIEW.created;
                  const { Icon } = view;
                  return (
                    <li className="drawer-event" key={`${key}-${e.at}-${i}`}>
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
            )}

            {inviteFlow && (
              <p className="drawer__note">
                Resending invalidates any older link (only the newest link
                works).
              </p>
            )}
          </div>
        )}

        {/* ===== Footer ===== */}
        <footer className="drawer__foot">
          {editing ? (
            <>
              <button
                type="button"
                className="btn-outline drawer__btn"
                onClick={cancelEdit}
                disabled={busyAction === "edit"}
              >
                Cancel
              </button>
              <button
                type="submit"
                form={`${uid}-form`}
                className="btn-primary drawer__btn"
                disabled={busyAction === "edit"}
              >
                <CheckIcon size={12} />
                {busyAction === "edit" ? "Saving..." : "Save changes"}
              </button>
            </>
          ) : (
            <>
              {inviteFlow && (
                <button
                  type="button"
                  className="btn-outline drawer__btn"
                  onClick={startEdit}
                  disabled={Boolean(busyAction)}
                >
                  Edit email
                </button>
              )}

              {inviteFlow && (
                <button
                  type="button"
                  className="btn-primary drawer__btn"
                  onClick={handleResendClick}
                  disabled={Boolean(busyAction)}
                >
                  <RefreshIcon size={12} />
                  {busyAction === "resend"
                    ? "Sending..."
                    : "Resend invitation"}
                </button>
              )}

              {account.status === "Active" && !account.locked && (
                <button
                  type="button"
                  className="btn-outline btn-outline--danger drawer__btn"
                  onClick={() => onDeactivate(account)}
                  disabled={Boolean(busyAction)}
                >
                  Deactivate
                </button>
              )}

              {account.status === "Inactive" && (
                <button
                  type="button"
                  className="btn-primary drawer__btn"
                  onClick={handleReactivateClick}
                  disabled={Boolean(busyAction)}
                >
                  <CheckIcon size={12} />
                  {busyAction === "reactivate"
                    ? "Reactivating..."
                    : "Reactivate"}
                </button>
              )}
            </>
          )}
        </footer>
      </aside>
    </div>
  );
}