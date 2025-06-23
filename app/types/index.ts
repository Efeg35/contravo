// Contract Status Enum
export type ContractStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SENT_FOR_SIGNATURE' | 'SIGNED' | 'ARCHIVED';

// Contract Types
export type ContractType = 
  | 'general' 
  | 'procurement' 
  | 'service' 
  | 'sales' 
  | 'employment' 
  | 'partnership' 
  | 'nda' 
  | 'rental';

// Base Contract Interface
export interface Contract {
  id: string;
  title: string;
  description?: string;
  status: ContractStatus;
  type: ContractType;
  value?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  otherPartyName?: string;
  otherPartyEmail?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdById: string;
  companyId?: string;
}

// User Interface
export interface User {
  id: string;
  name?: string;
  email: string;
  role?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// Contract with Relations
export interface ContractWithUser extends Contract {
  createdBy: Pick<User, 'name' | 'email'>;
}

// Dashboard Stats
export interface DashboardStats {
  totalContracts: number;
  draftContracts: number;
  reviewContracts: number;
  signedContracts: number;
  monthlyContracts: number;
  recentContracts: ContractWithUser[];
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Data Types
export interface CreateContractData {
  title: string;
  description?: string;
  type: ContractType;
  value?: number;
  startDate?: string;
  endDate?: string;
  otherPartyName?: string;
  otherPartyEmail?: string;
}

export interface UpdateContractData extends Partial<CreateContractData> {
  status?: ContractStatus;
}

// Component Props - Şimdilik basit tutalım
export interface HeroProps {
  className?: string;
}

export interface FeaturesProps {
  className?: string;
}

export interface UseCasesProps {
  className?: string;
}

export interface TestimonialsProps {
  className?: string;
}

export interface PricingProps {
  className?: string;
}

export interface BlogProps {
  className?: string;
}

export interface ContactFormProps {
  className?: string;
}

export interface FAQProps {
  className?: string;
}

export interface CookieConsentProps {
  className?: string;
}

export interface ThemeToggleProps {
  className?: string;
}

export interface LanguageToggleProps {
  className?: string;
} 