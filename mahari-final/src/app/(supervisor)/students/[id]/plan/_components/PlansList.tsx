'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useUser';

interface Plan { id: string; target_description: string; status: string; target_date: string | null; skill_domains: { name_en: string; name_ar: string; color_hex: string | null } }
interface Domain { id: string; name_en: string; name_ar: string }

interface Props {
  plans:     Plan[];
  domains:   Domain[];
  studentId: string;
  schoolId:  string;
}

export function PlansList({ plans: initialPlans, domains, studentId, schoolId }: Props) {
  const router = useRouter();
  const { user } = useUser();
  const [plans,   setPlans]   = useState(initialPlans);
  const [showNew, setShowNew] = useState(false);
  const [domainId, setDomainId] = useState('');
  const [target,   setTarget]  = useState('');
  const [date,     setDate]    = useState('');
  const [saving,   setSaving]  = useState(false);

  async function addPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !domainId || target.length < 20) return;
    setSaving(true);
    const supabase = createClient();
    const { data } = await supabase.from('skill_plans').insert({ student_id: studentId, domain_id: domainId, created_by: user.id, school_id: schoolId, target_description: target, target_date: date || null }).select('*, skill_domains(name_en, name_ar, color_hex)').single();
    if (data) setPlans(prev => [data as Plan, ...prev]);
    setShowNew(false); setDomainId(''); setTarget(''); setDate('');
    setSaving(false);
  }

  async function updateStatus(planId: string, status: string) {
    const supabase = createClient();
    await supabase.from('skill_plans').update({ status }).eq('id', planId);
    setPlans(prev => prev.map(p => p.id === planId ? { ...p, status } : p));
  }

  const statusLabel = (s: string) => ({ active: 'نشطة', completed: 'مكتملة', paused: 'موقوفة', abandoned: 'ملغاة' }[s] ?? s);
  const statusColor = (s: string) => s === 'active' ? 'var(--color-text-success)' : s === 'completed' ? 'var(--color-text-info)' : 'var(--color-text-secondary)';
  const statusBg = (s: string) => s === 'active' ? 'var(--color-background-success)' : s === 'completed' ? 'var(--color-background-info)' : 'var(--color-background-secondary)';

  return (
    <>
      <button onClick={() => setShowNew(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 'var(--border-radius-md)', border: 'none', background: 'var(--teal)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)', marginBottom: 16 }}>
        <i className="ti ti-plus" aria-hidden="true" /> خطة جديدة
      </button>

      {showNew && (
        <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 12 }}>خطة مهارية جديدة</h3>
          <form onSubmit={addPlan} noValidate>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 5 }}>المجال *</label>
              <select value={domainId} onChange={e => setDomainId(e.target.value)} style={{ width: '100%', padding: '9px 11px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none' }} required>
                <option value="">اختر المجال</option>
                {domains.map(d => <option key={d.id} value={d.id}>{d.name_en} — {d.name_ar}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 5 }}>وصف الهدف * (20 حرف على الأقل)</label>
              <textarea value={target} onChange={e => setTarget(e.target.value)} rows={2} style={{ width: '100%', padding: '9px 11px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} required />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 5 }}>تاريخ الهدف (اختياري)</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ padding: '9px 11px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)', fontSize: 13, fontFamily: 'var(--font-sans)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setShowNew(false)} style={{ padding: '9px 14px', borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-tertiary)', background: 'none', color: 'var(--color-text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>إلغاء</button>
              <button type="submit" disabled={saving || !domainId || target.length < 20} style={{ flex: 1, padding: '9px', borderRadius: 'var(--border-radius-md)', border: 'none', background: 'var(--teal)', color: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>{saving ? 'جارٍ الحفظ…' : 'إضافة الخطة'}</button>
            </div>
          </form>
        </div>
      )}

      {plans.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>لا توجد خطط مهارية بعد.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {plans.map(p => (
            <div key={p.id} style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-md)', padding: 14, borderTop: `2px solid ${p.skill_domains?.color_hex ?? '#9B9890'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-primary)' }}>{p.skill_domains?.name_en}</div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>{p.skill_domains?.name_ar}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 100, background: statusBg(p.status), color: statusColor(p.status) }}>{statusLabel(p.status)}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.5, margin: '0 0 10px' }}>{p.target_description}</p>
              {p.target_date && <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 10 }}>الهدف: {new Date(p.target_date).toLocaleDateString('ar-SA')}</div>}
              {p.status === 'active' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => updateStatus(p.id, 'completed')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 100, border: '0.5px solid var(--color-border-success)', background: 'none', color: 'var(--color-text-success)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>✓ مكتملة</button>
                  <button onClick={() => updateStatus(p.id, 'paused')} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 100, border: '0.5px solid var(--color-border-tertiary)', background: 'none', color: 'var(--color-text-secondary)', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>إيقاف مؤقت</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
