import { NavLink, useNavigate } from "react-router-dom";
import Logo from "./Logo";
import useAccounts from "./Useaccounts";
import { hasAnyPrivilege, getInitials } from "../data/Accounts";
import {
  DashboardIcon,
  UsersIcon,
  ShieldIcon,
  CapIcon,
  SmileIcon,
  LinkIcon,
  LogoutIcon,
} from "./Icons";

// عدّل الروابط هنا مرة واحدة وتتغير في كل الصفحات
// needs: الصلاحيات المطلوبة لفتح الصفحة (لو الأدمن ما عندوش أي واحدة منهم اللينك بيتعطّل)
const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", Icon: DashboardIcon, needs: ["Dashboard"] },
  { to: "/accounts", label: "Accounts", Icon: UsersIcon, needs: ["Teachers", "Parents", "Admins"] },
  { to: "/admins", label: "Admins & privileges", Icon: ShieldIcon, needs: ["Admins"] },
  { to: "/classes", label: "Classes", Icon: CapIcon, needs: ["Teachers", "Students"] },
  { to: "/students", label: "Students", Icon: SmileIcon, needs: ["Students"] },
  { to: "/parentlinks", label: "ParentLinks", Icon: LinkIcon, needs: ["Parents"] },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { currentAdmin } = useAccounts();

  const name = currentAdmin?.name || "Admin";
  const roleLabel = currentAdmin?.status === "Default" ? "Default admin" : currentAdmin?.role || "Admin";

  const handleLogout = () => {
    // TODO: امسح التوكن / الجلسة هنا
    navigate("/login");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar__logo">
        <Logo />
      </div>

      <p className="sidebar__section">MANAGE</p>

      <nav className="sidebar__nav" aria-label="Main">
        {NAV_ITEMS.map(({ to, label, Icon, needs }) =>
          hasAnyPrivilege(currentAdmin, needs) ? (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `sidebar__link${isActive ? " sidebar__link--active" : ""}`
              }
            >
              <Icon size={15} />
              <span>{label}</span>
            </NavLink>
          ) : (
            <span
              key={to}
              className="sidebar__link sidebar__link--disabled"
              aria-disabled="true"
              title="You don’t have access to this page"
            >
              <Icon size={15} />
              <span>{label}</span>
            </span>
          )
        )}
      </nav>

      <div className="sidebar__user">
        <span className={`sidebar__avatar avatar--${currentAdmin?.avatar || "cyan"}`}>
          {getInitials(name)}
        </span>
        <div className="sidebar__user-info">
          <strong>{name}</strong>
          <span>{roleLabel}</span>
        </div>
        <button
          type="button"
          className="sidebar__logout"
          onClick={handleLogout}
          aria-label="Log out"
        >
          <LogoutIcon size={14} />
        </button>
      </div>
    </aside>
  );
}