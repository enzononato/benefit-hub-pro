-- Deletar recibos de pagamento associados às solicitações
DELETE FROM payment_receipts;

-- Deletar notificações relacionadas a solicitações
DELETE FROM notifications WHERE entity_type = 'benefit_request';

-- Deletar logs relacionados a solicitações
DELETE FROM logs WHERE entity_type = 'benefit_request';

-- Deletar todas as solicitações de teste
DELETE FROM benefit_requests;