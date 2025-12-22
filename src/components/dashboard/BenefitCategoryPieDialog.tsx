import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
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

interface BenefitCategoryPieDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  benefitType: BenefitType;
}

export function BenefitCategoryPieDialog({ open, onOpenChange, benefitType }: BenefitCategoryPieDialogProps) {
  const [filterType, setFilterType] = useState<'unit' | 'gender'>('unit');
  const [chartData, setChartData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (open) {
      fetchChartData();
    }
  }, [open, benefitType, filterType]);

  const fetchChartData = async () => {
    try {
      // Fetch benefit requests for this benefit type
      const { data: requests, error: requestsError } = await supabase
        .from('benefit_requests')
        .select('user_id')
        .eq('benefit_type', benefitType);

      if (requestsError) throw requestsError;

      if (!requests || requests.length === 0) {
        setChartData([]);
        return;
      }

      // Get user IDs
      const userIds = requests.map(r => r.user_id);

      if (filterType === 'unit') {
        // Fetch profiles with units
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('unit_id, units(name)')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Count by unit
        const unitCounts: Record<string, number> = {};
        profiles?.forEach(profile => {
          const unitName = (profile as any).units?.name || 'Sem Unidade';
          unitCounts[unitName] = (unitCounts[unitName] || 0) + 1;
        });

        setChartData(
          Object.entries(unitCounts).map(([name, value]) => ({ name, value }))
        );
      } else {
        // Fetch profiles with gender
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('gender')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Count by gender
        const genderCounts: Record<string, number> = {};
        profiles?.forEach(profile => {
          const gender = profile.gender || 'Não informado';
          const genderLabel = gender === 'masculino' ? 'Masculino' : 
                             gender === 'feminino' ? 'Feminino' : 'Não informado';
          genderCounts[genderLabel] = (genderCounts[genderLabel] || 0) + 1;
        });

        setChartData(
          Object.entries(genderCounts).map(([name, value]) => ({ name, value }))
        );
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
    }
  };

  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{benefitTypeLabels[benefitType]} - Análise Detalhada</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-3">
            <Label>Filtrar por:</Label>
            <RadioGroup value={filterType} onValueChange={(value) => setFilterType(value as 'unit' | 'gender')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unit" id="unit" />
                <Label htmlFor="unit" className="font-normal cursor-pointer">Por Unidade</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="gender" id="gender" />
                <Label htmlFor="gender" className="font-normal cursor-pointer">Por Sexo</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="h-80">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Nenhum dado disponível
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}