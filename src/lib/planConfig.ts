export type PlanKey = "free" | "pro" | "vip";

export const PLAN_GENERATION_LIMITS: Record<PlanKey, number> = {
  free: 3,
  pro: 500,
  vip: 9999,
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  pro: "Marketing Kit",
  vip: "VIP",
};

// Plans that have access to the Business Management System
export const BUSINESS_ACCESS_PLANS: PlanKey[] = [];

// Plans that have access to the Standalone HR Management
export const HR_ACCESS_PLANS: PlanKey[] = [];

export function hasBusinessAccess(plan: string | undefined | null): boolean {
  if (!plan) return false;
  return BUSINESS_ACCESS_PLANS.includes(plan as PlanKey);
}

export function hasHRAccess(plan: string | undefined | null): boolean {
  if (!plan) return false;
  return HR_ACCESS_PLANS.includes(plan as PlanKey);
}
