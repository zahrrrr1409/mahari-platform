import type { CSSProperties } from 'react';

interface MaturityBarProps {
  level:    number;    // 0–4 (0 = unassessed)
  color:    string;    // domain color
  height?:  number;   // bar height in px, default 4
}

/**
 * Renders a 4-segment progress bar representing a maturity level.
 * Segments are filled up to the current level using the domain's color.
 */
export function MaturityBar({ level, color, height = 4 }: MaturityBarProps) {
  const segStyle = (i: number): CSSProperties => ({
    height,
    flex:         1,
    borderRadius: 2,
    background:   i <= level ? color : 'var(--color-border-tertiary)',
    transition:   'background 0.3s',
  });

  return (
    <div style={{ display: 'flex', gap: 3 }} role="img" aria-label={`مستوى ${level} من 4`}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={segStyle(i)} />
      ))}
    </div>
  );
}
