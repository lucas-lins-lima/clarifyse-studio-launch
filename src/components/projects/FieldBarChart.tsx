import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

interface Row { label: string; realizado: number; meta: number }

export default function FieldBarChart({ rows }: { rows: Row[] }) {
  const data = rows.map(r => ({
    name: r.label,
    realizado: r.realizado,
    meta: r.meta,
    pct: r.meta > 0 ? Math.min((r.realizado / r.meta) * 100, 100) : 0,
  }));

  if (data.length === 0) return null;

  const height = Math.max(120, data.length * 36);

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis
            type="number"
            domain={[0, 'dataMax']}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={80}
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value: number, name: string) => [
              value,
              name === 'realizado' ? 'Realizado' : 'Meta',
            ]}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="meta" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
          <Bar dataKey="realizado" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.pct >= 100 ? '#16a34a' : entry.pct >= 50 ? '#0d9488' : '#a855f7'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
