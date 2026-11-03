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

/* ---------------- Data (استبدلها ببيانات الـ API) ---------------- */
const STATS = [
  { label: "Fever alerts today", value: "3", note: "2 classes · parents notified", Icon: ThermometerIcon, tone: "red", valueTone: "red" },
  { label: "No meal logged", value: "6", note: "students · lunch window passed", Icon: UtensilsIcon, tone: "amber", valueTone: "amber" },
  { label: "Classes without teacher", value: "1", note: "Rainbows", Icon: CapIcon, tone: "cyan" },
  { label: "Parents not linked", value: "4", note: "accounts waiting", Icon: LinkIcon, tone: "slate" },
];

const ATTENTION = [
  { title: "Malak Hassan — 38.2 °C", sub: "Sunflowers · today 11:05 · 2 parents notified", tag: "Fever", tone: "red", Icon: ThermometerIcon },
  { title: "Ali Ahmed — 37.9 °C", sub: "Little Stars · today 09:30 · 1 parent notified", tag: "Fever", tone: "red", Icon: ThermometerIcon },
  { title: "6 students without lunch logged", sub: "Sunflowers (4), Bumblebees (2) · after 13:00", tag: "Meals", tone: "amber", Icon: UtensilsIcon },
  { title: "Rainbows has no teacher", sub: "Class created 10 Oct · 12 students", tag: "Class", tone: "amber", iconTone: "cyan", Icon: CapIcon },
  { title: "4 parents with no linked child", sub: "Waiting for admin linking", tag: "Links", tone: "slate", Icon: LinkIcon },
  { title: "2 teachers without a class", sub: "Rana Adel, Sara Nabil", tag: "Teachers", tone: "slate", Icon: UserIcon },
  { title: "3 invitations expired", sub: "Not activated within the time limit · resend", tag: "Invites", tone: "slate", Icon: SendIcon },
];

const MEALS = [
  { name: "Sunflowers · KG-1", logged: 15, total: 18, sub: "Mariam Fathy · 18 students" },
  { name: "Little Stars · Pre-K", logged: 14, total: 14, sub: "Rana Adel · 14 students" },
  { name: "Bumblebees · KG-2", logged: 12, total: 16, sub: "Hany Samir · 16 students" },
  { name: "Rainbows · Nursery", logged: 0, total: 12, sub: "— No teacher · 12 students", warn: true },
];

const TOTALS = [
  { value: 60, label: "students" },
  { value: 5, label: "teachers" },
  { value: 74, label: "parents" },
];

/* ---------------- Page ---------------- */
export default function Dashboard() {
  return (
    <>
      <Topbar
        title="Good morning, Ahlam"
        subtitle="Monday 12 Oct 2026 · overview across all classes"
      />

      <div className="content">
        {/* ===== Stat cards ===== */}
        <section className="stats">
          {STATS.map(({ label, value, note, Icon, tone, valueTone }) => (
            <button type="button" className="stat-card" key={label}>
              <span className="stat-card__head">
                <span className={`icon-box icon-box--${tone}`}>
                  <Icon size={14} />
                </span>
                <span className="stat-card__label">{label}</span>
                <ChevronRightIcon size={12} className="stat-card__chev" />
              </span>
              <span className={`stat-card__value${valueTone ? ` stat-card__value--${valueTone}` : ""}`}>
                {value}
              </span>
              <span className="stat-card__note">{note}</span>
            </button>
          ))}
        </section>

        {/* ===== Lower grid ===== */}
        <section className="dash-grid">
          {/* Needs attention */}
          <div className="panel">
            <div className="panel__head">
              <h2 className="panel__title">Needs attention</h2>
              <span className="pill pill--red">{ATTENTION.length} items</span>
            </div>

            <ul className="attn-list">
              {ATTENTION.map(({ title, sub, tag, tone, iconTone, Icon }) => (
                <li className="attn-row" key={title}>
                  <span className={`icon-box icon-box--${iconTone || tone}`}>
                    <Icon size={14} />
                  </span>
                  <div className="attn-row__body">
                    <p className="attn-row__title">{title}</p>
                    <p className="attn-row__sub">{sub}</p>
                  </div>
                  <span className={`tag tag--${tone}`}>{tag}</span>
                  <button type="button" className="btn-outline btn-outline--review">
                    Review
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Meals logged today */}
          <div className="panel">
            <div className="panel__head">
              <h2 className="panel__title">Meals logged today</h2>
              <span className="panel__hint">by class</span>
            </div>

            <ul className="meal-list">
              {MEALS.map(({ name, logged, total, sub, warn }) => (
                <li className="meal" key={name}>
                  <div className="meal__top">
                    <span className="meal__name">{name}</span>
                    <span className="meal__count">{logged}/{total} meals</span>
                  </div>
                  <div className="meal__bar" role="progressbar" aria-valuenow={logged} aria-valuemax={total}>
                    <span style={{ width: `${(logged / total) * 100}%` }} />
                  </div>
                  <p className={`meal__sub${warn ? " meal__sub--warn" : ""}`}>{sub}</p>
                </li>
              ))}
            </ul>

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