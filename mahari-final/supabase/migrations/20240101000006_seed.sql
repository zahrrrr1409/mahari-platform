-- ================================================================
-- Mahari v0.1 — Migration 006: Seed Data
-- 6 skill domains — fixed, not user-editable.
-- ================================================================

insert into public.skill_domains (name_en, name_ar, description_en, description_ar, color_hex, icon_key, display_order)
values
  ('Daily Life Skills',  'الحياة اليومية',      'Self-care, household tasks, time management, personal safety',           'العناية بالنفس، المهام المنزلية، إدارة الوقت، السلامة الشخصية',           '#D97706', 'home',          1),
  ('Communication',      'التواصل',              'Verbal and non-verbal expression, assistive tools, active listening',     'التعبير اللفظي وغير اللفظي، أدوات التواصل المساعدة، الاستماع الفعّال',   '#2563EB', 'message',       2),
  ('Digital Skills',     'الرقمية',              'Device use, app navigation, online safety, productivity tools',           'استخدام الأجهزة، التنقل في التطبيقات، الأمان الرقمي، أدوات الإنتاجية',  '#0B6B55', 'device-tablet', 3),
  ('Social Skills',      'الاجتماعية',           'Peer interaction, group participation, empathy, community norms',         'التفاعل مع الأقران، المشاركة الجماعية، التعاطف، أعراف المجتمع',          '#7C3AED', 'users',         4),
  ('Vocational Skills',  'المهنية',              'Task completion, work habits, following instructions, practical skills',  'إنجاز المهام، عادات العمل، اتباع التعليمات، المهارات التطبيقية',         '#C4513A', 'tool',          5),
  ('Self-Advocacy',      'الاستقلالية الذاتية', 'Decision-making, expressing needs, goal-setting, self-knowledge',         'اتخاذ القرارات، التعبير عن الاحتياجات، تحديد الأهداف، المعرفة الذاتية', '#059669', 'star',          6);
