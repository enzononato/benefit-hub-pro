import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { BenefitsChart } from '@/components/dashboard/BenefitsChart';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BenefitTypeChart } from '@/components/dashboard/BenefitTypeChart';
import { BenefitCategoryCards } from '@/components/dashboard/BenefitCategoryCards';
import { RecentRequests } from '@/components/dashboard/RecentRequests';
import { AgentPerformanceChart } from '@/components/dashboard/AgentPerformanceChart';
import { DashboardFiltersComponent, DashboardFilters } from '@/components/dashboard/DashboardFilters';
import { FileText, Clock, CheckCircle, XCircle, FolderOpen, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { BenefitType } from '@/types/benefits';
import { benefitTypes } from '@/data/mockData';

// Benefit types without "outros"
const filteredBenefitTypes = benefitTypes.filter(t => t !== 'outros') as BenefitType[];

interface DashboardStats {
  total: number;
  today: number;
  abertos: number;
  emAnalise: number;
  aprovados: number;
  reprovados: number;
}

interface RequestData {
  status: string;
  benefit_type: string;
  user_id: string;
  created_at: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({ total: 0, today: 0, abertos: 0, emAnalise: 0, aprovados: 0, reprovados: 0 });
  const [benefitTypeData, setBenefitTypeData] = useState<{ type: BenefitType; count: number }[]>([]);
  const [allRequests, setAllRequests] = useState<RequestData[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>({
    unitId: null,
    benefitType: null,
    status: null,
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchDashboardData();
  }, [filters]);

  const fetchDashboardData = async () => {
    try {
      // First get benefit requests without the join that's causing issues
      let query = supabase
        .from('benefit_requests')
        .select('status, benefit_type, user_id, created_at');

      if (filters.benefitType) {
        query = query.eq('benefit_type', filters.benefitType);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching dashboard data:', error);
        return;
      }

      let filteredData = data || [];

      // If filtering by unit, we need to filter by user profiles
      if (filters.unitId && filteredData.length > 0) {
        const userIds = [...new Set(filteredData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('unit_id', filters.unitId)
          .in('user_id', userIds);
        
        const validUserIds = new Set(profilesData?.map(p => p.user_id) || []);
        filteredData = filteredData.filter(r => validUserIds.has(r.user_id));
      }

      setAllRequests(filteredData);

      const total = filteredData.length;
      
      // Calculate today's requests
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const today = filteredData.filter(r => new Date(r.created_at) >= todayStart).length;
      
      const abertos = filteredData.filter(r => r.status === 'aberta').length;
      const emAnalise = filteredData.filter(r => r.status === 'em_analise').length;
      const aprovados = filteredData.filter(r => r.status === 'aprovada' || r.status === 'concluida').length;
      const reprovados = filteredData.filter(r => r.status === 'recusada').length;

      setStats({ total, today, abertos, emAnalise, aprovados, reprovados });

      // Calculate benefit type counts (without "outros")
      const typeData = filteredBenefitTypes.map(type => ({
        type,
        count: filteredData.filter(r => r.benefit_type === type).length,
      }));
      setBenefitTypeData(typeData);
    } catch (err) {
      console.error('Error in fetchDashboardData:', err);
    }
  };

  const monthlyData = useMemo(() => {
    // Use last 6 months as default if no date filters
    const end = filters.endDate || new Date();
    const start = filters.startDate || subMonths(end, 5);
    
    const months: { month: string; solicitacoes: number; aprovadas: number; recusadas: number }[] = [];
    const currentDate = startOfMonth(start);
    const endMonth = startOfMonth(end);
    
    while (currentDate <= endMonth) {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      
      const monthRequests = allRequests.filter((req) => {
        const reqDate = new Date(req.created_at);
        return reqDate >= monthStart && reqDate <= monthEnd;
      });
      
      months.push({
        month: format(currentDate, 'MMM', { locale: ptBR }),
        solicitacoes: monthRequests.length,
        aprovadas: monthRequests.filter((r) => r.status === 'aprovada' || r.status === 'concluida').length,
        recusadas: monthRequests.filter((r) => r.status === 'recusada').length,
      });
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  }, [allRequests, filters.startDate, filters.endDate]);

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
            Dashboard
            <span className="hidden sm:inline"> - Revalle Gestão do DP</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            <span className="hidden sm:inline">Acompanhamento em tempo real das solicitações e análises do DP</span>
            <span className="sm:hidden">Visão geral das solicitações</span>
          </p>
        </div>

        {/* Filters */}
        <DashboardFiltersComponent filters={filters} onFiltersChange={setFilters} />

        {/* Stats Grid - 6 KPI Cards */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Total"
            value={stats.total}
            icon={FileText}
            onClick={() => navigate('/solicitacoes')}
          />
          <StatCard
            title="Hoje"
            value={stats.today}
            icon={TrendingUp}
            onClick={() => navigate('/solicitacoes')}
          />
          <StatCard
            title="Aberto"
            value={stats.abertos}
            icon={FolderOpen}
            variant="info"
            onClick={() => navigate('/solicitacoes?status=aberta')}
          />
          <StatCard
            title="Análise"
            value={stats.emAnalise}
            icon={Clock}
            variant="warning"
            onClick={() => navigate('/solicitacoes?status=em_analise')}
          />
          <StatCard
            title="Aprovadas"
            value={stats.aprovados}
            icon={CheckCircle}
            variant="success"
            onClick={() => navigate('/solicitacoes?status=aprovada')}
          />
          <StatCard
            title="Reprovadas"
            value={stats.reprovados}
            icon={XCircle}
            variant="destructive"
            onClick={() => navigate('/solicitacoes?status=recusada')}
          />
        </div>

        {/* Benefit Category Cards */}
        <BenefitCategoryCards data={benefitTypeData} />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <BenefitsChart data={monthlyData} />
          <BenefitTypeChart data={benefitTypeData} />
        </div>

        {/* Agent Performance Chart */}
        <AgentPerformanceChart />

        {/* Recent Requests */}
        <RecentRequests />
      </div>
    </MainLayout>
  );
}
