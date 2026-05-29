'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MATURITY_LEVELS } from '@/lib/utils/maturity';
import { MaturityBar } from '@/components/students/MaturityBar';
import { submitAssessment } from '@/hooks/useAssessments';

interface AssessmentStepperProps {
  studentId:   string;
  studentName: string;
  schoolId:    string;
  domains:     Array<{ id: string; nameEn: string; nameAr: string; colorHex: string }>;
  currentLevels: Record<string, number>;  // domainId → current level
}

type Step = 1 | 2 | 3 | 4;

/**
 * Full 4-step assessment form.
 * Step 1: Choose domain
 * Step 2: Choose maturity level
 * Step 3: Write observation note
 * Step 4: Review + optional AI insight generation
 */
export function AssessmentStepper({
  studentId, studentName, schoolId, domains, currentLevels,
}: AssessmentStepperProps) {
  const router = useRouter();

  const [step,          setStep]          = useState<Step>(1);
  const [selectedDomain, setSelectedDomain] = useState<typeof domains[0] | null>(null);
  const [selectedLevel,  setSelectedLevel]  = useState<number | null>(null);
  const [observation,    setObservation]    = useState('');
  const [saving,         setSaving]         = useState(false);
  const [aiInsight,      setAiInsight]      = useState<string | null>(null);
  const [generatingAI,   setGeneratingAI]   = useState(false);
  const [error,          setError]          = useState<string | null>(null);

  const progress = ((step - 1) / 3) * 100;

  async function handleSave() {
    if (!selectedDomain || !selectedLevel || observation.length < 30) return;
    setSaving(true);
    setError(null);

    const { assessmentId, error: saveError } = await submitAssessment({
      studentId,
      domainId:        selectedDomain.id,
      domainNameEn:    selectedDomain.nameEn,
      maturityLevel:   selectedLevel,
      observationNote: observation,
      schoolId,
    });

    if (saveError) {
      setError(saveError);
      setSaving(false);
      return;
    }

    // Navigate back to student profile after save
    router.push(`/dashboard/students/${studentId}`);
    router.refresh();
  }

  async function generateAIInsight() {
    if (!selectedDomain || !selectedLevel) return;
    setGeneratingAI(true);

    try {
      const res = await fetch('/api/ai/insight', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          domainNameEn:    selectedDomain.nameEn,
          maturityLevel:   selectedLevel,
          observationNote: observation,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.insight) setAiInsight(data.insight);
        else setAiInsight('سيظهر التحليل بعد حفظ التقييم ومراجعته.');
      }
    } catch {
      setAiInsight('تعذّر إنشاء التحليل الآن. سيُنشأ تلقائياً بعد الحفظ.');
    }
    setGeneratingAI(false);
  }

  return (
    <div style={{ maxWidth: 560 }}>
      {/* Progress bar */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 22 }}>
        {[1,2,3,4].map(s => (
          <div key={s} style={{
            height: 3, flex: 1, borderRadius: 2,
            background: s <= step ? 'var(--teal)' : 'var(--color-border-tertiary)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <div style={{
        background:   'var(--color-background-primary)',
        border:       '0.5px solid var(--color-border-tertiary)',
        borderRadius: 'var(--border-radius-lg)',
        padding:      '20px',
      }}>

        {/* ── Step 1: Domain picker ──────────────────────────────── */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              أيّ مجال قدرات تُقيِّم؟
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              اختر المجال الذي لديك ملاحظات مباشرة عنه لـ {studentName}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {domains.map(d => {
                const currentLvl = currentLevels[d.id] ?? 0;
                const isSelected = selectedDomain?.id === d.id;
                return (
                  <button
                    key={d.id}
                    onClick={() => { setSelectedDomain(d); setStep(2); }}
                    style={{
                      padding:      '12px',
                      borderRadius: 'var(--border-radius-md)',
                      border:       `${isSelected ? 1.5 : 0.5}px solid ${isSelected ? d.colorHex : 'var(--color-border-tertiary)'}`,
                      background:   isSelected ? d.colorHex + '10' : 'var(--color-background-primary)',
                      cursor:       'pointer',
                      textAlign:    'start',
                      transition:   'all 0.15s',
                      fontFamily:   'var(--font-sans)',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: isSelected ? d.colorHex : 'var(--color-text-primary)' }}>
                      {d.nameEn}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginBottom: 7 }}>
                      {d.nameAr}
                    </div>
                    <MaturityBar level={currentLvl} color={d.colorHex} height={3} />
                    <div style={{ fontSize: 9, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
                      الحالي: {currentLvl > 0 ? MATURITY_LEVELS[currentLvl - 1]?.labelAr : 'غير مقيَّم'}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* ── Step 2: Maturity selector ──────────────────────────── */}
        {step === 2 && selectedDomain && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              ما المستوى الذي لاحظته؟
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
              {selectedDomain.nameEn} · {studentName}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MATURITY_LEVELS.map(m => {
                const isSelected = selectedLevel === m.level;
                return (
                  <button
                    key={m.level}
                    onClick={() => { setSelectedLevel(m.level); setStep(3); }}
                    style={{
                      display:      'flex',
                      alignItems:   'center',
                      gap:          12,
                      padding:      '12px 14px',
                      borderRadius: 'var(--border-radius-md)',
                      border:       `${isSelected ? 1.5 : 0.5}px solid ${isSelected ? m.color : 'var(--color-border-tertiary)'}`,
                      background:   isSelected ? m.background : 'var(--color-background-primary)',
                      cursor:       'pointer',
                      textAlign:    'start',
                      fontFamily:   'var(--font-sans)',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: m.background,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 15, fontWeight: 500, color: m.color, flexShrink: 0,
                    }}>
                      {m.level}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: m.color }}>
                        {m.labelEn} <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400, fontSize: 11 }}>· {m.labelAr}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 2 }}>
                        {m.descEn}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <button onClick={() => setStep(1)} style={backBtnStyle}>رجوع →</button>
          </>
        )}

        {/* ── Step 3: Observation note ───────────────────────────── */}
        {step === 3 && selectedDomain && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 4 }}>
              صِف ما لاحظته
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
              الملاحظات الدقيقة والمحددة أقوى بكثير من الانطباعات العامة.
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontStyle: 'italic', marginBottom: 12 }}>
              ماذا فعل {studentName} تحديداً؟ في أيّ سياق؟ ما الذي كان مفاجئاً أو لافتاً؟
            </p>
            <textarea
              value={observation}
              onChange={e => setObservation(e.target.value)}
              placeholder={`صِف لحظة محددة شاهدت فيها قدرة ${studentName} في مجال ${selectedDomain.nameAr}…`}
              rows={5}
              style={{
                width:        '100%',
                fontSize:     13,
                color:        'var(--color-text-primary)',
                lineHeight:   1.7,
                background:   'var(--color-background-primary)',
                border:       '0.5px solid var(--color-border-tertiary)',
                borderRadius: 'var(--border-radius-md)',
                padding:      '12px 14px',
                fontFamily:   'var(--font-sans)',
                resize:       'vertical',
                outline:      'none',
                boxSizing:    'border-box',
              }}
              aria-describedby="obs-hint"
            />
            <div id="obs-hint" style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
              {observation.length}/30 حرف كحد أدنى
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setStep(2)} style={backBtnStyle}>رجوع →</button>
              <button
                onClick={() => setStep(4)}
                disabled={observation.length < 30}
                style={{
                  flex:         1,
                  padding:      '10px',
                  borderRadius: 'var(--border-radius-md)',
                  border:       'none',
                  background:   observation.length >= 30 ? 'var(--teal)' : 'var(--color-border-tertiary)',
                  color:        observation.length >= 30 ? '#FFFFFF' : 'var(--color-text-secondary)',
                  fontSize:     13,
                  fontWeight:   500,
                  cursor:       observation.length >= 30 ? 'pointer' : 'not-allowed',
                  fontFamily:   'var(--font-sans)',
                }}
              >
                متابعة ←
              </button>
            </div>
          </>
        )}

        {/* ── Step 4: Review + AI ────────────────────────────────── */}
        {step === 4 && selectedDomain && selectedLevel && (
          <>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 14 }}>
              مراجعة التقييم
            </h2>

            {/* Summary box */}
            <div style={{
              background: 'var(--color-background-secondary)',
              borderRadius: 'var(--border-radius-md)',
              padding: '12px 14px',
              marginBottom: 14,
            }}>
              <div style={{ display: 'flex', gap: 16, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                    المجال
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {selectedDomain.nameEn}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
                    المستوى
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: MATURITY_LEVELS[selectedLevel - 1]?.color }}>
                    {MATURITY_LEVELS[selectedLevel - 1]?.labelAr}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>
                {observation}
              </div>
            </div>

            {/* AI insight */}
            {!aiInsight && !generatingAI && (
              <button
                onClick={generateAIInsight}
                style={{
                  width:        '100%',
                  padding:      '12px',
                  borderRadius: 'var(--border-radius-md)',
                  border:       '1.5px dashed var(--teal)',
                  background:   'var(--teal-light)',
                  color:        'var(--teal)',
                  fontSize:     13,
                  fontWeight:   500,
                  cursor:       'pointer',
                  fontFamily:   'var(--font-sans)',
                  marginBottom: 14,
                  display:      'flex',
                  alignItems:   'center',
                  justifyContent: 'center',
                  gap:          7,
                }}
              >
                <i className="ti ti-sparkles" style={{ fontSize: 15 }} aria-hidden="true" />
                إنشاء تحليل ذكاء اصطناعي (اختياري)
              </button>
            )}

            {generatingAI && (
              <div style={{
                background: 'var(--teal-light)',
                borderRadius: 'var(--border-radius-md)',
                padding: '14px',
                textAlign: 'center',
                marginBottom: 14,
              }}>
                <div style={{ fontSize: 13, color: 'var(--teal)', fontWeight: 500 }}>
                  جارٍ تحليل الملاحظات…
                </div>
              </div>
            )}

            {aiInsight && (
              <div style={{
                padding:           '12px 14px',
                marginBottom:      14,
                background:        'var(--teal-light)',
                borderRadius:      'var(--border-radius-md)',
                borderInlineStart: '3px solid var(--teal)',
              }}>
                <div style={{ fontSize: 9, fontWeight: 500, color: 'var(--teal-mid)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 7 }}>
                  ✦ تحليل الذكاء الاصطناعي (مسودة — سيحتاج موافقتك)
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {aiInsight}
                </p>
              </div>
            )}

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: 'var(--border-radius-md)',
                background: 'var(--color-background-danger)', color: 'var(--color-text-danger)',
                fontSize: 13, marginBottom: 12,
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setStep(3)} style={backBtnStyle}>رجوع →</button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  flex:         1,
                  padding:      '11px',
                  borderRadius: 'var(--border-radius-md)',
                  border:       'none',
                  background:   saving ? 'var(--color-border-tertiary)' : 'var(--teal)',
                  color:        '#FFFFFF',
                  fontSize:     13,
                  fontWeight:   500,
                  cursor:       saving ? 'not-allowed' : 'pointer',
                  fontFamily:   'var(--font-sans)',
                }}
              >
                {saving ? 'جارٍ الحفظ…' : 'حفظ التقييم'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  padding:      '10px 14px',
  borderRadius: 'var(--border-radius-md)',
  border:       '0.5px solid var(--color-border-tertiary)',
  background:   'none',
  color:        'var(--color-text-secondary)',
  fontSize:     12,
  cursor:       'pointer',
  fontFamily:   'var(--font-sans)',
};
