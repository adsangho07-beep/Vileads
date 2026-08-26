export const LEAD_SEARCH_CREDIT_COST = 3;
export const SIGNUP_BONUS_CREDITS = 5;

export interface CreditPackage {
  id: string;
  credits: number;
  amountXof: number;
  label: string;
  badge?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: 'pack_10', credits: 10, amountXof: 1000, label: 'Découverte' },
  { id: 'pack_50', credits: 50, amountXof: 4000, label: 'Croissance', badge: '-20%' },
  { id: 'pack_150', credits: 150, amountXof: 10000, label: 'Pro', badge: '-33%' },
];

export function getCreditPackage(packageId: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((p) => p.id === packageId);
}
