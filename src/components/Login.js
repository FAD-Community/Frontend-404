import { useState } from "react";


/* ---------------- Icons ---------------- */
const UserIcon = () => (
  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
  </svg>
);

const LockIcon = () => (
  <svg className="login-input-icon" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" />}
  </svg>
);

const AlertIcon = () => (
  <svg className="login-error__icon" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

/* ---------------- Logo (Kidoo) ---------------- */
const KidooLogo = () => (
  <div className="login-logo" aria-label="Kidoo">
    {/* smiley mark */}
    <svg className="login-logo__mark" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="15.5" cy="4.5" r="3" fill="#FFB347" />
      <path d="M2 9.5c1.2 5.2 8.8 7.2 13 2.4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>

    {/* wordmark */}
    <span className="login-logo__word">
      kid
      <svg className="login-logo__oo" viewBox="0 0 30 14" fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="5.2" stroke="#fff" strokeWidth="3.2" />
        <circle cx="22" cy="7" r="5.2" stroke="#fff" strokeWidth="3.2" />
      </svg>
    </span>
  </div>
);

/* ---------------- Page ---------------- */
export default function Login() {
  const [username, setUsername] = useState("Ahlam Mahmoud");
  const [password, setPassword] = useState("••••••••••");
  const [showPassword, setShowPassword] = useState(false);

  // الرسالة اللي في الصورة. خليها null لو عاوزها تظهر بس بعد فشل تسجيل الدخول
  const [error, setError] = useState(
    "This account is inactive. Contact the nursery owner. (FR-04)"
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: اربط هنا الـ API بتاع تسجيل الدخول
    // setError(null) عند النجاح  |  setError("رسالة الخطأ") عند الفشل
  };

  return (
    <div className="login-page">
      {/* ===== Left brand panel ===== */}
      <aside className="login-brand">
        <KidooLogo />

        <div className="login-hero">
          <h1 className="login-hero__title">
            Run your nursery, keep every parent in the loop.
          </h1>
          <p className="login-hero__text">
            Admin dashboard for accounts, classes, students and daily insights.
          </p>
        </div>

        <div className="login-brand__footer">© 2026 Kidoo</div>

        <span className="login-circle login-circle--big" />
        <span className="login-circle login-circle--orange" />
      </aside>

      {/* ===== Right form ===== */}
      <main className="login-main">
        <form className="login-card" onSubmit={handleSubmit} noValidate>
          <h2 className="login-card__title">Admin log in</h2>
          <p className="login-card__subtitle">
            Use the account created for you by the nursery.
          </p>

          <div className="login-field">
            <label className="login-label" htmlFor="username">
              Username or email
            </label>
            <div className="login-input-wrap login-input-wrap--active">
              <UserIcon />
              <input
                id="username"
                className="login-input"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">
              Password
            </label>
            <div className="login-input-wrap">
              <LockIcon />
              <input
                id="password"
                className="login-input"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="login-eye"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <EyeIcon off={showPassword} />
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn">
            Log in
          </button>

          {error && (
            <div className="login-error" role="alert">
              <AlertIcon />
              <span>
                <strong>Error state:</strong> “{error}”
              </span>
            </div>
          )}

          <p className="login-note">Teachers and parents use the Kidoo mobile app.</p>
        </form>
      </main>
    </div>
  );
}