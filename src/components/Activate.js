import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import AuthBrand from "../components/AuthBrand";
import useAccounts from "./Useaccounts";
import {
  UserIcon,
  ShieldIcon,
  MailIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  InfoIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "../components/Icons";
import {
  NURSERY_NAME,
  PASSWORD_RULES,
  hashPassword,
  isPasswordAcceptable,
  landingPathFor,
  passwordStrength,
} from "../data/Auth";

// حساب تجريبي لمعاينة الصفحتين من غير ما تحتاج أدمن جديد: /activate?demo=1
const DEMO_ACCOUNT = {
  id: "demo",
  name: "Mariam Fathy",
  role: "Admin",
  email: "mariam@kidoo.app",
  username: "mariam.f",
  status: "Invited",
};

/** أيقونة التطبيق (مربع سماوي بوش مبتسم) */
function AppMark() {
  return (
    <svg className="act-mark" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <rect width="22" height="22" rx="6" fill="#22C1E6" />
      <circle cx="8.5" cy="9.4" r="3" fill="#FFB547" />
      <circle cx="14.4" cy="10.6" r="1.9" fill="#fff" />
      <path d="M5 13.6Q11 19.6 17 13.6" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

/** صف بيانات للقراءة بس (مقفول) */
function DetailRow({ Icon, label, value, pill }) {
  return (
    <div className="act-row">
      <Icon size={14} className="act-row__icon" />
      <div className="act-row__text">
        <span className="act-row__label">{label}</span>
        <span className="act-row__value">{value}</span>
      </div>
      {pill && <span className="act-pill">{pill}</span>}
      <LockIcon size={12} className="act-row__lock" aria-label="Locked" />
    </div>
  );
}

/**
 * تفعيل حساب أدمن جديد (بعد الدعوة):
 *   الخطوة 1: Welcome — مراجعة البيانات (للقراءة فقط)
 *   الخطوة 2: Create a password — إنشاء كلمة المرور ثم الدخول
 * الرابط: /activate?u=<username>   (للمعاينة: /activate?demo=1)
 */
export default function Activate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { accounts, activateAccount, setSessionId } = useAccounts();

  const demo = params.has("demo");
  const username = (params.get("u") || "").trim().toLowerCase();
  const account = demo
    ? DEMO_ACCOUNT
    : accounts.find((a) => a.role === "Admin" && a.username.toLowerCase() === username);

  const [step, setStep] = useState("welcome"); // welcome | password
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  /* ----- حماية: لازم يكون حساب أدمن لسه دعوته ما اتفعّلتش ----- */
  if (!account) {
    return <Navigate to="/login" replace state={{ error: "This activation link isn’t valid." }} />;
  }
  if (account.status === "Invite expired") {
    return (
      <Navigate
        to="/login"
        replace
        state={{ error: "This invitation has expired. Ask your nursery admin to send a new one." }}
      />
    );
  }
  if (account.status !== "Invited") {
    return <Navigate to="/login" replace />; // الحساب متفعّل بالفعل -> صفحة اللوجن العادية
  }

  const firstName = account.name.trim().split(" ")[0];
  const strength = passwordStrength(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = isPasswordAcceptable(password) && confirm === password && !submitting;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      if (demo) {
        navigate("/login");
        return;
      }
      const hash = await hashPassword(password);
      activateAccount(account.id, hash); // الحالة -> Active + تسجيل الحدث
      setSessionId(account.id); // دخول تلقائي
      navigate(landingPathFor(account), { replace: true });
    } catch (err) {
      setError(err?.message || "Couldn’t create the password. Please try again.");
      setSubmitting(false);
    }
  };

  /* ================= الخطوة 1: Welcome ================= */
  if (step === "welcome") {
    return (
      <div className="login-page">
        <AuthBrand />

        <main className="login-main act-main">
          <section className="act-welcome">
            <AppMark />

            <h2 className="act-welcome__title">Welcome, {firstName}!</h2>
            <p className="act-welcome__text">
              {NURSERY_NAME} set up your account. Check your details, then create a password.
            </p>

            <div className="act-card" aria-label="Your account details">
              <DetailRow Icon={UserIcon} label="Full name" value={account.name} />
              <DetailRow Icon={ShieldIcon} label="Role" value={account.role} pill={account.role} />
              <DetailRow Icon={MailIcon} label="Email" value={account.email} />
              <DetailRow Icon={UserIcon} label="Username" value={account.username} />
            </div>

            <p className="act-info">
              <InfoIcon size={13} />
              <span>
                Details are set by the nursery and can’t be changed here. Something wrong? Contact your
                nursery admin.
              </span>
            </p>

            <button type="button" className="login-btn act-continue" onClick={() => setStep("password")}>
              Continue
            </button>
          </section>
        </main>
      </div>
    );
  }

  /* ================= الخطوة 2: Create a password ================= */
  return (
    <div className="login-page">
      <AuthBrand />

      <main className="login-main">
        <form className="act-form" onSubmit={handleSubmit} noValidate>
          <h2 className="login-card__title">Create a password</h2>
          <p className="act-form__sub">
            You’ll use it with <strong>{account.username}</strong> to log in.
          </p>

          {/* New password */}
          <label className="act-label" htmlFor="new-password">New password</label>
          <div className="act-input">
            <LockIcon size={14} className="act-input__icon" />
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
            />
            <button
              type="button"
              className="act-eye"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
            </button>
          </div>

          <div
            className="act-meter"
            role="progressbar"
            aria-label="Password strength"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={strength.percent}
          >
            <span className={`act-meter__fill act-meter__fill--${strength.tone}`} style={{ width: `${strength.percent}%` }} />
          </div>

          <ul className="act-rules">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
              return (
                <li key={rule.key} className={`act-rule${ok ? " act-rule--ok" : ""}`}>
                  {ok ? <CheckCircleIcon size={12} /> : <InfoIcon size={12} />}
                  {rule.label}
                </li>
              );
            })}
          </ul>

          {/* Confirm password */}
          <label className="act-label act-label--confirm" htmlFor="confirm-password">Confirm password</label>
          <div className={`act-input${mismatch ? " act-input--error" : ""}`}>
            <LockIcon size={14} className="act-input__icon" />
            <input
              id="confirm-password"
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              aria-invalid={mismatch}
            />
            <button
              type="button"
              className="act-eye"
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOffIcon size={15} /> : <EyeIcon size={15} />}
            </button>
          </div>

          {mismatch && (
            <p className="act-error" role="alert">
              <AlertTriangleIcon size={12} /> Password don’t match
            </p>
          )}

          {error && (
            <p className="act-error" role="alert">
              <AlertTriangleIcon size={12} /> {error}
            </p>
          )}

          {/* الزر بيظهر لما الباسورد يبقى مقبول ومتطابق (من غير ما يحرّك باقي الصفحة) */}
          {canSubmit && (
            <button type="submit" className="login-btn act-submit">
              Create password
            </button>
          )}
        </form>
      </main>
    </div>
  );
}