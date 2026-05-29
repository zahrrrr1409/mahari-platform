import { createHash } from 'node:crypto';
import type { AiAnonymizedPayload, AiDomainSnapshot, AiNewAssessment } from '@/lib/types';

/**
 * Creates a deterministic but opaque reference for a student.
 * Same student always gets the same ref within a session,
 * but the ref cannot be reversed to identify the student.
 */
export function pseudonymizeStudentId(id: string): string {
  return 'ref_' + createHash('sha256').update(id).digest('hex').slice(0, 10);
}

/**
 * Replaces known PII patterns in observation text.
 * Called before any text is included in a Claude API payload.
 */
export function sanitizeObservationText(
  text:           string,
  studentNameAr?: string | null,
  studentNameEn?: string | null,
  staffName?:     string | null
): string {
  let result = text;

  if (studentNameAr) {
    result = result.replace(new RegExp(escapeRegex(studentNameAr), 'g'), '[student]');
  }
  if (studentNameEn) {
    result = result.replace(new RegExp(escapeRegex(studentNameEn), 'gi'), '[student]');
  }
  if (staffName) {
    result = result.replace(new RegExp(escapeRegex(staffName), 'gi'), '[educator]');
  }

  // Strip 10-digit sequences (Saudi national ID pattern)
  result = result.replace(/\b\d{10}\b/g, '[ID-removed]');

  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ─── Types used by API routes ────────────────────────────────────
interface RawAssessmentRow {
  domain_id:       string;
  maturity_level:  number;
  assessed_at:     string;
  skill_domains: {
    name_en: string;
    name_ar: string;
  };
}

interface BuildPayloadOptions {
  studentId:        string;
  studentNameAr?:   string | null;
  studentNameEn?:   string | null;
  assessments:      RawAssessmentRow[];
  requestType:      'capability_insight' | 'ability_signature';
  newObservation?:  { domainNameEn: string; level: number; text: string };
  supervisorName?:  string | null;
}

/**
 * Builds the anonymized payload sent to Claude API.
 * Aggregates assessment history per domain, strips all PII.
 * No student name, school name, or identifying information leaves the server.
 */
export function buildAiPayload(opts: BuildPayloadOptions): AiAnonymizedPayload {
  const {
    studentId, studentNameAr, studentNameEn, assessments,
    requestType, newObservation, supervisorName,
  } = opts;

  // Group assessments by domain, sorted oldest first
  const byDomain = new Map<string, number[]>();
  for (const a of [...assessments].sort(
    (a, b) => new Date(a.assessed_at).getTime() - new Date(b.assessed_at).getTime()
  )) {
    const key = a.skill_domains.name_en;
    if (!byDomain.has(key)) byDomain.set(key, []);
    byDomain.get(key)!.push(a.maturity_level);
  }

  const domains: AiDomainSnapshot[] = [];
  byDomain.forEach((levels, nameEn) => {
    const raw = assessments.find(a => a.skill_domains.name_en === nameEn);
    if (!raw) return;
    domains.push({
      nameEn,
      nameAr:        raw.skill_domains.name_ar,
      currentLevel:  levels[levels.length - 1]!,
      previousLevel: levels.length > 1 ? levels[levels.length - 2]! : null,
      levelsOverTime: levels,
    });
  });

  let newAssessment: AiNewAssessment | undefined;
  if (newObservation) {
    newAssessment = {
      domain:        newObservation.domainNameEn,
      maturityLevel: newObservation.level,
      observation:   sanitizeObservationText(
        newObservation.text,
        studentNameAr,
        studentNameEn,
        supervisorName
      ),
    };
  }

  // Count unique domain appearances as a proxy for total assessments
  const totalAssessments = assessments.length;
  const domainsAdvanced  = domains.filter(d =>
    d.previousLevel !== null && d.currentLevel > d.previousLevel
  ).length;

  return {
    studentRef:  pseudonymizeStudentId(studentId),
    requestType,
    domains,
    newAssessment,
    growthVelocity: { domainsAdvancedThisSemester: domainsAdvanced, totalAssessments },
  };
}
