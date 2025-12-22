import { FileText, Clock, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { BenefitStatus } from '@/types/benefits';

interface StatsCardsProps {
  requests: {
    status: BenefitStatus;
    created_at: string;
  }[];
}

export function StatsCards({ requests }: StatsCardsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stats = {
    total: requests.length,
    today: requests.filter(r => new Date(r.created_at) >= today).length,
    abertos: requests.filter(r => r.status === 'aberta').length,
    emAndamento: requests.filter(r => r.status === 'em_analise' || r.status === 'aprovada').length,
    encerrados: requests.filter(r => r.status === 'concluida' || r.status === 'recusada').length,
  };

  const cards = [
    {
      title: 'Total Hoje',
      value: stats.today,
      icon: TrendingUp,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      title: 'Abertos',
      value: stats.abertos,
      icon: FileText,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Em Andamento',
      value: stats.emAndamento,
      icon: Clock,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Encerrados',
      value: stats.encerrados,
      icon: CheckCircle2,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 shrink-0 ${card.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground truncate">{card.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
