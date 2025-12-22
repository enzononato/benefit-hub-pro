/**
 * Formata número de telefone com máscara brasileira
 */
export function formatPhone(value: string): string {
  if (!value) return '';
  
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length === 0) return '';
  if (numbers.length <= 2) {
    return `(${numbers}`;
  }
  if (numbers.length <= 7) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  }
  if (numbers.length <= 11) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
  }
  return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
}

/**
 * Remove máscara do telefone
 */
export function unformatPhone(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Gera link do WhatsApp
 */
export function getWhatsAppLink(phone: string): string {
  const numbers = phone.replace(/\D/g, '');
  const phoneWithCountry = numbers.startsWith('55') ? numbers : `55${numbers}`;
  return `https://wa.me/${phoneWithCountry}`;
}

/**
 * Calcula tempo relativo (ex: "há 2 dias")
 */
export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Agora';
  if (diffMins < 60) return `Há ${diffMins} min`;
  if (diffHours < 24) return `Há ${diffHours}h`;
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `Há ${diffDays} dias`;
  if (diffDays < 30) return `Há ${Math.floor(diffDays / 7)} sem`;
  return `Há ${Math.floor(diffDays / 30)} mês`;
}

/**
 * Calcula SLA - tempo em aberto formatado (ex: "3h 42min")
 */
export function getSLATime(date: Date | string): string {
  const now = new Date();
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - targetDate.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) return `${diffMins}min`;
  if (diffHours < 24) {
    const mins = diffMins % 60;
    return `${diffHours}h ${mins}min`;
  }
  if (diffDays < 7) {
    const hours = diffHours % 24;
    return `${diffDays}d ${hours}h`;
  }
  return `${diffDays}d`;
}
