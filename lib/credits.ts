export const LEAD_SEARCH_CREDIT_COST = 3;
export const SIGNUP_BONUS_CREDITS = 5;

export interface CreditPackage {
  id: string;
  credits: number;
  amount: number; // Montant en FCFA (XOF)
  currency: string;
  amountUsd?: number;
  label: string;
  badge?: string;
  description?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'pack_10',
    credits: 10,
    amount: 1000,
    currency: 'XOF',
    amountUsd: 2,
    label: 'Pack Découverte',
    description: 'Idéal pour tester et trouver vos premiers prospects ciblés.',
  },
  {
    id: 'pack_50',
    credits: 50,
    amount: 4000,
    currency: 'XOF',
    amountUsd: 6,
    label: 'Pack Croissance',
    badge: '-20%',
    description: 'Le choix populaire pour les équipes et agences en croissance.',
  },
  {
    id: 'pack_150',
    credits: 150,
    amount: 10000,
    currency: 'XOF',
    amountUsd: 15,
    label: 'Pack Pro',
    badge: '-33%',
    description: 'Volume maximal au meilleur tarif pour une prospection intensive.',
  },
];


export function getCreditPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === packageId);
}

export function formatPriceCfa(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR').format(amount)} FCFA`;
}


