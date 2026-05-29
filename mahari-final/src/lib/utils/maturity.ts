export interface MaturityDef {
  level:      number;
  labelEn:    string;
  labelAr:    string;
  descEn:     string;
  color:      string;      // CSS variable or hex for text/border
  background: string;      // CSS variable for fills
}

export const MATURITY_LEVELS: MaturityDef[] = [
  {
    level:      1,
    labelEn:    'Emerging',
    labelAr:    'ناشئ',
    descEn:     'Building foundations with full support',
    color:      'var(--color-text-secondary)',
    background: 'var(--color-background-secondary)',
  },
  {
    level:      2,
    labelEn:    'Developing',
    labelAr:    'متطور',
    descEn:     'Growing with partial support',
    color:      'var(--color-text-warning)',
    background: 'var(--color-background-warning)',
  },
  {
    level:      3,
    labelEn:    'Advanced',
    labelAr:    'متقدم',
    descEn:     'Independent in familiar contexts',
    color:      'var(--color-text-info)',
    background: 'var(--color-background-info)',
  },
  {
    level:      4,
    labelEn:    'Independent',
    labelAr:    'مستقل',
    descEn:     'Fully autonomous across contexts',
    color:      'var(--color-text-success)',
    background: 'var(--color-background-success)',
  },
];

export const MATURITY_BY_LEVEL = Object.fromEntries(
  MATURITY_LEVELS.map(m => [m.level, m])
);

export function getMaturity(level: number): MaturityDef {
  return MATURITY_BY_LEVEL[level] ?? MATURITY_LEVELS[0]!;
}

/**
 * Calculates profile strength from domain levels.
 * Formula: (sum of all domain levels / 24) × 100
 * Unassessed domains = 0; maximum = 24 = 100%.
 */
export function calcProfileStrength(domainLevels: number[]): number {
  const sum = domainLevels.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / 24) * 100);
}
