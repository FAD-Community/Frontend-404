
import { useEffect, useRef, useState } from "react";

const getDateString = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getToday = () => getDateString(new Date());

const getYesterday = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return getDateString(date);
};

const getLastSevenDays = () => {
  const today = new Date();
  const from = new Date();

  from.setDate(from.getDate() - 6);

  return {
    from: getDateString(from),
    to: getDateString(today),
  };
};

const getThisMonth = () => {
  const today = new Date();

  const firstDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  );

  return {
    from: getDateString(firstDay),
    to: getDateString(today),
  };
};

const DATE_OPTIONS = [
  "Today",
  "Yesterday",
  "Last 7 Days",
  "This Month",
  "Custom Date Range",
];

export default function Topbar({
  title,
  subtitle,
  actions,
  from,
  to,
  onDateChange = () => {},
  search,
  onSearchChange,
  searchPlaceholder = "Search name, username, code...",
}) {
  const [selectedPeriod, setSelectedPeriod] = useState("Today");
  const [dateMenuOpen, setDateMenuOpen] = useState(false);

  const [customFrom, setCustomFrom] = useState(from || getToday());
  const [customTo, setCustomTo] = useState(to || getToday());

  const dateMenuRef = useRef(null);

  /* Close menu when clicking outside */

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        dateMenuRef.current &&
        !dateMenuRef.current.contains(event.target)
      ) {
        setDateMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  const selectDatePeriod = (period) => {
    setSelectedPeriod(period);

    if (period === "Today") {
      const today = getToday();
      onDateChange(today, today);
      setDateMenuOpen(false);
      return;
    }

    if (period === "Yesterday") {
      const yesterday = getYesterday();
      onDateChange(yesterday, yesterday);
      setDateMenuOpen(false);
      return;
    }

    if (period === "Last 7 Days") {
      const range = getLastSevenDays();
      onDateChange(range.from, range.to);
      setDateMenuOpen(false);
      return;
    }

    if (period === "This Month") {
      const range = getThisMonth();
      onDateChange(range.from, range.to);
      setDateMenuOpen(false);
      return;
    }

    if (period === "Custom Date Range") {
      setCustomFrom(from || getToday());
      setCustomTo(to || getToday());
    }
  };

  /* Apply custom date range */

  const applyCustomDateRange = () => {
    if (!customFrom || !customTo) return;

    if (customFrom > customTo) {
      window.alert("The start date cannot be after the end date.");
      return;
    }

    onDateChange(customFrom, customTo);
    setSelectedPeriod("Custom Date Range");
    setDateMenuOpen(false);
  };

  return (
    <header className="topbar">
      <div>
        <h1 className="topbar__title">{title}</h1>
        {subtitle && (
          <p className="topbar__subtitle">{subtitle}</p>
        )}
      </div>

      <div className="topbar__actions">
        {/* Search */}

        <label className="topbar__search">
          <input
            type="search"
            placeholder={searchPlaceholder}
            {...(onSearchChange
              ? {
                  value: search ?? "",
                  onChange: (e) => onSearchChange(e.target.value),
                }
              : {})}
          />
        </label>

        {/* Calendar */}

        <div
          className="dashboard-date-filter"
          ref={dateMenuRef}
        >
          <button
            type="button"
            className="dashboard-date-trigger"
            onClick={() => setDateMenuOpen((prev) => !prev)}
            aria-expanded={dateMenuOpen}
            aria-haspopup="true"
          >
            <span className="dashboard-calendar-icon">▦</span>
            <span>{selectedPeriod}</span>
          </button>

          {dateMenuOpen && (
            <div className="dashboard-date-menu">
              {DATE_OPTIONS.map((period) => (
                <button
                  type="button"
                  key={period}
                  className={`dashboard-date-option ${
                    selectedPeriod === period ? "active" : ""
                  }`}
                  onClick={() => selectDatePeriod(period)}
                >
                  <span className="dashboard-date-option-icon">
                    ▦
                  </span>

                  <span>{period}</span>

                  {selectedPeriod === period && (
                    <span className="dashboard-date-check">
                      ✓
                    </span>
                  )}
                </button>
              ))}

              {selectedPeriod === "Custom Date Range" && (
                <div className="dashboard-custom-range">
                  <label>
                    From
                    <input
                      type="date"
                      value={customFrom}
                      max={getToday()}
                      onChange={(event) =>
                        setCustomFrom(event.target.value)
                      }
                    />
                  </label>

                  <label>
                    To
                    <input
                      type="date"
                      value={customTo}
                      min={customFrom}
                      max={getToday()}
                      onChange={(event) =>
                        setCustomTo(event.target.value)
                      }
                    />
                  </label>

                  <button
                    type="button"
                    className="dashboard-apply-date"
                    onClick={applyCustomDateRange}
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {actions}
      </div>
    </header>
  );
}
