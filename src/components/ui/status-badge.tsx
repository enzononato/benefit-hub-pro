import { cn } from '@/lib/utils';
import { BenefitStatus, statusLabels } from '@/types/benefits';

interface StatusBadgeProps {
  status: BenefitStatus;
  className?: string;
}

const statusStyles: Record<BenefitStatus, string> = {
  aberta: 'bg-info/15 text-info border-info/30',
  em_analise: 'bg-warning/15 text-warning border-warning/30',
  aprovada: 'bg-success/15 text-success border-success/30',
  recusada: 'bg-destructive/15 text-destructive border-destructive/30',
  concluida: 'bg-success/15 text-success border-success/30', // Mesmo estilo de aprovada
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
      statusStyles[status],
      className
    )}>
      {statusLabels[status]}
    </span>
  );
}
