export interface CreditPackage {
  id: string;
  credits: number;
  amount: number;
  label: string;
  badge?: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  { id: "starter", credits: 10, amount: 3900, label: "스타터" },
  { id: "popular", credits: 30, amount: 8900, label: "인기", badge: "BEST" },
  { id: "pro", credits: 100, amount: 19900, label: "프로", badge: "MAX 49% 할인" },
];

export function getCreditPackage(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === id);
}
