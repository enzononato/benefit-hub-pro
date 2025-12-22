import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileUp, Send, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { benefitTypeLabels, type BenefitStatus } from "@/types/benefits";
import { formatCpf } from "@/lib/utils";

interface BenefitDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: {
    id: string;
    protocol: string;
    benefit_type: string;
    status: BenefitStatus;
    details: string | null;
    created_at: string;
    pdf_url: string | null;
    pdf_file_name: string | null;
    rejection_reason: string | null;
    closing_message: string | null;
    account_id: number | null;
    conversation_id: number | null;
    profiles: {
      full_name: string;
      cpf: string | null;
      phone: string | null;
      units: {
        name: string;
      } | null;
    } | null;
  };
  onSuccess?: () => void;
  currentIndex?: number;
  totalItems?: number;
  onNavigate?: (direction: 'prev' | 'next') => void;
}

export function BenefitDetailsDialog({
  open,
  onOpenChange,
  request,
  onSuccess,
  currentIndex = 0,
  totalItems = 1,
  onNavigate,
}: BenefitDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BenefitStatus>(request.status);
  const [rejectionReason, setRejectionReason] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState(request.pdf_url);

  // Reset state when request changes
  useEffect(() => {
    setStatus(request.status);
    setRejectionReason(request.rejection_reason || "");
    setClosingMessage(request.closing_message || "");
    setPdfUrl(request.pdf_url);
    setPdfFile(null);
  }, [request.id, request.status, request.rejection_reason, request.closing_message, request.pdf_url]);

  const handleApprove = () => {
    setStatus("aprovada");
    toast.success("Status alterado para Aprovado. Faça o upload do PDF.");
  };

  const handleReject = () => {
    setStatus("recusada");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Por favor, selecione um arquivo PDF");
      return;
    }

    setPdfFile(file);

    // Upload imediato
    setLoading(true);
    try {
      const fileName = `${request.protocol}_${Date.now()}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("benefit-pdfs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("benefit-pdfs")
        .getPublicUrl(fileName);

      setPdfUrl(urlData.publicUrl);
      toast.success("PDF enviado com sucesso");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao enviar PDF: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const sendWebhook = async (webhookStatus: 'aprovado' | 'reprovado', motivo?: string, mensagemRh?: string) => {
    try {
      const webhookData = {
        protocolo: request.protocol,
        nome_colaborador: request.profiles?.full_name || "N/A",
        telefone_whatsapp: request.profiles?.phone || "",
        status: webhookStatus,
        motivo: motivo || null,
        account_id: request.account_id || null,
        conversation_id: request.conversation_id || null,
        mensagem_rh: mensagemRh || null,
      };

      console.log("Enviando webhook:", webhookData);

      const response = await fetch("https://n8n.revalle.com.br/webhook/aprovacao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookData),
      });

      if (!response.ok) {
        console.error("Erro no webhook:", response.status, response.statusText);
      } else {
        console.log("Webhook enviado com sucesso");
      }
    } catch (error) {
      console.error("Erro ao enviar webhook:", error);
    }
  };

  const handleSend = async () => {
    setLoading(true);
    try {
      // Validações
      if (status === "aprovada" && !pdfUrl) {
        toast.error("É necessário fazer o upload do PDF antes de enviar");
        setLoading(false);
        return;
      }

      if (status === "recusada" && !rejectionReason.trim()) {
        toast.error("Por favor, informe o motivo da rejeição");
        setLoading(false);
        return;
      }

      if (!closingMessage.trim()) {
        toast.error("Por favor, insira uma mensagem para o colaborador");
        setLoading(false);
        return;
      }

      // Determinar status final
      const finalStatus: BenefitStatus = 
        status === "aprovada" ? "concluida" : "recusada";

      // Atualizar solicitação no banco
      const { error: updateError } = await supabase
        .from("benefit_requests")
        .update({
          status: finalStatus,
          pdf_url: pdfUrl,
          pdf_file_name: pdfFile?.name || request.pdf_file_name,
          rejection_reason: status === "recusada" ? rejectionReason : null,
          closing_message: closingMessage,
          closed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) throw updateError;

      // Registrar log
      await supabase.from("logs").insert({
        entity_type: "benefit_request",
        entity_id: request.id,
        action: finalStatus === "concluida" ? "approved" : "rejected",
        details: {
          protocol: request.protocol,
          status: finalStatus,
          message: closingMessage,
        },
      });

      // Enviar webhook para n8n
      await sendWebhook(
        status === "aprovada" ? "aprovado" : "reprovado",
        status === "recusada" ? rejectionReason : undefined,
        closingMessage
      );

      // Enviar mensagem WhatsApp
      const whatsappMessage = `
📦 *Sistema de Convênios — Encerramento de Protocolo*

🔹 *Protocolo:* ${request.protocol}
${pdfUrl ? `🧾 *Nota Fiscal:* ${pdfUrl}` : ""}
👤 *Colaborador:* ${request.profiles?.full_name || "N/A"}
🏭 *Unidade:* ${request.profiles?.units?.name || "N/A"}
📅 *Data do Encerramento:* ${format(new Date(), "dd/MM/yyyy · HH:mm", { locale: ptBR })}

🗒️ *Mensagem ao Colaborador:*
${closingMessage}

⚙️ *Status do Protocolo:* ${finalStatus === "concluida" ? "✅ Liberado" : "❌ Rejeitado"}
${status === "recusada" && rejectionReason ? `\n❗ *Motivo:* ${rejectionReason}` : ""}
      `.trim();

      // TODO: Implementar envio real via WhatsApp
      console.log("Mensagem WhatsApp:", whatsappMessage);

      toast.success("Solicitação atualizada com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error("Erro ao enviar:", error);
      toast.error("Erro ao processar solicitação: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const isPending = request.status === "aberta" || request.status === "em_analise";
  const isApproved = status === "aprovada";
  const isRejected = status === "recusada";
  const isClosed = request.status === "concluida" || request.status === "recusada";

  const canNavigatePrev = currentIndex > 0;
  const canNavigateNext = currentIndex < totalItems - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between pr-8">
          <DialogTitle>Detalhes da Solicitação</DialogTitle>
          
          {/* Navegação */}
          {onNavigate && totalItems > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onNavigate('prev')}
                disabled={!canNavigatePrev || loading}
                title="Protocolo anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                {currentIndex + 1} / {totalItems}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => onNavigate('next')}
                disabled={!canNavigateNext || loading}
                title="Próximo protocolo"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Protocolo */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <Label className="text-muted-foreground">Protocolo</Label>
              <p className="font-semibold">{request.protocol}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Data de Abertura</Label>
              <p className="font-semibold">
                {format(new Date(request.created_at), "dd/MM/yyyy · HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
            <div>
              <Label className="text-muted-foreground">Colaborador</Label>
              <p className="font-semibold">{request.profiles?.full_name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">CPF</Label>
              <p className="font-semibold">{request.profiles?.cpf ? formatCpf(request.profiles.cpf) : "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Unidade</Label>
              <p className="font-semibold">{request.profiles?.units?.name || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">WhatsApp</Label>
              <p className="font-semibold">{request.profiles?.phone || "N/A"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Tipo de Convênio</Label>
              <p className="font-semibold">{benefitTypeLabels[request.benefit_type as keyof typeof benefitTypeLabels]}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Status Atual</Label>
              <div className="mt-1">
                <StatusBadge status={status} />
              </div>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground">Descrição</Label>
              <p className="font-semibold">{request.details || "Sem descrição"}</p>
            </div>
          </div>

          {/* Mostrar informações de fechamento se já estiver encerrado */}
          {isClosed && (
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <Label className="text-muted-foreground">Este protocolo já foi encerrado</Label>
              {request.closing_message && (
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">Mensagem de encerramento:</Label>
                  <p className="text-sm mt-1">{request.closing_message}</p>
                </div>
              )}
              {request.rejection_reason && (
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">Motivo da rejeição:</Label>
                  <p className="text-sm mt-1">{request.rejection_reason}</p>
                </div>
              )}
              {request.pdf_url && (
                <div className="mt-2">
                  <a
                    href={request.pdf_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    Ver PDF anexado
                  </a>
                </div>
              )}
            </div>
          )}

          {/* Ações de Aprovação/Rejeição */}
          {isPending && !isClosed && (
            <div className="flex gap-3">
              <Button
                onClick={handleApprove}
                className="flex-1"
                variant="default"
                disabled={loading || isApproved}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Aprovar
              </Button>
              <Button
                onClick={handleReject}
                className="flex-1"
                variant="destructive"
                disabled={loading || isRejected}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Rejeitar
              </Button>
            </div>
          )}

          {/* Motivo da Rejeição */}
          {isRejected && !isClosed && (
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Motivo da Rejeição</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo da rejeição..."
                rows={3}
              />
            </div>
          )}

          {/* Upload de PDF */}
          {isApproved && !isClosed && (
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">Upload de PDF (Obrigatório)</Label>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => document.getElementById("pdf-upload")?.click()}
                  variant="outline"
                  disabled={loading}
                  className="w-full"
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  {pdfFile ? pdfFile.name : pdfUrl ? "Substituir PDF" : "Selecionar PDF"}
                </Button>
                <input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              {pdfUrl && (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Ver PDF atual
                </a>
              )}
            </div>
          )}

          {/* Mensagem para o Colaborador */}
          {(isApproved || isRejected) && !isClosed && (
            <div className="space-y-2">
              <Label htmlFor="closing-message">Mensagem ao Colaborador *</Label>
              <Textarea
                id="closing-message"
                value={closingMessage}
                onChange={(e) => setClosingMessage(e.target.value)}
                placeholder={
                  isApproved
                    ? "Seu convênio foi aprovado. Segue o comprovante para conferência."
                    : "Sua solicitação foi analisada e não pôde ser aprovada."
                }
                rows={4}
              />
            </div>
          )}

          {/* Botão Enviar */}
          {(isApproved || isRejected) && !isClosed && (
            <Button
              onClick={handleSend}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Enviando..." : "Enviar e Finalizar"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
