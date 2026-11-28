import { useCallback, useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import NewAdminDrawer from "../components/Newadmindrawer";
import EditPrivilegesDrawer from "../components/Editprivilegesdrawer";
import NoAccess from "./Noaccess";
import { useAuth } from "../context/AuthContext";
import { getAdminAudit, listAdmins, createAdmin, updateAdminPrivileges } from "../api/admins.api";
import {
  fmtDate,
  getInitials,
  hasAnyPrivilege,
  privilegeTitle,
} from "../data/Accounts";
import { PlusIcon, LockIcon, ChevronLeftIcon, ChevronRightIcon } from "../components/Icons";

const PAGE_SIZE = 8;
const STATUS_OPTIONS = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
];

function createdBy(admin) {
  if (admin.status === "Default") return "System setup";
  if (!admin.createdBy?.fullName) return admin.createdAt ? fmtDate(admin.createdAt) : "—";
  const date = fmtDate(admin.createdAt);
  return date
    ? `${admin.createdBy.fullName.trim().split(/\s+/)[0]} · ${date}`
    : admin.createdBy.fullName;
}

function AdminStatus({ status }) {
  if (status === "Default") {
    return (
      <span className="tag tag--slate tag--icon">
        <LockIcon size={9} /> Can’t edit
      </span>
    );
  }
  if (status === "Active") return <span className="tag tag--green">Active</span>;
  if (status === "Pending") return <span className="tag tag--blue">Pending</span>;
  if (status === "Inactive") return <span className="tag tag--slate">Inactive</span>;
  return <span className="tag tag--slate">{status}</span>;
}

export default function Admins() {
  const { user, loading: authLoading } = useAuth();
  const currentAdmin = user
    ? { ...user, name: user.fullName || user.name || "Admin" }
    : null;
  const hasAdminManagement =
    user?.role === "Admin" && hasAnyPrivilege(user, ["Admins"]);

  const [admins, setAdmins] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [newAdminOpen, setNewAdminOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [audit, setAudit] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const editing = useMemo(
    () => admins.find((admin) => String(admin.id) === String(editId)) || null,
    [admins, editId]
  );
  const reload = useCallback(() => setReloadKey((current) => current + 1), []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!hasAdminManagement) return undefined;
    const controller = new AbortController();
    let active = true;

    async function loadAdmins() {
      setLoading(true);
      setError("");
      try {
        const result = await listAdmins({
          search: debouncedSearch,
          status,
          page,
          pageSize: PAGE_SIZE,
          signal: controller.signal,
        });
        if (active) {
          setAdmins(result.items);
          setTotal(result.total);
          if (result.items.length === 0 && page > 1) setPage((current) => current - 1);
        }
      } catch (requestError) {
        if (active && requestError?.name !== "AbortError") {
          setError(requestError.message || "Failed to load admins.");
          setAdmins([]);
          setTotal(0);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAdmins();
    return () => {
      active = false;
      controller.abort();
    };
  }, [hasAdminManagement, debouncedSearch, status, page, reloadKey]);

  useEffect(() => {
    if (!editId || !hasAdminManagement) return undefined;
    const controller = new AbortController();
    let active = true;
    setAudit([]);
    setAuditError("");
    setAuditLoading(true);

    getAdminAudit(editId, { page: 1, pageSize: 100, signal: controller.signal })
      .then((result) => {
        if (active) setAudit(result.items);
      })
      .catch((requestError) => {
        if (active && requestError?.name !== "AbortError") {
          setAuditError(requestError.message || "Failed to load audit history.");
        }
      })
      .finally(() => {
        if (active) setAuditLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [editId, hasAdminManagement]);

  const handleCreate = async (form) => {
    const created = await createAdmin(form);
    setNewAdminOpen(false);
    setNotice(
      created.invitationSent === false
        ? "Admin created, but the invitation email could not be sent."
        : "Admin created and invitation sent."
    );
    reload();
  };

  const handleSavePrivileges = async (id, privileges) => {
    await updateAdminPrivileges(id, privileges);
    setEditId(null);
    setNotice("Admin privileges updated.");
    reload();
  };

  if (authLoading) {
    return <div className="content" role="status">Loading access...</div>;
  }
  if (!hasAdminManagement) {
    return (
      <NoAccess
        title="Admins & privileges"
        pageName="admin management"
        privilege="ADMIN_MGMT"
        backTo="/dashboard"
        backLabel="Go to Dashboard"
      />
    );
  }

  return (
    <>
      <Topbar
        title="Admins & privileges"
        subtitle="Delegate administration safely."
        search={search}
        onSearchChange={(value) => {
          setSearch(value.slice(0, 100));
          setPage(1);
        }}
        searchPlaceholder="Search admin name, username or email..."
        actions={
          <button type="button" className="btn-primary" onClick={() => setNewAdminOpen(true)}>
            <PlusIcon size={13} />
            New admin
          </button>
        }
      />

      <div className="content">
        <section className="panel acc-card">
          <div className="acc-toolbar">
            <div className="acc-tabs" aria-label="Admin status">
              <span className="acc-tab acc-tab--active">Admins</span>
            </div>
            <label className="admin-status-filter">
              <span>Status</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          {notice && <p className="admin-notice" role="status">{notice}</p>}

          <div className="acc-scroll">
            <table className="acc-table adm-table">
              <colgroup>
                <col style={{ width: "24%" }} />
                <col style={{ width: "35%" }} />
                <col style={{ width: "20%" }} />
                <col style={{ width: "21%" }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Privileges</th>
                  <th>Created by</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4}>Loading admins...</td></tr>
                ) : error ? (
                  <tr>
                    <td colSpan={4}>
                      <div role="alert">
                        <p>{error}</p>
                        <button type="button" onClick={reload}>Try again</button>
                      </div>
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr><td colSpan={4} className="admin-empty">No admins found.</td></tr>
                ) : admins.map((admin) => {
                  const isDefault = admin.status === "Default";
                  const privileges = admin.privileges || [];
                  return (
                    <tr
                      key={admin.id}
                      className="acc-row"
                      tabIndex={0}
                      onClick={() => setEditId(admin.id)}
                      onKeyDown={(event) => {
                        if (event.target !== event.currentTarget) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setEditId(admin.id);
                        }
                      }}
                    >
                      <td>
                        <div className="acc-user">
                          <span className={`avatar avatar--${admin.avatar}`}>{getInitials(admin.name)}</span>
                          <div>
                            <p className="acc-user__name">{admin.name}</p>
                            <p className="acc-user__handle">{isDefault ? "Default admin" : admin.username}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="adm-privs">
                          {privileges.includes("All") ? (
                            <span className="tag tag--cyan">All privileges</span>
                          ) : privileges.map((privilege) => (
                            <span className="tag tag--priv" key={privilege}>
                              {privilegeTitle(privilege)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td><span className="adm-created">{createdBy(admin)}</span></td>
                      <td><AdminStatus status={admin.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="acc-footer">
            <span>
              Showing {admins.length ? (page - 1) * PAGE_SIZE + 1 : 0}–
              {(page - 1) * PAGE_SIZE + admins.length} of {total}
            </span>
            <div className="pager">
              <button
                type="button"
                className="pager__btn"
                aria-label="Previous page"
                disabled={loading || page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeftIcon size={14} />
              </button>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                <button
                  type="button"
                  className={`pager__btn${page === pageNumber ? " pager__btn--active" : ""}`}
                  aria-current={page === pageNumber ? "page" : undefined}
                  disabled={loading}
                  onClick={() => setPage(pageNumber)}
                  key={pageNumber}
                >
                  {pageNumber}
                </button>
              ))}
              <button
                type="button"
                className="pager__btn"
                aria-label="Next page"
                disabled={loading || page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                <ChevronRightIcon size={14} />
              </button>
            </div>
          </div>
        </section>

        <p className="note-info">
          <span>
            An admin can only grant privileges they hold. The default admin has every privilege and can’t be changed.
          </span>
        </p>
      </div>

      {editing && (
        <EditPrivilegesDrawer
          key={editing.id}
          account={{ ...editing, history: audit }}
          currentAdmin={currentAdmin}
          auditLoading={auditLoading}
          auditError={auditError}
          onClose={() => setEditId(null)}
          onSave={handleSavePrivileges}
        />
      )}

      {newAdminOpen && (
        <NewAdminDrawer
          existingUsernames={admins.map((admin) => admin.username)}
          onClose={() => setNewAdminOpen(false)}
          onSubmit={handleCreate}
        />
      )}
    </>
  );
}
