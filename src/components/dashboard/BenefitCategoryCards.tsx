import { useState } from 'react';
import { Car, Pill, Wrench, Fuel, Pencil, Glasses } from 'lucide-react';
import { BenefitType, benefitTypeLabels } from '@/types/benefits';
import { cn } from '@/lib/utils';
import { BenefitCategoryPieDialog } from './BenefitCategoryPieDialog';

interface BenefitCategoryCardsProps {
  data: { type: BenefitType; count: number }[];
}

const benefitConfig: Record<Exclude<BenefitType, 'outros'>, { icon: React.ElementType; label: string }> = {
  autoescola: { icon: Car, label: 'Autoescola' },
  farmacia: { icon: Pill, label: 'Farmácia' },
  oficina: { icon: Wrench, label: 'Oficina' },
  vale_gas: { icon: Fuel, label: 'Vale Gás' },
  papelaria: { icon: Pencil, label: 'Papelaria' },
  otica: { icon: Glasses, label: 'Óculos' },
};

const categoryStyles: Record<Exclude<BenefitType, 'outros'>, { bg: string; text: string }> = {
  autoescola: { bg: 'bg-benefit-autoescola', text: 'text-benefit-autoescola-icon' },
  farmacia: { bg: 'bg-benefit-farmacia', text: 'text-benefit-farmacia-icon' },
  oficina: { bg: 'bg-benefit-oficina', text: 'text-benefit-oficina-icon' },
  vale_gas: { bg: 'bg-benefit-vale-gas', text: 'text-benefit-vale-gas-icon' },
  papelaria: { bg: 'bg-benefit-papelaria', text: 'text-benefit-papelaria-icon' },
  otica: { bg: 'bg-benefit-otica', text: 'text-benefit-otica-icon' },
};

export function BenefitCategoryCards({ data }: BenefitCategoryCardsProps) {
  const [selectedBenefitType, setSelectedBenefitType] = useState<BenefitType | null>(null);
  
  // Filter out 'outros' type
  const filteredData = data.filter(item => item.type !== 'outros');
  const total = filteredData.reduce((acc, item) => acc + item.count, 0);

  return (
    <>
      <div className="rounded-xl border border-border bg-card p-4 sm:p-6 animate-slide-up" style={{ animationDelay: '50ms' }}>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4">Solicitações por Categoria</h3>
        <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          {filteredData.map((item) => {
            if (item.type === 'outros') return null;
            
            const config = benefitConfig[item.type as Exclude<BenefitType, 'outros'>];
            const styles = categoryStyles[item.type as Exclude<BenefitType, 'outros'>];
            const Icon = config.icon;
            const percentage = total > 0 ? ((item.count / total) * 100).toFixed(0) : 0;

            return (
              <div
                key={item.type}
                onClick={() => item.count > 0 && setSelectedBenefitType(item.type)}
                className={cn(
                  'rounded-lg p-2 sm:p-4 transition-all hover:scale-105 border border-transparent hover:border-border',
                  styles.bg,
                  item.count > 0 ? 'cursor-pointer' : 'cursor-default opacity-60'
                )}
              >
              <div className={cn('flex items-center justify-center mb-2 sm:mb-3 shrink-0', styles.text)}>
                  <Icon className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 shrink-0 drop-shadow-lg" style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))' }} />
                </div>
                <p className="text-[10px] sm:text-xs lg:text-sm font-semibold text-foreground text-center truncate">
                  {config.label}
                </p>
                <p className={cn('text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground text-center mt-0.5 sm:mt-1 truncate')}>
                  {item.count} <span className="hidden sm:inline">{item.count === 1 ? 'solicitação' : 'solicitações'}</span>
                </p>
                <p className={cn('text-[9px] sm:text-[10px] lg:text-xs font-medium text-center mt-0.5', styles.text)}>
                  {percentage}%
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {selectedBenefitType && (
        <BenefitCategoryPieDialog
          open={!!selectedBenefitType}
          onOpenChange={(open) => !open && setSelectedBenefitType(null)}
          benefitType={selectedBenefitType}
        />
      )}
    </>
  );
}
