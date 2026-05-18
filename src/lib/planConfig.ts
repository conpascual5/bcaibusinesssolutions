export type PlanKey = "free" | "pro" | "pro_plus" | "vip";

export const PLAN_GENERATION_LIMITS: Record<PlanKey, number> = {
  free: 3,
  pro: 500,
  pro_plus: 1000,
  vip: 9999,
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  pro: "Pro",
  pro_plus: "Pro+",
  vip: "VIP",
};

// Plans that have access to the Business Management System
export const BUSINESS_ACCESS_PLANS: PlanKey[] = ["pro", "pro_plus", "vip"];

// Plans that have access to the Standalone HR Management
export const HR_ACCESS_PLANS: PlanKey[] = ["pro_plus", "vip"];

export function hasBusinessAccess(plan: string | undefined | null): boolean {
  if (!plan) return false;
  return BUSINESS_ACCESS_PLANS.includes(plan as PlanKey);
}

export function hasHRAccess(plan: string | undefined | null): boolean {
  if (!plan) return false;
  return HR_ACCESS_PLANS.includes(plan as PlanKey);
}
