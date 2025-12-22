import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, Download, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Unit {
  id: string;
  code: string;
  name: string;
}

const DEPARTAMENTOS_VALIDOS = ['101', '102', '201', '202', '301', '302', '401', '402', '501', '502', '601', '602', '701', '702', '801', '802', '803'];

export function ImportCSVDialog({ onSuccess }: { onSuccess?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (open) {
      fetchUnits();
    }
  }, [open]);

  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('id, code, name')
      .order('name');
    
    if (error) {
      console.error('Error fetching units:', error);
      return;
    }
    
    setUnits(data || []);
  };

  const handleDownloadExample = () => {
    const exampleUnit = units[0]?.code || '04690106000115';
    const csvContent = `nome_completo,cpf,data_aniversario,telefone,sexo,cargo,codigo_unidade,departamento
João Silva,12345678900,01/10/1990,(11) 98765-4321,masculino,Analista,${exampleUnit},301
Maria Santos,98765432100,15/05/1985,(11) 91234-5678,feminino,Gerente,${exampleUnit},401`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'exemplo_colaboradores.csv';
    link.click();
    toast.success('Arquivo de exemplo baixado com sucesso!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const errors: string[] = [];
    let successCount = 0;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('Arquivo CSV vazio ou inválido');
        return;
      }

      // Parse CSV headers
      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['nome_completo', 'cpf', 'data_aniversario', 'telefone', 'sexo', 'cargo', 'codigo_unidade', 'departamento'];
      
      const hasValidHeaders = expectedHeaders.every(h => headers.includes(h));
      if (!hasValidHeaders) {
        toast.error('Cabeçalhos do CSV inválidos. Use o arquivo de exemplo como referência.');
        return;
      }

      // Create a map of unit codes to unit IDs
      const unitMap = new Map(units.map(u => [u.code, u.id]));

      // Check for existing CPFs
      const cpfsToCheck = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        return values[headers.indexOf('cpf')].replace(/\D/g, '');
      });

      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('cpf')
        .in('cpf', cpfsToCheck);

      const existingCpfs = new Set(existingProfiles?.map(p => p.cpf) || []);

      // Process each line
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(v => v.trim());
        
        const rowData = {
          nome_completo: values[headers.indexOf('nome_completo')],
          cpf: values[headers.indexOf('cpf')].replace(/\D/g, ''),
          data_aniversario: values[headers.indexOf('data_aniversario')],
          telefone: values[headers.indexOf('telefone')],
          sexo: values[headers.indexOf('sexo')],
          cargo: values[headers.indexOf('cargo')],
          codigo_unidade: values[headers.indexOf('codigo_unidade')],
          departamento: values[headers.indexOf('departamento')],
        };

        // Validate unit exists
        const unitId = unitMap.get(rowData.codigo_unidade);
        if (!unitId) {
          errors.push(`Linha ${i + 1}: Unidade com código "${rowData.codigo_unidade}" não encontrada`);
          continue;
        }

        // Check for duplicate CPF
        if (existingCpfs.has(rowData.cpf)) {
          errors.push(`Linha ${i + 1}: CPF ${rowData.cpf} já cadastrado`);
          continue;
        }

        // Validate gender
        if (!['masculino', 'feminino'].includes(rowData.sexo.toLowerCase())) {
          errors.push(`Linha ${i + 1}: Sexo deve ser "masculino" ou "feminino"`);
          continue;
        }

        // Validate departamento
        if (!DEPARTAMENTOS_VALIDOS.includes(rowData.departamento)) {
          errors.push(`Linha ${i + 1}: Departamento "${rowData.departamento}" inválido. Use: ${DEPARTAMENTOS_VALIDOS.join(', ')}`);
          continue;
        }

        // Insert profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            full_name: rowData.nome_completo,
            cpf: rowData.cpf,
            birthday: rowData.data_aniversario,
            phone: rowData.telefone,
            gender: rowData.sexo.toLowerCase(),
            position: rowData.cargo,
            unit_id: unitId,
            departamento: rowData.departamento,
            email: `${rowData.cpf}@temp.com`, // Temporary email
            user_id: crypto.randomUUID(), // Temporary user_id
          });

        if (insertError) {
          errors.push(`Linha ${i + 1}: Erro ao inserir - ${insertError.message}`);
        } else {
          successCount++;
          existingCpfs.add(rowData.cpf); // Add to set to prevent duplicates in same file
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(`${successCount} colaborador(es) importado(s) com sucesso!`);
      }
      
      if (errors.length > 0) {
        console.error('Erros na importação:', errors);
        toast.error(`${errors.length} erro(s) encontrado(s). Verifique o console para detalhes.`);
      }
      
      if (successCount > 0) {
        setOpen(false);
        onSuccess?.();
      }
    } catch (error) {
      toast.error('Erro ao processar arquivo CSV');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar Colaboradores via CSV</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Os colaboradores serão importados e salvos no banco de dados. CPFs duplicados serão ignorados.
            </AlertDescription>
          </Alert>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Formato do arquivo CSV:</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li><strong>nome_completo</strong>: Nome completo do colaborador</li>
              <li><strong>cpf</strong>: CPF (apenas números, 11 dígitos)</li>
              <li><strong>data_aniversario</strong>: Data no formato DD/MM/YYYY</li>
              <li><strong>telefone</strong>: Telefone com DDD (ex: (11) 98765-4321)</li>
              <li><strong>sexo</strong>: masculino ou feminino</li>
              <li><strong>cargo</strong>: Cargo do colaborador</li>
              <li><strong>codigo_unidade</strong>: CNPJ da unidade (apenas números)</li>
              <li><strong>departamento</strong>: Código (101, 201, 301, 401 ou 501)</li>
            </ul>
          </div>

          <div className="rounded-lg border border-border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Departamentos disponíveis:</h4>
            <div className="text-sm text-muted-foreground grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
              <div><code className="bg-background px-1 rounded">101</code> – PUXADA</div>
              <div><code className="bg-background px-1 rounded">102</code> – PUXADA</div>
              <div><code className="bg-background px-1 rounded">201</code> – ARMAZEM</div>
              <div><code className="bg-background px-1 rounded">202</code> – ARMAZEM</div>
              <div><code className="bg-background px-1 rounded">301</code> – ADM</div>
              <div><code className="bg-background px-1 rounded">302</code> – ADM</div>
              <div><code className="bg-background px-1 rounded">401</code> – VENDAS</div>
              <div><code className="bg-background px-1 rounded">402</code> – VENDAS</div>
              <div><code className="bg-background px-1 rounded">501</code> – ENTREGA</div>
              <div><code className="bg-background px-1 rounded">502</code> – ENTREGA</div>
              <div><code className="bg-background px-1 rounded">601</code> – ESTAGIO</div>
              <div><code className="bg-background px-1 rounded">602</code> – ESTAGIO</div>
              <div><code className="bg-background px-1 rounded">701</code> – JOVEM APRENDIZ</div>
              <div><code className="bg-background px-1 rounded">702</code> – JOVEM APRENDIZ</div>
              <div><code className="bg-background px-1 rounded">801</code> – ADM - CSC</div>
              <div><code className="bg-background px-1 rounded">802</code> – VENDAS - CSC</div>
              <div><code className="bg-background px-1 rounded">803</code> – ENTREGA - CSC</div>
            </div>
          </div>

          {units.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Unidades disponíveis:</h4>
              <div className="text-sm text-muted-foreground space-y-1 max-h-40 overflow-y-auto">
                {units.map(unit => (
                  <div key={unit.id} className="flex justify-between">
                    <span>{unit.name}</span>
                    <code className="text-xs bg-background px-2 py-0.5 rounded">{unit.code}</code>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleDownloadExample}
          >
            <Download className="h-4 w-4" />
            Baixar Arquivo de Exemplo
          </Button>

          <div className="relative">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={loading}
            />
            <Button className="w-full gap-2" disabled={loading}>
              <Upload className="h-4 w-4" />
              {loading ? 'Processando...' : 'Selecionar Arquivo CSV'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Arraste um arquivo CSV ou clique para selecionar
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}