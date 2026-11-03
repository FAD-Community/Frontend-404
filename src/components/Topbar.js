import { SearchIcon, CalendarIcon } from "./Icons";

// شريط علوي مشترك.
// - title / subtitle: من كل صفحة
// - actions: (اختياري) زر مخصص للصفحة، لو مش موجود بيظهر زر "Today"
export default function Topbar({ title, subtitle, actions }) {
  return (
    <header className="topbar">
      <div>
        <h1 className="topbar__title">{title}</h1>
        {subtitle && <p className="topbar__subtitle">{subtitle}</p>}
      </div>

      <div className="topbar__actions">
        <label className="topbar__search">
          <SearchIcon size={14} />
          <input type="search" placeholder="Search name, username, code..." />
        </label>

        {actions ?? (
          <button type="button" className="btn-outline">
            <CalendarIcon size={12} />
            Today
          </button>
        )}
      </div>
    </header>
  );
}