import { useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import NewAccountModal from "../components/Newaccountmodal";
import AccountDrawer from "../components/Accountdrawer";
import ConfirmDeactivateModal from "../components/ConfirmDeactivateModal";
import { RoleTag, StatusBadge } from "../components/AccountBadges";
import useAccounts from "./Useaccounts";
import { getInfo, getInitials } from "../data/Accounts";
import {
  PlusIcon,
  FilterIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  KebabIcon,
  LockIcon,
  RefreshIcon,
} from "../components/Icons";

const TABS = [
  { key: "All", count: 82 },
  { key: "Admin", label: "Admins", count: 3 },
  { key: "Teacher", label: "Teachers", count: 5 },
  { key: "Parent", label: "Parents", count: 74 },
];

const STATUS_OPTIONS = ["All", "Active", "Invited", "Invite expired", "Inactive"];

export default function Accounts() {
  const { accounts, addAccount, resendInvitation, updateAccount, setActive } = useAccounts();

  const [tab, setTab] = useState("All");
  const [status, setStatus] = useState("All");
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState(null); // الحساب المفتوح في الدراور
  const [deactivateId, setDeactivateId] = useState(null); // نافذة تأكيد الإيقاف
  const [modal, setModal] = useState(null); // null | { mode: "create" } | { mode: "resend", id }

  const rows = useMemo(
    () =>
      accounts.filter(
        (a) => (tab === "All" || a.role === tab) && (status === "All" || a.status === status)
      ),
    [accounts, tab, status]
  );

  const total = TABS.find((t) => t.key === tab).count;
  const selected = accounts.find((a) => a.id === selectedId);
  const deactivateTarget = accounts.find((a) => a.id === deactivateId);
  const resendTarget = modal?.mode === "resend" ? accounts.find((a) => a.id === modal.id) : null;

  /* ----- actions ----- */
  const openResend = (account) => {
    if (account.role === "Admin") {
      // الأدمن بيتعمل من صفحة Admins & privileges، فبنعيد إرسال الدعوة مباشرة
      resendInvitation(account.id, {
        fullName: account.name,
        username: account.username,
        email: account.email,
        role: "Admin",
        classId: "",
      });
      setSelectedId(account.id);
      return;
    }
    setSelectedId(null);
    setModal({ mode: "resend", id: account.id });
  };

  const openDeactivate = (account) => {
    setSelectedId(null);
    setDeactivateId(account.id);
  };

  const cancelDeactivate = () => {
    setSelectedId(deactivateId); // نرجع لصفحة تفاصيل الحساب
    setDeactivateId(null);
  };

  const confirmDeactivate = () => {
    setActive(deactivateId, false);
    setDeactivateId(null);
  };

  const closeModal = () => {
    // لو لغيت Resend بنرجع للدراور بتاع نفس الحساب
    if (modal?.mode === "resend") setSelectedId(modal.id);
    setModal(null);
  };

  const handleModalSubmit = (form) => {
    const id = modal.mode === "resend" ? resendInvitation(modal.id, form) : addAccount(form);
    setModal(null);
    setSelectedId(id); // يظهر الحساب بنفس شكل صفحة التفاصيل
  };

  const onRowKey = (e, id) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setSelectedId(id);
    }
  };

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  return (
    <>
      <Topbar
        title="Accounts"
        subtitle="Create, invite, activate and deactivate users. Deactivating never deletes history."
        actions={
          <button type="button" className="btn-primary" onClick={() => setModal({ mode: "create" })}>
            <PlusIcon size={13} />
            New account
          </button>
        }
      />

      <div className="content">
        <section className="panel acc-card">
          {/* ===== Toolbar ===== */}
          <div className="acc-toolbar">
            <div className="acc-tabs" role="tablist">
              {TABS.map(({ key, label, count }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  className={`acc-tab${tab === key ? " acc-tab--active" : ""}`}
                  onClick={() => setTab(key)}
                >
                  {label || key}
                  <span className="acc-tab__count">{count}</span>
                </button>
              ))}
            </div>

            <div className="acc-filter">
              <button
                type="button"
                className="btn-outline acc-filter__btn"
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
              >
                <FilterIcon size={12} />
                Status: {status}
                <ChevronDownIcon size={12} className="acc-filter__chev" />
              </button>

              {menuOpen && (
                <ul className="acc-menu" role="listbox">
                  {STATUS_OPTIONS.map((opt) => (
                    <li key={opt}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={status === opt}
                        className={status === opt ? "is-active" : ""}
                        onClick={() => {
                          setStatus(opt);
                          setMenuOpen(false);
                        }}
                      >
                        {opt}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ===== Table ===== */}
          <div className="acc-scroll">
            <table className="acc-table">
              <colgroup>
                <col style={{ width: "27.6%" }} />
                <col style={{ width: "18.3%" }} />
                <col style={{ width: "14.7%" }} />
                <col style={{ width: "14.4%" }} />
                <col style={{ width: "19.7%" }} />
                <col style={{ width: "5.3%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Assignment / info</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr
                    key={a.id}
                    className="acc-row"
                    tabIndex={0}
                    onClick={() => setSelectedId(a.id)}
                    onKeyDown={(e) => onRowKey(e, a.id)}
                  >
                    <td>
                      <div className="acc-user">
                        <span className={`avatar avatar--${a.avatar}`}>{getInitials(a.name)}</span>
                        <div>
                          <p className="acc-user__name">{a.name}</p>
                          <p className="acc-user__handle">{a.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="acc-email">{a.email}</td>
                    <td>
                      <RoleTag role={a.role} />
                    </td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
                    <td>
                      {a.status === "Invite expired" ? (
                        <button type="button" className="acc-resend" onClick={stop(() => openResend(a))}>
                          <RefreshIcon size={11} /> Resend
                        </button>
                      ) : (
                        <span className={`acc-info${a.infoTone ? ` acc-info--${a.infoTone}` : ""}`}>
                          {getInfo(a)}
                        </span>
                      )}
                    </td>
                    <td className="acc-actions">
                      {a.locked ? (
                        <LockIcon size={14} className="acc-lock" aria-label="Locked" />
                      ) : (
                        <button
                          type="button"
                          className="acc-kebab"
                          aria-label={`Open ${a.name}`}
                          onClick={stop(() => setSelectedId(a.id))}
                        >
                          <KebabIcon size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ===== Footer ===== */}
          <div className="acc-footer">
            <span>
              Showing 1–{rows.length} of {total}
            </span>

            <div className="pager">
              <button
                type="button"
                className="pager__btn"
                aria-label="Previous page"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeftIcon size={14} />
              </button>
              {[1, 2].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`pager__btn${page === n ? " pager__btn--active" : ""}`}
                  aria-current={page === n ? "page" : undefined}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className="pager__btn"
                aria-label="Next page"
                onClick={() => setPage((p) => Math.min(2, p + 1))}
              >
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* ===== Account details drawer ===== */}
      {selected && (
        <AccountDrawer
          key={selected.id}
          account={selected}
          existingUsernames={accounts.filter((a) => a.id !== selected.id).map((a) => a.username)}
          onClose={() => setSelectedId(null)}
          onResend={openResend}
          onSave={updateAccount}
          onDeactivate={openDeactivate}
          onSetActive={setActive}
        />
      )}

      {/* ===== Deactivate confirmation ===== */}
      {deactivateTarget && (
        <ConfirmDeactivateModal
          account={deactivateTarget}
          onCancel={cancelDeactivate}
          onConfirm={confirmDeactivate}
        />
      )}

      {/* ===== New account / Resend invitation ===== */}
      {modal && (
        <NewAccountModal
          key={modal.mode + (modal.id || "")}
          initial={
            resendTarget && {
              role: resendTarget.role,
              fullName: resendTarget.name,
              username: resendTarget.username,
              email: resendTarget.email,
              classId: resendTarget.classId || "",
            }
          }
          existingUsernames={accounts
            .filter((a) => a.id !== modal.id)
            .map((a) => a.username)}
          onClose={closeModal}
          onSubmit={handleModalSubmit}
        />
      )}
    </>
  );
}