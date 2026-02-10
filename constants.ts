
import { Material, LaborType, TransportRule, AppConfig } from './types';

export const SEED_MATERIALS: Material[] = [
  { id: 'm1', name: 'MDF 18mm', category: 'Wood', unit: 'Sheet', price: 850, wasteFactor: 0.15 },
  { id: 'm2', name: 'MDF 12mm', category: 'Wood', unit: 'Sheet', price: 600, wasteFactor: 0.15 },
  { id: 'm3', name: 'Muski Wood', category: 'Wood', unit: 'm3', price: 15500, wasteFactor: 0.10 },
  { id: 'm4', name: 'Formica Standard', category: 'Finishing', unit: 'm2', price: 420, wasteFactor: 0.05 },
  { id: 'm5', name: 'Plastic Paint', category: 'Finishing', unit: 'm2', price: 85, wasteFactor: 0.05 },
  { id: 'm6', name: 'Banner Frontlit', category: 'Printing', unit: 'm2', price: 110, wasteFactor: 0.08 },
  { id: 'm7', name: 'Vinyl Sticker', category: 'Printing', unit: 'm2', price: 190, wasteFactor: 0.08 },
  { id: 'm8', name: 'LED Spotlight', category: 'Lighting', unit: 'Pcs', price: 475, wasteFactor: 0 },
  { id: 'm9', name: 'LED Strip', category: 'Lighting', unit: 'm', price: 150, wasteFactor: 0.02 },
];

export const SEED_LABOR: LaborType[] = [
  { id: 'l1', name: 'Carpenter', dailyRate: 300 },
  { id: 'l2', name: 'Installer', dailyRate: 375 },
  { id: 'l3', name: 'Electrician', dailyRate: 425 },
  { id: 'l4', name: 'Supervisor', dailyRate: 600 },
];

export const SEED_TRANSPORT: TransportRule[] = [
  { id: 't1', type: 'Quarter', basePrice: 1000, loadingFee: 400 },
  { id: 't2', type: 'Half', basePrice: 1800, loadingFee: 600 },
];

export const APP_CONFIG: AppConfig = {
  VAT_RATE: 0.14,
  DEFAULT_OVERHEAD: 0.10,
  DEFAULT_MARKUP: 0.25,
  appName: 'ExhibiPrice',
  appIcon: 'E',
  companyAddress: 'Industrial Zone, 5th Settlement, New Cairo, Egypt',
  companyPhone: '+20 123 456 789',
  companyEmail: 'info@exhibiprice.com',
  companyWebsite: 'www.exhibiprice.com',
  companyTaxId: 'Tax ID: 123-456-789',
  themeColor: '#1d4ed8',
  surfaceColor: '#ffffff',
  mainTextColor: '#000000',
  mutedTextColor: '#475569',
  bgColor: '#f1f5f9',
  themeMode: 'light',
  themeStyle: 'modern',
  borderRadius: 8,
  layoutDensity: 0.7,
  fontFamily: 'Inter',
  fontWeight: 'bold',
  showBorders: true,
  borderType: 'standard',
  pageBackgrounds: {
    dashboard: '#f1f5f9',
    estimator: '#f1f5f9',
    catalog: '#f1f5f9',
    layout: '#f1f5f9',
    admin: '#f1f5f9',
    settings: '#f1f5f9',
    profile: '#f1f5f9'
  },
  defaultTerms: `1. Production materials remain company property unless purchased.\n2. Design ownership is reserved by the company.`,
  defaultPaymentTerms: `50% Down Payment, 50% on Delivery`,
  defaultValidityPeriod: `15 Days`,
  mainTextTransform: 'uppercase',
  secondaryTextTransform: 'none',
  allowRememberMe: true
};
