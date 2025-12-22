import { MainLayout } from '@/components/layout/MainLayout';
import { Building2, Users, FileText, MapPin } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { NewUnidadeDialog } from '@/components/unidades/NewUnidadeDialog';
import { ManageUnidadeDialog } from '@/components/unidades/ManageUnidadeDialog';
import { formatCnpj } from '@/lib/utils';

interface Unit {
  id: string;
  name: string;
  code: string;
}

interface UnitWithStats extends Unit {
  collaborators_count: number;
  requests_count: number;
}

const DEFAULT_UNITS: Unit[] = [
  { id: 'default-1', name: 'Revalle Juazeiro', code: '04690106000115' },
  { id: 'default-2', name: 'Revalle Bonfim', code: '04690106000387' },
  { id: 'default-3', name: 'Revalle Petrolina', code: '07717961000160' },
  { id: 'default-4', name: 'Revalle Ribeira do Pombal', code: '28098474000137' },
  { id: 'default-5', name: 'Revalle Paulo Afonso', code: '28098474000218' },
  { id: 'default-6', name: 'Revalle Alagoinhas', code: '54677520000162' },
  { id: 'default-7', name: 'Revalle Serrinha', code: '54677520000243' },
];

export default function Unidades() {
  const { data: units, isLoading, refetch } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      // Buscar unidades
      const { data: unitsData, error: unitsError } = await supabase
        .from('units')
        .select('*')
        .order('name');
      
      if (unitsError) throw unitsError;
      
      if (!unitsData || unitsData.length === 0) {
        return DEFAULT_UNITS.map(unit => ({
          ...unit,
          collaborators_count: 0,
          requests_count: 0,
        }));
      }

      // Buscar contagens de colaboradores por unidade com paginação
      let allProfiles: { unit_id: string | null }[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;

      while (hasMore) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('unit_id')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (profilesData && profilesData.length > 0) {
          allProfiles = [...allProfiles, ...profilesData];
          hasMore = profilesData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Buscar solicitações com paginação
      let allRequests: { user_id: string }[] = [];
      page = 0;
      hasMore = true;

      while (hasMore) {
        const { data: requestsData } = await supabase
          .from('benefit_requests')
          .select('user_id')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (requestsData && requestsData.length > 0) {
          allRequests = [...allRequests, ...requestsData];
          hasMore = requestsData.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Buscar profiles para requests com paginação
      let allProfilesForRequests: { user_id: string; unit_id: string | null }[] = [];
      page = 0;
      hasMore = true;

      while (hasMore) {
        const { data: profilesForRequests } = await supabase
          .from('profiles')
          .select('user_id, unit_id')
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (profilesForRequests && profilesForRequests.length > 0) {
          allProfilesForRequests = [...allProfilesForRequests, ...profilesForRequests];
          hasMore = profilesForRequests.length === pageSize;
          page++;
        } else {
          hasMore = false;
        }
      }

      // Contar colaboradores por unidade
      const collaboratorsCounts: Record<string, number> = {};
      allProfiles.forEach(profile => {
        if (profile.unit_id) {
          collaboratorsCounts[profile.unit_id] = (collaboratorsCounts[profile.unit_id] || 0) + 1;
        }
      });

      // Contar solicitações por unidade
      const requestsCounts: Record<string, number> = {};
      allRequests.forEach(request => {
        const profile = allProfilesForRequests.find(p => p.user_id === request.user_id);
        if (profile?.unit_id) {
          requestsCounts[profile.unit_id] = (requestsCounts[profile.unit_id] || 0) + 1;
        }
      });

      // Combinar dados
      return unitsData.map(unit => ({
        ...unit,
        collaborators_count: collaboratorsCounts[unit.id] || 0,
        requests_count: requestsCounts[unit.id] || 0,
      })) as UnitWithStats[];
    },
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Unidades</h1>
              <p className="mt-1 text-muted-foreground">
                Gerencie as unidades da empresa
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Unidades</h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie as unidades da empresa
            </p>
          </div>
          <NewUnidadeDialog onSuccess={() => refetch()} />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {units && units.length > 0 ? (
            units.map((unit, index) => (
              <div
                key={unit.id}
                className="rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
              <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6 shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground truncate">{unit.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{formatCnpj(unit.code)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-medium truncate">Colaboradores</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {unit.collaborators_count}
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4 shrink-0" />
                      <span className="text-xs font-medium truncate">Solicitações</span>
                    </div>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {unit.requests_count}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <ManageUnidadeDialog unit={unit} onSuccess={() => refetch()} />
                </div>
              </div>
            </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Nenhuma unidade cadastrada
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
