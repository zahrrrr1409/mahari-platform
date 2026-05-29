'use client';

import { useState } from 'react';
import { RecommendationCard } from '@/components/ai/RecommendationCard';

interface Rec {
  id:            string;
  content_draft: string;
  confidence:    number | null;
  rec_type:      string;
  generated_at:  string;
  students: { id: string; name_ar: string; name_en: string | null } | null;
}

export function ReviewQueueClient({ recommendations }: { recommendations: Rec[] }) {
  const [reviewed, setReviewed] = useState<Set<string>>(new Set());

  const pending = recommendations.filter(r => !reviewed.has(r.id));
  const done    = recommendations.filter(r => reviewed.has(r.id));

  return (
    <>
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 14 }}>
        {pending.length} توصية تنتظر المراجعة
      </div>

      {pending.map(r => (
        <RecommendationCard
          key={r.id}
          id={r.id}
          studentNameAr={r.students?.name_ar ?? '—'}
          studentNameEn={r.students?.name_en ?? null}
          recType={r.rec_type}
          contentDraft={r.content_draft}
          confidence={r.confidence}
          generatedAt={r.generated_at}
          onReviewed={() => setReviewed(prev => new Set([...prev, r.id]))}
        />
      ))}

      {done.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 10 }}>
            تمت مراجعتها ({done.length})
          </div>
          {done.map(r => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--color-background-success)', borderRadius: 'var(--border-radius-md)', marginBottom: 6 }}>
              <i className="ti ti-check" style={{ fontSize: 15, color: 'var(--color-text-success)' }} aria-hidden="true" />
              <span style={{ fontSize: 13, color: 'var(--color-text-success)' }}>
                {r.students?.name_ar} — تمت المراجعة
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
