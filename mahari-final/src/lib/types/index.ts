import type { User } from '@supabase/supabase-js';
import type { Database, Profile, UserRole } from './database';

// ─── Auth ─────────────────────────────────────────────────────────
/**
 * Supabase User enriched with app_metadata claims.
 * app_metadata is set server-side via service_role — not user-editable.
 */
export interface AuthUser extends User {
  app_metadata: {
    role:      UserRole;
    school_id: string | null;
  };
}

/** Derived from AuthUser — used throughout the app for the current session. */
export interface SessionUser {
  id:       string;
  email:    string | null;
  role:     UserRole;
  schoolId: string | null;
  nameAr:   string;
  nameEn:   string | null;
}

// ─── Maturity ─────────────────────────────────────────────────────
export interface MaturityMeta {
  label:   string;
  labelAr: string;
  desc:    string;
}

export const MATURITY: Record<number, MaturityMeta> = {
  1: { label: 'Emerging',    labelAr: 'ناشئ',  desc: 'Building foundations with full support' },
  2: { label: 'Developing',  labelAr: 'متطور', desc: 'Growing with partial support' },
  3: { label: 'Advanced',    labelAr: 'متقدم', desc: 'Independent in familiar contexts' },
  4: { label: 'Independent', labelAr: 'مستقل', desc: 'Fully autonomous across contexts' },
};

// ─── API Responses ────────────────────────────────────────────────
export interface ApiSuccess<T> {
  success: true;
  data:    T;
}

export interface ApiError {
  success: false;
  error: {
    code:    string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ─── Dashboard ────────────────────────────────────────────────────
export interface SupervisorDashboardStats {
  totalStudents:      number;
  avgProfileStrength: number;
  domainAdvancementsThisSemester: number;
  pendingAiReviews:   number;
}

export interface StudentSummary {
  id:              string;
  nameAr:          string;
  nameEn:          string | null;
  gradeLevel:      string | null;
  programType:     string | null;
  profileStrength: number;
  abilitySignature: string | null;
  domainLevels:    Record<string, number>;
  topStrength:     string | null;
  growth:          number;
}

// ─── Capability Radar ─────────────────────────────────────────────
export interface RadarPoint {
  domain:   string;
  domainAr: string;
  value:    number;
  fullMark: 4;
}

// ─── AI Payload (what gets sent to Claude — no PII) ───────────────
export interface AiAnonymizedPayload {
  studentRef:     string;
  requestType:    'capability_insight' | 'ability_signature';
  domains:        AiDomainSnapshot[];
  newAssessment?: AiNewAssessment;
  growthVelocity: { domainsAdvancedThisSemester: number; totalAssessments: number };
}

export interface AiDomainSnapshot {
  nameEn:         string;
  nameAr:         string;
  currentLevel:   number;
  previousLevel:  number | null;
  levelsOverTime: number[];
}

export interface AiNewAssessment {
  domain:         string;
  maturityLevel:  number;
  observation:    string;  // names replaced with [student], [educator]
}

export interface AiClaudeResponse {
  type:        'capability_insight' | 'ability_signature';
  content:     string;
  confidence:  number;
  keyDomains:  string[];
}
