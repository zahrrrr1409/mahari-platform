// ================================================================
// Mahari v0.1 — Database Types
// Auto-generate by running: npm run db:types
// This file is the manual baseline until Supabase CLI is configured.
// ================================================================

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type UserRole       = 'student' | 'teacher' | 'supervisor' | 'parent' | 'principal' | 'admin';
export type MaturityLevel  = 1 | 2 | 3 | 4;
export type AssessmentType = 'formal' | 'informal' | 'observation';
export type PlanStatus     = 'active' | 'completed' | 'paused' | 'abandoned';
export type ObserverRole   = 'supervisor' | 'teacher' | 'parent';
export type ObsSetting     = 'classroom' | 'home' | 'community' | 'other';
export type RecType        = 'capability_insight' | 'skill_focus';
export type ReviewStatus   = 'pending' | 'approved' | 'modified' | 'rejected';

export interface Database {
  public: {
    Tables: {

      schools: {
        Row: {
          id:          string;
          name_ar:     string;
          name_en:     string | null;
          region:      string;
          ministry_id: string | null;
          tier:        'standard' | 'premium';
          created_at:  string;
          deleted_at:  string | null;
        };
        Insert: Partial<Database['public']['Tables']['schools']['Row']> & { name_ar: string; region: string };
        Update: Partial<Database['public']['Tables']['schools']['Row']>;
      };

      profiles: {
        Row: {
          id:         string;        // = auth.uid()
          name_ar:    string;
          name_en:    string | null;
          role:       UserRole;
          school_id:  string | null;
          is_active:  boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; name_ar: string; role: UserRole };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };

      students: {
        Row: {
          id:              string;
          profile_id:      string | null;
          school_id:       string;
          name_ar:         string;
          name_en:         string | null;
          grade_level:     string | null;
          program_type:    string | null;
          enrollment_date: string;
          transition_year: number | null;
          created_at:      string;
          updated_at:      string;
          deleted_at:      string | null;
        };
        Insert: Partial<Database['public']['Tables']['students']['Row']> & { name_ar: string; school_id: string };
        Update: Partial<Database['public']['Tables']['students']['Row']>;
      };

      skill_domains: {
        Row: {
          id:             string;
          name_en:        string;
          name_ar:        string;
          description_en: string | null;
          description_ar: string | null;
          color_hex:      string | null;
          icon_key:       string | null;
          display_order:  number;
          is_active:      boolean;
        };
        Insert: never;   // seed only — not user-insertable
        Update: never;
      };

      skill_profiles: {
        Row: {
          id:                string;
          student_id:        string;
          school_id:         string;
          ability_signature: string | null;
          sig_draft:         string | null;
          profile_strength:  number;
          version:           number;
          last_updated_at:   string;
          created_at:        string;
        };
        Insert: Partial<Database['public']['Tables']['skill_profiles']['Row']> & { student_id: string; school_id: string };
        Update: Partial<Database['public']['Tables']['skill_profiles']['Row']>;
      };

      skill_profile_versions: {
        Row: {
          id:                string;
          profile_id:        string;
          ability_signature: string | null;
          profile_strength:  number | null;
          version:           number;
          archived_at:       string;
        };
        Insert: never;
        Update: never;
      };

      skill_assessments: {
        Row: {
          id:               string;
          student_id:       string;
          domain_id:        string;
          assessor_id:      string;
          school_id:        string;
          maturity_level:   MaturityLevel;
          observation_note: string;
          assessment_type:  AssessmentType;
          assessed_at:      string;
          created_at:       string;
        };
        Insert: Omit<Database['public']['Tables']['skill_assessments']['Row'], 'id' | 'created_at'>;
        Update: never;   // append-only — never update
      };

      observations: {
        Row: {
          id:             string;
          student_id:     string;
          observer_id:    string;
          school_id:      string;
          observer_role:  ObserverRole;
          setting:        ObsSetting;
          content:        string;
          ai_domain_tags: string[];
          is_verified:    boolean;
          verified_by:    string | null;
          verified_at:    string | null;
          observed_at:    string;
          created_at:     string;
          deleted_at:     string | null;
        };
        Insert: Omit<Database['public']['Tables']['observations']['Row'], 'id' | 'created_at' | 'deleted_at' | 'verified_at'>;
        Update: Pick<Database['public']['Tables']['observations']['Row'],
          'is_verified' | 'verified_by' | 'verified_at' | 'ai_domain_tags' | 'deleted_at'>;
      };

      skill_plans: {
        Row: {
          id:                 string;
          student_id:         string;
          domain_id:          string;
          created_by:         string;
          school_id:          string;
          target_description: string;
          activities:         Json;
          target_date:        string | null;
          status:             PlanStatus;
          progress_notes:     string | null;
          created_at:         string;
          updated_at:         string;
          deleted_at:         string | null;
        };
        Insert: Omit<Database['public']['Tables']['skill_plans']['Row'], 'id' | 'created_at' | 'updated_at' | 'deleted_at'>;
        Update: Partial<Pick<Database['public']['Tables']['skill_plans']['Row'],
          'target_description' | 'activities' | 'target_date' | 'status' | 'progress_notes' | 'deleted_at'>>;
      };

      ai_recommendations: {
        Row: {
          id:               string;
          student_id:       string;
          school_id:        string;
          triggered_by:     string | null;
          rec_type:         RecType;
          content_draft:    string;
          content_approved: string | null;
          confidence:       number | null;
          review_status:    ReviewStatus;
          reviewed_by:      string | null;
          reviewer_notes:   string | null;
          generated_at:     string;
          reviewed_at:      string | null;
        };
        Insert: Omit<Database['public']['Tables']['ai_recommendations']['Row'],
          'id' | 'generated_at' | 'reviewed_at' | 'reviewed_by' | 'content_approved'>;
        Update: Pick<Database['public']['Tables']['ai_recommendations']['Row'],
          'review_status' | 'content_approved' | 'reviewed_by' | 'reviewer_notes' | 'reviewed_at'>;
      };

      supervisor_assignments: {
        Row: {
          id:            string;
          supervisor_id: string;
          student_id:    string;
          school_id:     string;
          assigned_by:   string | null;
          is_active:     boolean;
          assigned_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['supervisor_assignments']['Row'], 'id' | 'assigned_at'>;
        Update: Pick<Database['public']['Tables']['supervisor_assignments']['Row'], 'is_active'>;
      };

      teacher_assignments: {
        Row: {
          id:          string;
          teacher_id:  string;
          student_id:  string;
          school_id:   string;
          is_active:   boolean;
          assigned_at: string;
        };
        Insert: Omit<Database['public']['Tables']['teacher_assignments']['Row'], 'id' | 'assigned_at'>;
        Update: Pick<Database['public']['Tables']['teacher_assignments']['Row'], 'is_active'>;
      };

      parent_student_links: {
        Row: {
          id:           string;
          parent_id:    string;
          student_id:   string;
          school_id:    string;
          activated_at: string | null;
          created_at:   string;
        };
        Insert: Omit<Database['public']['Tables']['parent_student_links']['Row'], 'id' | 'created_at'>;
        Update: Pick<Database['public']['Tables']['parent_student_links']['Row'], 'activated_at'>;
      };

      audit_logs: {
        Row: {
          id:            number;
          user_id:       string | null;
          action:        string;
          resource_type: string;
          resource_id:   string | null;
          school_id:     string | null;
          old_values:    Json | null;
          new_values:    Json | null;
          ip_address:    string | null;
          user_agent:    string | null;
          created_at:    string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id'>;
        Update: never;
      };

    };

    Views:   {};
    Functions: {
      auth_uid:       { Args: {}; Returns: string };
      auth_role:      { Args: {}; Returns: string };
      auth_school_id: { Args: {}; Returns: string };
    };
    Enums: {};
  };
}

// ─── Convenience re-exports ───────────────────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateDto<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Fully-typed table rows
export type School              = Tables<'schools'>;
export type Profile             = Tables<'profiles'>;
export type Student             = Tables<'students'>;
export type SkillDomain         = Tables<'skill_domains'>;
export type SkillProfile        = Tables<'skill_profiles'>;
export type SkillAssessment     = Tables<'skill_assessments'>;
export type Observation         = Tables<'observations'>;
export type SkillPlan           = Tables<'skill_plans'>;
export type AiRecommendation    = Tables<'ai_recommendations'>;
export type SupervisorAssignment = Tables<'supervisor_assignments'>;
export type ParentStudentLink   = Tables<'parent_student_links'>;
export type AuditLog            = Tables<'audit_logs'>;
