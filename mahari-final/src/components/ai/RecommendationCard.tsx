'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RecommendationCardProps {
  id:           string;
  studentNameAr: string;
  studentNameEn: string | null;
  recType:      string;
  contentDraft: string;
  confidence:   number | null;
  triggeredByObservation?: string;
  generatedAt:  string;
  onReviewed:   () => void;
}

/**
 * AI recommendation review card.
 * Supervisor can approve, modify+approve, or reject with a reason.
 * After action, the record is updated in Supabase and the card hides.
 */
export function RecommendationCard({
  id, studentNameAr, studentNameEn, recType,
  contentDraft, confidence, generatedAt, onReviewed,
}: RecommendationCardProps) {
  const [action,        setAction]        = useState<'approve' | 'modify' | 'reject' | null>(null);
  const [editedContent, setEditedContent] = useState(contentDraft);
  const [rejectReason,  setRejectReason]  = useState('');
  const [submitting,    setSubmitting]    = useState(false);
  const [done,          setDone]          = useState(false);

  const confidencePct = confidence ? Math.round(confidence * 100) : null;
  const isLowConf     = confidence !== null && confidence < 0.6;

  async function handleSubmit() {
    if (submitting) return;
    if (action === 'modify' && editedContent.length < 30) return;
    if (action === 'reject' && rejectReason.length < 10) return;

    setSubmitting(true);
    const supabase = createClient();

    const update = action === 'reject'
      ? { review_status: 'rejected', reviewer_notes: rejectReason, reviewed_at: new Date().toISOString() }
      : action === 'modify'
      ? { review_status: 'modified', content_approved: editedContent, reviewed_at: new Date().toISOString() }
      : { review_status: 'approved', content_approved: contentDraft, reviewed_at: new Date().toISOString() };

    await supabase.from('ai_recommendations').update(update as any).eq('id', id);

    setDone(true);
    setSubmitting(false);
    onReviewed();
  }

  if (done) return null;

  return (
    <div style={{
      background:   'var(--color-background-primary)',
      border:       '0.5px solid var(--color-border-tertiary)',
      borderRadius: 'var(--border-radius-lg)',
      padding:      '14px',
      marginBottom: 12,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>{studentNameAr}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
            {studentNameEn}
            {recType === 'capability_insight' ? ' · رؤية حول القدرات' : ' · مقترح مجال تركيز'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {isLowConf && (
            <span style={{
              fontSize: 10, padding: '2px 7px', borderRadius: 100,
              background: 'var(--color-background-warning)', color: 'var(--color-text-warning)',
            }}>
              ثقة منخفضة
            </span>
          )}
          {confidencePct !== null && (
            <span style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 100, fontWeight: 500,
              background: confidencePct >= 80 ? 'var(--color-background-success)' : 'var(--color-background-info)',
              color:      confidencePct >= 80 ? 'var(--color-text-success)' : 'var(--color-text-info)',
            }}>
              {confidencePct}% ثقة
            </span>
          )}
        </div>
      </div>

      {/* AI Draft */}
      <div style={{
        padding:          '10px 12px',
        marginBottom:     10,
        background:       'var(--teal-light)',
        borderRadius:     'var(--border-radius-md)',
        borderInlineStart: '2px solid var(--teal)',
      }}>
        <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--teal-mid)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 5 }}>
          ✦ مسودة الذكاء الاصطناعي
        </div>

        {action === 'modify' ? (
          <textarea
            value={editedContent}
            onChange={e => setEditedContent(e.target.value)}
            rows={4}
            style={{
              width:        '100%',
              fontSize:     13,
              color:        'var(--color-text-primary)',
              lineHeight:   1.7,
              background:   'var(--color-background-primary)',
              border:       '0.5px solid var(--color-border-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding:      '8px 10px',
              fontFamily:   'var(--font-sans)',
              resize:       'vertical',
              outline:      'none',
              boxSizing:    'border-box',
            }}
            aria-label="تعديل نص التوصية"
          />
        ) : (
          <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.7, margin: 0 }}>
            {contentDraft}
          </p>
        )}
      </div>

      {/* Reject reason textarea */}
      {action === 'reject' && (
        <div style={{ marginBottom: 10 }}>
          <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 5 }}>
            سبب الرفض (سيُحفظ للتحسين المستمر)
          </label>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={2}
            placeholder="أدخل سبب الرفض (10 أحرف على الأقل)..."
            style={{
              width:        '100%',
              fontSize:     13,
              color:        'var(--color-text-primary)',
              background:   'var(--color-background-primary)',
              border:       '0.5px solid var(--color-border-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding:      '8px 10px',
              fontFamily:   'var(--font-sans)',
              resize:       'vertical',
              outline:      'none',
              boxSizing:    'border-box',
            }}
          />
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 7 }}>
        {action === null ? (
          <>
            <button onClick={() => setAction('approve')} style={actionBtnStyle('approve')}>
              <i className="ti ti-check" style={{ fontSize: 13, verticalAlign: '-2px' }} aria-hidden="true" /> موافقة
            </button>
            <button onClick={() => setAction('modify')} style={actionBtnStyle('modify')}>
              <i className="ti ti-edit" style={{ fontSize: 13, verticalAlign: '-2px' }} aria-hidden="true" /> تعديل وموافقة
            </button>
            <button onClick={() => setAction('reject')} style={actionBtnStyle('reject')}>
              <i className="ti ti-x" style={{ fontSize: 13, verticalAlign: '-2px' }} aria-hidden="true" /> رفض
            </button>
          </>
        ) : (
          <>
            <button onClick={() => { setAction(null); setEditedContent(contentDraft); setRejectReason(''); }} style={actionBtnStyle('back')}>
              رجوع →
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                flex:         1,
                padding:      '8px',
                borderRadius: 'var(--border-radius-md)',
                border:       'none',
                background:   submitting ? 'var(--color-border-tertiary)' : 'var(--teal)',
                color:        '#FFFFFF',
                fontSize:     12,
                fontWeight:   500,
                cursor:       submitting ? 'not-allowed' : 'pointer',
                fontFamily:   'var(--font-sans)',
              }}
            >
              {submitting ? 'جارٍ الحفظ…' :
               action === 'approve' ? 'تأكيد الموافقة' :
               action === 'modify'  ? 'حفظ التعديل والموافقة' :
               'تأكيد الرفض'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function actionBtnStyle(type: string): React.CSSProperties {
  const styles: Record<string, React.CSSProperties> = {
    approve: {
      flex:         1,
      padding:      '8px',
      borderRadius: 'var(--border-radius-md)',
      border:       '0.5px solid var(--color-border-success)',
      background:   'none',
      color:        'var(--color-text-success)',
      fontSize:     12,
      fontWeight:   500,
      cursor:       'pointer',
      fontFamily:   'var(--font-sans)',
      transition:   'background 0.15s',
    },
    modify: {
      flex:         1,
      padding:      '8px',
      borderRadius: 'var(--border-radius-md)',
      border:       '0.5px solid var(--color-border-info)',
      background:   'none',
      color:        'var(--color-text-info)',
      fontSize:     12,
      fontWeight:   500,
      cursor:       'pointer',
      fontFamily:   'var(--font-sans)',
    },
    reject: {
      flex:         1,
      padding:      '8px',
      borderRadius: 'var(--border-radius-md)',
      border:       '0.5px solid var(--color-border-danger)',
      background:   'none',
      color:        'var(--color-text-danger)',
      fontSize:     12,
      fontWeight:   500,
      cursor:       'pointer',
      fontFamily:   'var(--font-sans)',
    },
    back: {
      padding:      '8px 12px',
      borderRadius: 'var(--border-radius-md)',
      border:       '0.5px solid var(--color-border-tertiary)',
      background:   'none',
      color:        'var(--color-text-secondary)',
      fontSize:     12,
      cursor:       'pointer',
      fontFamily:   'var(--font-sans)',
    },
  };
  return styles[type] ?? {};
}
