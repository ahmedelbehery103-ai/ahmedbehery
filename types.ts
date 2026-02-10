export type Language = 'en' | 'ar';
export type ProjectType = 'single' | 'bundle';

export enum Role {
  ADMIN = 'ADMIN',
  SALES = 'SALES',
  ESTIMATOR = 'ESTIMATOR',
  USER = 'USER'
}

export interface Permissions {
  canAccessEstimator: boolean;
  canAccessCatalog: boolean;
  canAccessProjects: boolean;
  canAccessLayout: boolean;
  canAccessAdmin: boolean;
}

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: Role;
  email: string;
  avatar: string;
  isActive: boolean;
  createdAt: string;
  permissions: Permissions;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  targetUserId: string;
  action: 'CREATE_USER' | 'EDIT_USER' | 'DEACTIVATE_USER' | 'ACTIVATE_USER' | 'EXPORT_SYSTEM' | 'IMPORT_SYSTEM';
  before?: string;
  after?: string;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  wasteFactor: number;
}

// Added missing interface for labor types as used in constants.ts
export interface LaborType {
  id: string;
  name: string;
  dailyRate: number;
}

// Added missing interface for transport rules as used in constants.ts
export interface TransportRule {
  id: string;
  type: string;
  basePrice: number;
  loadingFee: number;
}

export interface LineItem {
  id: string;
  materialId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  category: string;
  imageRef?: string;
}

export interface ProjectGroup {
  id: string;
  name: string;
  items: LineItem[];
  imageRefs?: string[];
  headerColor?: string;
}

export interface Template {
  id: string;
  name: string;
  clientName: string;
  projectType: ProjectType;
  dimensions: { l: number; w: number; h: number };
  groups: ProjectGroup[];
  laborDays: number;
  accommodationPerDay: number;
  selectedTransport: string;
  markup: number;
  overhead: number;
  proposalId?: string;
  proposalDate?: string;
  paymentTerms?: string;
  validityPeriod?: string;
  notes?: string;
  primaryColor?: string;
  customLogo?: string;
  fitToPage?: boolean;
  scalePercent?: number;
  validUntil?: string;
}

export type ThemeMode = 'light' | 'dark' | 'gray';
export type ThemeStyle = 'modern' | 'corporate' | 'playful' | 'minimalist' | 'gradient' | 'glassmorphism';
export type BorderType = 'none' | 'hairline' | 'standard' | 'thick';
export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface AppConfig {
  VAT_RATE: number;
  DEFAULT_OVERHEAD: number;
  DEFAULT_MARKUP: number;
  appName: string;
  appIcon: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  companyTaxId: string;
  themeColor: string;
  surfaceColor: string;
  mainTextColor: string;
  mutedTextColor: string;
  bgColor: string;
  themeMode: ThemeMode;
  themeStyle: ThemeStyle;
  borderRadius: number;
  layoutDensity: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  showBorders: boolean;
  borderType: BorderType;
  pageBackgrounds: Record<string, string>;
  defaultTerms: string;
  defaultPaymentTerms: string;
  defaultValidityPeriod: string;
  mainTextTransform: TextTransform;
  secondaryTextTransform: TextTransform;
  allowRememberMe: boolean;
}