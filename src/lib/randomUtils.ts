export function seededRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return function () {
    hash = (hash * 16807 + 0) % 2147483647;
    return (hash - 1) / 2147483646;
  };
}

export function pick<T>(arr: T[], rng: () => number): T {
  if (arr.length === 0) throw new Error("pick() called on empty array");
  const val = Math.max(0, Math.min(0.999999, rng()));
  return arr[Math.floor(val * arr.length)];
}

export function pickN<T>(arr: T[], n: number, rng: () => number): T[] {
  if (arr.length === 0) return [];
  const count = Math.min(n, arr.length);
  const shuffled = [...arr].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}
