import type { CSSProperties } from 'react';

interface AbilitySignatureProps {
  signature:      string | null;
  draft?:         string | null;
  isSupervisor?:  boolean;
  studentNameAr?: string;
}

/**
 * Displays the student's ability signature — the most important element
 * in the entire platform. It must feel like a dignified portrait,
 * not a clinical report field.
 *
 * Shows:
 * - Approved signature: visible to all roles
 * - Draft (with "awaiting approval" indicator): visible to supervisors only
 * - Empty state with call to action: when neither exists
 */
export function AbilitySignature({
  signature,
  draft,
  isSupervisor = false,
  studentNameAr,
}: AbilitySignatureProps) {
  const containerStyle: CSSProperties = {
    borderRadius:    'var(--border-radius-md)',
    padding:         '16px 20px',
    borderInlineStart: '3px solid var(--teal)',
    background:      'var(--teal-light)',
  };

  if (signature) {
    return (
      <div style={containerStyle}>
        <div style={{
          fontSize:      10,
          fontWeight:    500,
          color:         'var(--teal-mid)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom:  8,
        }}>
          ✦ بصمة القدرة
        </div>
        <p style={{
          fontSize:   13,
          color:      'var(--color-text-primary)',
          lineHeight: 1.8,
          margin:     0,
          fontStyle:  'italic',
        }}>
          "{signature}"
        </p>
      </div>
    );
  }

  if (draft && isSupervisor) {
    return (
      <div style={{
        ...containerStyle,
        borderInlineStartColor: 'var(--amber)',
        background:             'var(--amber-light)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{
            fontSize:      10,
            fontWeight:    500,
            color:         'var(--amber)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}>
            ✦ مسودة البصمة — تنتظر موافقتك
          </div>
          <span style={{
            fontSize:   10,
            padding:    '2px 8px',
            borderRadius: 100,
            background: 'var(--color-background-warning)',
            color:      'var(--color-text-warning)',
          }}>
            معلّقة
          </span>
        </div>
        <p style={{
          fontSize:   13,
          color:      'var(--color-text-primary)',
          lineHeight: 1.8,
          margin:     '0 0 12px',
          fontStyle:  'italic',
        }}>
          "{draft}"
        </p>
        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
          راجع هذه المسودة وقرر الموافقة عليها أو تعديلها قبل أن تظهر في ملف الطالب
        </p>
      </div>
    );
  }

  return (
    <div style={{
      ...containerStyle,
      borderInlineStartColor: 'var(--color-border-secondary)',
      background:             'var(--color-background-secondary)',
    }}>
      <div style={{
        fontSize:  13,
        color:     'var(--color-text-tertiary)',
        fontStyle: 'italic',
      }}>
        {isSupervisor
          ? `لم يتم إنشاء بصمة القدرة بعد${studentNameAr ? ` لـ ${studentNameAr}` : ''}. أضف تقييماً واحداً على الأقل ثم اطلب إنشاء البصمة من الذكاء الاصطناعي.`
          : 'لم يتم إنشاء بصمة القدرة بعد.'}
      </div>
    </div>
  );
}
