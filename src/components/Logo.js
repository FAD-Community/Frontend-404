// variant="brand"   -> على الخلفية السماوي (صفحة Login)
// variant="default" -> على الخلفية البيضاء (Sidebar)
export default function Logo({ variant = "default" }) {
  const brand = variant === "brand";

  return (
    <div className={`kd-logo kd-logo--${variant}`} aria-label="Kidoo">
      {brand ? (
        <svg className="kd-logo__mark" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="15.5" cy="4.5" r="3" fill="#FFB347" />
          <path d="M2 9.5c1.2 5.2 8.8 7.2 13 2.4" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        </svg>
      ) : (
        <svg className="kd-logo__mark" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <rect width="22" height="22" rx="6" fill="#22C1E6" />
          <circle cx="8.5" cy="9.4" r="3" fill="#FFB547" />
          <circle cx="14.4" cy="10.6" r="1.9" fill="#fff" />
          <path d="M5 13.6Q11 19.6 17 13.6" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      )}

      <span className="kd-logo__word">
        kid
        {brand ? (
          <svg className="kd-logo__oo" viewBox="0 0 30 14" fill="none" aria-hidden="true">
            <circle cx="7" cy="7" r="5.2" stroke="#fff" strokeWidth="3.2" />
            <circle cx="22" cy="7" r="5.2" stroke="#fff" strokeWidth="3.2" />
          </svg>
        ) : (
          <svg className="kd-logo__oo" viewBox="0 0 21 10.5" fill="none" aria-hidden="true">
            <circle cx="5.25" cy="5.25" r="3.6" stroke="#22C1E6" strokeWidth="3.3" />
            <circle cx="15.75" cy="5.25" r="3.6" stroke="#22C1E6" strokeWidth="3.3" />
          </svg>
        )}
      </span>
    </div>
  );
}