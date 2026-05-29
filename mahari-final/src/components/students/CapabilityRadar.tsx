'use client';

import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ResponsiveContainer,
} from 'recharts';

interface RadarPoint {
  domain:   string;
  domainAr: string;
  value:    number;
}

interface CapabilityRadarProps {
  data: RadarPoint[];
}

/**
 * Spider/radar chart showing capability levels across all 6 domains.
 * Client component — Recharts requires browser environment.
 */
export function CapabilityRadar({ data }: CapabilityRadarProps) {
  const tickFormatter = (value: string) => {
    const point = data.find(d => d.domain === value);
    return point?.domain ?? value;
  };

  return (
    <div
      role="img"
      aria-label="مخطط رادار يُظهر مستويات القدرات في المجالات الستة"
      style={{ width: '100%', height: 220 }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid stroke="var(--color-border-tertiary)" />
          <PolarAngleAxis
            dataKey="domain"
            tickFormatter={tickFormatter}
            tick={{
              fontSize:   11,
              fill:       'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)',
            }}
          />
          <PolarRadiusAxis
            domain={[0, 4]}
            tick={false}
            axisLine={false}
          />
          <Radar
            dataKey="value"
            fill="#0B6B55"
            fillOpacity={0.15}
            stroke="#0B6B55"
            strokeWidth={1.5}
            dot={{ fill: '#0B6B55', r: 3, strokeWidth: 0 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
