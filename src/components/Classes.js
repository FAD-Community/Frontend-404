import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "./Topbar";
import AssignTeacherDrawer from "./Assignteacherdrawer";
import ClassModal from "./ClassModal";
import {
  getClasses,
  createClass,
  updateClass,
  archiveClass,
  activateClass,
  assignClassTeacher,
} from "../api/Classes";
import { mapClassFromApi } from "../data/Classes";
import { getInitials } from "../data/Accounts";
import {
  PlusIcon,
  CapIcon,
  KebabIcon,
  BabyIcon,
  UserIcon,
  PencilIcon,
  CheckIcon,
  XIcon,
  UserXIcon,
  AlertTriangleIcon,
} from "./Icons";

export default function Classes({ onNewClass, onViewStudents, onClassMenu }) {
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [assignId, setAssignId] = useState(null);
  const [classModal, setClassModal] = useState(null); // null | { mode: "create" } | { mode: "edit", classCard }
  const [openMenuId, setOpenMenuId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const menuRef = useRef(null);
  const assignTarget = classes.find((c) => c.id === assignId);

  const reloadClasses = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  // Debounce للبحث في Topbar
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(t);
  }, [search]);

  // إغلاق قائمة الثلاث نقاط عند الضغط برّه أو Esc
  useEffect(() => {
    if (openMenuId == null) return undefined;
    const onDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [openMenuId]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await getClasses({
          search: debouncedSearch,
          page: 1,
          pageSize: 100,
          signal: controller.signal,
        });
        const items = Array.isArray(res) ? res : res?.items || [];
        setClasses(items.map(mapClassFromApi));
      } catch (err) {
        if (err?.name === "AbortError") return;
        setError(err.message || "Failed to load classes. Please try again.");
        setClasses([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    load();
    return () => controller.abort();
  }, [debouncedSearch, reloadKey]);

  /* ----- Assign / Change / Unassign teacher (PUT /classes/{id}/teacher) ----- */
  async function assignTeacher(classId, teacher) {
    setActionError("");
    const updatedRaw = await assignClassTeacher(
      classId,
      teacher ? teacher.id : null
    );
    const updated = mapClassFromApi(updatedRaw);

    setClasses((list) =>
      list.map((c) => {
        if (c.id === classId) return updated;
        if (teacher && c.teacher?.id === teacher.id) {
          return { ...c, teacher: null };
        }
        return c;
      })
    );

    setAssignId(null);
    reloadClasses();
  }

  async function handleUnassignTeacher(classCard) {
    setOpenMenuId(null);
    setBusyId(classCard.id);
    setActionError("");
    try {
      await assignTeacher(classCard.id, null);
    } catch (err) {
      setActionError(err.message || "Failed to unassign teacher.");
    } finally {
      setBusyId(null);
    }
  }

  /* ----- Create / Edit class (POST /classes & PUT /classes/{id}) ----- */
  async function handleClassModalSubmit(payload) {
    setActionError("");
    if (classModal?.mode === "edit" && classModal.classCard) {
      const updatedRaw = await updateClass(classModal.classCard.id, payload);
      const updated = mapClassFromApi(updatedRaw);
      setClasses((list) =>
        list.map((c) => (c.id === updated.id ? updated : c))
      );
    } else {
      const createdRaw = await createClass(payload);
      const created = mapClassFromApi(createdRaw);
      setClasses((list) => [created, ...list]);
    }
    setClassModal(null);
    reloadClasses();
  }

  /* ----- Archive / Activate (POST /classes/{id}/archive & /activate) ----- */
  async function handleArchive(classCard) {
    setOpenMenuId(null);
    setBusyId(classCard.id);
    setActionError("");
    try {
      const updatedRaw = await archiveClass(classCard.id);
      const updated = mapClassFromApi(updatedRaw);
      setClasses((list) =>
        list.map((c) => (c.id === updated.id ? updated : c))
      );
      reloadClasses();
    } catch (err) {
      setActionError(err.message || "Failed to archive class.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleActivate(classCard) {
    setOpenMenuId(null);
    setBusyId(classCard.id);
    setActionError("");
    try {
      const updatedRaw = await activateClass(classCard.id);
      const updated = mapClassFromApi(updatedRaw);
      setClasses((list) =>
        list.map((c) => (c.id === updated.id ? updated : c))
      );
      reloadClasses();
    } catch (err) {
      setActionError(err.message || "Failed to activate class.");
    } finally {
      setBusyId(null);
    }
  }

  function handleViewStudents(c) {
    if (onViewStudents) {
      onViewStudents(c);
    } else {
      navigate("/students", { state: { classId: c.id } });
    }
  }

  return (
    <>
      <Topbar
        title="Classes"
        subtitle="Each class has exactly one teacher at a time (FR-15)."
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search class name..."
       actions={
  <button
    type="button"
    className="btn-primary cls-new-btn"
    onClick={() => setClassModal({ mode: "create" })}
  >
    <PlusIcon size={13} />
    <span>New class</span>
  </button>
}
      />

      <div className="content">
        {actionError && (
          <div className="drawer-alert cls-alert" role="alert">
            <AlertTriangleIcon size={14} />
            <p>{actionError}</p>
            <button
              type="button"
              className="na-close cls-alert__close"
              onClick={() => setActionError("")}
              aria-label="Dismiss error"
            >
              <XIcon size={12} />
            </button>
          </div>
        )}

        {loading ? (
          <p>Loading classes...</p>
        ) : error ? (
          <div className="cls-error" role="alert">
            <p>{error}</p>
            <button
              type="button"
              className="btn-outline cls-retry-btn"
              onClick={reloadClasses}
            >
              Try again
            </button>
          </div>
        ) : classes.length === 0 ? (
          <p>No classes found.</p>
        ) : (
          <section className="cls-grid" aria-label="Classes">
            {classes.map((c) => {
              const isArchived = c.status === "Archived";
              const isBusy = busyId === c.id;
              const menuOpen = openMenuId === c.id;

              return (
                <article
                  key={c.id}
                  className={`cls-card${c.teacher ? "" : " cls-card--warn"}`}
                >
                  {/* ===== Header ===== */}
                  <header className="cls-card__head">
                    <span className="cls-card__icon">
                      <CapIcon size={16} />
                    </span>

                    <div className="cls-card__titles">
                      <h2 className="cls-card__name">{c.name}</h2>
                      <p className="cls-card__level">
                        {isArchived ? `${c.level} · Archived` : c.level}
                      </p>
                    </div>

                    <div
                      className="admin-actions cls-card__menu-wrap"
                      ref={menuOpen ? menuRef : null}
                    >
                      <button
                        type="button"
                        className="cls-card__menu"
                        aria-label={`Actions for ${c.name}`}
                        aria-expanded={menuOpen}
                        disabled={isBusy}
                        onClick={() => {
                          onClassMenu?.(c);
                          setOpenMenuId((cur) => (cur === c.id ? null : c.id));
                        }}
                      >
                        <KebabIcon size={16} />
                      </button>

                      {menuOpen && (
                        <div className="admin-actions__menu cls-menu">
                          <button
                            type="button"
                            className="cls-menu__item"
                            onClick={() => {
                              setOpenMenuId(null);
                              setClassModal({ mode: "edit", classCard: c });
                            }}
                          >
                            <PencilIcon size={14} />
                            <span>Edit class</span>
                          </button>

                          {!isArchived && c.teacher && (
                            <button
                              type="button"
                              className="cls-menu__item"
                              onClick={() => handleUnassignTeacher(c)}
                            >
                              <UserXIcon size={14} />
                              <span>Unassign teacher</span>
                            </button>
                          )}

                          {isArchived ? (
                            <button
                              type="button"
                              className="cls-menu__item cls-menu__item--ok"
                              onClick={() => handleActivate(c)}
                            >
                              <CheckIcon size={14} />
                              <span>Activate class</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="cls-menu__item admin-actions__delete"
                              onClick={() => handleArchive(c)}
                            >
                              <XIcon size={14} />
                              <span>Archive class</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </header>

                  {/* ===== Teacher ===== */}
                  <div className="cls-card__teacher">
                    {c.teacher ? (
                      <span
                        className={`avatar avatar--${c.teacher.avatar} cls-avatar`}
                      >
                        {getInitials(c.teacher.name)}
                      </span>
                    ) : (
                      <span className="cls-avatar cls-avatar--empty">
                        <UserIcon size={12} />
                      </span>
                    )}

                    <div className="cls-card__who">
                      <p className="cls-card__label">Teacher</p>
                      <p
                        className={`cls-card__tname${
                          c.teacher ? "" : " cls-card__tname--warn"
                        }`}
                      >
                        {c.teacher ? c.teacher.name : "No teacher assigned"}
                      </p>
                    </div>

                    {c.teacher ? (
                      <button
                        type="button"
                        className="btn-outline cls-card__btn"
                        disabled={isArchived || isBusy}
                        onClick={() => setAssignId(c.id)}
                      >
                        Change
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn-primary cls-card__btn"
                        disabled={isArchived || isBusy}
                        onClick={() => setAssignId(c.id)}
                      >
                        Assign
                      </button>
                    )}
                  </div>

                  {/* ===== Footer ===== */}
                  <footer className="cls-card__foot">
                    <span className="cls-card__count">
                      <BabyIcon size={12} />
                      {c.students} students
                    </span>
                    <button
                      type="button"
                      className="cls-card__link"
                      onClick={() => handleViewStudents(c)}
                    >
                      View students
                    </button>
                  </footer>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {/* ===== Assign / Change teacher ===== */}
      {assignTarget && (
        <AssignTeacherDrawer
          key={assignTarget.id}
          classCard={assignTarget}
          classes={classes}
          onClose={() => setAssignId(null)}
          onAssign={assignTeacher}
        />
      )}

      {/* ===== Create / Edit class ===== */}
      {classModal && (
        <ClassModal
          key={
            classModal.mode === "edit"
              ? `edit-${classModal.classCard?.id}`
              : "create"
          }
          mode={classModal.mode}
          initialClass={classModal.classCard}
          onClose={() => setClassModal(null)}
          onSubmit={handleClassModalSubmit}
        />
      )}
    </>
  );
}