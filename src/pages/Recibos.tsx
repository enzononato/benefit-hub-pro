import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { Search, Download, Eye, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';

interface PaymentReceipt {
  id: string;
  file_name: string;
  file_url: string;
  uploaded_at: string;
  benefit_request_id: string;
  benefit_requests: {
    user_id: string;
    profiles: {
      full_name: string;
    } | null;
  } | null;
}

export default function Recibos() {
  const [search, setSearch] = useState('');
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    const { data, error } = await supabase
      .from('payment_receipts')
      .select('id, file_name, file_url, uploaded_at, benefit_request_id, benefit_requests(user_id, profiles(full_name))')
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching receipts:', error);
    } else {
      setReceipts(data as unknown as PaymentReceipt[]);
    }
    setLoading(false);
  };

  const filteredReceipts = receipts.filter((receipt) => {
    const matchesSearch = 
      receipt.benefit_requests?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      receipt.file_name.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Recibos de Pagamento</h1>
            <p className="mt-1 text-muted-foreground">
              Visualize e faça download dos recibos de pagamento
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Recibos</p>
                <p className="text-2xl font-bold text-foreground">{receipts.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10">
                <Download className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Último Upload</p>
                <p className="text-2xl font-bold text-foreground">
                  {receipts[0] ? new Date(receipts[0].uploaded_at).toLocaleDateString('pt-BR') : '-'}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <Eye className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Colaboradores</p>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(receipts.map(r => r.benefit_requests?.user_id).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por colaborador ou arquivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Colaborador</TableHead>
                <TableHead className="font-semibold">Arquivo</TableHead>
                <TableHead className="font-semibold">Data Upload</TableHead>
                <TableHead className="font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredReceipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    Nenhum recibo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                          {receipt.benefit_requests?.profiles?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '??'}
                        </div>
                        <span className="font-medium">{receipt.benefit_requests?.profiles?.full_name || 'Usuário'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {receipt.file_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(receipt.uploaded_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="gap-2" asChild>
                          <a href={receipt.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="h-4 w-4" />
                            Ver
                          </a>
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-2" asChild>
                          <a href={receipt.file_url} download>
                            <Download className="h-4 w-4" />
                            Baixar
                          </a>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination info */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Mostrando {filteredReceipts.length} de {receipts.length} recibos</span>
        </div>
      </div>
    </MainLayout>
  );
}
