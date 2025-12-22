import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { benefitTypeLabels, benefitTypeFilterLabels, statusLabels, statusFilterLabels, BenefitStatus, BenefitType } from '@/types/benefits';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { NewBenefitDialog } from '@/components/benefits/NewBenefitDialog';
import { BenefitDetailsSheet } from '@/components/benefits/BenefitDetailsSheet';
import { StatsCards } from '@/components/benefits/StatsCards';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { Label } from '@/components/ui/label';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Filter, Download, Eye, Calendar, ArrowUpDown, ExternalLink, Eraser, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { formatPhone, unformatPhone, getWhatsAppLink, getRelativeTime, getSLATime } from '@/lib/formatters';

interface BenefitRequest {
  id: string;
  protocol: string;
  benefit_type: BenefitType;
  status: BenefitStatus;
  created_at: string;
  user_id: string;
  profiles: {
    full_name: string;
    phone: string | null;
    cpf: string | null;
  } | null;
}

type SortField = 'created_at' | 'full_name' | 'status' | 'benefit_type';
type SortOrder = 'asc' | 'desc';

export default function Solicitacoes() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const urlStatus = searchParams.get('status');
    return urlStatus || 'all';
  });
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [whatsappFilter, setWhatsappFilter] = useState('');
  const [requests, setRequests] = useState<BenefitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [pendingViewRequest, setPendingViewRequest] = useState<{ id: string; index: number } | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const { data: requestsData, error: requestsError } = await supabase
      .from('benefit_requests')
      .select('id, protocol, benefit_type, status, created_at, user_id')
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Error fetching requests:', requestsError);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((requestsData || []).map((r) => r.user_id).filter(Boolean))];

    const { data: profilesData, error: profilesError } = userIds.length
      ? await supabase
          .from('profiles')
          .select('user_id, full_name, phone, cpf')
          .in('user_id', userIds)
      : { data: [], error: null };

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
    }

    const profilesMap = new Map((profilesData || []).map((p) => [p.user_id, p]));

    const requestsWithProfiles = (requestsData || []).map((request) => {
      const profile = profilesMap.get(request.user_id);
      return {
        ...request,
        profiles: profile ? { full_name: profile.full_name, phone: profile.phone, cpf: profile.cpf } : null,
      };
    });

    setRequests(requestsWithProfiles as unknown as BenefitRequest[]);
    setLoading(false);
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value) {
      setWhatsappFilter('');
      return;
    }
    setWhatsappFilter(formatPhone(value));
  };

  const filteredRequests = useMemo(() => {
    let result = requests.filter((request) => {
      // Busca inteligente: protocolo, nome, CPF, telefone
      const searchTerm = search.trim();
      if (!searchTerm) {
        // Se não há busca, passa direto para os outros filtros
      } else {
        const searchLower = searchTerm.toLowerCase();
        const searchNumbers = searchTerm.replace(/\D/g, '');
        
        // Normaliza os dados do request para comparação
        const protocolMatch = request.protocol?.toLowerCase().includes(searchLower);
        const nameMatch = request.profiles?.full_name?.toLowerCase().includes(searchLower);
        
        // Para CPF e telefone, compara apenas números
        const cpfClean = request.profiles?.cpf?.replace(/\D/g, '') || '';
        const phoneClean = request.profiles?.phone?.replace(/\D/g, '') || '';
        const cpfMatch = searchNumbers.length > 0 && cpfClean.includes(searchNumbers);
        const phoneMatch = searchNumbers.length > 0 && phoneClean.includes(searchNumbers);
        
        const matchesSearch = protocolMatch || nameMatch || cpfMatch || phoneMatch;
        
        if (!matchesSearch) return false;
      }

      const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
      const matchesType = typeFilter === 'all' || request.benefit_type === typeFilter;

      const whatsappNumbers = unformatPhone(whatsappFilter);
      const phoneClean = request.profiles?.phone?.replace(/\D/g, '') || '';
      const matchesWhatsapp = !whatsappNumbers || phoneClean.includes(whatsappNumbers);

      const requestDate = new Date(request.created_at);
      const matchesStartDate = !startDate || requestDate >= new Date(startDate);
      const matchesEndDate = !endDate || requestDate <= new Date(endDate + 'T23:59:59');

      return matchesStatus && matchesType && matchesWhatsapp && matchesStartDate && matchesEndDate;
    });

    // Ordenação
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'created_at':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'full_name':
          comparison = (a.profiles?.full_name || '').localeCompare(b.profiles?.full_name || '');
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'benefit_type':
          comparison = a.benefit_type.localeCompare(b.benefit_type);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [requests, search, statusFilter, typeFilter, whatsappFilter, startDate, endDate, sortField, sortOrder]);

  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleViewDetails = async (requestId: string, index: number) => {
    const { data: requestData, error: requestError } = await supabase
      .from('benefit_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.error('Error fetching request details:', requestError);
      return;
    }

    // Se status é 'aberta', mostrar confirmação antes de mudar para 'em_analise'
    if (requestData.status === 'aberta') {
      setPendingViewRequest({ id: requestId, index });
      setConfirmDialogOpen(true);
      return;
    }

    await openRequestDetails(requestData, index);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingViewRequest) return;

    const { data: requestData, error: requestError } = await supabase
      .from('benefit_requests')
      .select('*')
      .eq('id', pendingViewRequest.id)
      .single();

    if (requestError) {
      console.error('Error fetching request details:', requestError);
      setConfirmDialogOpen(false);
      setPendingViewRequest(null);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();

    const { error: updateError } = await supabase
      .from('benefit_requests')
      .update({
        status: 'em_analise',
        reviewed_by: userData?.user?.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pendingViewRequest.id);

    if (updateError) {
      console.error('Error updating status:', updateError);
      toast.error('Erro ao atualizar status');
    } else {
      requestData.status = 'em_analise';
      setRequests((prev) => prev.map((r) => (r.id === pendingViewRequest.id ? { ...r, status: 'em_analise' } : r)));
      toast.info('Status alterado para "Em Análise"');
    }

    await openRequestDetails(requestData, pendingViewRequest.index);
    setConfirmDialogOpen(false);
    setPendingViewRequest(null);
  };

  const openRequestDetails = async (requestData: any, index: number) => {
    const { data: profileData } = await supabase
      .from('profiles')
      .select(`full_name, cpf, phone, unit_id, units (name)`)
      .eq('user_id', requestData.user_id)
      .single();

    // Buscar nome do responsável pela análise (reviewed_by)
    let reviewerName = null;
    if (requestData.reviewed_by) {
      const { data: reviewerData } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', requestData.reviewed_by)
        .single();
      reviewerName = reviewerData?.full_name || null;
    }

    const combinedData = {
      ...requestData,
      profiles: profileData,
      reviewer_name: reviewerName,
    };

    setSelectedRequest(combinedData);
    setCurrentIndex(index);
    setDetailsOpen(true);
  };

  const handleNavigate = async (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;

    if (newIndex >= 0 && newIndex < filteredRequests.length) {
      const request = filteredRequests[newIndex];
      await handleViewDetails(request.id, newIndex);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
    setWhatsappFilter('');
    setCurrentPage(1);
    // Clear URL params
    setSearchParams({});
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
    // Update URL params
    if (value === 'all') {
      searchParams.delete('status');
    } else {
      searchParams.set('status', value);
    }
    setSearchParams(searchParams);
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead
      className="font-semibold cursor-pointer hover:bg-muted/30 transition-colors select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        <span className="truncate">{children}</span>
        <ArrowUpDown className={`h-3 w-3 shrink-0 ${sortField === field ? 'text-primary' : 'text-muted-foreground/50'}`} />
      </div>
    </TableHead>
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Solicitações de Convênios</h1>
            <p className="mt-1 text-muted-foreground">
              Cadastre e gerencie solicitações de convênios dos colaboradores
            </p>
          </div>
          <div className="flex gap-3">
            <NewBenefitDialog onSuccess={fetchRequests} />
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <StatsCards requests={requests} />

        {/* Filters */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          {/* Busca inteligente */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground shrink-0" />
            <Input
              placeholder="Buscar por protocolo, colaborador, CPF ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-11"
            />
          </div>

          {/* Linha de filtros */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="h-9">
                  <Filter className="mr-2 h-3 w-3 shrink-0" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(Object.keys(statusFilterLabels) as Array<keyof typeof statusFilterLabels>).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusFilterLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {(Object.keys(benefitTypeFilterLabels) as Array<keyof typeof benefitTypeFilterLabels>).map((type) => (
                    <SelectItem key={type} value={type}>
                      {benefitTypeFilterLabels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Inicial</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground shrink-0" />
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-8 h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Data Final</Label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground shrink-0" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-8 h-9" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">WhatsApp</Label>
              <Input
                placeholder="(00) 00000-0000"
                value={whatsappFilter}
                onChange={handleWhatsappChange}
                className="h-9"
                maxLength={15}
              />
            </div>

            <div className="space-y-1.5 flex flex-col justify-end">
              <Button 
                variant="outline" 
                onClick={clearFilters} 
                className="h-9 bg-muted/50 border-border hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <Eraser className="mr-2 h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Limpar filtros</span>
                <span className="sm:hidden">Limpar</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Protocolo</TableHead>
                <SortableHeader field="full_name">Colaborador</SortableHeader>
                <TableHead className="font-semibold">WhatsApp</TableHead>
                <SortableHeader field="benefit_type">Tipo</SortableHeader>
                <SortableHeader field="status">Status</SortableHeader>
                <TableHead className="font-semibold">SLA</TableHead>
                <SortableHeader field="created_at">Data</SortableHeader>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Nenhuma solicitação encontrada
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request, idx) => {
                  const globalIndex = (currentPage - 1) * itemsPerPage + idx;
                  return (
                    <TableRow key={request.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-mono text-sm">{request.protocol}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                            {request.profiles?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2) || '??'}
                          </div>
                          <span className="font-medium truncate max-w-[150px]">{request.profiles?.full_name || 'Usuário'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.profiles?.phone ? (
                          <a
                            href={getWhatsAppLink(request.profiles.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                          >
                            <span className="truncate">{request.profiles.phone}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{benefitTypeLabels[request.benefit_type]}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 shrink-0" />
                          <span className="truncate">{getSLATime(request.created_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{new Date(request.created_at).toLocaleDateString('pt-BR')}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleViewDetails(request.id, globalIndex)}
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4 shrink-0" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredRequests.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalItems={filteredRequests.length}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </div>

      {/* Sheet de Detalhes */}
      {selectedRequest && (
        <BenefitDetailsSheet
          open={detailsOpen}
          onOpenChange={setDetailsOpen}
          request={selectedRequest}
          onSuccess={fetchRequests}
          currentIndex={currentIndex}
          totalItems={filteredRequests.length}
          onNavigate={handleNavigate}
        />
      )}

      {/* Dialog de Confirmação */}
      <ConfirmDialog
        open={confirmDialogOpen}
        onOpenChange={(open) => {
          setConfirmDialogOpen(open);
          if (!open) setPendingViewRequest(null);
        }}
        title="Iniciar análise?"
        description="Ao visualizar esta solicitação, o status será alterado para 'Em Análise'. O colaborador será notificado sobre esta mudança. Deseja continuar?"
        confirmLabel="Sim, iniciar análise"
        cancelLabel="Cancelar"
        onConfirm={handleConfirmStatusChange}
      />
    </MainLayout>
  );
}
