import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileUp,
  Send,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Phone,
  Building2,
  User,
  Calendar,
  FileText,
  ExternalLink,
} from "lucide-react";
import { benefitTypeLabels, type BenefitStatus } from "@/types/benefits";
import { formatCpf } from "@/lib/utils";
import { getWhatsAppLink, getRelativeTime } from "@/lib/formatters";

interface BenefitDetailsSheetProps {
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
    reviewed_by: string | null;
    reviewed_at: string | null;
    reviewer_name: string | null;
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
  onNavigate?: (direction: "prev" | "next") => void;
}

export function BenefitDetailsSheet({
  open,
  onOpenChange,
  request,
  onSuccess,
  currentIndex = 0,
  totalItems = 1,
  onNavigate,
}: BenefitDetailsSheetProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BenefitStatus>(request.status);
  const [rejectionReason, setRejectionReason] = useState("");
  const [closingMessage, setClosingMessage] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState(request.pdf_url);

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

      const finalStatus: BenefitStatus =
        status === "aprovada" ? "concluida" : "recusada";

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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        {/* Header fixo */}
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg">Detalhes do Protocolo</SheetTitle>
              <p className="text-sm text-muted-foreground font-mono mt-1">
                {request.protocol}
              </p>
            </div>

            {/* Navegação */}
            {onNavigate && totalItems > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onNavigate("prev")}
                  disabled={!canNavigatePrev || loading}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground min-w-[50px] text-center">
                  {currentIndex + 1} / {totalItems}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onNavigate("next")}
                  disabled={!canNavigateNext || loading}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Conteúdo scrollável */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {/* Status atual */}
            <div className="flex items-center justify-between">
              <StatusBadge status={status} />
              <span className="text-xs text-muted-foreground">
                {getRelativeTime(request.created_at)}
              </span>
            </div>

            {/* Informações do colaborador */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Colaborador</h4>
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{request.profiles?.full_name || "N/A"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {request.profiles?.cpf ? formatCpf(request.profiles.cpf) : "CPF não informado"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{request.profiles?.units?.name || "Unidade não informada"}</span>
                </div>
                {request.profiles?.phone && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{request.profiles.phone}</span>
                    </div>
                    <a
                      href={getWhatsAppLink(request.profiles.phone)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Abrir WhatsApp
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Detalhes do convênio */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Convênio</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Tipo</p>
                  <p className="font-medium">
                    {benefitTypeLabels[request.benefit_type as keyof typeof benefitTypeLabels]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Data de Abertura</p>
                  <p className="font-medium">
                    {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
                {request.reviewer_name && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Responsável pela Análise</p>
                    <p className="font-medium text-primary">{request.reviewer_name}</p>
                    {request.reviewed_at && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        desde {format(new Date(request.reviewed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                )}
              </div>
              {request.details && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm bg-muted/50 rounded p-3">{request.details}</p>
                </div>
              )}
            </div>

            {/* Informações de fechamento (se já encerrado) */}
            {isClosed && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Encerramento</h4>
                  {request.closing_message && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Mensagem</p>
                      <p className="text-sm bg-muted/50 rounded p-3">{request.closing_message}</p>
                    </div>
                  )}
                  {request.rejection_reason && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Motivo da rejeição</p>
                      <p className="text-sm bg-destructive/10 text-destructive rounded p-3">
                        {request.rejection_reason}
                      </p>
                    </div>
                  )}
                  {request.pdf_url && (
                    <a
                      href={request.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <FileUp className="h-4 w-4" />
                      Ver PDF anexado
                    </a>
                  )}
                </div>
              </>
            )}

            {/* Ações (se pendente) */}
            {isPending && !isClosed && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Ações</h4>

                  {/* Botões de ação */}
                  <div className="flex gap-3">
                    <Button
                      onClick={handleApprove}
                      className="flex-1"
                      variant={isApproved ? "default" : "outline"}
                      disabled={loading}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Aprovar
                    </Button>
                    <Button
                      onClick={handleReject}
                      className="flex-1"
                      variant={isRejected ? "destructive" : "outline"}
                      disabled={loading}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reprovar
                    </Button>
                  </div>

                  {/* Campo de rejeição */}
                  {isRejected && (
                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
                      <Textarea
                        id="rejection-reason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Descreva o motivo da rejeição..."
                        rows={3}
                      />
                    </div>
                  )}

                  {/* Upload de PDF (aprovado) */}
                  {isApproved && (
                    <div className="space-y-2">
                      <Label>Upload de PDF *</Label>
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
                      {pdfUrl && (
                        <a
                          href={pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline"
                        >
                          Ver PDF atual
                        </a>
                      )}
                    </div>
                  )}

                  {/* Mensagem ao colaborador */}
                  {(isApproved || isRejected) && (
                    <div className="space-y-2">
                      <Label htmlFor="closing-message">Mensagem ao Colaborador *</Label>
                      <Textarea
                        id="closing-message"
                        value={closingMessage}
                        onChange={(e) => setClosingMessage(e.target.value)}
                        placeholder={
                          isApproved
                            ? "Seu convênio foi aprovado..."
                            : "Sua solicitação foi analisada..."
                        }
                        rows={3}
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer fixo com botão de enviar */}
        {(isApproved || isRejected) && !isClosed && (
          <div className="p-6 pt-4 border-t border-border">
            <Button
              onClick={handleSend}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              <Send className="w-4 h-4 mr-2" />
              {loading ? "Enviando..." : "Enviar e Encerrar"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
