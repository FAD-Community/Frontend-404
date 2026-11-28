import { useCallback, useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import LinkChildModal from "../components/Linkchildmodal ";
import ConfirmRemoveLinkModal from "../components/Confirmremovelinkmodal";
import NoAccess from "./Noaccess";
import { useAuth } from "../context/AuthContext";
import {
  createParentLink,
  getParentAccounts,
  getParentChildren,
  getParentLinkCandidates,
  removeParentLink,
} from "../api/parents.api";
import { ChevronRightIcon, LinkIcon, UnlinkIcon, ShieldIcon } from "../components/Icons";

const PAGE_SIZE = 8;
const PARENT_PAGE_SIZE = 100;
const TONES = ["cyan", "green", "blue", "amber", "red"];
const initialsOf = (name = "") =>
  name.trim().split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase();
const avatarTone = (id) => TONES[Math.abs(Number(id) || 0) % TONES.length];
const countLabel = (count) =>
  count === 0 ? "No child linked" : count === 1 ? "1 child" : `${count} children`;
const displayDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${date.toLocaleString("en", { month: "short" })}`;
};
const pageItems = (response) =>
  Array.isArray(response) ? response : Array.isArray(response?.items) ? response.items : [];
const canLinkToParent = (status) => status === "Active" || status === "Invited";

export default function ParentLinks() {
  const { user, loading: authLoading } = useAuth();
  const privileges = user?.privileges;
  const hasParentManagement =
    user?.role === "Admin" &&
    (Array.isArray(privileges) &&
      (privileges.includes("PARENT_MGMT") ||
        privileges.includes("Parents") ||
        privileges.includes("All")));

  const [parents, setParents] = useState([]);
  const [parentsLoading, setParentsLoading] = useState(true);
  const [parentsError, setParentsError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [removeError, setRemoveError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidates, setCandidates] = useState([]);
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [candidateLoading, setCandidateLoading] = useState(false);
  const [candidateError, setCandidateError] = useState("");

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    if (!hasParentManagement) return undefined;
    const controller = new AbortController();
    let active = true;

    async function loadParents() {
      setParentsLoading(true);
      setParentsError("");
      try {
        const allParents = [];
        let page = 1;
        let total = Infinity;
        while (allParents.length < total) {
          const result = await getParentAccounts({
            page,
            pageSize: PARENT_PAGE_SIZE,
            signal: controller.signal,
          });
          const items = pageItems(result);
          allParents.push(...items);
          total = Number.isFinite(result?.total) ? result.total : allParents.length;
          if (items.length < PARENT_PAGE_SIZE || items.length === 0) break;
          page += 1;
        }
        if (active) {
          const mapped = allParents.map((parent) => ({
            ...parent,
            name: parent.fullName || parent.name || "",
            avatar: avatarTone(parent.id),
            childrenCount: Array.isArray(parent.children) ? parent.children.length : 0,
          }));
          setParents(mapped);
          setSelectedId((current) =>
            mapped.some((parent) => String(parent.id) === String(current))
              ? current
              : mapped[0]?.id ?? null
          );
        }
      } catch (error) {
        if (active && error?.name !== "AbortError") {
          setParentsError(error.message || "Failed to load parent accounts.");
        }
      } finally {
        if (active) setParentsLoading(false);
      }
    }

    loadParents();
    return () => {
      active = false;
      controller.abort();
    };
  }, [hasParentManagement, reloadKey]);

  const selected = useMemo(
    () => parents.find((parent) => String(parent.id) === String(selectedId)) || null,
    [parents, selectedId]
  );

  useEffect(() => {
    if (!hasParentManagement || !selectedId) {
      setDetail(null);
      return undefined;
    }
    const controller = new AbortController();
    let active = true;
    setDetailLoading(true);
    setDetailError("");
    setDetail(null);
    getParentChildren(selectedId, { signal: controller.signal })
      .then((result) => {
        if (active) setDetail(result);
      })
      .catch((error) => {
        if (active && error?.name !== "AbortError") {
          setDetailError(error.message || "Failed to load parent links.");
        }
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [hasParentManagement, selectedId, reloadKey]);

  useEffect(() => {
    if (!linkOpen || !selectedId || !hasParentManagement) return undefined;
    const controller = new AbortController();
    let active = true;
    setCandidateLoading(true);
    setCandidateError("");
    getParentLinkCandidates(selectedId, {
      search: candidateSearch,
      page: candidatePage,
      pageSize: PAGE_SIZE,
      signal: controller.signal,
    })
      .then((result) => {
        if (!active) return;
        setCandidates(pageItems(result));
        setCandidateTotal(result?.total ?? pageItems(result).length);
      })
      .catch((error) => {
        if (active && error?.name !== "AbortError") {
          setCandidateError(error.message || "Failed to find students.");
          setCandidates([]);
          setCandidateTotal(0);
        }
      })
      .finally(() => {
        if (active) setCandidateLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [hasParentManagement, linkOpen, selectedId, candidateSearch, candidatePage]);

  const linkedChildren = detail?.children || [];
  const unlinked = parents.filter((parent) => parent.childrenCount === 0).length;

  const submitLink = async (student, relationship) => {
    setActionLoading(true);
    setCandidateError("");
    try {
      await createParentLink({
        parentId: Number(selected.id),
        studentId: Number(student.id),
        relationship,
      });
      setLinkOpen(false);
      setCandidateSearch("");
      setCandidatePage(1);
      setActionError("");
      reload();
    } catch (error) {
      setCandidateError(error.message || "Failed to link this child.");
    } finally {
      setActionLoading(false);
    }
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    setActionLoading(true);
    setRemoveError("");
    try {
      await removeParentLink(removeTarget.id);
      setRemoveTarget(null);
      reload();
    } catch (error) {
      setRemoveError(error.message || "Failed to remove this link.");
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading) {
    return <div className="content" role="status">Loading access...</div>;
  }
  if (!hasParentManagement) {
    return (
      <NoAccess
        title="Parent links"
        pageName="parent links"
        privilege="PARENT_MGMT"
        backTo="/dashboard"
        backLabel="Go to Dashboard"
      />
    );
  }

  return (
    <>
      <Topbar title="Parent links" subtitle="Connect parent accounts to students." actions={false} />
      <div className="content">
        <div className="pl-layout">
          <aside className="panel pl-list" aria-label="Parents">
            <header className="pl-list__head">
              <h2>Parents</h2>
              <span className="pill pl-badge">{unlinked} unlinked</span>
            </header>
            {parentsLoading ? (
              <p className="pl-state">Loading parents...</p>
            ) : parentsError ? (
              <div className="pl-state pl-state--error" role="alert">
                <p>{parentsError}</p>
                <button type="button" onClick={reload}>Try again</button>
              </div>
            ) : parents.length === 0 ? (
              <p className="pl-state">No parent accounts found.</p>
            ) : (
              <ul>
                {parents.map((parent) => {
                  const active = String(parent.id) === String(selectedId);
                  return (
                    <li key={parent.id}>
                      <button
                        type="button"
                        className={`pl-item${active ? " pl-item--active" : ""}`}
                        aria-current={active ? "true" : undefined}
                        onClick={() => setSelectedId(parent.id)}
                      >
                        <span className={`avatar avatar--${parent.avatar} pl-avatar`}>
                          {initialsOf(parent.name)}
                        </span>
                        <span className="pl-item__text">
                          <strong>{parent.name}</strong>
                          <span className={parent.childrenCount === 0 ? "is-none" : ""}>
                            {countLabel(parent.childrenCount)}
                          </span>
                        </span>
                        {active && <ChevronRightIcon size={13} className="pl-item__chev" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>

          {selected && (
            <section className="panel pl-detail" aria-label={`${selected.name} details`}>
              <header className="pl-detail__head">
                <span className={`avatar avatar--${selected.avatar} pl-detail__avatar`}>
                  {initialsOf(selected.name)}
                </span>
                <div className="pl-detail__who">
                  <h2>{selected.name}</h2>
                  <p>@{selected.username} · {selected.email} · Parent</p>
                </div>
                <span className={`tag tag--${selected.status === "Active" ? "green" : "blue"}`}>
                  {selected.status}
                </span>
              </header>

              <div className="pl-detail__body">
                <div className="pl-detail__bar">
                  <h3>Linked children</h3>
                  <button
                    type="button"
                    className="pl-link-btn"
                    disabled={!canLinkToParent(selected.status) || actionLoading}
                    title={!canLinkToParent(selected.status) ? "Only active or invited parents can be linked." : undefined}
                    onClick={() => {
                      setCandidateSearch("");
                      setCandidatePage(1);
                      setCandidates([]);
                      setCandidateError("");
                      setLinkOpen(true);
                    }}
                  >
                    <LinkIcon size={12} />
                    Link a child
                  </button>
                </div>

                {detailError && (
                  <div className="pl-state pl-state--error" role="alert">
                    <p>{detailError}</p>
                    <button type="button" onClick={reload}>Try again</button>
                  </div>
                )}
                {actionError && <p className="pl-error" role="alert">{actionError}</p>}

                {detailLoading ? (
                  <p className="pl-state">Loading linked children...</p>
                ) : (
                  <ul className="pl-children">
                    {linkedChildren.map((link) => {
                      const student = link.student || {};
                      const linkedBy =
                        link.linkedBy?.fullName?.trim().split(/\s+/)[0] || "Unknown";
                      const linkedDate = displayDate(link.linkedAt);
                      return (
                        <li className="pl-child" key={link.id}>
                          <span className={`avatar avatar--${avatarTone(student.id)} pl-child__avatar`}>
                            {initialsOf(student.fullName)}
                          </span>
                          <div className="pl-child__who">
                            <strong>{student.fullName}</strong>
                            <span>
                              {student.class?.name || "No class"} · #{student.studentCode || "—"} · {link.relationship}
                              {student.status && student.status !== "Active" ? ` · ${student.status}` : ""}
                            </span>
                          </div>
                          <span className="pl-child__meta">
                            Linked by {linkedBy}{linkedDate ? ` · ${linkedDate}` : ""}
                          </span>
                          <button
                            type="button"
                            className="pl-remove"
                            disabled={actionLoading}
                            onClick={() => {
                              setRemoveError("");
                              setRemoveTarget({
                                id: link.id,
                                student: { ...student, name: student.fullName },
                                parent: selected,
                              });
                            }}
                          >
                            <UnlinkIcon size={12} />
                            Remove
                          </button>
                        </li>
                      );
                    })}
                    {!detailError && linkedChildren.length === 0 && (
                      <li className="pl-empty">No child linked</li>
                    )}
                  </ul>
                )}

                <p className="note-info pl-note">
                  <ShieldIcon size={13} />
                  <span>
                    Links control who can see a child’s data. A parent sees only linked children (FR-24).
                    A child can have several parents (FR-22).
                  </span>
                </p>
              </div>
            </section>
          )}
        </div>
      </div>

      {removeTarget && (
        <ConfirmRemoveLinkModal
          parent={removeTarget.parent}
          student={removeTarget.student}
          error={removeError}
          loading={actionLoading}
          onCancel={() => {
            if (!actionLoading) {
              setRemoveTarget(null);
              setRemoveError("");
            }
          }}
          onConfirm={confirmRemove}
        />
      )}

      {linkOpen && selected && (
        <LinkChildModal
          parent={selected}
          candidates={candidates}
          page={candidatePage}
          pageSize={PAGE_SIZE}
          total={candidateTotal}
          loading={candidateLoading || actionLoading}
          error={candidateError}
          onSearch={setCandidateSearch}
          onPageChange={setCandidatePage}
          onClose={() => {
            if (!actionLoading) setLinkOpen(false);
          }}
          onSubmit={submitLink}
        />
      )}
    </>
  );
}
