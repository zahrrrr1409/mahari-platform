export interface DomainDef {
  id:          string;
  nameEn:      string;
  nameAr:      string;
  shortEn:     string;
  color:       string;
  colorLight:  string;
  iconKey:     string;
  displayOrder: number;
}

/**
 * The 6 Mahari capability domains — mirrors the skill_domains seed data.
 * Single source of truth for all frontend domain rendering.
 */
export const DOMAINS: DomainDef[] = [
  {
    id:           'daily-life',
    nameEn:       'Daily Life Skills',
    nameAr:       'الحياة اليومية',
    shortEn:      'Life',
    color:        '#D97706',
    colorLight:   '#FEF3E2',
    iconKey:      'home',
    displayOrder: 1,
  },
  {
    id:           'communication',
    nameEn:       'Communication',
    nameAr:       'التواصل',
    shortEn:      'Comm',
    color:        '#2563EB',
    colorLight:   '#EFF6FF',
    iconKey:      'message',
    displayOrder: 2,
  },
  {
    id:           'digital',
    nameEn:       'Digital Skills',
    nameAr:       'الرقمية',
    shortEn:      'Digital',
    color:        '#0B6B55',
    colorLight:   '#ECFDF5',
    iconKey:      'device-tablet',
    displayOrder: 3,
  },
  {
    id:           'social',
    nameEn:       'Social Skills',
    nameAr:       'الاجتماعية',
    shortEn:      'Social',
    color:        '#7C3AED',
    colorLight:   '#F5F3FF',
    iconKey:      'users',
    displayOrder: 4,
  },
  {
    id:           'vocational',
    nameEn:       'Vocational Skills',
    nameAr:       'المهنية',
    shortEn:      'Voc',
    color:        '#C4513A',
    colorLight:   '#FEF2F2',
    iconKey:      'tool',
    displayOrder: 5,
  },
  {
    id:           'self-advocacy',
    nameEn:       'Self-Advocacy',
    nameAr:       'الاستقلالية الذاتية',
    shortEn:      'Advocacy',
    color:        '#059669',
    colorLight:   '#ECFDF5',
    iconKey:      'star',
    displayOrder: 6,
  },
];

export const DOMAIN_BY_ID = Object.fromEntries(DOMAINS.map(d => [d.id, d]));
export const DOMAIN_BY_NAME_EN = Object.fromEntries(DOMAINS.map(d => [d.nameEn, d]));

/** Returns domain matching a DB domain record by name_en. */
export function resolveDomain(nameEn: string): DomainDef {
  return DOMAIN_BY_NAME_EN[nameEn] ?? DOMAINS[0]!;
}
