export function MembershipBadge({ missing, english = false, compact = false }: { missing?: boolean; english?: boolean; compact?: boolean }) {
  if (!missing) return null;
  return (
    <span className={`membership-badge${compact ? " membership-badge--compact" : ""}`}>
      {english ? "No membership" : "Sin membresía"}
    </span>
  );
}
