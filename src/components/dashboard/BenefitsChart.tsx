import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MonthlyData {
  month: string;
  solicitacoes: number;
  aprovadas: number;
  recusadas: number;
}

interface BenefitsChartProps {
  data: MonthlyData[];
}

export function BenefitsChart({ data }: BenefitsChartProps) {

  const hasData = data.length > 0 && data.some(d => d.solicitacoes > 0 || d.aprovadas > 0 || d.recusadas > 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6 animate-slide-up">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">Solicitações por Mês</h3>
      <div className="h-52 sm:h-64 lg:h-80">
        {!hasData ? (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
            Nenhum dado disponível para o período selecionado
          </div>
        ) : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis 
              dataKey="month" 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickMargin={8}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              allowDecimals={false}
              tickFormatter={(value) => Math.floor(value).toString()}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px' }}
              iconSize={10}
            />
            <Bar 
              dataKey="solicitacoes" 
              name="Total" 
              fill="hsl(var(--chart-1))" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="aprovadas" 
              name="Aprovadas" 
              fill="hsl(var(--chart-4))" 
              radius={[4, 4, 0, 0]}
            />
            <Bar 
              dataKey="recusadas" 
              name="Recusadas" 
              fill="hsl(var(--destructive))" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
