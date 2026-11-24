import { useEffect, useId, useState } from "react";
import {
  XIcon,
  CheckIcon,
  UserIcon,
  UsersIcon,
  SendIcon,
  AlertTriangleIcon,
  ChevronDownIcon,
} from "./Icons";
import { CLASSES } from "../data/Accounts";
import { listClasses } from "../api/Classes";

const EMPTY_FORM = {
  role: "Teacher",
  fullName: "",
  username: "",
  email: "",
  classId: "",
};

const ROLES = [
  { key: "Teacher", Icon: UserIcon, hint: "Needs Teacher Management" },
  { key: "Parent", Icon: UsersIcon, hint: "Needs Parent Management" },
];

export default function NewAccountModal({
  initial,
  existingUsernames = [],
  classes = CLASSES,
  onClose,
  onSubmit,
}) {
  const uid = useId();
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [submitted, setSubmitted] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const username = form.username.trim();
  const taken = existingUsernames.some((u) => u.toLowerCase() === username.toLowerCase());
  const missing = {
    fullName: submitted && !form.fullName.trim(),
    username: submitted && !username,
    email: submitted && !form.email.trim(),
  };
  const firstName = form.fullName.trim().split(" ")[0] || "The user";

  // Esc يقفل + منع سكرول الصفحة اللي ورا
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
    setSubmitted(true);
    if (taken || !form.fullName.trim() || !username || !form.email.trim()) return;
    onSubmit?.({ ...form, fullName: form.fullName.trim(), username, email: form.email.trim() });
  };
  const [apiClasses, setApiClasses] = useState([]);
  // const classOptions = classes.length > 0 ? classes : apiClasses;

  useEffect(() => {
    if (classes.length > 0) return undefined;
    const controller = new AbortController();
    listClasses({ signal: controller.signal })
      .then(setApiClasses)
      .catch(() => {});
    return () => controller.abort();
  }, [classes.length]);

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <form
        className="na-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* ===== Header ===== */}
        <header className="na-head">
          <div>
            <h2 className="na-title" id={`${uid}-title`}>New account</h2>
            <p className="na-sub">Admins are added from “Admins &amp; privileges”.</p>
          </div>
          <button type="button" className="na-close" onClick={onClose} aria-label="Close">
            <XIcon size={14} />
          </button>
        </header>

        {/* ===== Body ===== */}
        <div className="na-body">
          <div className="na-label" id={`${uid}-role`}>Role</div>
          <div className="na-roles" role="radiogroup" aria-labelledby={`${uid}-role`}>
            {ROLES.map(({ key, Icon, hint }) => {
              const active = form.role === key;
              return (
                <button
                  key={key}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  className={`na-role${active ? " na-role--active" : ""}`}
                  onClick={() => setForm((f) => ({ ...f, role: key }))}
                >
                  <span className="na-role__icon">
                    <Icon size={13} />
                  </span>
                  <span className="na-role__text">
                    <strong>{key}</strong>
                    <span>{hint}</span>
                  </span>
                  {active && (
                    <span className="na-role__check">
                      <CheckIcon size={9} strokeWidth={3} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="na-field">
            <label className="na-label" htmlFor={`${uid}-name`}>Full name</label>
            <input
              id={`${uid}-name`}
              className={`na-input${missing.fullName ? " is-invalid" : ""}`}
              value={form.fullName}
              onChange={set("fullName")}
              placeholder="e.g. Sara Nabil"
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="na-row">
            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-user`}>Username</label>
              <input
                id={`${uid}-user`}
                className={`na-input${taken || missing.username ? " is-invalid" : ""}`}
                value={form.username}
                onChange={set("username")}
                placeholder="e.g. sara.n"
                aria-invalid={taken}
                aria-describedby={taken ? `${uid}-user-err` : undefined}
                autoComplete="off"
              />
            </div>
            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-email`}>Email</label>
              <input
                id={`${uid}-email`}
                type="email"
                className={`na-input${missing.email ? " is-invalid" : ""}`}
                value={form.email}
                onChange={set("email")}
                placeholder="name@example.com"
                autoComplete="off"
              />
            </div>
          </div>

          {taken && (
            <p className="na-error" id={`${uid}-user-err`} role="alert">
              <AlertTriangleIcon size={11} /> Username already taken
            </p>
          )}

          <div className="na-info">
            <SendIcon size={13} className="na-info__icon" />
            <p>
              An invitation will be emailed to <strong>{form.email.trim() || "the email address"}</strong>.{" "}
              {firstName} activates the account herself (verify email + set password). The link
              works once and expires in 72 h (TBD). Status stays <strong>Invited</strong> until then.
            </p>
          </div>

          {form.role === "Teacher" && (
            <div className="na-field na-field--class">
              <label className="na-label" htmlFor={`${uid}-class`}>
                Assign to class <span>(optional — can be done later)</span>
              </label>
              <div className="na-select">
                <select
                  id={`${uid}-class`}
                  value={form.classId}
                  onChange={set("classId")}
                  className={form.classId ? "has-value" : ""}
                >
                  <option value="">Select a class</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDownIcon size={14} className="na-select__chev" />
              </div>
            </div>
          )}
        </div>

        {/* ===== Footer ===== */}
        <footer className="na-foot">
          <button type="button" className="btn-outline na-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn-primary na-submit">
            <SendIcon size={12} />
            Create &amp; send invitation
          </button>
        </footer>
      </form>
    </div>
  );
}