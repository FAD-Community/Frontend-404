import { useEffect, useRef, useState } from "react";
import Topbar from "../components/Topbar";
import NewAdminDrawer from "../components/Newadmindrawer";
import EditPrivilegesDrawer from "../components/Editprivilegesdrawer";
import useAccounts from "./Useaccounts";
import { fmtDate, getInitials, lastEvent } from "../data/Accounts";
import {
  PlusIcon,
  KebabIcon,
  LockIcon,
  InfoIcon,
  UserXIcon,
  XIcon,
} from "../components/Icons";

/** "Mona Saleh · 10 Oct" أو "System setup" لو اتعمل من النظام */
function createdBy(admin) {
  const created = lastEvent(admin, "created");

  if (!created) return "—";
  if (created.by === "System") return "System setup";

  return `${created.by} · ${fmtDate(created.at)}`;
}

function AdminStatus({ status }) {
  if (status === "Default") {
    return (
      <span className="tag tag--slate tag--icon">
        <LockIcon size={9} /> Can’t deactivate
      </span>
    );
  }

  if (status === "Active") {
    return <span className="tag tag--green">Active</span>;
  }

  if (status === "Invited") {
    return <span className="tag tag--blue">Invited</span>;
  }

  if (status === "Invite expired") {
    return <span className="tag tag--amber">Invite expired</span>;
  }

  return <span className="tag tag--slate">{status}</span>;
}

/* قائمة الإجراءات التي تظهر عند الضغط على الثلاث نقط */
function AdminActions({ admin, onDelete }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  if (admin.status === "Default") {
    return (
      <LockIcon
        size={14}
        className="acc-lock"
        aria-label="Locked"
      />
    );
  }

  return (
    <div className="admin-actions" ref={menuRef}>
      <button
        type="button"
        className="acc-kebab"
        aria-label={`Actions for ${admin.name}`}
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
      >
        <KebabIcon size={16} />
      </button>

      {open && (
        <div className="admin-actions__menu">
          <button
            type="button"
            className="admin-actions__delete"
            onClick={() => {
              setOpen(false);
              onDelete(admin);
            }}
          >
            <UserXIcon size={14} />
            <span>Delete admin</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default function Admins() {
  const { accounts, currentAdmin, addAdmin, deleteAdmin, updatePrivileges } = useAccounts();

  const [newAdminOpen, setNewAdminOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // جديد: الأدمن اللي بيتعدّل في درج Edit privileges
  const [editId, setEditId] = useState(null);
  const editing = accounts.find((account) => account.id === editId);

  const admins = accounts.filter((account) => account.role === "Admin");

  async function confirmDelete() {
    if (!adminToDelete || deleting) return;

    // لا نسمح بحذف الأدمن الافتراضي
    if (adminToDelete.status === "Default") {
      setDeleteError("The default admin cannot be deleted.");
      return;
    }

    if (typeof deleteAdmin !== "function") {
      setDeleteError(
        "The deleteAdmin function is missing from Useaccounts.js."
      );
      return;
    }

    try {
      setDeleting(true);
      setDeleteError("");

      await deleteAdmin(adminToDelete.id);

      setAdminToDelete(null);
    } catch (error) {
      console.error("Failed to delete admin:", error);

      setDeleteError(
        error?.message ||
          "Could not delete this admin. Please try again."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Topbar
        title="Admins & privileges"
        subtitle="Delegate administration safely."
        actions={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setNewAdminOpen(true)}
          >
            <PlusIcon size={13} />
            New admin
          </button>
        }
      />

      <div className="content">
        <section className="panel">
          <div className="acc-scroll">
            <table className="acc-table adm-table">
              <colgroup>
                <col style={{ width: "22.6%" }} />
                <col style={{ width: "33.3%" }} />
                <col style={{ width: "18.7%" }} />
                <col style={{ width: "19%" }} />
                <col style={{ width: "6.4%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th>Admin</th>
                  <th>Privileges</th>
                  <th>Created by</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {admins.map((admin) => {
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
                          <span
                            className={`avatar avatar--${admin.avatar}`}
                          >
                            {getInitials(admin.name)}
                          </span>

                          <div>
                            <p className="acc-user__name">
                              {admin.name}
                            </p>

                            <p className="acc-user__handle">
                              {isDefault
                                ? "Default admin"
                                : admin.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="adm-privs">
                          {privileges.includes("All") ? (
                            <span className="tag tag--cyan">
                              All privileges
                            </span>
                          ) : (
                            privileges.map((privilege) => (
                              <span
                                className="tag tag--priv"
                                key={privilege}
                              >
                                {privilege}
                              </span>
                            ))
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`adm-created${
                            isDefault
                              ? " adm-created--system"
                              : ""
                          }`}
                        >
                          {createdBy(admin)}
                        </span>
                      </td>

                      <td>
                        <AdminStatus status={admin.status} />
                      </td>

                      {/* stopPropagation: الضغط على النقط الثلاثة / القفل ما يفتحش درج Edit privileges */}
                      <td
                        className="acc-actions"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <AdminActions
                          admin={admin}
                          onDelete={(selectedAdmin) => {
                            setDeleteError("");
                            setAdminToDelete(selectedAdmin);
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}

                {admins.length === 0 && (
                  <tr>
                    <td colSpan={5} className="admin-empty">
                      No admins found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="note-info">
          <InfoIcon size={13} />

          <span>
            An admin can only grant privileges they hold (FR-10).
            The default admin always has every privilege and can’t
            be deactivated (FR-06, FR-11).
          </span>
        </p>
      </div>

      {/* جديد: تعديل صلاحيات أدمن */}
      {editing && (
        <EditPrivilegesDrawer
          key={editing.id}
          account={editing}
          currentAdmin={currentAdmin}
          onClose={() => setEditId(null)}
          onSave={(id, privileges) => {
            updatePrivileges(id, privileges);
            setEditId(null);
          }}
        />
      )}

      {/* إنشاء أدمن جديد */}
      {newAdminOpen && (
        <NewAdminDrawer
          existingUsernames={accounts.map(
            (account) => account.username
          )}
          onClose={() => setNewAdminOpen(false)}
          onSubmit={async (form) => {
            await addAdmin(form);
            setNewAdminOpen(false);
          }}
        />
      )}

      {/* تأكيد حذف الأدمن */}
      {adminToDelete && (
        <div
          className="delete-admin-overlay"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !deleting
            ) {
              setAdminToDelete(null);
              setDeleteError("");
            }
          }}
        >
          <section
            className="delete-admin-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-admin-title"
            aria-describedby="delete-admin-description"
          >
            <div className="delete-admin-dialog__header">
              <div className="delete-admin-icon">
                <UserXIcon size={20} />
              </div>

              <button
                type="button"
                className="delete-admin-close"
                aria-label="Close"
                disabled={deleting}
                onClick={() => {
                  setAdminToDelete(null);
                  setDeleteError("");
                }}
              >
                <XIcon size={14} />
              </button>
            </div>

            <h2 id="delete-admin-title">
              Delete admin?
            </h2>

            <p id="delete-admin-description">
              Are you sure you want to delete{" "}
              <strong>{adminToDelete.name}</strong>?
              This action cannot be undone.
            </p>

            {deleteError && (
              <p className="delete-admin-error" role="alert">
                {deleteError}
              </p>
            )}

            <div className="delete-admin-buttons">
              <button
                type="button"
                className="btn-outline"
                disabled={deleting}
                onClick={() => {
                  setAdminToDelete(null);
                  setDeleteError("");
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-admin-confirm"
                disabled={deleting}
                onClick={confirmDelete}
              >
                <UserXIcon size={14} />
                {deleting ? "Deleting..." : "Delete admin"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}