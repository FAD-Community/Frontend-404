import { LockIcon, SendIcon, ClockIcon } from "./Icons";

export const ROLE_TONE = { Admin: "cyan", Teacher: "blue", Parent: "amber" };

export function RoleTag({ role }) {
  return <span className={`tag tag--${ROLE_TONE[role]}`}>{role}</span>;
}

export function StatusBadge({ status }) {
  switch (status) {
    case "Default":
      return (
        <span className="tag tag--slate tag--icon">
          <LockIcon size={9} /> Default
        </span>
      );
    case "Active":
      return <span className="tag tag--green">Active</span>;
    case "Invited":
      return (
        <span className="tag tag--blue tag--icon">
          <SendIcon size={9} /> Invited
        </span>
      );
    case "Invite expired":
      return (
        <span className="tag tag--amber tag--icon">
          <ClockIcon size={9} /> Invite expired
        </span>
      );
    default:
      return <span className="tag tag--slate">{status}</span>;
  }
}