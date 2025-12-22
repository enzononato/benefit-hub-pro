// Alinhado com os enums do banco de dados Supabase
export type BenefitType = 'autoescola' | 'farmacia' | 'oficina' | 'vale_gas' | 'papelaria' | 'otica' | 'outros';

export type BenefitStatus = 'aberta' | 'em_analise' | 'aprovada' | 'recusada' | 'concluida';

export type UserRole = 'colaborador' | 'gestor' | 'admin';

export interface Unit {
  id: string;
  name: string;
  code: string;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  unitId: string;
  unit?: Unit;
  role: UserRole;
  createdAt: Date;
}

export interface BenefitRequest {
  id: string;
  protocol: string;
  user_id: string;
  user?: User;
  benefit_type: BenefitType;
  status: BenefitStatus;
  details: string;
  requested_value?: number;
  approved_value?: number;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  pdf_url?: string;
  pdf_file_name?: string;
  closing_message?: string;
  closed_by?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Log {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string;
  user?: User;
  details?: any;
  created_at: string;
}

export const benefitTypeLabels: Record<BenefitType, string> = {
  autoescola: '🚗 Autoescola',
  farmacia: '💊 Farmácia',
  oficina: '🔧 Oficina',
  vale_gas: '⛽ Vale Gás',
  papelaria: '📝 Papelaria',
  otica: '👓 Ótica',
  outros: '📋 Outros',
};

export const statusLabels: Record<BenefitStatus, string> = {
  aberta: 'Aberto',
  em_analise: 'Em Análise',
  aprovada: 'Aprovado',
  recusada: 'Recusado',
  concluida: 'Aprovado', // Concluída é exibida como Aprovado na UI
};

// Status labels for filters (sem concluida)
export const statusFilterLabels: Record<Exclude<BenefitStatus, 'concluida'>, string> = {
  aberta: 'Aberto',
  em_analise: 'Em Análise',
  aprovada: 'Aprovado',
  recusada: 'Reprovado',
};

// Benefit types without "outros" for filters
export const benefitTypeFilterLabels: Record<Exclude<BenefitType, 'outros'>, string> = {
  autoescola: '🚗 Autoescola',
  farmacia: '💊 Farmácia',
  oficina: '🔧 Oficina',
  vale_gas: '⛽ Vale Gás',
  papelaria: '📝 Papelaria',
  otica: '👓 Ótica',
};

export const roleLabels: Record<UserRole, string> = {
  colaborador: 'Colaborador',
  gestor: 'Gestor',
  admin: 'Administrador',
};
