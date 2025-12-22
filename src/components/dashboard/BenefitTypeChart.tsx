import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';

const BENEFIT_COLORS: Record<BenefitType, string> = {
  autoescola: 'hsl(var(--benefit-autoescola))',
  farmacia: 'hsl(var(--benefit-farmacia))',
  oficina: 'hsl(var(--benefit-oficina))',
  vale_gas: 'hsl(var(--benefit-vale-gas))',
  papelaria: 'hsl(var(--benefit-papelaria))',
  otica: 'hsl(var(--benefit-otica))',
  outros: 'hsl(var(--benefit-outros))',
};

interface BenefitTypeChartProps {
  data?: { type: BenefitType; count: number }[];
}

export function BenefitTypeChart({ data: rawData }: BenefitTypeChartProps) {
  if (!rawData || rawData.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Por Tipo de Convênio</h3>
        <div className="h-52 sm:h-64 lg:h-80 flex items-center justify-center text-muted-foreground text-sm">
          Nenhum dado disponível
        </div>
      </div>
    );
  }

  const data = rawData.map(item => ({
    type: item.type,
    name: benefitTypeLabels[item.type],
    value: item.count,
  }));

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Por Tipo de Convênio</h3>
      <div className="h-52 sm:h-64 lg:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="45%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
            {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={BENEFIT_COLORS[entry.type]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              wrapperStyle={{ fontSize: '10px' }}
              iconSize={8}
              formatter={(value) => <span className="text-xs sm:text-sm text-muted-foreground">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
