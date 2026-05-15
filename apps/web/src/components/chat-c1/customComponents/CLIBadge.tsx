export function CLIBadge({
  label,
  tone = 'neutral',
  detail,
}: {
  label: string;
  tone?: 'neutral' | 'danger' | 'success';
  detail?: string;
}) {
  return (
    <span className={`c1-badge c1-badge-${tone}`} title={detail || label}>
      {label}
    </span>
  );
}
