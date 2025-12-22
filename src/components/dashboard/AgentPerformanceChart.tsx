import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { UserCheck, Loader2 } from 'lucide-react';

interface AgentData {
  name: string;
  atendidas: number;
  aprovadas: number;
  recusadas: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export function AgentPerformanceChart() {
  const [data, setData] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgentData();
  }, []);

  const fetchAgentData = async () => {
    try {
      // Buscar solicitações que têm reviewed_by (foram atendidas por alguém)
      const { data: requests, error: requestsError } = await supabase
        .from('benefit_requests')
        .select('reviewed_by, status')
        .not('reviewed_by', 'is', null);

      if (requestsError) {
        console.error('Error fetching requests:', requestsError);
        setLoading(false);
        return;
      }

      if (!requests || requests.length === 0) {
        setData([]);
        setLoading(false);
        return;
      }

      // Agrupar por reviewed_by
      const agentMap = new Map<string, { atendidas: number; aprovadas: number; recusadas: number }>();
      
      requests.forEach((req) => {
        if (!req.reviewed_by) return;
        
        const current = agentMap.get(req.reviewed_by) || { atendidas: 0, aprovadas: 0, recusadas: 0 };
        current.atendidas++;
        
        if (req.status === 'aprovada' || req.status === 'concluida') {
          current.aprovadas++;
        } else if (req.status === 'recusada') {
          current.recusadas++;
        }
        
        agentMap.set(req.reviewed_by, current);
      });

      // Buscar nomes dos agentes
      const agentIds = Array.from(agentMap.keys());
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', agentIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Montar dados para o gráfico
      const chartData: AgentData[] = Array.from(agentMap.entries())
        .map(([userId, stats]) => ({
          name: profileMap.get(userId)?.split(' ')[0] || 'Desconhecido', // Primeiro nome apenas
          ...stats,
        }))
        .sort((a, b) => b.atendidas - a.atendidas) // Ordenar por mais atendimentos
        .slice(0, 10); // Top 10

      setData(chartData);
    } catch (error) {
      console.error('Error in fetchAgentData:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5 text-primary" />
            Atendimentos por Agente
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-5 w-5 text-primary" />
            Atendimentos por Agente
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[300px]">
          <p className="text-muted-foreground text-sm">Nenhum atendimento registrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserCheck className="h-5 w-5 text-primary" />
          Atendimentos por Agente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis type="number" className="text-xs fill-muted-foreground" />
            <YAxis 
              type="category" 
              dataKey="name" 
              className="text-xs fill-muted-foreground"
              width={80}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                borderColor: 'hsl(var(--border))',
                borderRadius: '8px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))' }}
              formatter={(value: number, name: string) => {
                const labels: Record<string, string> = {
                  atendidas: 'Total Atendidas',
                  aprovadas: 'Aprovadas',
                  recusadas: 'Recusadas',
                };
                return [value, labels[name] || name];
              }}
            />
            <Bar 
              dataKey="atendidas" 
              fill="hsl(var(--primary))" 
              radius={[0, 4, 4, 0]}
              name="atendidas"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda com totais */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center border-t pt-4">
          <div>
            <p className="text-2xl font-bold text-foreground">
              {data.reduce((sum, d) => sum + d.atendidas, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Total Atendidas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-success">
              {data.reduce((sum, d) => sum + d.aprovadas, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">
              {data.reduce((sum, d) => sum + d.recusadas, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Recusadas</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
