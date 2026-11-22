
import "../App.css";

function Loader({ fullPage = false, small = false }) {
  const containerClass = [
    "loader-container",
    fullPage ? "loader-container--full" : "",
    small ? "loader-container--small" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={containerClass}>
      <span className="loader" role="status" aria-label="Loading">
        Loading...
      </span>
    </div>
  );
}

export default Loader;
