export type PlanKey = "free" | "pro" | "vip";

export const PLAN_GENERATION_LIMITS: Record<PlanKey, number> = {
  // Free: one-time trial (not monthly)
  free: 3,
  // Pro: up to 500 generations
  pro: 500,
  // VIP: up to 100 generations
  vip: 100,
};

export const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  pro: "Pro",
  vip: "VIP",
};
