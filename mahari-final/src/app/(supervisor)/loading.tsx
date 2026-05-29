/**
 * Loading skeleton for the supervisor section.
 * Shown by Next.js while Server Components are fetching data.
 * Prevents blank screens during navigation.
 */
export default function SupervisorLoading() {
  const shimmer: React.CSSProperties = {
    background:   'linear-gradient(90deg, var(--color-background-secondary) 25%, var(--color-border-tertiary) 50%, var(--color-background-secondary) 75%)',
    backgroundSize: '200% 100%',
    animation:    'shimmer 1.5s infinite',
    borderRadius: 'var(--border-radius-md)',
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Page title skeleton */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ ...shimmer, height: 24, width: 180, marginBottom: 8 }} />
        <div style={{ ...shimmer, height: 16, width: 280 }} />
      </div>

      {/* Stats row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: '1.5rem' }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: 14 }}>
            <div style={{ ...shimmer, height: 28, width: 60, marginBottom: 8 }} />
            <div style={{ ...shimmer, height: 12, width: '80%' }} />
          </div>
        ))}
      </div>

      {/* Student card skeletons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <div>
                <div style={{ ...shimmer, height: 18, width: 120, marginBottom: 6 }} />
                <div style={{ ...shimmer, height: 12, width: 80 }} />
              </div>
              <div style={{ ...shimmer, height: 28, width: 52 }} />
            </div>
            <div style={{ ...shimmer, height: 60, width: '100%', marginBottom: 10 }} />
            <div style={{ ...shimmer, height: 12, width: '60%' }} />
          </div>
        ))}
      </div>
    </>
  );
}
