interface StatCardProps {
  value:    string | number;
  labelAr:  string;
  accent?:  'teal' | 'amber' | 'danger' | 'default';
}

export function StatCard({ value, labelAr, accent = 'default' }: StatCardProps) {
  const color =
    accent === 'teal'    ? 'var(--teal)'                  :
    accent === 'amber'   ? 'var(--amber)'                 :
    accent === 'danger'  ? 'var(--color-text-danger)'     :
    'var(--color-text-primary)';

  return (
    <div style={{
      background:   'var(--color-background-primary)',
      border:       '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-md)',
      padding:      '14px',
    }}>
      <div style={{ fontSize: 22, fontWeight: 500, color }}>{value}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 4, lineHeight: 1.4 }}>
        {labelAr}
      </div>
    </div>
  );
}
