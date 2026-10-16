export type PaymentCategory = 'mobile_money' | 'card';

export interface PaymentOperator {
  id: string;
  name: string;
  category: PaymentCategory;
  description: string;
  iconName?: string;
  colorClass?: string;
  badge?: string;
}

export interface CountryPaymentConfig {
  code: string; // ISO 3166-1 alpha-2, e.g. "SN", "CI", "ML"
  name: string;
  flag: string;
  currency: string;
  phonePrefix: string;
  methods: PaymentOperator[];
}

export const SUPPORTED_PAYMENT_METHODS: Record<string, PaymentOperator> = {
  orange_money: {
    id: 'orange_money',
    name: 'Orange Money',
    category: 'mobile_money',
    description: 'Paiement instantané avec votre compte Orange Money',
    colorClass: 'from-orange-500 to-amber-600 text-white',
    badge: 'Populaire',
  },
  wave: {
    id: 'wave',
    name: 'Wave',
    category: 'mobile_money',
    description: 'Paiement sans frais et instantané via Wave',
    colorClass: 'from-sky-500 to-blue-600 text-white',
    badge: '0% frais',
  },
  free_money: {
    id: 'free_money',
    name: 'Free Money',
    category: 'mobile_money',
    description: 'Paiement direct via Free Money Sénégal',
    colorClass: 'from-rose-500 to-red-600 text-white',
  },
  mtn_momo: {
    id: 'mtn_momo',
    name: 'MTN Mobile Money',
    category: 'mobile_money',
    description: 'Paiement rapide via MTN MoMo',
    colorClass: 'from-amber-400 to-yellow-500 text-slate-900',
  },
  moov_money: {
    id: 'moov_money',
    name: 'Moov Money (Flooz)',
    category: 'mobile_money',
    description: 'Paiement sécurisé via Moov Africa / Flooz',
    colorClass: 'from-blue-600 to-indigo-700 text-white',
  },
  t_money: {
    id: 't_money',
    name: 'T-Money',
    category: 'mobile_money',
    description: 'Paiement direct avec Togocom T-Money',
    colorClass: 'from-emerald-500 to-teal-600 text-white',
  },
  celtiis: {
    id: 'celtiis',
    name: 'Celtiis Cash',
    category: 'mobile_money',
    description: 'Paiement via Celtiis Cash Bénin',
    colorClass: 'from-purple-500 to-indigo-600 text-white',
  },
  card: {
    id: 'card',
    name: 'Carte Bancaire (Visa / Mastercard)',
    category: 'card',
    description: 'Cartes bancaires internationales Visa, Mastercard, etc.',
    colorClass: 'from-slate-800 to-slate-950 text-white',
    badge: 'International',
  },
};

export const SUPPORTED_COUNTRIES: CountryPaymentConfig[] = [
  {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    currency: 'XOF',
    phonePrefix: '+221',
    methods: [
      SUPPORTED_PAYMENT_METHODS.orange_money,
      SUPPORTED_PAYMENT_METHODS.wave,
      SUPPORTED_PAYMENT_METHODS.free_money,
      SUPPORTED_PAYMENT_METHODS.card,
    ],
  },
  {
    code: 'CI',
    name: "Côte d'Ivoire",
    flag: '🇨🇮',
    currency: 'XOF',
    phonePrefix: '+225',
    methods: [
      SUPPORTED_PAYMENT_METHODS.orange_money,
      SUPPORTED_PAYMENT_METHODS.wave,
      SUPPORTED_PAYMENT_METHODS.mtn_momo,
      SUPPORTED_PAYMENT_METHODS.moov_money,
      SUPPORTED_PAYMENT_METHODS.card,
    ],
  },
  {
    code: 'ML',
    name: 'Mali',
    flag: '🇲🇱',
    currency: 'XOF',
    phonePrefix: '+223',
    methods: [
      SUPPORTED_PAYMENT_METHODS.orange_money,
      SUPPORTED_PAYMENT_METHODS.wave,
      SUPPORTED_PAYMENT_METHODS.moov_money,
      SUPPORTED_PAYMENT_METHODS.card,
    ],
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    currency: 'XOF',
    phonePrefix: '+226',
    methods: [
      SUPPORTED_PAYMENT_METHODS.orange_money,
      SUPPORTED_PAYMENT_METHODS.moov_money,
      SUPPORTED_PAYMENT_METHODS.card,
    ],
  },
  {
    code: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',
    currency: 'XOF',
    phonePrefix: '+229',
    methods: [
      SUPPORTED_PAYMENT_METHODS.mtn_momo,
      SUPPORTED_PAYMENT_METHODS.moov_money,
      SUPPORTED_PAYMENT_METHODS.celtiis,
      SUPPORTED_PAYMENT_METHODS.card,
    ],
  },
  {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    currency: 'XOF',
    phonePrefix: '+228',
    methods: [
      SUPPORTED_PAYMENT_METHODS.t_money,
      SUPPORTED_PAYMENT_METHODS.moov_money,
      SUPPORTED_PAYMENT_METHODS.card,
    ],
  },
  {
    code: 'CM',
    name: 'Cameroun',
    flag: '🇨🇲',
    currency: 'XAF',
    phonePrefix: '+237',
    methods: [
      SUPPORTED_PAYMENT_METHODS.orange_money,
      SUPPORTED_PAYMENT_METHODS.mtn_momo,
      SUPPORTED_PAYMENT_METHODS.card,
    ],
  },
  {
    code: 'OTHER',
    name: 'Autre pays / International',
    flag: '🌍',
    currency: 'XOF',
    phonePrefix: '+1',
    methods: [
      SUPPORTED_PAYMENT_METHODS.card,
    ],
  },
];

export function getCountryPaymentConfig(countryCode: string): CountryPaymentConfig {
  const found = SUPPORTED_COUNTRIES.find((c) => c.code.toUpperCase() === countryCode.toUpperCase());
  return found || SUPPORTED_COUNTRIES[0]; // fallback Senegal
}

