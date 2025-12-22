import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Eraser } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { benefitTypeFilterLabels, statusFilterLabels, BenefitType, BenefitStatus } from '@/types/benefits';
import { cn } from '@/lib/utils';

export interface DashboardFilters {
  unitId: string | null;
  benefitType: BenefitType | null;
  status: BenefitStatus | null;
  startDate: Date | null;
  endDate: Date | null;
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

interface Unit {
  id: string;
  name: string;
  code: string;
}

export function DashboardFiltersComponent({ filters, onFiltersChange }: DashboardFiltersProps) {
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    const fetchUnits = async () => {
      const { data } = await supabase.from('units').select('*').order('name');
      if (data) setUnits(data);
    };
    fetchUnits();
  }, []);

  const clearFilters = () => {
    onFiltersChange({
      unitId: null,
      benefitType: null,
      status: null,
      startDate: null,
      endDate: null,
    });
  };

  const hasActiveFilters = filters.unitId || filters.benefitType || filters.status || filters.startDate || filters.endDate;

  return (
    <div className="rounded-xl border border-border bg-card p-3 sm:p-4 animate-fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        {/* Unit Filter */}
        <Select
          value={filters.unitId || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, unitId: value === 'all' ? null : value })}
        >
          <SelectTrigger className="w-full h-9 text-xs sm:text-sm">
            <SelectValue placeholder="Unidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {units.map((unit) => (
              <SelectItem key={unit.id} value={unit.id}>
                {unit.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Benefit Type Filter */}
        <Select
          value={filters.benefitType || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, benefitType: value === 'all' ? null : (value as BenefitType) })}
        >
          <SelectTrigger className="w-full h-9 text-xs sm:text-sm">
            <SelectValue placeholder="Tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            {(Object.keys(benefitTypeFilterLabels) as Array<keyof typeof benefitTypeFilterLabels>).map((type) => (
              <SelectItem key={type} value={type}>
                {benefitTypeFilterLabels[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) => onFiltersChange({ ...filters, status: value === 'all' ? null : (value as BenefitStatus) })}
        >
          <SelectTrigger className="w-full h-9 text-xs sm:text-sm">
            <SelectValue placeholder="Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as situações</SelectItem>
            {(Object.keys(statusFilterLabels) as Array<keyof typeof statusFilterLabels>).map((status) => (
              <SelectItem key={status} value={status}>
                {statusFilterLabels[status]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Start Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full h-9 justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3',
                !filters.startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">
                {filters.startDate ? (
                  format(filters.startDate, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  'Data inicial'
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.startDate || undefined}
              onSelect={(date) => onFiltersChange({ ...filters, startDate: date || null })}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {/* End Date */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full h-9 justify-start text-left font-normal text-xs sm:text-sm px-2 sm:px-3',
                !filters.endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              <span className="truncate">
                {filters.endDate ? (
                  format(filters.endDate, 'dd/MM/yyyy', { locale: ptBR })
                ) : (
                  'Data final'
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={filters.endDate || undefined}
              onSelect={(date) => onFiltersChange({ ...filters, endDate: date || null })}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        {/* Clear Filters Button */}
        <Button 
          variant="outline" 
          onClick={clearFilters} 
          disabled={!hasActiveFilters}
          className="w-full h-9 bg-muted/50 border-border hover:bg-muted text-muted-foreground hover:text-foreground text-xs sm:text-sm px-2 sm:px-3"
        >
          <Eraser className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span className="truncate">Limpar filtros</span>
        </Button>
      </div>
    </div>
  );
}
