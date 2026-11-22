import { useNavigate } from "react-router-dom";
import Topbar from "./Topbar";
import { LockIcon } from "./Icons";


export default function NoAccess({
  title,
  pageName = title?.toLowerCase(),
  privilege,
  granter = "Admin account management",
  backTo = "/accounts",
  backLabel = "Go to Accounts",
}) {
  const navigate = useNavigate();

  return (
    <>
      <Topbar title={title} actions={false} />

      <div className="content noacc-wrap">
        <section className="noacc" role="status">
          <span className="noacc__icon">
            <LockIcon size={40} strokeWidth={2.2} />
          </span>

          <h2 className="noacc__title">You don’t have access to the {pageName}</h2>

          <p className="noacc__text">
            Your account doesn’t include the <strong>{privilege}</strong> privilege. Ask an admin who
            has “{granter}” to grant it.
          </p>

          <button type="button" className="noacc__btn" onClick={() => navigate(backTo)}>
            {backLabel}
          </button>
        </section>
      </div>
    </>
  );
}