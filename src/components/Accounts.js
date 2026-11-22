import { useCallback, useEffect, useState } from "react";
import { getAccounts } from "../api/accounts.api";
import Topbar from "./Topbar";
import NewAccountModal from "./Newaccountmodal";
import AccountDrawer from "./Accountdrawer";
import ConfirmDeactivateModal from "./ConfirmDeactivateModal";
import { RoleTag, StatusBadge } from "./AccountBadges";
import useAccounts from "./Useaccounts";
import {
  getInfo,
  getInfoTone,
  getInitials,
  mapAccountFromApi,
} from "../data/Accounts";
import {
  PlusIcon,
  FilterIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilIcon,
  LockIcon,
  RefreshIcon,
} from "./Icons";

const PAGE_SIZE = 8;

const TABS = [
  { key: "All", label: "All", role: "" },
  { key: "Admin", label: "Admins", role: "Admin" },
  { key: "Teacher", label: "Teachers", role: "Teacher" },
  { key: "Parent", label: "Parents", role: "Parent" },
];

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "Active", value: "Active" },
  { label: "Invited", value: "Invited" },
  { label: "Invite expired", value: "InviteExpired" },
  { label: "Inactive", value: "Inactive" },
];

export default function Accounts() {
  const {
    createAccount,
    resendInvitation,
    updateEmail,
    setActive,
    checkUsername,
  } = useAccounts();

  const [tab, setTab] = useState("All");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState(null);
  const [drawerEditMode, setDrawerEditMode] = useState(false);
  const [drawerOpenSeq, setDrawerOpenSeq] = useState(0);
  const [accountSnapshot, setAccountSnapshot] = useState(null);
  const [deactivateId, setDeactivateId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [resendingId, setResendingId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const reloadAccounts = useCallback(() => {
    setReloadKey((current) => current + 1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  const patchRowState = useCallback((id, updater) => {
    setRows((prev) =>
      prev.map((acc) => {
        if (acc.id !== id) return acc;
        const next = updater(acc);
        return {
          ...next,
          info: getInfo(next),
          infoTone: getInfoTone(next),
        };
      })
    );
    setAccountSnapshot((prev) => {
      if (!prev || prev.id !== id) return prev;
      const next = updater(prev);
      return {
        ...next,
        info: getInfo(next),
        infoTone: getInfoTone(next),
      };
    });
  }, []);

  /* ----- Resend invitation (Drawer & Table row) ----- */
  const handleResend = async (account) => {
    setActionError("");
    try {
      const res = await resendInvitation(account.id);
      patchRowState(account.id, (acc) => ({
        ...acc,
        status: "Invited",
        rawStatus: "Invited",
        invitation: {
          sentAt: res?.sentAt || new Date().toISOString(),
          expiresAt: res?.expiresAt || null,
        },
      }));
      reloadAccounts();
      return res;
    } catch (err) {
      if (err?.invitationSaved && err.raw) {
        patchRowState(account.id, (acc) => ({
          ...acc,
          status: "Invited",
          rawStatus: "Invited",
          invitation: {
            sentAt: err.raw.sentAt || new Date().toISOString(),
            expiresAt: err.raw.expiresAt || null,
          },
        }));
        reloadAccounts();
      }
      throw err;
    }
  };

  const handleRowResend = async (account) => {
    setResendingId(account.id);
    setActionError("");
    try {
      await handleResend(account);
      openDrawer(account, false);
    } catch (err) {
      setActionError(err.message || "Failed to resend invitation.");
    } finally {
      setResendingId(null);
    }
  };

  /* ----- Edit email (PUT /accounts/{id}/email) ----- */
  const handleSaveEmail = async (id, email) => {
    setActionError("");
    try {
      const res = await updateEmail(id, email);
      patchRowState(id, (acc) => ({
        ...acc,
        email: res?.sentTo || email,
        status: "Invited",
        rawStatus: "Invited",
        invitation: {
          sentAt: res?.sentAt || new Date().toISOString(),
          expiresAt: res?.expiresAt || null,
        },
      }));
      reloadAccounts();
      return res;
    } catch (err) {
      if (err?.invitationSaved && err.raw) {
        patchRowState(id, (acc) => ({
          ...acc,
          email: err.raw.sentTo || email,
          status: "Invited",
          rawStatus: "Invited",
          invitation: {
            sentAt: err.raw.sentAt || new Date().toISOString(),
            expiresAt: err.raw.expiresAt || null,
          },
        }));
        reloadAccounts();
      }
      throw err;
    }
  };

  /* ----- Deactivate (POST /accounts/{id}/deactivate) ----- */
  const openDeactivate = (account) => {
    setActionError("");
    setAccountSnapshot(account);
    setSelectedId(null);
    setDeactivateId(account.id);
  };

  const cancelDeactivate = () => {
    setDrawerEditMode(false);
    setDrawerOpenSeq((s) => s + 1);
    setSelectedId(deactivateId);
    setDeactivateId(null);
  };

  const confirmDeactivate = async () => {
    const targetId = deactivateId;
    setActionError("");
    try {
      await setActive(targetId, false);
      patchRowState(targetId, (acc) => ({
        ...acc,
        status: "Inactive",
        rawStatus: "Inactive",
        classes: acc.role === "Teacher" ? [] : acc.classes,
        classId: acc.role === "Teacher" ? "" : acc.classId,
      }));
      setDeactivateId(null);
      reloadAccounts();
    } catch (err) {
      setDeactivateId(null);
      setActionError(err.message || "Failed to deactivate account.");
    }
  };

  /* ----- Reactivate (POST /accounts/{id}/reactivate) ----- */
  const handleReactivate = async (id) => {
    setActionError("");
    const current =
      rows.find((acc) => acc.id === id) ||
      (accountSnapshot?.id === id ? accountSnapshot : null);

    await setActive(id, true);
    reloadAccounts();

    if (current?.username) {
      try {
        const res = await getAccounts({
          search: current.username,
          page: 1,
          pageSize: 20,
        });
        const items = Array.isArray(res) ? res : res?.items || [];
        const fresh = items.find((item) => item.id === id);
        if (fresh) {
          setAccountSnapshot(mapAccountFromApi(fresh));
        }
      } catch {
        // reloadAccounts سيتكفل بالتحديث
      }
    }
  };

  /* ----- Create account (POST /accounts) ----- */
  const handleModalSubmit = async (form) => {
    const created = await createAccount(form);
    const mapped = mapAccountFromApi(created);
    setModalOpen(false);
    reloadAccounts();
    if (mapped?.id) {
      openDrawer(mapped, false);
    }
  };

  const openDrawer = (account, startEditing = false) => {
    setActionError("");
    setAccountSnapshot(account);
    setDrawerEditMode(Boolean(startEditing));
    setDrawerOpenSeq((s) => s + 1);
    setSelectedId(account.id);
  };

  const onRowKey = (e, account) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openDrawer(account, false);
    }
  };

  const stop = (fn) => (e) => {
    e.stopPropagation();
    fn();
  };

  const tabCount = (key) => {
    const countKey = {
      Admin: "admins",
      Teacher: "teachers",
      Parent: "parents",
    }[key];

    if (key === "All") {
      if (typeof counts.all === "number") return counts.all;
      return (
        (counts.admins || 0) +
        (counts.teachers || 0) +
        (counts.parents || 0)
      );
    }

    return counts[countKey] || 0;
  };

  const selected =
    rows.find((account) => account.id === selectedId) ||
    (accountSnapshot?.id === selectedId ? accountSnapshot : null);

  const deactivateTarget =
    rows.find((account) => account.id === deactivateId) ||
    (accountSnapshot?.id === deactivateId ? accountSnapshot : null);

  useEffect(() => {
    let isCurrent = true;

    async function loadAccounts() {
      setLoading(true);
      setError("");

      try {
        const selectedTab = TABS.find((item) => item.key === tab);

        const data = await getAccounts({
          search: debouncedSearch,
          role: selectedTab?.role || "",
          status,
          page,
          pageSize: PAGE_SIZE,
        });

        if (!isCurrent) return;

        const rawItems = Array.isArray(data) ? data : data?.items || [];
        const items = rawItems.map(mapAccountFromApi);

        setRows(items);
        setCounts(data?.counts || {});
        setTotal(
          Array.isArray(data) ? data.length : data?.total ?? items.length
        );
      } catch (err) {
        if (!isCurrent) return;
        setError(err.message || "Failed to load accounts. Please try again.");
        setRows([]);
        setCounts({});
        setTotal(0);
      } finally {
        if (isCurrent) setLoading(false);
      }
    }

    loadAccounts();

    return () => {
      isCurrent = false;
    };
  }, [tab, status, debouncedSearch, page, reloadKey]);

  return (
    <>
      <Topbar
        title="Accounts"
        subtitle="Create, invite, activate and deactivate users. Deactivating never deletes history."
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search name, username, email..."
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setModalOpen(true)}
          >
            <PlusIcon size={13} />
            New account
          </button>
        }
      />

      <div className="content">
        <section className="panel acc-card">
          {/* Toolbar */}
          <div className="acc-toolbar">
            <div className="acc-tabs" role="tablist">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={tab === key}
                  className={`acc-tab${tab === key ? " acc-tab--active" : ""}`}
                  onClick={() => {
                    setTab(key);
                    setPage(1);
                    setSelectedId(null);
                    setAccountSnapshot(null);
                  }}
                >
                  {label || key}
                  <span className="acc-tab__count">{tabCount(key)}</span>
                </button>
              ))}
            </div>

            <div className="acc-filter">
              <button
                type="button"
                className="btn-outline acc-filter__btn"
                aria-haspopup="listbox"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((current) => !current)}
              >
                <FilterIcon size={12} />
                Status:{" "}
                {STATUS_OPTIONS.find((option) => option.value === status)
                  ?.label || "All"}
                <ChevronDownIcon size={12} className="acc-filter__chev" />
              </button>

              {menuOpen && (
                <ul className="acc-menu" role="listbox">
                  {STATUS_OPTIONS.map((option) => (
                    <li key={option.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={status === option.value}
                        className={status === option.value ? "is-active" : ""}
                        onClick={() => {
                          setStatus(option.value);
                          setPage(1);
                          setMenuOpen(false);
                        }}
                      >
                        {option.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {actionError && (
            <div className="drawer-alert" role="alert">
              <p>{actionError}</p>
            </div>
          )}

          {/* Table */}
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
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading accounts...</td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6}>
                      <div role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={reloadAccounts}>
                          Try again
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No accounts found.</td>
                  </tr>
                ) : (
                  rows.map((account) => (
                    <tr
                      key={account.id}
                      className="acc-row"
                      tabIndex={0}
                      onClick={() => openDrawer(account, false)}
                      onKeyDown={(e) => onRowKey(e, account)}
                    >
                      <td>
                        <div className="acc-user">
                          <span className={`avatar avatar--${account.avatar}`}>
                            {getInitials(account.name)}
                          </span>
                          <div>
                            <p className="acc-user__name">{account.name}</p>
                            <p className="acc-user__handle">
                              {account.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="acc-email">{account.email}</td>

                      <td>
                        <RoleTag role={account.role} />
                      </td>

                      <td>
                        <StatusBadge status={account.status} />
                      </td>

                      <td>
                        {account.status === "Invite expired" ? (
                          <button
                            type="button"
                            className="acc-resend"
                            disabled={resendingId === account.id}
                            onClick={stop(() => handleRowResend(account))}
                          >
                            <RefreshIcon size={11} />
                            {resendingId === account.id
                              ? "Sending..."
                              : "Resend"}
                          </button>
                        ) : (
                          <span
                            className={`acc-info${
                              account.infoTone
                                ? ` acc-info--${account.infoTone}`
                                : ""
                            }`}
                          >
                            {account.info}
                          </span>
                        )}
                      </td>

                      <td className="acc-actions">
                        {account.locked ? (
                          <LockIcon
                            size={14}
                            className="acc-lock"
                            aria-label="Locked"
                          />
                        ) : (
                          <button
                            type="button"
                            className="acc-kebab"
                            aria-label={`Edit ${account.name}`}
                            title="Edit"
                            onClick={stop(() => openDrawer(account, true))}
                          >
                            <PencilIcon size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer / Pagination */}
          <div className="acc-footer">
            <span>
              Showing {rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}
              {"–"}
              {(page - 1) * PAGE_SIZE + rows.length} of {total}
            </span>

            <div className="pager">
              <button
                type="button"
                className="pager__btn"
                aria-label="Previous page"
                disabled={loading || page <= 1}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
              >
                <ChevronLeftIcon size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                (pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    className={`pager__btn${
                      page === pageNumber ? " pager__btn--active" : ""
                    }`}
                    aria-current={page === pageNumber ? "page" : undefined}
                    disabled={loading}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                )
              )}

              <button
                type="button"
                className="pager__btn"
                aria-label="Next page"
                disabled={loading || page >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
              >
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Account details drawer */}
      {selected && (
        <AccountDrawer
          key={`${selected.id}-${drawerOpenSeq}`}
          account={selected}
          initialEditing={drawerEditMode}
          onClose={() => {
            setSelectedId(null);
            setAccountSnapshot(null);
            setDrawerEditMode(false);
          }}
          onResend={handleResend}
          onSave={handleSaveEmail}
          onDeactivate={openDeactivate}
          onSetActive={handleReactivate}
        />
      )}

      {/* Deactivate confirmation */}
      {deactivateTarget && (
        <ConfirmDeactivateModal
          account={deactivateTarget}
          onCancel={cancelDeactivate}
          onConfirm={confirmDeactivate}
        />
      )}

      {/* New account */}
      {modalOpen && (
        <NewAccountModal
          onCheckUsername={checkUsername}
          onClose={() => setModalOpen(false)}
          onSubmit={handleModalSubmit}
        />
      )}
    </>
  );
}