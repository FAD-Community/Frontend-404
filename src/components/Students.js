import { useCallback, useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import AddStudentDrawer from "../components/Addstudentdrawer";
import TransferStudentModal from "../components/Transferstudentmodal ";
import { PlusIcon, KebabIcon, ChevronLeftIcon, ChevronRightIcon } from "../components/Icons";
import { listStudents, createStudent, transferStudent } from "../api/students";
import { listClasses } from "../api/Classes";

const PAGE_SIZE = 8;

const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * صفحة الطلاب (متوصّلة بالـ API).
 *  - GET  /students?page&pageSize&classId   قايمة الطلاب (مع Pagination وفلتر الفصل)
 *  - POST /students                         Add student
 *  - POST /students/{id}/transfers          Transfer student (النقط الثلاثة)
 *  - GET  /classes                          تابات الفصول (افتراضي – راجع api/classes.js)
 */
export default function Students({ onStudentMenu }) {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [classFilter, setClassFilter] = useState("all"); // "all" أو id الفصل
  const [apiClasses, setApiClasses] = useState([]);
  const [seenClasses, setSeenClasses] = useState([]); // فصول مستنتجة من الطلاب (احتياطي لو /classes مش شغال)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [addOpen, setAddOpen] = useState(false);
  const [transferTarget, setTransferTarget] = useState(null); // الطالب اللي بيتنقل

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  /* ----- الفصول (التابات + اختيارات الفصل في النماذج) — بتتحمل تاني مع Retry ----- */
  useEffect(() => {
    const controller = new AbortController();
    listClasses({ signal: controller.signal })
      .then(setApiClasses)
      .catch(() => {});
    return () => controller.abort();
  }, [reloadKey]);

  const classes = useMemo(() => {
    const map = new Map();
    [...apiClasses, ...seenClasses].forEach((c) => {
      if (!map.has(String(c.id))) map.set(String(c.id), c);
    });
    return [...map.values()];
  }, [apiClasses, seenClasses]);

  /* ----- الطلاب ----- */
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listStudents({
      page,
      pageSize: PAGE_SIZE,
      classId: classFilter === "all" ? undefined : classFilter,
      signal: controller.signal,
    })
      .then((res) => {
        setRows(res.items);
        setTotal(res.total);
        // لو الصفحة الحالية بقت فاضية (مثلاً بعد نقل آخر طالب فيها) نرجع صفحة
        if (res.items.length === 0 && page > 1) setPage((p) => p - 1);
        setSeenClasses((prev) => {
          const known = new Set(prev.map((c) => String(c.id)));
          const fresh = res.items
            .filter((s) => s.classId != null && !known.has(String(s.classId)))
            .map((s) => ({ id: s.classId, name: s.className, level: "", teacherName: "" }));
          return fresh.length ? [...prev, ...fresh] : prev;
        });
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page, classFilter, reloadKey]);

  /* ----- إجراءات ----- */
  const selectClass = (id) => {
    setClassFilter(id);
    setPage(1);
  };

  const addStudent = async (body) => {
    await createStudent(body); // لو فيه خطأ بيتعرض جوه الدرج
    setAddOpen(false);
    setClassFilter("all");
    setPage(1);
    reload();
  };

  const doTransfer = async (student, { classId, effectiveFrom }) => {
    await transferStudent(student.id, { classId, effectiveFrom });
    setTransferTarget(null);
    reload();
  };

  /* ----- Pagination ----- */
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = from === 0 ? 0 : from + rows.length - 1;
  const pageNumbers = (() => {
    const start = Math.max(1, Math.min(page - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  })();

  const tabs = [{ id: "all", name: "All classes" }, ...classes];
  const firstLoad = loading && rows.length === 0 && !error;

  return (
    <>
      <Topbar
        title="Students"
        subtitle="Student records — one class at a time."
        actions={
          <button type="button" className="btn-primary" onClick={() => setAddOpen(true)}>
            <PlusIcon size={13} />
            Add student
          </button>
        }
      />

      <div className="content">
        <section className="panel acc-card">
          {/* ===== Tabs ===== */}
          <div className="acc-toolbar stu-toolbar">
            <div className="acc-tabs stu-tabs" role="tablist" aria-label="Classes">
              {tabs.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={String(classFilter) === String(c.id)}
                  className={`acc-tab${String(classFilter) === String(c.id) ? " acc-tab--active" : ""}`}
                  onClick={() => selectClass(c.id)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* ===== Table ===== */}
          <div className="acc-scroll">
            <table className={`acc-table stu-table${loading && rows.length > 0 ? " stu-table--busy" : ""}`}>
              <colgroup>
                <col style={{ width: "26.9%" }} />
                <col style={{ width: "13.8%" }} />
                <col style={{ width: "17.4%" }} />
                <col style={{ width: "13.8%" }} />
                <col style={{ width: "19.9%" }} />
                <col style={{ width: "8.2%" }} />
              </colgroup>

              <thead>
                <tr>
                  <th>Student</th>
                  <th>Code</th>
                  <th>Date of birth</th>
                  <th>Class</th>
                  <th>Linked parents</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {rows.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div className="stu-name">
                        <span className={`avatar avatar--${s.avatar}`}>{initialsOf(s.name)}</span>
                        <span>{s.name}</span>
                      </div>
                    </td>
                    <td className="stu-code">{s.code}</td>
                    <td className="stu-dob">{s.dob}</td>
                    <td>
                      <span className="tag tag--cyan">{s.className}</span>
                    </td>
                    <td>
                      {s.parents.length > 0 ? (
                        <span className="stu-parents">{s.parents.join(", ")}</span>
                      ) : (
                        <span className="stu-parents stu-parents--none">No parent linked</span>
                      )}
                    </td>
                    <td className="acc-actions stu-actions">
                      <button
                        type="button"
                        className="acc-kebab"
                        aria-label={`Actions for ${s.name}`}
                        onClick={() => {
                          setTransferTarget(s);
                          onStudentMenu?.(s);
                        }}
                      >
                        <KebabIcon size={14} />
                      </button>
                    </td>
                  </tr>
                ))}

                {firstLoad && (
                  <tr>
                    <td colSpan={6} className="stu-empty" role="status">
                      Loading students…
                    </td>
                  </tr>
                )}

                {error && (
                  <tr>
                    <td colSpan={6} className="stu-empty stu-empty--error" role="alert">
                      {error.message}{" "}
                      <button type="button" className="stu-retry" onClick={reload}>
                        Retry
                      </button>
                    </td>
                  </tr>
                )}

                {!loading && !error && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="stu-empty">
                      {classFilter === "all" ? "No students yet." : "No students in this class yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ===== Footer / Pagination (بيظهر بس لو فيه أكتر من صفحة) ===== */}
          {total > PAGE_SIZE && (
            <div className="acc-footer">
              <span>
                Showing {from}–{to} of {total}
              </span>

              <div className="pager">
                <button
                  type="button"
                  className="pager__btn"
                  aria-label="Previous page"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeftIcon size={14} />
                </button>
                {pageNumbers.map((n) => (
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
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRightIcon size={14} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ===== Transfer student ===== */}
      {transferTarget && (
        <TransferStudentModal
          key={transferTarget.id}
          student={transferTarget}
          classes={classes}
          onClose={() => setTransferTarget(null)}
          onSubmit={(data) => doTransfer(transferTarget, data)}
          onScheduleChanged={reload}
        />
      )}

      {/* ===== Add student ===== */}
      {addOpen && (
        <AddStudentDrawer
          classes={classes}
          onClose={() => setAddOpen(false)}
          onSubmit={addStudent}
        />
      )}
    </>
  );
}