import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Smartphone, Settings, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export default function WhatsApp() {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">WhatsApp</h1>
            <p className="mt-1 text-muted-foreground">
              Configure a integração com WhatsApp
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Connection Status */}
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success/10 text-success">
                  <MessageSquare className="h-7 w-7" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">Status da Conexão</h3>
                    <Badge className="bg-success/15 text-success border-success/30">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Número: +55 11 99900-1234
                  </p>
                </div>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Configurar
                </Button>
              </div>
            </div>

            {/* Webhook Config */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Configuração do Webhook</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground">URL do Webhook</label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      value="https://api.seudominio.com/whatsapp/webhook"
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline">Copiar</Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground">Token de Verificação</label>
                  <div className="mt-1.5 flex gap-2">
                    <Input
                      value="••••••••••••••••"
                      type="password"
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button variant="outline">Regenerar</Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Message */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Enviar Mensagem de Teste</h3>
              <div className="flex gap-2">
                <Input placeholder="Número do telefone (ex: 5511999001234)" />
                <Button className="gap-2">
                  <Send className="h-4 w-4" />
                  Enviar
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Mensagens Hoje</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Recebidas</span>
                  <span className="text-2xl font-bold text-foreground">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Enviadas</span>
                  <span className="text-2xl font-bold text-foreground">0</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Protocolos Criados</span>
                  <span className="text-2xl font-bold text-primary">0</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Comandos Disponíveis</h3>
              <div className="space-y-3">
                {['vale gás', 'vale refeição', 'vale transporte', 'status', 'ajuda'].map((cmd) => (
                  <div key={cmd} className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <code className="bg-muted px-2 py-0.5 rounded text-xs">{cmd}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
