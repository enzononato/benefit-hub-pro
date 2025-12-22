import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { benefitTypeLabels } from '@/types/benefits';
import { StatusBadge } from '@/components/ui/status-badge';
import { ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { BenefitStatus, BenefitType } from '@/types/benefits';

interface RecentRequest {
  id: string;
  protocol: string;
  benefit_type: BenefitType;
  status: BenefitStatus;
  created_at: string;
  user_id: string;
  full_name?: string;
}

export function RecentRequests() {
  const [requests, setRequests] = useState<RecentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentRequests = async () => {
      try {
        // Fetch benefit requests
        const { data: requestsData, error: requestsError } = await supabase
          .from('benefit_requests')
          .select('id, protocol, benefit_type, status, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(5);

        if (requestsError) {
          console.error('Error fetching recent requests:', requestsError);
          setLoading(false);
          return;
        }

        if (!requestsData || requestsData.length === 0) {
          setRequests([]);
          setLoading(false);
          return;
        }

        // Fetch profiles separately
        const userIds = [...new Set(requestsData.map(r => r.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p.full_name]) || []);

        // Merge data
        const mergedData = requestsData.map(req => ({
          ...req,
          full_name: profilesMap.get(req.user_id) || 'Usuário'
        }));

        setRequests(mergedData);
      } catch (err) {
        console.error('Error in fetchRecentRequests:', err);
      }
      setLoading(false);
    };

    fetchRecentRequests();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="p-4 sm:p-6 border-b border-border">
          <Skeleton className="h-5 sm:h-6 w-40 sm:w-48" />
        </div>
        <div className="divide-y divide-border">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 sm:p-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <Skeleton className="h-8 w-8 sm:h-10 sm:w-10 rounded-full" />
                <div>
                  <Skeleton className="h-3 sm:h-4 w-24 sm:w-32 mb-1.5 sm:mb-2" />
                  <Skeleton className="h-2.5 sm:h-3 w-32 sm:w-48" />
                </div>
              </div>
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Solicitações Recentes</h3>
        </div>
        <div className="p-6 sm:p-8 text-center text-muted-foreground text-sm">
          Nenhuma solicitação recente encontrada
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card animate-slide-up" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
        <h3 className="text-base sm:text-lg font-semibold text-foreground">Solicitações Recentes</h3>
        <Link 
          to="/solicitacoes" 
          className="flex items-center gap-1 text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
        >
          <span className="hidden sm:inline">Ver todas</span>
          <span className="sm:hidden">Ver</span>
          <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-3 sm:p-4 hover:bg-muted/50 transition-colors gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 flex-1">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-semibold">
                {request.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-foreground truncate">{request.full_name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  <span className="hidden sm:inline">{request.protocol} • </span>
                  {benefitTypeLabels[request.benefit_type]}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 shrink-0">
              <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap hidden md:block">
                {new Date(request.created_at).toLocaleDateString('pt-BR')}
              </span>
              <StatusBadge status={request.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
