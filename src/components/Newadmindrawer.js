import { useEffect, useId, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { hasAnyPrivilege } from "../data/Accounts";

import {
  XIcon,
  CheckIcon,
  LockIcon,
  SendIcon,
  HistoryIcon,
  AlertTriangleIcon,
} from "./Icons";

/*
  مفاتيح الصلاحيات متوافقة مع الأسماء الظاهرة في جدول الأدمن.
  كل صلاحية لها checkbox مستقل.
*/
const ADMIN_PRIVILEGES = [
  {
    key: "Teachers",
    title: "Teacher management",
    hint: "Create / deactivate teacher accounts",
  },
  {
    key: "Students",
    title: "Student & class management",
    hint: "Classes, students, transfers, teacher assignment",
  },
  {
    key: "Parents",
    title: "Parent management",
    hint: "Parent accounts and parent–student links",
  },
  {
    key: "Dashboard",
    title: "Dashboard & reports",
    hint: "View dashboard and analytics reports",
  },
  {
    key: "Admins",
    title: "Admin account management",
    hint: "Create admins and assign privileges",
  },
];

const EMPTY_FORM = {
  fullName: "",
  username: "",
  email: "",
  privileges: [],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewAdminDrawer({
  existingUsernames = [],
  onClose,
  onSubmit,
}) {
  const uid = useId();
  const { user } = useAuth();
  const currentAdmin = user
    ? { ...user, name: user.fullName || user.name || "Admin" }
    : null;

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const username = form.username.trim();
  const email = form.email.trim();
  const fullName = form.fullName.trim();

  const taken =
    username.length > 0 &&
    existingUsernames.some(
      (item) =>
        typeof item === "string" &&
        item.toLowerCase() === username.toLowerCase()
    );

  const bad = {
    fullName: submitted && !fullName,
    username: submitted && (!username || taken),
    email: submitted && !EMAIL_RE.test(email),
    privileges: submitted && form.privileges.length === 0,
  };

  const firstName = fullName.split(/\s+/)[0] || "the new admin";

  const set = (key) => (event) => {
    setForm((previous) => ({
      ...previous,
      [key]: event.target.value,
    }));
  };

  // كل صلاحية تتحدد وتت取消 بشكل مستقل.
  const toggle = (key) => {
    setForm((previous) => {
      const selected = previous.privileges.includes(key);

      return {
        ...previous,
        privileges: selected
          ? previous.privileges.filter((item) => item !== key)
          : [...previous.privileges, key],
      };
    });
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (
      saving ||
      !fullName ||
      !username ||
      taken ||
      !EMAIL_RE.test(email) ||
      form.privileges.length === 0
    ) {
      return;
    }

    // نحافظ على ترتيب الصلاحيات كما تظهر في الشاشة.
    const privileges = ADMIN_PRIVILEGES
      .filter((option) => form.privileges.includes(option.key))
      .map((option) => option.key);

    setSaving(true);
    setFormError("");

    try {
      await onSubmit?.({
        fullName,
        username,
        email,
        privileges,
      });
    } catch (error) {
      setFormError(error.message || "Failed to create admin. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="drawer-overlay nad-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <form
        className="drawer nad"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        onSubmit={handleSubmit}
        noValidate
      >
        {/* Header */}
        <header className="nad-head">
          <div className="nad-heading">
            <h2 className="na-title" id={`${uid}-title`}>
              New admin
            </h2>

            <p className="na-sub">
              Choose exactly what this admin can manage.
            </p>
          </div>

          <button
            type="button"
            className="na-close drawer__close"
            onClick={onClose}
            aria-label="Close"
          >
            <XIcon size={14} />
          </button>
        </header>

        {/* Body */}
        <div className="drawer__body nad-body">
          {/* Name and username */}
          <div className="na-row">
            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-name`}>
                Full name
              </label>

              <input
                id={`${uid}-name`}
                className={`na-input ${
                  bad.fullName ? "is-invalid" : ""
                }`}
                value={form.fullName}
                onChange={set("fullName")}
                placeholder="e.g. Dina Mourad"
                autoComplete="off"
                aria-invalid={Boolean(bad.fullName)}
              />

              {bad.fullName && (
                <p className="na-error" role="alert">
                  <AlertTriangleIcon size={11} />
                  Enter the full name
                </p>
              )}
            </div>

            <div className="na-field">
              <label className="na-label" htmlFor={`${uid}-user`}>
                Username
              </label>

              <input
                id={`${uid}-user`}
                className={`na-input ${
                  bad.username ? "is-invalid" : ""
                }`}
                value={form.username}
                onChange={set("username")}
                placeholder="e.g. dina.m"
                autoComplete="off"
                aria-invalid={Boolean(bad.username)}
              />

              {taken && (
                <p className="na-error" role="alert">
                  <AlertTriangleIcon size={11} />
                  Username already taken
                </p>
              )}

              {submitted && !username && (
                <p className="na-error" role="alert">
                  Enter a username
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="na-field nad-email-field">
            <label className="na-label" htmlFor={`${uid}-email`}>
              Email
            </label>

            <input
              id={`${uid}-email`}
              type="email"
              className={`na-input ${
                bad.email ? "is-invalid" : ""
              }`}
              value={form.email}
              onChange={set("email")}
              placeholder="name@example.com"
              autoComplete="off"
              aria-invalid={Boolean(bad.email)}
            />

            {bad.email && (
              <p className="na-error" role="alert">
                <AlertTriangleIcon size={11} />
                Enter a valid email address
              </p>
            )}
          </div>

          {/* Privileges */}
          <div
            className="na-label nad-privs-label"
            id={`${uid}-privs`}
          >
            Privileges
          </div>

          <div
            className="nad-privs"
            role="group"
            aria-labelledby={`${uid}-privs`}
          >
            {ADMIN_PRIVILEGES.map(({ key, title, hint }) => {
              const disabled = !hasAnyPrivilege(currentAdmin, [key]);

              const checked =
                !disabled && form.privileges.includes(key);

              return (
                <label
                  key={key}
                  className={[
                    "nad-priv",
                    checked ? "nad-priv--on" : "",
                    disabled ? "nad-priv--disabled" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <input
                    type="checkbox"
                    className="nad-priv__input"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggle(key)}
                  />

                  <span
                    className="nad-priv__box"
                    aria-hidden="true"
                  >
                    {disabled ? (
                      <LockIcon size={9} />
                    ) : checked ? (
                      <CheckIcon
                        size={10.5}
                        strokeWidth={2.6}
                      />
                    ) : null}
                  </span>

                  <span className="nad-priv__text">
                    <strong>{title}</strong>
                    <span>
                      {disabled
                        ? "You don’t hold this privilege, so you can’t grant it."
                        : hint}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>

          {bad.privileges && (
            <p className="na-error nad-error" role="alert">
              <AlertTriangleIcon size={11} />
              Select at least one privilege
            </p>
          )}

          {formError && <p className="na-error nad-error" role="alert">{formError}</p>}

          {/* Audit */}
          <div className="na-info nad-audit">
            <HistoryIcon
              size={13}
              className="na-info__icon"
            />

            <p>
              Audit: this admin will be recorded as{" "}
              <strong>
                created by {currentAdmin?.name || "you"}
              </strong>{" "}
              with the privileges above (FR-09). An invitation is
              emailed to {firstName} to activate the account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="drawer__foot nad-foot">
          <button
            type="button"
            className="btn-outline drawer__btn nad-cancel"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn-primary drawer__btn nad-submit"
            disabled={saving}
          >
            <SendIcon size={12} />
            <span>
              {saving ? "Creating admin..." : "Create & send invitation"}
            </span>
          </button>
        </footer>
      </form>
    </div>
  );
}