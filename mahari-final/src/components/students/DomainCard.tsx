import { getMaturity } from '@/lib/utils/maturity';
import { MaturityBar } from './MaturityBar';

interface DomainCardProps {
  nameEn:    string;
  nameAr:    string;
  color:     string;
  level:     number;    // 0 = unassessed
}

/**
 * Displays a single capability domain card with:
 * - Domain name (EN + AR)
 * - Current maturity level badge
 * - 4-segment progress bar
 */
export function DomainCard({ nameEn, nameAr, color, level }: DomainCardProps) {
  const mat = getMaturity(level);

  return (
    <div style={{
      background:     'var(--color-background-primary)',
      border:         '0.5px solid var(--color-border-tertiary)',
      borderRadius:   'var(--border-radius-md)',
      padding:        '10px 12px',
      borderTop:      `2px solid ${color}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {nameEn}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginTop: 1 }}>
            {nameAr}
          </div>
        </div>
        {level > 0 ? (
          <span style={{
            fontSize:     10,
            fontWeight:   500,
            padding:      '2px 7px',
            borderRadius: 100,
            background:   mat.background,
            color:        mat.color,
            flexShrink:   0,
          }}>
            {mat.labelAr}
          </span>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>لم يُقيَّم</span>
        )}
      </div>
      <MaturityBar level={level} color={color} />
    </div>
  );
}
