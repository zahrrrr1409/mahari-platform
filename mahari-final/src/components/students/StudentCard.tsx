import Link from 'next/link';
import { getMaturity } from '@/lib/utils/maturity';

interface StudentCardProps {
  id:               string;
  nameAr:           string;
  nameEn:           string | null;
  gradeLevel:       string | null;
  programType:      string | null;
  profileStrength:  number;
  abilitySignature: string | null;
}

export function StudentCard({
  id, nameAr, nameEn, gradeLevel, programType,
  profileStrength, abilitySignature,
}: StudentCardProps) {
  const initials = nameEn?.charAt(0) ?? nameAr.charAt(0);

  return (
    <Link
      href={`/dashboard/students/${id}`}
      style={{
        display:        'block',
        background:     'var(--color-background-primary)',
        border:         '0.5px solid var(--color-border-tertiary)',
        borderRadius:   'var(--border-radius-lg)',
        padding:        '14px',
        textDecoration: 'none',
        transition:     'border-color 0.15s',
      }}
      onMouseEnter={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-secondary)')}
      onMouseLeave={e => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border-tertiary)')}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{
            width:          36, height: 36, borderRadius: '50%',
            background:     'var(--teal-light)',
            display:        'flex', alignItems: 'center', justifyContent: 'center',
            fontSize:       14, fontWeight: 500, color: 'var(--teal)', flexShrink: 0,
          }}>
            {initials}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{nameAr}</div>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 1 }}>
              {nameEn}{gradeLevel ? ` · ${gradeLevel}` : ''}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'end' }}>
          <div style={{ fontSize: 19, fontWeight: 500, color: 'var(--teal)' }}>{profileStrength}%</div>
          <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)' }}>وضوح القدرات</div>
        </div>
      </div>

      {/* Ability Signature excerpt */}
      <div style={{
        background:        'var(--teal-light)',
        borderRadius:      'var(--border-radius-md)',
        padding:           '8px 10px',
        marginBottom:      10,
        borderInlineStart: '2px solid var(--teal)',
      }}>
        <div style={{
          fontSize: 9, fontWeight: 500, color: 'var(--teal-mid)',
          letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 3,
        }}>
          ✦ بصمة القدرة
        </div>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1.5, margin: 0 }}>
          {abilitySignature
            ? (abilitySignature.length > 110 ? abilitySignature.slice(0, 110) + '…' : abilitySignature)
            : 'لم يتم إنشاء البصمة بعد'}
        </p>
      </div>

      {/* Footer */}
      <div style={{
        display:         'flex',
        justifyContent:  'space-between',
        alignItems:      'center',
        paddingTop:      10,
        borderTop:       '0.5px solid var(--color-border-tertiary)',
        fontSize:        11,
      }}>
        <span style={{
          background: 'var(--color-background-secondary)',
          color:      'var(--color-text-secondary)',
          padding:    '2px 7px',
          borderRadius: 100,
          fontSize:   10,
        }}>
          {programType ?? 'برنامج التربية الخاصة'}
        </span>
        <span style={{ color: 'var(--teal)', fontWeight: 500 }}>
          عرض الملف ←
        </span>
      </div>
    </Link>
  );
}
