
import { useEffect, useState } from "react";

import Topbar from "../components/Topbar";
import {
  ThermometerIcon,
  UtensilsIcon,
  CapIcon,
  LinkIcon,
  UserIcon,
  SendIcon,
  ChevronRightIcon,
} from "../components/Icons";

import { useDashboardSummary } from "../features/dashboard/hooks/useDashboardSummary";
import Loader from "../loading/Loader";
import { useAuth } from "../context/AuthContext";

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getToday = () => getDateString(new Date());

const formatDateTime = (date) => {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

//   const map = new Map();

//   items.forEach((item, index) => {
//     const key = getKey(item);

//     // Keep records with missing IDs instead of merging them together.
//     map.set(key ?? `missing-${index}`, item);
//   });

//   return [...map.values()];
// };



export default function Dashboard() {
  const { user } = useAuth();

  // Start with Today.
  const [from, setFrom] = useState(getToday);
  const [to, setTo] = useState(getToday);


  const {
    data,
    loading,
    error,
    refetch,
  } = useDashboardSummary(from, to);

  useEffect(() => {
    if (!data) return;

    if (process.env.NODE_ENV === "development") {
      console.group("[Dashboard] Backend data loaded");
      console.info("Requested date range:", { from, to });
      console.info("API response:", data);
      console.info("Dashboard totals:", data.totals);
      console.info("Fever alerts:", data.fever?.count ?? 0);
      console.info("Students without lunch:", data.noLunch?.students ?? 0);
      console.info("Classes without teacher:", data.classesWithoutTeacher?.count ?? 0);
      console.info("Parents without child:", data.parentsWithoutChild ?? 0);
      console.groupEnd();
    }
  }, [data, from, to]);

  if (loading && !data) {
    return (
      <>
       <Topbar
  title={`Good morning, ${user?.fullName || "Admin"}`}
  subtitle={`Dashboard overview · ${from} to ${to}`}
  from={from}
  to={to}
  onDateChange={(newFrom, newTo) => {
    setFrom(newFrom);
    setTo(newTo);
  }}
/>

        <div className="content">
          <Loader />
        </div>
      </>
    );
  }


  if (error && !data) {
    return (
      <>
        <Topbar
          title={`Good morning, ${user?.fullName || "Admin"}`}
          subtitle="Dashboard overview"
        />

        <div className="content">
          <div className="dashboard-error-state">
            <h3>Unable to load dashboard</h3>
            <p>{error}</p>

            <button
              type="button"
              className="dashboard-retry-btn"
              onClick={refetch}
              disabled={loading}
            >
              {loading ? "Loading..." : "Try Again"}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!data) return null;

  const totals = data.totals || {};

const feverItems = data.fever?.items || [];
const meals = data.mealsByClass || [];

const classesWithoutTeacher =
  data.classesWithoutTeacher?.items || [];

const teachersWithoutClass =
  data.teachersWithoutClass?.items || [];

const noLunchClasses = data.noLunch?.classes || [];


  const STATS = [
    {
      label: "Fever alerts today",
      value: data.fever?.count ?? 0,
      note: `${data.fever?.classes ?? 0} classes · parents notified`,
      Icon: ThermometerIcon,
      tone: "red",
      valueTone: "red",
    },
    {
      label: "No meal logged",
      value: data.noLunch?.students ?? 0,
      note: `${data.noLunch?.daysCounted ?? 0} days · lunch window`,
      Icon: UtensilsIcon,
      tone: "amber",
      valueTone: "amber",
    },
    {
      label: "Classes without teacher",
      value: data.classesWithoutTeacher?.count ?? 0,
      note:
        classesWithoutTeacher.map((item) => item.name).join(", ") ||
        "All classes assigned",
      Icon: CapIcon,
      tone: "cyan",
    },
    {
      label: "Parents without child",
      value: data.parentsWithoutChild ?? 0,
      note: "Accounts waiting for linking",
      Icon: LinkIcon,
      tone: "slate",
    },
  ];


  const ATTENTION = [
    ...feverItems.map((item, index) => ({
      id: `fever-${item.temperatureLogId ?? index}`,
      title: `${item.student?.name || "Unknown student"} — ${item.temperatureC ?? "-"} °C`,
      sub: `${item.class?.name || "Unknown class"} · ${formatDateTime(item.at)} · ${item.parentsNotified ?? 0} parents notified`,
      tag: "Fever",
      tone: "red",
      Icon: ThermometerIcon,
    })),

    ...(data.noLunch?.students > 0
      ? [
          {
            id: "no-lunch",
            title: `${data.noLunch.students} students without lunch logged`,
            sub: `${noLunchClasses.map((item) => item.name).join(", ")} · ${data.noLunch.cutoff || ""} cutoff`,
            tag: "Meals",
            tone: "amber",
            Icon: UtensilsIcon,
          },
        ]
        
      : []),
    ...classesWithoutTeacher.map((item) => ({
      id: `class-${item.id}`,
      title: `${item.name} has no teacher`,
      sub: `${item.level || ""} · ${item.students ?? 0} students`,
      tag: "Class",
      tone: "amber",
      iconTone: "cyan",
      Icon: CapIcon,
    })),

    ...(data.parentsWithoutChild > 0
      ? [
          {
            id: "parents-without-child",
            title: `${data.parentsWithoutChild} parents without linked child`,
            sub: "Waiting for admin linking",
            tag: "Links",
            tone: "slate",
            Icon: LinkIcon,
          },
        ]
      : []),

    ...teachersWithoutClass.map((item) => ({
      id: `teacher-${item.id}`,
      title: `${item.name} has no class`,
      sub: "Teacher is not assigned to a class",
      tag: "Teachers",
      tone: "slate",
      Icon: UserIcon,
    })),

    ...(data.expiredInvitations > 0
      ? [
          {
            id: "expired-invitations",
            title: `${data.expiredInvitations} invitations expired`,
            sub: "Not activated within the time limit · resend",
            tag: "Invites",
            tone: "slate",
            Icon: SendIcon,
          },
        ]
      : []),
  ];

console.log("data", data )

  const MEALS = meals.map((item) => ({
    id: item.classId,
    name: `${item.name || "Unnamed class"} · ${item.level || ""}`,
    logged: item.logged ?? 0,
    total: item.expected ?? 0,
    sub: `${item.teacher?.name || "No teacher"} · ${item.students ?? 0} students`,
    warn: (item.logged ?? 0) < (item.expected ?? 0),
  }));


  const TOTALS = [
    {
      value: totals.students ?? 0,
      label: "students",
    },
    {
      value: totals.teachers ?? 0,
      label: "teachers",
    },
    {
      value: totals.parents ?? 0,
      label: "parents",
    },
  ];


  return (
    <>
      <Topbar
        title={`Good morning, ${user?.fullName || "Admin"}`}
        subtitle={`Dashboard overview · ${from} to ${to}`}
      />

      <div className="content">

        {error && (
          <div role="alert" className="dashboard-inline-error">
            <span>{error}</span>
            <button type="button" onClick={refetch}>
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="dashboard-refreshing">
            Updating dashboard data...
          </div>
        )}

        {/* Stat Cards */}

        <section className="stats">
          {STATS.map(
            ({ label, value, note, Icon, tone, valueTone }) => (
              <button
                type="button"
                className="stat-card"
                key={label}
              >
                <span className="stat-card__head">
                  <span className={`icon-box icon-box--${tone}`}>
                    <Icon size={14} />
                  </span>

                  <span className="stat-card__label">
                    {label}
                  </span>

                  <ChevronRightIcon
                    size={12}
                    className="stat-card__chev"
                  />
                </span>

                <span
                  className={`stat-card__value${
                    valueTone
                      ? ` stat-card__value--${valueTone}`
                      : ""
                  }`}
                >
                  {value}
                </span>

                <span className="stat-card__note">
                  {note || "No details"}
                </span>
              </button>
            )
          )}
        </section>

        {/* Lower Grid */}

        <section className="dash-grid">

          {/* Needs Attention */}

          <div className="panel">
            <div className="panel__head">
              <h2 className="panel__title">
                Needs attention
              </h2>

              <span className="pill pill--red">
                {ATTENTION.length} items
              </span>
            </div>

            <ul className="attn-list">
              {ATTENTION.length > 0 ? (
                ATTENTION.map(
                  ({ id, title, sub, tag, tone, iconTone, Icon }) => (
                    <li className="attn-row" key={id}>
                      <span
                        className={`icon-box icon-box--${iconTone || tone}`}
                      >
                        <Icon size={14} />
                      </span>

                      <div className="attn-row__body">
                        <p className="attn-row__title">
                          {title}
                        </p>

                        <p className="attn-row__sub">
                          {sub}
                        </p>
                      </div>

                      <span className={`tag tag--${tone}`}>
                        {tag}
                      </span>

                     
                    </li>
                  )
                )
              ) : (
                <li className="attn-row">
                  <p>No alerts at the moment.</p>
                </li>
              )}
            </ul>
          </div>

          {/* Meals Logged */}

          <div className="panel">
            <div className="panel__head">
              <h2 className="panel__title">
                Meals logged
              </h2>

              <span className="panel__hint">
                by class
              </span>
            </div>

            <ul className="meal-list">
              {MEALS.length > 0 ? (
                MEALS.map(
                  ({ id, name, logged, total, sub, warn }) => (
                    <li className="meal" key={id}>
                      <div className="meal__top">
                        <span className="meal__name">
                          {name}
                        </span>

                        <span className="meal__count">
                          {logged}/{total} meals
                        </span>
                      </div>

                      <div
                        className="meal__bar"
                        role="progressbar"
                        aria-valuenow={logged}
                        aria-valuemin={0}
                        aria-valuemax={total}
                      >
                        <span
                          style={{
                            width: `${
                              total > 0
                                ? Math.min((logged / total) * 100, 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>

                      <p
                        className={`meal__sub${
                          warn ? " meal__sub--warn" : ""
                        }`}
                      >
                        {sub}
                      </p>
                    </li>
                  )
                )
              ) : (
                <li className="meal">
                  No meal data available.
                </li>
              )}
            </ul>

            {/* Totals */}

            <div className="totals">
              {TOTALS.map(({ value, label }) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

        </section>
      </div>
    </>
  );
}
