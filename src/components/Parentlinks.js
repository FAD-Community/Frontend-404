import { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import LinkChildModal from "../components/Linkchildmodal ";
import ConfirmRemoveLinkModal from "../components/Confirmremovelinkmodal";
import { STUDENTS } from "../data/Students";
import { PARENT_ACCOUNTS, OTHER_UNLINKED, LINK_META, EXTRA_STUDENTS } from "../data/Parentlinks";
import { ChevronRightIcon, LinkIcon, UnlinkIcon, ShieldIcon } from "../components/Icons";

const STUDENTS_KEY = "kidoo.students.v1"; // نفس مفتاح صفحة Students (الروابط بتتشارك معاها)

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function loadStudents() {
  try {
    const raw = localStorage.getItem(STUDENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return STUDENTS;
}

// اسم الأدمن الحالي (من الجلسة المحفوظة) علشان "Linked by …"
function adminFirstName() {
  try {
    const id = localStorage.getItem("kidoo.session") || "acc-1";
    const accounts = JSON.parse(localStorage.getItem("kidoo.accounts.v1") || "[]");
    const name = accounts.find((a) => a.id === id)?.name;
    if (name) return name.trim().split(" ")[0];
  } catch {
    /* ignore */
  }
  return "Mona";
}

const countLabel = (n) => (n === 0 ? "No child linked" : n === 1 ? "1 child" : `${n} children`);

/**
 * صفحة ربط أولياء الأمور بالطلاب.
 * الروابط مأخوذة من حقل parents بتاع كل طالب (نفس بيانات صفحة Students)، و Remove بيشيل الرابط ويتحفظ.
 * "Link a child" بيفتح نافذة اختيار طالب وربطه بولي الأمر.
 */
export default function ParentLinks() {
  const [students, setStudents] = useState(loadStudents);
  const [selectedId, setSelectedId] = useState(PARENT_ACCOUNTS[0].id);
  const [linkOpen, setLinkOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState(null); // { student, parent } بنأكد فك الربط

  useEffect(() => {
    try {
      localStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    } catch {
      /* ignore */
    }
  }, [students]);

  const childrenOf = (parent) => students.filter((s) => (s.parents || []).includes(parent.name));

  const parents = useMemo(
    () => PARENT_ACCOUNTS.map((p) => ({ ...p, children: childrenOf(p) })),
    [students] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const unlinked = parents.filter((p) => p.children.length === 0).length + OTHER_UNLINKED;
  const selected = parents.find((p) => p.id === selectedId) || parents[0];

  // أول فتح للنافذة بيظهر بالحالة التجريبية اللي في التصميم (لحد أول ربط حقيقي)
  const demo = !students.some((s) => s.linkMeta);

  // الطلاب المتاحين للربط: الموجودين + الإضافيين اللي مش في قايمة Students لسه
  const pool = useMemo(
    () => [...students, ...EXTRA_STUDENTS.filter((e) => !students.some((s) => s.id === e.id))],
    [students]
  );

  const linkChild = (student, parent) => {
    const now = new Date();
    const month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][now.getMonth()];
    const meta = `Linked by ${adminFirstName()} · ${now.getDate()} ${month}`;

    setStudents((list) => {
      const base = list.some((s) => s.id === student.id) ? list : [...list, student];
      return base.map((s) =>
        s.id === student.id
          ? {
              ...s,
              parents: [...(s.parents || []).filter((n) => n !== parent.name), parent.name],
              linkMeta: { ...(s.linkMeta || {}), [parent.name]: meta },
            }
          : s
      );
    });
    setLinkOpen(false);
  };

  const removeLink = (student, parent) =>
    setStudents((list) =>
      list.map((s) =>
        s.id === student.id ? { ...s, parents: (s.parents || []).filter((n) => n !== parent.name) } : s
      )
    );

  return (
    <>
      <Topbar
        title="Parent links"
        subtitle="Connect parent accounts to students."
        actions={false}
      />

      <div className="content">
        <div className="pl-layout">
          {/* ===== Parents list ===== */}
          <aside className="panel pl-list" aria-label="Parents">
            <header className="pl-list__head">
              <h2>Parents</h2>
              <span className="pill pl-badge">{unlinked} unlinked</span>
            </header>

            <ul>
              {parents.map((p) => {
                const active = p.id === selected.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={`pl-item${active ? " pl-item--active" : ""}`}
                      aria-current={active ? "true" : undefined}
                      onClick={() => setSelectedId(p.id)}
                    >
                      <span className={`avatar avatar--${p.avatar} pl-avatar`}>{p.initials || initialsOf(p.name)}</span>
                      <span className="pl-item__text">
                        <strong>{p.name}</strong>
                        <span className={p.children.length === 0 ? "is-none" : ""}>
                          {countLabel(p.children.length)}
                        </span>
                      </span>
                      {active && <ChevronRightIcon size={13} className="pl-item__chev" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* ===== Selected parent ===== */}
          <section className="panel pl-detail" aria-label={`${selected.name} details`}>
            <header className="pl-detail__head">
              <span className={`avatar avatar--${selected.avatar} pl-detail__avatar`}>
                {selected.initials || initialsOf(selected.name)}
              </span>

              <div className="pl-detail__who">
                <h2>{selected.name}</h2>
                <p>
                  @{selected.username} · {selected.email} · Parent
                </p>
              </div>

              <span className={`tag tag--${selected.status === "Active" ? "green" : "blue"}`}>
                {selected.status}
              </span>
            </header>

            <div className="pl-detail__body">
              <div className="pl-detail__bar">
                <h3>Linked children</h3>
                <button type="button" className="pl-link-btn" onClick={() => setLinkOpen(true)}>
                  <LinkIcon size={12} />
                  Link a child
                </button>
              </div>

              <ul className="pl-children">
                {selected.children.map((s) => (
                  <li className="pl-child" key={s.id}>
                    <span className={`avatar avatar--${s.avatar} pl-child__avatar`}>{initialsOf(s.name)}</span>

                    <div className="pl-child__who">
                      <strong>{s.name}</strong>
                      <span>
                        {s.className} · #{s.code}
                      </span>
                    </div>

                    <span className="pl-child__meta">
                      {s.linkMeta?.[selected.name] || LINK_META[`${s.id}|${selected.name}`] || "Linked at enrolment"}
                    </span>

                    <button type="button" className="pl-remove" onClick={() => setRemoveTarget({ student: s, parent: selected })}>
                      <UnlinkIcon size={12} />
                      Remove
                    </button>
                  </li>
                ))}

                {selected.children.length === 0 && (
                  <li className="pl-empty">
                    No child linked yet. Use “Link a child” to connect one.
                  </li>
                )}
              </ul>

              <p className="note-info pl-note">
                <ShieldIcon size={13} />
                <span>
                  Links control who can see a child’s data. A parent sees only linked children (FR-24).
                  A child can have several parents (FR-22).
                </span>
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* ===== Remove link (تأكيد) ===== */}
      {removeTarget && (
        <ConfirmRemoveLinkModal
          parent={removeTarget.parent}
          student={removeTarget.student}
          onCancel={() => setRemoveTarget(null)}
          onConfirm={() => {
            removeLink(removeTarget.student, removeTarget.parent);
            setRemoveTarget(null);
          }}
        />
      )}

      {/* ===== Link a child ===== */}
      {linkOpen && (
        <LinkChildModal
          parent={selected}
          students={pool}
          demo={demo}
          onClose={() => setLinkOpen(false)}
          onSubmit={(student) => linkChild(student, selected)}
        />
      )}
    </>
  );
}